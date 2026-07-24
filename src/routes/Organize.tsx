import { useState } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import JSZip from 'jszip'
import {
  RotateCw,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  Scissors,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert } from '../components/ui'
import { download, withSuffix } from '../lib/files'
import { loadPdfJsDoc, renderPageToCanvas } from '../lib/pdfjs'
import { loadPdf } from '../lib/loadPdf'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

interface PageItem {
  id: string
  originalIndex: number
  rotation: number
  thumb: string
  selected: boolean
}

export function Organize() {
  const tool = getTool('organizar')!
  const { t } = useI18n()
  const [fileName, setFileName] = useState<string>('')
  const [srcBytes, setSrcBytes] = useState<Uint8Array | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadFile(files: File[]) {
    const file = files[0]
    if (!file) return
    setError(null)
    setLoading(true)
    setPages([])
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      setSrcBytes(bytes)
      setFileName(file.name)
      const pdfjsDoc = await loadPdfJsDoc(bytes)
      const items: PageItem[] = []
      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const canvas = await renderPageToCanvas(pdfjsDoc, i, 0.35)
        items.push({
          id: `p-${i}`,
          originalIndex: i - 1,
          rotation: 0,
          thumb: canvas.toDataURL('image/jpeg', 0.7),
          selected: false,
        })
      }
      setPages(items)
    } catch (e) {
      console.error(e)
      setError(t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  function move(index: number, dir: -1 | 1) {
    setPages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function rotate(id: string, delta: number) {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p)),
    )
  }

  function removePage(id: string) {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  function toggleSelect(id: string) {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)))
  }

  async function buildPdf(items: PageItem[]) {
    const src = await loadPdf(srcBytes!)
    const out = await PDFDocument.create()
    const copied = await out.copyPages(
      src,
      items.map((p) => p.originalIndex),
    )
    copied.forEach((page, i) => {
      const rot = items[i].rotation
      if (rot) page.setRotation(degrees(page.getRotation().angle + rot))
      out.addPage(page)
    })
    return out.save()
  }

  async function downloadAll() {
    if (!srcBytes || pages.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const bytes = await buildPdf(pages)
      download(bytes, withSuffix(fileName, t('organize.suffixEdited')))
    } catch (e) {
      console.error(e)
      setError(t('organize.genError'))
    } finally {
      setBusy(false)
    }
  }

  async function downloadSelected() {
    const selected = pages.filter((p) => p.selected)
    if (selected.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const bytes = await buildPdf(selected)
      download(bytes, withSuffix(fileName, t('organize.suffixExtracted')))
    } catch (e) {
      console.error(e)
      setError(t('organize.extractError'))
    } finally {
      setBusy(false)
    }
  }

  async function splitIndividual() {
    if (!srcBytes || pages.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const zip = new JSZip()
      for (let i = 0; i < pages.length; i++) {
        const bytes = await buildPdf([pages[i]])
        zip.file(`${withSuffix(fileName, '')}${t('organize.pageFile', { n: i + 1 })}.pdf`, bytes)
      }
      const zipBytes = await zip.generateAsync({ type: 'uint8array' })
      download(
        zipBytes,
        withSuffix(fileName, t('organize.suffixPages')).replace(/\.pdf$/, '.zip'),
        'application/zip',
      )
    } catch (e) {
      console.error(e)
      setError(t('organize.splitError'))
    } finally {
      setBusy(false)
    }
  }

  const selectedCount = pages.filter((p) => p.selected).length

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        {!srcBytes && <Dropzone onFiles={loadFile} hint={t('organize.dropHint')} />}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('organize.loadingPages')}
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {pages.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={downloadAll} disabled={busy} icon={<Download className="h-4 w-4" />}>
                {t('organize.downloadPdf')}
              </Button>
              <Button
                variant="secondary"
                onClick={splitIndividual}
                disabled={busy}
                icon={<Scissors className="h-4 w-4" />}
              >
                {t('organize.splitIndividual')}
              </Button>
              <Button
                variant="secondary"
                onClick={downloadSelected}
                disabled={busy || selectedCount === 0}
                icon={<Download className="h-4 w-4" />}
              >
                {t('organize.extractSelected', { count: selectedCount })}
              </Button>
              <label className="ml-auto cursor-pointer text-sm font-medium text-brand-600 hover:underline">
                {t('organize.changeFile')}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && loadFile(Array.from(e.target.files))}
                />
              </label>
            </div>

            <Card>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {pages.map((page, i) => (
                  <div
                    key={page.id}
                    className="group relative rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                  >
                    <button
                      onClick={() => toggleSelect(page.id)}
                      className="absolute left-3 top-3 z-10 rounded bg-white/90 p-0.5 text-brand-600 shadow dark:bg-black/60"
                      aria-label={t('organize.select')}
                    >
                      {page.selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
                      <img
                        src={page.thumb}
                        alt={t('organize.pageAlt', { n: i + 1 })}
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        className="max-h-full max-w-full transition-transform"
                      />
                    </div>
                    <p className="mt-1.5 text-center text-xs text-gray-500">{i + 1}</p>
                    <div className="mt-1 flex items-center justify-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                        aria-label={t('organize.moveBefore')}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === pages.length - 1}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                        aria-label={t('organize.moveAfter')}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => rotate(page.id, -90)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label={t('organize.rotateLeft')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => rotate(page.id, 90)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label={t('organize.rotateRight')}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removePage(page.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        aria-label={t('organize.deletePage')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  )
}
