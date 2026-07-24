import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Type,
  CalendarDays,
  FileSignature as SignatureIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  X,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert } from '../components/ui'
import { download, withSuffix } from '../lib/files'
import { loadPdfJsDoc, renderPageToCanvas } from '../lib/pdfjs'
import { buildEditedPdf, type EditElement } from '../lib/edit'
import { detectFormFields, fillFormFields, type FieldDescriptor } from '../lib/formFill'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'
import type { PDFDocumentProxy } from 'pdfjs-dist'

const DISPLAY_WIDTH = 760
const PAD_WIDTH = 500
const PAD_HEIGHT = 200

let idCounter = 0
const nextId = () => `fs-${Date.now()}-${idCounter++}`

export function FillSign() {
  const tool = getTool('rellenar-firmar')!
  const { t, lang } = useI18n()
  const [fileName, setFileName] = useState('')
  const [srcBytes, setSrcBytes] = useState<Uint8Array | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageImg, setPageImg] = useState<string | null>(null)
  const [pageSizePt, setPageSizePt] = useState({ width: 612, height: 792 })
  const [elements, setElements] = useState<EditElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formFields, setFormFields] = useState<FieldDescriptor[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [padOpen, setPadOpen] = useState(false)
  const [padHasInk, setPadHasInk] = useState(false)

  const pdfjsDocRef = useRef<PDFDocumentProxy | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageUrlsRef = useRef<Map<string, string>>(new Map())
  const padCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const padDrawingRef = useRef(false)
  const dragState = useRef<null | {
    id: string
    mode: 'move' | 'resize'
    startX: number
    startY: number
    orig: EditElement
  }>(null)

  async function loadFile(files: File[]) {
    const file = files[0]
    if (!file) return
    setError(null)
    setLoading(true)
    setElements([])
    setFormFields([])
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      setSrcBytes(bytes)
      setFileName(file.name)
      const doc = await loadPdfJsDoc(bytes)
      pdfjsDocRef.current = doc
      setNumPages(doc.numPages)
      setPageIndex(0)
      await renderPage(doc, 0)
      try {
        const fields = await detectFormFields(bytes)
        setFormFields(fields)
      } catch (e) {
        console.warn('No se pudieron leer los campos del formulario', e)
      }
    } catch (e) {
      console.error(e)
      setError(t('common.loadError'))
    } finally {
      setLoading(false)
    }
  }

  async function renderPage(doc: PDFDocumentProxy, index: number) {
    const page = await doc.getPage(index + 1)
    const nativeViewport = page.getViewport({ scale: 1 })
    setPageSizePt({ width: nativeViewport.width, height: nativeViewport.height })
    const scale = DISPLAY_WIDTH / nativeViewport.width
    const canvas = await renderPageToCanvas(doc, index + 1, scale)
    setPageImg(canvas.toDataURL('image/jpeg', 0.85))
  }

  async function goToPage(index: number) {
    if (!pdfjsDocRef.current || index < 0 || index >= numPages) return
    setPageIndex(index)
    setSelectedId(null)
    setLoading(true)
    try {
      await renderPage(pdfjsDocRef.current, index)
    } finally {
      setLoading(false)
    }
  }

  function addText() {
    const el: EditElement = {
      id: nextId(),
      type: 'text',
      page: pageIndex,
      xFrac: 0.35,
      yFrac: 0.45,
      text: t('edit.defaultNewText'),
      fontSize: 16,
      color: '#111111',
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
  }

  function addDate() {
    const dateStr = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US').format(new Date())
    const el: EditElement = {
      id: nextId(),
      type: 'text',
      page: pageIndex,
      xFrac: 0.35,
      yFrac: 0.55,
      text: dateStr,
      fontSize: 14,
      color: '#111111',
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
  }

  function updateElement(id: string, patch: Partial<EditElement>) {
    setElements((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as EditElement) : e)))
  }

  function removeElement(id: string) {
    const url = imageUrlsRef.current.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      imageUrlsRef.current.delete(id)
    }
    setElements((prev) => prev.filter((e) => e.id !== id))
    setSelectedId(null)
  }

  function onPointerDownElement(e: ReactPointerEvent, el: EditElement, mode: 'move' | 'resize') {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(el.id)
    dragState.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, orig: el }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    const drag = dragState.current
    const container = containerRef.current
    if (!drag || !container) return
    const rect = container.getBoundingClientRect()
    const dxFrac = (e.clientX - drag.startX) / rect.width
    const dyFrac = (e.clientY - drag.startY) / rect.height

    if (drag.mode === 'move') {
      updateElement(drag.id, {
        xFrac: Math.min(0.95, Math.max(0, drag.orig.xFrac + dxFrac)),
        yFrac: Math.min(0.95, Math.max(0, drag.orig.yFrac + dyFrac)),
      })
    } else if (drag.orig.type !== 'text') {
      updateElement(drag.id, {
        widthFrac: Math.max(0.03, drag.orig.widthFrac + dxFrac),
        heightFrac: Math.max(0.03, drag.orig.heightFrac + dyFrac),
      } as Partial<EditElement>)
    }
  }

  function onPointerUp() {
    dragState.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function getPadPos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = padCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function padPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const ctx = padCanvasRef.current!.getContext('2d')!
    const { x, y } = getPadPos(e)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    padDrawingRef.current = true
  }

  function padPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!padDrawingRef.current) return
    const ctx = padCanvasRef.current!.getContext('2d')!
    const { x, y } = getPadPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setPadHasInk(true)
  }

  function padPointerUp() {
    padDrawingRef.current = false
  }

  function clearPad() {
    const canvas = padCanvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setPadHasInk(false)
  }

  function openPad() {
    setPadOpen(true)
    setTimeout(() => {
      const canvas = padCanvasRef.current
      if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    }, 0)
  }

  function useSignature() {
    const canvas = padCanvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      blob.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf)
        const url = URL.createObjectURL(blob)
        const aspect = canvas.height / canvas.width
        const widthFrac = 0.3
        const el: EditElement = {
          id: nextId(),
          type: 'image',
          page: pageIndex,
          xFrac: 0.35,
          yFrac: 0.6,
          widthFrac,
          heightFrac: (widthFrac * pageSizePt.width * aspect) / pageSizePt.height,
          bytes,
          mime: 'image/png',
        }
        imageUrlsRef.current.set(el.id, url)
        setElements((prev) => [...prev, el])
        setSelectedId(el.id)
        setPadOpen(false)
      })
    }, 'image/png')
  }

  function updateFieldAt(index: number, next: FieldDescriptor) {
    setFormFields((prev) => prev.map((f, i) => (i === index ? next : f)))
  }

  async function exportPdf() {
    if (!srcBytes) return
    setBusy(true)
    setError(null)
    try {
      let bytes = srcBytes
      if (formFields.length > 0) {
        bytes = await fillFormFields(bytes, formFields, true)
      }
      if (elements.length > 0) {
        bytes = await buildEditedPdf(bytes, elements)
      }
      download(bytes, withSuffix(fileName, t('fillSign.suffix')))
    } catch (e) {
      console.error(e)
      setError(t('organize.genError'))
    } finally {
      setBusy(false)
    }
  }

  const selected = elements.find((e) => e.id === selectedId) ?? null
  const pageElements = elements.filter((e) => e.page === pageIndex)
  const displayHeight = DISPLAY_WIDTH * (pageSizePt.height / pageSizePt.width || 1.29)

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        {!srcBytes && <Dropzone onFiles={loadFile} hint={t('fillSign.dropHint')} />}

        {loading && !pageImg && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('edit.loadingPdf')}
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {formFields.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('fillSign.formDetected')}</p>
            <div className="space-y-3">
              {formFields.map((f, i) => (
                <div key={f.name} className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-center sm:gap-3">
                  <label className="truncate text-sm text-gray-600 sm:col-span-1 dark:text-gray-300" title={f.name}>
                    {f.name}
                  </label>
                  <div className="sm:col-span-2">
                    {f.kind === 'text' && (
                      <input
                        value={f.value}
                        onChange={(e) => updateFieldAt(i, { ...f, value: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-white/5"
                      />
                    )}
                    {f.kind === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={f.checked}
                        onChange={(e) => updateFieldAt(i, { ...f, checked: e.target.checked })}
                        className="h-4 w-4"
                      />
                    )}
                    {f.kind === 'radio' && (
                      <div className="flex flex-wrap gap-3">
                        {f.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="radio"
                              name={f.name}
                              checked={f.selected === opt}
                              onChange={() => updateFieldAt(i, { ...f, selected: opt })}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {f.kind === 'dropdown' && (
                      <select
                        value={f.selected}
                        onChange={(e) => updateFieldAt(i, { ...f, selected: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-white/5"
                      >
                        <option value="" />
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {srcBytes && pageImg && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={addText} icon={<Type className="h-4 w-4" />}>
                {t('edit.addText')}
              </Button>
              <Button variant="secondary" onClick={addDate} icon={<CalendarDays className="h-4 w-4" />}>
                {t('fillSign.addDate')}
              </Button>
              <Button variant="secondary" onClick={openPad} icon={<SignatureIcon className="h-4 w-4" />}>
                {t('fillSign.addSignature')}
              </Button>

              {numPages > 1 && (
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  <button
                    onClick={() => goToPage(pageIndex - 1)}
                    disabled={pageIndex === 0}
                    className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {t('edit.pageOf', { current: pageIndex + 1, total: numPages })}
                  <button
                    onClick={() => goToPage(pageIndex + 1)}
                    disabled={pageIndex === numPages - 1}
                    className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {selected && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-white/5">
                {selected.type === 'text' && (
                  <>
                    <input
                      value={selected.text}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                      className="min-w-[160px] flex-1 rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-white/10"
                    />
                    <label className="flex items-center gap-1.5">
                      {t('edit.sizeLabel')}
                      <input
                        type="number"
                        value={selected.fontSize}
                        min={6}
                        max={120}
                        onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                        className="w-16 rounded border border-gray-300 px-1.5 py-1 dark:border-gray-700 dark:bg-white/10"
                      />
                    </label>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className="h-8 w-8 rounded border border-gray-300 dark:border-gray-700"
                    />
                  </>
                )}
                <button
                  onClick={() => removeElement(selected.id)}
                  className="ml-auto inline-flex items-center gap-1 rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" /> {t('edit.delete')}
                </button>
              </div>
            )}

            <div
              ref={containerRef}
              onPointerDown={() => setSelectedId(null)}
              className="relative mx-auto select-none overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-700"
              style={{ width: DISPLAY_WIDTH, height: displayHeight }}
            >
              <img
                src={pageImg}
                alt={t('organize.pageAlt', { n: pageIndex + 1 })}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
              {pageElements.map((el) => (
                <div
                  key={el.id}
                  onPointerDown={(e) => onPointerDownElement(e, el, 'move')}
                  className={`absolute cursor-move ${selectedId === el.id ? 'outline outline-2 outline-brand-500' : ''}`}
                  style={{
                    left: `${el.xFrac * 100}%`,
                    top: `${el.yFrac * 100}%`,
                    width: el.type === 'text' ? 'auto' : `${el.widthFrac * 100}%`,
                    height: el.type === 'text' ? 'auto' : `${el.heightFrac * 100}%`,
                  }}
                >
                  {el.type === 'text' && (
                    <span
                      style={{
                        fontSize: (el.fontSize * DISPLAY_WIDTH) / pageSizePt.width,
                        color: el.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {el.text}
                    </span>
                  )}
                  {el.type === 'image' && (
                    <img
                      src={imageUrlsRef.current.get(el.id)}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  )}
                  {el.type !== 'text' && (
                    <div
                      onPointerDown={(e) => onPointerDownElement(e, el, 'resize')}
                      className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-brand-600"
                    />
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={exportPdf}
              disabled={busy}
              icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            >
              {busy ? t('fillSign.generating') : t('fillSign.downloadSigned')}
            </Button>
          </>
        )}

        {padOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t('fillSign.signatureModalTitle')}
                </p>
                <button
                  onClick={() => setPadOpen(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('fillSign.signHere')}</p>
              <canvas
                ref={padCanvasRef}
                width={PAD_WIDTH}
                height={PAD_HEIGHT}
                onPointerDown={padPointerDown}
                onPointerMove={padPointerMove}
                onPointerUp={padPointerUp}
                onPointerLeave={padPointerUp}
                className="w-full touch-none rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/5"
                style={{ height: PAD_HEIGHT }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={clearPad}>
                  {t('fillSign.clear')}
                </Button>
                <Button variant="secondary" onClick={() => setPadOpen(false)}>
                  {t('fillSign.cancel')}
                </Button>
                <Button onClick={useSignature} disabled={!padHasInk}>
                  {t('fillSign.useSignature')}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  )
}
