import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

export { pdfjsLib }

export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  return canvas
}

export async function loadPdfJsDoc(bytes: ArrayBuffer | Uint8Array) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return pdfjsLib.getDocument({ data }).promise
}
