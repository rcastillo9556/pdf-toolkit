import { useState } from 'react'
import { Droplets, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert } from '../components/ui'
import { download, formatBytes, withSuffix } from '../lib/files'
import { applyWatermark, type WatermarkOptions } from '../lib/watermark'
import { PasswordProtectedError } from '../lib/loadPdf'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

export function Watermark() {
  const tool = getTool('marca-de-agua')!
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<'text' | 'image'>('text')
  const [text, setText] = useState(() => t('watermark.defaultText'))
  const [fontSize, setFontSize] = useState(48)
  const [opacity, setOpacity] = useState(0.3)
  const [rotation, setRotation] = useState(45)
  const [color, setColor] = useState('#ff0000')
  const [position, setPosition] = useState<'center' | 'tiled' | 'bottom'>('center')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function run() {
    if (!file) return
    if (kind === 'text' && !text.trim()) return
    if (kind === 'image' && !imageFile) return
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const srcBytes = new Uint8Array(await file.arrayBuffer())
      let opts: WatermarkOptions
      if (kind === 'text') {
        opts = { kind: 'text', text, fontSize, opacity, rotation, color, position }
      } else {
        const imgBytes = new Uint8Array(await imageFile!.arrayBuffer())
        const mime = imageFile!.type === 'image/png' ? 'image/png' : 'image/jpeg'
        opts = { kind: 'image', imageBytes: imgBytes, mime, opacity, scale: 0.4, rotation, position: position === 'tiled' ? 'center' : position }
      }
      const bytes = await applyWatermark(srcBytes, opts)
      download(bytes, withSuffix(file.name, t('watermark.suffix')))
      setDone(true)
    } catch (e) {
      console.error(e)
      setError(e instanceof PasswordProtectedError ? t('common.passwordProtectedError') : t('watermark.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        {!file && <Dropzone onFiles={(f) => setFile(f[0] ?? null)} />}

        {file && (
          <Card className="flex items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-brand-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
              <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
            </div>
            <button onClick={() => setFile(null)} className="text-sm font-medium text-brand-600 hover:underline">
              {t('common.change')}
            </button>
          </Card>
        )}

        {file && (
          <Card className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setKind('text')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${kind === 'text' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 text-gray-600 dark:border-gray-700'}`}
              >
                {t('watermark.textTab')}
              </button>
              <button
                onClick={() => setKind('image')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${kind === 'image' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 text-gray-600 dark:border-gray-700'}`}
              >
                {t('watermark.imageTab')}
              </button>
            </div>

            {kind === 'text' ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t('watermark.textLabel')}
                  </label>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('watermark.sizeLabel')}
                    </label>
                    <input
                      type="number"
                      value={fontSize}
                      min={8}
                      max={200}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('watermark.colorLabel')}
                    </label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('watermark.opacityLabel')}
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('watermark.rotationLabel')}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('watermark.imageLabel')}
                </label>
                {imageFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
                    <ImageIcon className="h-5 w-5 text-brand-500" />
                    <span className="flex-1 truncate text-sm">{imageFile.name}</span>
                    <button
                      onClick={() => setImageFile(null)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      {t('common.change')}
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm"
                  />
                )}
                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t('watermark.opacityLabel')}
                  </label>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('watermark.positionLabel')}
              </label>
              <div className="flex gap-2">
                {(['center', 'tiled', 'bottom'] as const)
                  .filter((p) => kind === 'text' || p !== 'tiled')
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${position === p ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 text-gray-600 dark:border-gray-700'}`}
                    >
                      {p === 'center'
                        ? t('watermark.posCenter')
                        : p === 'tiled'
                          ? t('watermark.posTiled')
                          : t('watermark.posBottom')}
                    </button>
                  ))}
              </div>
            </div>
          </Card>
        )}

        {error && <Alert kind="error">{error}</Alert>}
        {done && <Alert kind="success">{t('watermark.success')}</Alert>}

        <Button
          onClick={run}
          disabled={!file || busy || (kind === 'image' && !imageFile)}
          icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplets className="h-4 w-4" />}
        >
          {busy ? t('watermark.applying') : t('watermark.applyButton')}
        </Button>
      </div>
    </PageShell>
  )
}
