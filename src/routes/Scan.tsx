import { useRef, useState } from 'react'
import {
  Camera,
  Upload,
  RotateCw,
  Contrast,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  Loader2,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Button, Card, Alert, ProgressBar } from '../components/ui'
import { download } from '../lib/files'
import { buildScanPdf, type ScanPage } from '../lib/scan'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

let idCounter = 0
const nextId = () => `scan-${Date.now()}-${idCounter++}`

export function Scan() {
  const tool = getTool('escanear')!
  const { t } = useI18n()
  const [pages, setPages] = useState<ScanPage[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newPages: ScanPage[] = Array.from(files).map((file) => ({
      id: nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      grayscale: false,
    }))
    setPages((prev) => [...prev, ...newPages])
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

  function rotate(id: string) {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)))
  }

  function toggleGrayscale(id: string) {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, grayscale: !p.grayscale } : p)))
  }

  function remove(id: string) {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function generate() {
    if (pages.length === 0) return
    setBusy(true)
    setError(null)
    setProgress(0)
    try {
      const bytes = await buildScanPdf(pages, (done, total) => setProgress(Math.round((done / total) * 100)))
      download(bytes, `${t('scan.fileName')}.pdf`)
    } catch (e) {
      console.error(e)
      setError(t('organize.genError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => cameraInputRef.current?.click()} icon={<Camera className="h-4 w-4" />}>
            {t('scan.addPhoto')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => uploadInputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            {t('scan.uploadImages')}
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {pages.length === 0 && (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Camera className="h-10 w-10 text-brand-500" strokeWidth={1.5} />
            <p className="text-base font-medium text-gray-800 dark:text-gray-100">{t('scan.emptyHint')}</p>
          </Card>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {busy && (
          <div className="space-y-2">
            <ProgressBar value={progress} />
            <p className="text-sm text-gray-500">{t('scan.building')}</p>
          </div>
        )}

        {pages.length > 0 && (
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {pages.map((page, i) => (
                <div
                  key={page.id}
                  className="group relative rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                >
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
                    <img
                      src={page.previewUrl}
                      alt={t('organize.pageAlt', { n: i + 1 })}
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        filter: page.grayscale ? 'grayscale(1)' : 'none',
                      }}
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
                      onClick={() => rotate(page.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                      aria-label={t('organize.rotateRight')}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleGrayscale(page.id)}
                      className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10 ${page.grayscale ? 'text-brand-600' : 'text-gray-400'}`}
                      aria-label={t('scan.grayscale')}
                    >
                      <Contrast className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(page.id)}
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
        )}

        {pages.length > 0 && (
          <Button
            onClick={generate}
            disabled={busy}
            icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          >
            {t('organize.downloadPdf')}
          </Button>
        )}
      </div>
    </PageShell>
  )
}
