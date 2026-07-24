import * as mupdf from 'mupdf'

export async function addPassword(srcBytes: Uint8Array, password: string): Promise<Uint8Array> {
  const doc = new mupdf.PDFDocument(srcBytes)
  const buffer = doc.saveToBuffer({
    encrypt: 'aes-256',
    'owner-password': password,
    'user-password': password,
  })
  return buffer.asUint8Array()
}

export type UnlockResult = { ok: true; bytes: Uint8Array } | { ok: false; reason: 'wrong-password' | 'not-encrypted' }

export async function removePassword(srcBytes: Uint8Array, password: string): Promise<UnlockResult> {
  const doc = new mupdf.PDFDocument(srcBytes)
  if (!doc.needsPassword()) {
    return { ok: false, reason: 'not-encrypted' }
  }
  const auth = doc.authenticatePassword(password)
  if (!auth) {
    return { ok: false, reason: 'wrong-password' }
  }
  const buffer = doc.saveToBuffer({ encrypt: 'none' })
  return { ok: true, bytes: buffer.asUint8Array() }
}

export async function isEncrypted(srcBytes: Uint8Array): Promise<boolean> {
  const doc = new mupdf.PDFDocument(srcBytes)
  return doc.needsPassword()
}
