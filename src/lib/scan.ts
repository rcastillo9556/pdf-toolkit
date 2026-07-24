import { PDFDocument } from 'pdf-lib'

export interface ScanPage {
  id: string
  file: File
  previewUrl: string
  rotation: number
  grayscale: boolean
}

const TARGET_DPI = 150

interface ProcessedImage {
  bytes: Uint8Array
  width: number
  height: number
}

async function processImage(file: File, rotation: number, grayscale: boolean): Promise<ProcessedImage> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image decode failed'))
      el.src = url
    })
    const w = img.naturalWidth
    const h = img.naturalHeight
    const swapped = rotation % 180 !== 0
    const canvas = document.createElement('canvas')
    canvas.width = swapped ? h : w
    canvas.height = swapped ? w : h
    const ctx = canvas.getContext('2d')!
    if (grayscale) ctx.filter = 'grayscale(1) contrast(1.08)'
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, -w / 2, -h / 2, w, h)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('canvas.toBlob failed')
    const buf = await blob.arrayBuffer()
    return { bytes: new Uint8Array(buf), width: canvas.width, height: canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function buildScanPdf(
  pages: ScanPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const { bytes, width, height } = await processImage(p.file, p.rotation, p.grayscale)
    const image = await pdfDoc.embedJpg(bytes)
    const pageWidth = (width / TARGET_DPI) * 72
    const pageHeight = (height / TARGET_DPI) * 72
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight })
    onProgress?.(i + 1, pages.length)
  }
  return pdfDoc.save()
}
