export function download(bytes: Uint8Array | ArrayBuffer, filename: string, mime = 'application/pdf') {
  const arr = bytes instanceof Uint8Array ? new Uint8Array(bytes) : new Uint8Array(bytes)
  const blob = new Blob([arr.buffer as ArrayBuffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function withSuffix(name: string, suffix: string) {
  const base = name.replace(/\.pdf$/i, '')
  return `${base}${suffix}.pdf`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}
