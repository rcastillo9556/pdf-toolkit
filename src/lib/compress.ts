import { PDFName, PDFNumber, PDFRawStream } from 'pdf-lib'
import { loadPdf } from './loadPdf'

export interface CompressOptions {
  quality: number
  maxDimension: number
}

export const COMPRESS_PRESETS: Record<'baja' | 'recomendada' | 'maxima', CompressOptions> = {
  baja: { quality: 0.82, maxDimension: 2000 },
  recomendada: { quality: 0.68, maxDimension: 1600 },
  maxima: { quality: 0.45, maxDimension: 1200 },
}

interface ReencodedImage {
  bytes: Uint8Array
  width: number
  height: number
}

async function reencodeJpeg(
  contents: Uint8Array,
  quality: number,
  maxDimension: number,
): Promise<ReencodedImage | null> {
  const blob = new Blob([contents.slice().buffer as ArrayBuffer], { type: 'image/jpeg' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image decode failed'))
      el.src = url
    })
    const { naturalWidth: w, naturalHeight: h } = img
    if (!w || !h) return null
    const scale = Math.min(1, maxDimension / Math.max(w, h))
    const newW = Math.max(1, Math.round(w * scale))
    const newH = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = newW
    canvas.height = newH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, newW, newH)
    ctx.drawImage(img, 0, 0, newW, newH)

    const outBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!outBlob) return null
    const buf = await outBlob.arrayBuffer()
    return { bytes: new Uint8Array(buf), width: newW, height: newH }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface CompressResult {
  bytes: Uint8Array
  originalSize: number
  compressedSize: number
  imagesTotal: number
  imagesCompressed: number
}

export async function compressPdf(
  srcBytes: Uint8Array,
  opts: CompressOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<CompressResult> {
  const pdfDoc = await loadPdf(srcBytes)
  const context = pdfDoc.context

  const candidates: PDFRawStream[] = []
  for (const [, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const dict = obj.dict
    const subtype = dict.get(PDFName.of('Subtype'))
    if (subtype !== PDFName.of('Image')) continue
    const filter = dict.get(PDFName.of('Filter'))
    if (filter !== PDFName.of('DCTDecode')) continue
    if (dict.get(PDFName.of('SMask')) || dict.get(PDFName.of('Mask'))) continue
    candidates.push(obj)
  }

  let imagesCompressed = 0
  let i = 0
  for (const stream of candidates) {
    i++
    onProgress?.(i, candidates.length)
    try {
      const result = await reencodeJpeg(stream.contents, opts.quality, opts.maxDimension)
      if (!result) continue
      if (result.bytes.length >= stream.contents.length) continue

      ;(stream as unknown as { contents: Uint8Array }).contents = result.bytes
      stream.dict.set(PDFName.of('Width'), PDFNumber.of(result.width))
      stream.dict.set(PDFName.of('Height'), PDFNumber.of(result.height))
      stream.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'))
      stream.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8))
      stream.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
      stream.dict.delete(PDFName.of('DecodeParms'))
      stream.dict.delete(PDFName.of('Decode'))
      imagesCompressed++
    } catch (e) {
      console.warn('No se pudo recomprimir una imagen, se deja sin cambios', e)
    }
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true })
  return {
    bytes,
    originalSize: srcBytes.byteLength,
    compressedSize: bytes.byteLength,
    imagesTotal: candidates.length,
    imagesCompressed,
  }
}
