import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface DropzoneProps {
  onFiles: (files: File[]) => void
  multiple?: boolean
  label?: string
  hint?: string
}

export function Dropzone({ onFiles, multiple = false, label, hint }: DropzoneProps) {
  const { t } = useI18n()
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length) onFiles(accepted)
    },
    [onFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: { 'application/pdf': ['.pdf'] },
  })

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragActive
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-300 bg-white/60 hover:border-brand-400 hover:bg-brand-50/60 dark:border-gray-700 dark:bg-white/5 dark:hover:bg-white/10'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-10 w-10 text-brand-500" strokeWidth={1.5} />
      <p className="text-base font-medium text-gray-800 dark:text-gray-100">
        {label ?? (multiple ? t('dropzone.multiple') : t('dropzone.single'))}
      </p>
      {hint && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}
