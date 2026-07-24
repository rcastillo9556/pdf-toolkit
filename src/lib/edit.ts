import { StandardFonts, rgb } from 'pdf-lib'
import { loadPdf } from './loadPdf'

export interface BaseElement {
  id: string
  page: number
  xFrac: number
  yFrac: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  color: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  widthFrac: number
  heightFrac: number
  bytes: Uint8Array
  mime: 'image/png' | 'image/jpeg'
}

export interface RectElement extends BaseElement {
  type: 'rect'
  widthFrac: number
  heightFrac: number
  color: string
  opacity: number
}

export interface TextReplaceElement extends BaseElement {
  type: 'textReplace'
  text: string
  fontSize: number
  color: string
  widthFrac: number
}

export type EditElement = TextElement | ImageElement | RectElement | TextReplaceElement

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255)
}

export async function buildEditedPdf(srcBytes: Uint8Array, elements: EditElement[]): Promise<Uint8Array> {
  const pdfDoc = await loadPdf(srcBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const imageCache = new Map<string, Awaited<ReturnType<typeof pdfDoc.embedPng>>>()

  for (const el of elements) {
    const page = pages[el.page]
    if (!page) continue
    const { width, height } = page.getSize()

    if (el.type === 'text') {
      page.drawText(el.text, {
        x: el.xFrac * width,
        y: height - el.yFrac * height - el.fontSize,
        size: el.fontSize,
        font,
        color: hexToRgb(el.color),
      })
    } else if (el.type === 'rect') {
      page.drawRectangle({
        x: el.xFrac * width,
        y: height - el.yFrac * height - el.heightFrac * height,
        width: el.widthFrac * width,
        height: el.heightFrac * height,
        color: hexToRgb(el.color),
        opacity: el.opacity,
      })
    } else if (el.type === 'image') {
      let image = imageCache.get(el.id)
      if (!image) {
        image = el.mime === 'image/png' ? await pdfDoc.embedPng(el.bytes) : await pdfDoc.embedJpg(el.bytes)
        imageCache.set(el.id, image)
      }
      page.drawImage(image, {
        x: el.xFrac * width,
        y: height - el.yFrac * height - el.heightFrac * height,
        width: el.widthFrac * width,
        height: el.heightFrac * height,
      })
    } else if (el.type === 'textReplace') {
      const baseline = height - el.yFrac * height - el.fontSize
      // Cover the original glyphs (white rectangle sized from a font-size
      // heuristic, since exact ascent/descent isn't available) then draw the
      // replacement text at the same position and size.
      page.drawRectangle({
        x: el.xFrac * width - 2,
        y: baseline - el.fontSize * 0.35,
        width: el.widthFrac * width + 4,
        height: el.fontSize * 1.3,
        color: rgb(1, 1, 1),
      })
      page.drawText(el.text, {
        x: el.xFrac * width,
        y: baseline,
        size: el.fontSize,
        font,
        color: hexToRgb(el.color),
      })
    }
  }

  return pdfDoc.save()
}
