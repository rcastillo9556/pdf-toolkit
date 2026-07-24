import { StandardFonts, rgb, degrees } from 'pdf-lib'
import { loadPdf } from './loadPdf'

export interface TextWatermarkOptions {
  kind: 'text'
  text: string
  fontSize: number
  opacity: number
  rotation: number
  color: string
  position: 'center' | 'tiled' | 'bottom'
}

export interface ImageWatermarkOptions {
  kind: 'image'
  imageBytes: Uint8Array
  mime: 'image/png' | 'image/jpeg'
  opacity: number
  scale: number
  rotation: number
  position: 'center' | 'bottom'
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255)
}

export async function applyWatermark(srcBytes: Uint8Array, opts: WatermarkOptions): Promise<Uint8Array> {
  const pdfDoc = await loadPdf(srcBytes)
  const pages = pdfDoc.getPages()

  if (opts.kind === 'text') {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const color = hexToRgb(opts.color)
    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize)

      if (opts.position === 'tiled') {
        const stepX = textWidth + 80
        const stepY = opts.fontSize + 80
        for (let y = -height; y < height * 2; y += stepY) {
          for (let x = -width; x < width * 2; x += stepX) {
            page.drawText(opts.text, {
              x,
              y,
              size: opts.fontSize,
              font,
              color,
              opacity: opts.opacity,
              rotate: degrees(opts.rotation),
            })
          }
        }
      } else {
        const x = width / 2 - textWidth / 2
        const y = opts.position === 'bottom' ? Math.min(40, height * 0.06) : height / 2
        page.drawText(opts.text, {
          x,
          y,
          size: opts.fontSize,
          font,
          color,
          opacity: opts.opacity,
          rotate: degrees(opts.position === 'bottom' ? 0 : opts.rotation),
        })
      }
    }
  } else {
    const image =
      opts.mime === 'image/png' ? await pdfDoc.embedPng(opts.imageBytes) : await pdfDoc.embedJpg(opts.imageBytes)
    const ratio = image.width / image.height
    for (const page of pages) {
      const { width, height } = page.getSize()
      const drawWidth = width * opts.scale
      const drawHeight = drawWidth / ratio
      const x = width / 2 - drawWidth / 2
      const y = opts.position === 'bottom' ? Math.min(40, height * 0.06) : height / 2 - drawHeight / 2
      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
        opacity: opts.opacity,
        rotate: degrees(opts.position === 'bottom' ? 0 : opts.rotation),
      })
    }
  }

  return pdfDoc.save()
}
