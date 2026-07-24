import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Combine, ChevronUp, ChevronDown, X, FileText, Loader2 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert } from '../components/ui'
import { download, formatBytes } from '../lib/files'
import { loadPdf, PasswordProtectedError } from '../lib/loadPdf'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

interface Entry {
  id: string
  file: File
  pageCount: number | null
}

export function Merge() {
  const tool = getTool('unir')!
  const { t } = useI18n()
  const [entries, setEntries] = useState<Entry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addFiles(files: File[]) {
    setError(null)
    const newEntries: Entry[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      pageCount: null,
    }))
    setEntries((prev) => [...prev, ...newEntries])

    for (const entry of newEntries) {
      try {
        const bytes = await entry.file.arrayBuffer()
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
        const count = doc.getPageCount()
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, pageCount: count } : e)))
      } catch {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, pageCount: -1 } : e)))
      }
    }
  }

  function move(index: number, dir: -1 | 1) {
    setEntries((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function mergeAll() {
    if (entries.length < 2) return
    setBusy(true)
    setError(null)
    try {
      const merged = await PDFDocument.create()
      for (const entry of entries) {
        const bytes = new Uint8Array(await entry.file.arrayBuffer())
        const src = await loadPdf(bytes)
        const copiedPages = await merged.copyPages(src, src.getPageIndices())
        copiedPages.forEach((p) => merged.addPage(p))
      }
      const outBytes = await merged.save()
      download(outBytes, `documento${t('merge.suffix')}.pdf`)
    } catch (e) {
      console.error(e)
      setError(e instanceof PasswordProtectedError ? t('common.passwordProtectedError') : t('merge.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        <Dropzone multiple onFiles={addFiles} label={t('merge.dropLabel')} hint={t('merge.dropHint')} />

        {error && <Alert kind="error">{error}</Alert>}

        {entries.length > 0 && (
          <Card className="p-3">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry, i) => (
                <li key={entry.id} className="flex items-center gap-3 py-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatBytes(entry.file.size)}
                      {entry.pageCount != null && entry.pageCount >= 0 && t('merge.pages', { count: entry.pageCount })}
                      {entry.pageCount === -1 && t('merge.couldNotRead')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                      aria-label={t('merge.moveUp')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === entries.length - 1}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                      aria-label={t('merge.moveDown')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(entry.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      aria-label={t('merge.remove')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Button
          onClick={mergeAll}
          disabled={entries.length < 2 || busy}
          icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Combine className="h-4 w-4" />}
        >
          {busy ? t('merge.merging') : t('merge.mergeButton', { count: entries.length || '' })}
        </Button>
      </div>
    </PageShell>
  )
}
