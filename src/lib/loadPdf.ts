import { PDFDocument } from 'pdf-lib'

export class PasswordProtectedError extends Error {
  constructor() {
    super('El PDF está protegido con contraseña. Usa la herramienta "Proteger / Desbloquear" para quitarla primero.')
    this.name = 'PasswordProtectedError'
  }
}

// pdf-lib's EncryptedPDFError loses its prototype chain when compiled to ES5
// (subclassing Error via tslib's __extends), so `instanceof` can't be used
// reliably here. Detect it by its stable, hardcoded message instead.
function isEncryptedPdfError(e: unknown): boolean {
  return e instanceof Error && e.message.includes('is encrypted')
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes)
  } catch (e) {
    if (isEncryptedPdfError(e)) throw new PasswordProtectedError()
    throw e
  }
}
