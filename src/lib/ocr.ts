import { createWorker } from 'tesseract.js'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPageToCanvas } from './pdfjs'

export interface OcrProgress {
  page: number
  totalPages: number
  status: string
  progress: number
}

export async function ocrPdfPages(
  pdfjsDoc: PDFDocumentProxy,
  pageIndices: number[],
  lang: string,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  let currentPage = 0
  const worker = await createWorker(lang, undefined, {
    logger: (m) => {
      if (typeof m.progress === 'number') {
        onProgress?.({ page: currentPage, totalPages: pageIndices.length, status: m.status, progress: m.progress })
      }
    },
  })

  let combined = ''
  try {
    for (let i = 0; i < pageIndices.length; i++) {
      currentPage = i + 1
      const pageNum = pageIndices[i] + 1
      const canvas = await renderPageToCanvas(pdfjsDoc, pageNum, 2)
      const {
        data: { text },
      } = await worker.recognize(canvas)
      combined += `----- Página ${pageNum} -----\n${text.trim()}\n\n`
    }
  } finally {
    await worker.terminate()
  }
  return combined.trim()
}
