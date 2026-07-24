import type { PDFPageProxy } from 'pdfjs-dist'

export interface TextRun {
  id: string
  page: number
  str: string
  xFrac: number
  yFrac: number
  widthFrac: number
  fontSize: number
}

export async function extractTextRuns(page: PDFPageProxy, pageIndex: number): Promise<TextRun[]> {
  const viewport = page.getViewport({ scale: 1, rotation: 0 })
  const pageWidth = viewport.width
  const pageHeight = viewport.height
  const content = await page.getTextContent()
  const runs: TextRun[] = []
  let i = 0
  for (const item of content.items) {
    if (!('str' in item)) continue
    const str = item.str.trim()
    if (!str) continue
    const [, , c, d, e, f] = item.transform
    // Font size = magnitude of the text matrix's vertical basis vector (c, d),
    // matching pdf.js's own convention (see TextLayer/getTextContent internals).
    const fontSize = item.height || Math.hypot(c, d) || 10
    const width = item.width || str.length * fontSize * 0.5

    const xFrac = e / pageWidth
    const yFrac = (pageHeight - f - fontSize) / pageHeight
    runs.push({
      id: `p${pageIndex}-r${i++}`,
      page: pageIndex,
      str,
      xFrac: Math.max(0, xFrac),
      yFrac: Math.max(0, Math.min(0.98, yFrac)),
      widthFrac: width / pageWidth,
      fontSize,
    })
  }
  return runs
}
