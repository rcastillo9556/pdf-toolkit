import { useState } from 'react'
import { ScanText, Download, Loader2, Copy } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert, ProgressBar } from '../components/ui'
import { download } from '../lib/files'
import { loadPdfJsDoc } from '../lib/pdfjs'
import { ocrPdfPages } from '../lib/ocr'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

export function Ocr() {
  const tool = getTool('ocr')!
  const { t } = useI18n()
  const LANGS = [
    { code: 'spa', label: t('ocr.langSpanish') },
    { code: 'eng', label: t('ocr.langEnglish') },
    { code: 'spa+eng', label: t('ocr.langBoth') },
  ]
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState('spa')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function run() {
    if (!file) return
    setBusy(true)
    setError(null)
    setText(null)
    setProgress(0)
    setStatus(t('ocr.loadingPdf'))
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const doc = await loadPdfJsDoc(bytes)
      const pageIndices = Array.from({ length: doc.numPages }, (_, i) => i)
      const result = await ocrPdfPages(doc, pageIndices, lang, (p) => {
        setStatus(t('ocr.statusLine', { page: p.page, total: p.totalPages, status: p.status }))
        setProgress(Math.round(((p.page - 1 + p.progress) / p.totalPages) * 100))
      })
      setText(result)
    } catch (e) {
      console.error(e)
      setError(t('ocr.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  function downloadTxt() {
    if (!text || !file) return
    const blob = new TextEncoder().encode(text)
    download(blob, file.name.replace(/\.pdf$/i, '') + '.txt', 'text/plain')
  }

  async function copyText() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        {!file && <Dropzone onFiles={(f) => setFile(f[0] ?? null)} hint={t('ocr.dropHint')} />}

        {file && (
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
              <button onClick={() => setFile(null)} className="text-sm font-medium text-brand-600 hover:underline">
                {t('common.change')}
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('ocr.langLabel')}
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/5"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {busy && (
          <div className="space-y-2">
            <ProgressBar value={progress} />
            <p className="text-sm text-gray-500">{status}</p>
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {text && (
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('ocr.recognizedText')}</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={copyText}
                  icon={<Copy className="h-3.5 w-3.5" />}
                  className="!px-2.5 !py-1.5 text-xs"
                >
                  {copied ? t('ocr.copied') : t('ocr.copy')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={downloadTxt}
                  icon={<Download className="h-3.5 w-3.5" />}
                  className="!px-2.5 !py-1.5 text-xs"
                >
                  {t('ocr.downloadTxt')}
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={text}
              className="scrollbar-thin h-72 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:border-gray-700 dark:bg-black/20 dark:text-gray-300"
            />
          </Card>
        )}

        <Button
          onClick={run}
          disabled={!file || busy}
          icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
        >
          {busy ? t('ocr.recognizing') : t('ocr.extractButton')}
        </Button>
      </div>
    </PageShell>
  )
}
