import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Type,
  Image as ImageIcon,
  Square,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Alert } from '../components/ui'
import { download, withSuffix } from '../lib/files'
import { loadPdfJsDoc, renderPageToCanvas } from '../lib/pdfjs'
import { buildEditedPdf, type EditElement } from '../lib/edit'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'
import type { PDFDocumentProxy } from 'pdfjs-dist'

const DISPLAY_WIDTH = 760

let idCounter = 0
const nextId = () => `el-${Date.now()}-${idCounter++}`

export function Edit() {
  const tool = getTool('editar')!
  const { t } = useI18n()
  const [fileName, setFileName] = useState('')
  const [srcBytes, setSrcBytes] = useState<Uint8Array | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageImg, setPageImg] = useState<string | null>(null)
  const [pageSizePt, setPageSizePt] = useState({ width: 612, height: 792 })
  const [elements, setElements] = useState<EditElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pdfjsDocRef = useRef<PDFDocumentProxy | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageUrlsRef = useRef<Map<string, string>>(new Map())
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
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      setSrcBytes(bytes)
      setFileName(file.name)
      const doc = await loadPdfJsDoc(bytes)
      pdfjsDocRef.current = doc
      setNumPages(doc.numPages)
      setPageIndex(0)
      await renderPage(doc, 0)
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
      fontSize: 18,
      color: '#111111',
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
  }

  function addRect() {
    const el: EditElement = {
      id: nextId(),
      type: 'rect',
      page: pageIndex,
      xFrac: 0.3,
      yFrac: 0.4,
      widthFrac: 0.3,
      heightFrac: 0.08,
      color: '#ffe066',
      opacity: 0.5,
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
  }

  function addImage(file: File) {
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const reader = new FileReader()
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer)
      const blob = new Blob([bytes], { type: mime })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const aspect = img.naturalHeight / img.naturalWidth
        const widthFrac = 0.3
        const el: EditElement = {
          id: nextId(),
          type: 'image',
          page: pageIndex,
          xFrac: 0.35,
          yFrac: 0.35,
          widthFrac,
          heightFrac: (widthFrac * pageSizePt.width * aspect) / pageSizePt.height,
          bytes,
          mime,
        }
        imageUrlsRef.current.set(el.id, url)
        setElements((prev) => [...prev, el])
        setSelectedId(el.id)
      }
      img.src = url
    }
    reader.readAsArrayBuffer(file)
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

  async function exportPdf() {
    if (!srcBytes) return
    setBusy(true)
    setError(null)
    try {
      const bytes = await buildEditedPdf(srcBytes, elements)
      download(bytes, withSuffix(fileName, t('edit.suffix')))
    } catch (e) {
      console.error(e)
      setError(t('edit.genError'))
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
        {!srcBytes && <Dropzone onFiles={loadFile} hint={t('edit.dropHint')} />}

        {loading && !pageImg && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('edit.loadingPdf')}
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}

        {srcBytes && pageImg && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={addText} icon={<Type className="h-4 w-4" />}>
                {t('edit.addText')}
              </Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10">
                <ImageIcon className="h-4 w-4" />
                {t('edit.addImage')}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])}
                />
              </label>
              <Button variant="secondary" onClick={addRect} icon={<Square className="h-4 w-4" />}>
                {t('edit.addHighlight')}
              </Button>

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
                {selected.type === 'rect' && (
                  <>
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                      className="h-8 w-8 rounded border border-gray-300 dark:border-gray-700"
                    />
                    <label className="flex items-center gap-1.5">
                      {t('edit.opacityLabel')}
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={selected.opacity}
                        onChange={(e) => updateElement(selected.id, { opacity: Number(e.target.value) })}
                      />
                    </label>
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
                  {el.type === 'rect' && (
                    <div className="h-full w-full" style={{ backgroundColor: el.color, opacity: el.opacity }} />
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
              {busy ? t('edit.generating') : t('edit.downloadEdited')}
            </Button>
          </>
        )}
      </div>
    </PageShell>
  )
}
