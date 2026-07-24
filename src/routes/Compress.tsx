import { useState } from 'react'
import { Minimize2, Download, Loader2, FileText } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert, ProgressBar } from '../components/ui'
import { download, formatBytes, withSuffix } from '../lib/files'
import { COMPRESS_PRESETS, compressPdf, type CompressResult } from '../lib/compress'
import { PasswordProtectedError } from '../lib/loadPdf'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

type PresetKey = keyof typeof COMPRESS_PRESETS

export function Compress() {
  const tool = getTool('comprimir')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [preset, setPreset] = useState<PresetKey>('recomendada')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function loadFile(files: File[]) {
    setFile(files[0] ?? null)
    setResult(null)
    setError(null)
  }

  async function run() {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const res = await compressPdf(bytes, COMPRESS_PRESETS[preset], (done, total) =>
        setProgress(total ? Math.round((done / total) * 100) : 100),
      )
      setResult(res)
    } catch (e) {
      console.error(e)
      setError(e instanceof PasswordProtectedError ? t('common.passwordProtectedError') : t('compress.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  function downloadResult() {
    if (!result || !file) return
    download(result.bytes, withSuffix(file.name, t('compress.suffix')))
  }

  const savings = result ? Math.max(0, 1 - result.compressedSize / result.originalSize) : 0

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        {!file && <Dropzone onFiles={loadFile} hint={t('compress.dropHint')} />}

        {file && (
          <Card className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-brand-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => {
                setFile(null)
                setResult(null)
              }}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t('common.change')}
            </button>
          </Card>
        )}

        {file && (
          <Card>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">{t('compress.levelLabel')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(Object.keys(COMPRESS_PRESETS) as PresetKey[]).map((key) => {
                const active = preset === key
                return (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {t(`compress.presets.${key}.label`)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t(`compress.presets.${key}.description`)}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {busy && (
          <div className="space-y-2">
            <ProgressBar value={progress} />
            <p className="text-sm text-gray-500">{t('compress.processingImages', { progress })}</p>
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {result && (
          <Alert kind="success">
            {result.imagesCompressed > 0
              ? t('compress.successWithSavings', {
                  original: formatBytes(result.originalSize),
                  compressed: formatBytes(result.compressedSize),
                  percent: Math.round(savings * 100),
                  compressedImgs: result.imagesCompressed,
                  totalImgs: result.imagesTotal,
                })
              : t('compress.successNoSavings', { size: formatBytes(result.compressedSize) })}
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={run}
            disabled={!file || busy}
            icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minimize2 className="h-4 w-4" />}
          >
            {busy ? t('compress.compressing') : t('compress.compressButton')}
          </Button>
          {result && (
            <Button variant="secondary" onClick={downloadResult} icon={<Download className="h-4 w-4" />}>
              {t('compress.download')}
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  )
}
