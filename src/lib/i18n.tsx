import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'es' | 'en'

const STORAGE_KEY = 'pdf-toolkit-lang'

const translations = {
  es: {
    common: {
      change: 'Cambiar',
      loadError: 'No se pudo abrir el PDF. Verifica que no esté dañado o protegido con contraseña.',
      passwordProtectedError:
        'El PDF está protegido con contraseña. Usa la herramienta "Proteger / Desbloquear" para quitarla primero.',
    },
    header: {
      localBadge: '100% local — tus archivos no salen de tu computadora',
      footer: 'Todo el procesamiento ocurre en tu navegador. No se sube ningún archivo a internet.',
    },
    home: {
      title: 'Todo lo que necesitas para tus PDFs',
      subtitle:
        'Une, divide, comprime, edita y protege tus archivos PDF directamente en tu navegador. Rápido, gratis y privado.',
    },
    tools: {
      unir: { name: 'Unir PDFs', description: 'Combina varios archivos PDF en uno solo, en el orden que elijas.' },
      organizar: {
        name: 'Organizar y dividir',
        description: 'Reordena, rota, elimina o extrae páginas y divide un PDF en varios.',
      },
      comprimir: {
        name: 'Comprimir PDF',
        description: 'Reduce el tamaño del archivo ajustando la calidad de las imágenes.',
      },
      marcaDeAgua: {
        name: 'Marca de agua',
        description: 'Agrega texto o una imagen como marca de agua sobre todas las páginas.',
      },
      editar: {
        name: 'Editar PDF',
        description: 'Añade texto, imágenes y formas directamente sobre el documento.',
      },
      escanear: {
        name: 'Escanear documento',
        description: 'Toma fotos con la cámara o sube imágenes y conviértelas en un PDF.',
      },
      rellenarFirmar: {
        name: 'Rellenar y firmar',
        description: 'Completa los campos de un formulario y añade tu firma dibujada.',
      },
      ocr: { name: 'OCR - Extraer texto', description: 'Reconoce texto en PDFs escaneados y descárgalo como .txt.' },
      proteger: {
        name: 'Proteger / Desbloquear',
        description: 'Añade o quita la contraseña de apertura de un PDF.',
      },
    },
    pageShell: {
      backLink: 'Todas las herramientas',
    },
    dropzone: {
      single: 'Arrastra tu PDF aquí o haz clic para elegirlo',
      multiple: 'Arrastra tus PDFs aquí o haz clic para elegirlos',
    },
    merge: {
      dropLabel: 'Arrastra dos o más PDFs aquí, o haz clic para elegirlos',
      dropHint: 'Podrás reordenarlos antes de combinarlos',
      pages: ' · {{count}} páginas',
      couldNotRead: ' · no se pudo leer',
      moveUp: 'Mover arriba',
      moveDown: 'Mover abajo',
      remove: 'Quitar',
      merging: 'Uniendo...',
      mergeButton: 'Unir {{count}} PDFs',
      errorGeneric: 'No se pudo unir alguno de los PDFs. Verifica que no esté dañado.',
      suffix: '-unido',
    },
    organize: {
      dropHint: 'Podrás reordenar, rotar, eliminar y dividir páginas',
      loadingPages: 'Cargando páginas del PDF…',
      downloadPdf: 'Descargar PDF',
      splitIndividual: 'Dividir en páginas individuales (.zip)',
      extractSelected: 'Extraer seleccionadas ({{count}})',
      changeFile: 'Cambiar archivo',
      select: 'Seleccionar',
      pageAlt: 'Página {{n}}',
      moveBefore: 'Mover antes',
      moveAfter: 'Mover después',
      rotateLeft: 'Rotar izquierda',
      rotateRight: 'Rotar derecha',
      deletePage: 'Eliminar página',
      genError: 'Ocurrió un error al generar el PDF.',
      extractError: 'Ocurrió un error al extraer las páginas.',
      splitError: 'Ocurrió un error al dividir el PDF.',
      suffixEdited: '-editado',
      suffixExtracted: '-extraido',
      suffixPages: '-paginas',
      pageFile: '-pagina-{{n}}',
    },
    compress: {
      dropHint: 'Funciona mejor con PDFs que contienen imágenes o escaneos',
      levelLabel: 'Nivel de compresión',
      processingImages: 'Procesando imágenes… {{progress}}%',
      errorGeneric: 'No se pudo comprimir el PDF. Verifica que no esté dañado.',
      successWithSavings:
        'Tamaño original: {{original}} → comprimido: {{compressed}} ({{percent}}% menos). Se optimizaron {{compressedImgs}} de {{totalImgs}} imágenes.',
      successNoSavings:
        'No se encontraron imágenes que se pudieran comprimir más en este PDF (tamaño final: {{size}}). Este documento ya está optimizado o es principalmente texto vectorial.',
      compressing: 'Comprimiendo...',
      compressButton: 'Comprimir PDF',
      download: 'Descargar',
      suffix: '-comprimido',
      presets: {
        baja: { label: 'Compresión ligera', description: 'Mejor calidad de imagen, ahorro moderado de espacio.' },
        recomendada: { label: 'Recomendada', description: 'Buen balance entre calidad y tamaño de archivo.' },
        maxima: {
          label: 'Compresión máxima',
          description: 'Menor tamaño posible, la calidad de imagen se reduce notablemente.',
        },
      },
    },
    watermark: {
      defaultText: 'CONFIDENCIAL',
      textTab: 'Texto',
      imageTab: 'Imagen',
      textLabel: 'Texto',
      sizeLabel: 'Tamaño',
      colorLabel: 'Color',
      opacityLabel: 'Opacidad',
      rotationLabel: 'Rotación',
      imageLabel: 'Imagen de marca de agua',
      positionLabel: 'Posición',
      posCenter: 'Centro',
      posTiled: 'Repetida (mosaico)',
      posBottom: 'Pie de página',
      errorGeneric: 'No se pudo aplicar la marca de agua. Verifica que el PDF no esté dañado.',
      success: 'Marca de agua aplicada y descargada correctamente.',
      applying: 'Aplicando...',
      applyButton: 'Aplicar marca de agua',
      suffix: '-marca-de-agua',
    },
    edit: {
      dropHint: 'Añade texto, imágenes o resaltados sobre tu PDF',
      loadingPdf: 'Cargando PDF…',
      addText: 'Añadir texto',
      addImage: 'Añadir imagen',
      addHighlight: 'Añadir resaltado',
      pageOf: 'Página {{current}} de {{total}}',
      sizeLabel: 'Tamaño',
      opacityLabel: 'Opacidad',
      delete: 'Eliminar',
      genError: 'Ocurrió un error al generar el PDF editado.',
      generating: 'Generando...',
      downloadEdited: 'Descargar PDF editado',
      defaultNewText: 'Texto nuevo',
      suffix: '-editado',
    },
    ocr: {
      dropHint: 'Ideal para documentos escaneados o fotografiados',
      langLabel: 'Idioma del documento',
      langSpanish: 'Español',
      langEnglish: 'Inglés',
      langBoth: 'Español + Inglés',
      loadingPdf: 'Cargando PDF...',
      statusLine: 'Página {{page}} de {{total}} — {{status}}',
      errorGeneric:
        'No se pudo procesar el PDF. Verifica tu conexión a internet (se necesita para descargar el modelo de idioma la primera vez) y que el archivo no esté dañado.',
      recognizedText: 'Texto reconocido',
      copied: 'Copiado',
      copy: 'Copiar',
      downloadTxt: 'Descargar .txt',
      recognizing: 'Reconociendo texto...',
      extractButton: 'Extraer texto (OCR)',
    },
    protect: {
      addTab: 'Añadir contraseña',
      removeTab: 'Quitar contraseña',
      dropHintAdd: 'Se le pedirá esta contraseña a quien quiera abrirlo',
      dropHintRemove: 'Necesitarás la contraseña actual del PDF',
      newPasswordLabel: 'Nueva contraseña',
      currentPasswordLabel: 'Contraseña actual',
      confirmPasswordLabel: 'Confirmar contraseña',
      mismatchError: 'Las contraseñas no coinciden.',
      wrongPasswordError: 'La contraseña no es correcta.',
      notEncryptedError: 'Este PDF no está protegido con contraseña.',
      genericError: 'No se pudo procesar el PDF. Verifica que el archivo no esté dañado.',
      successAdd: 'PDF protegido y descargado correctamente.',
      successRemove: 'Contraseña eliminada y PDF descargado correctamente.',
      processing: 'Procesando...',
      protectButton: 'Proteger PDF',
      removeButton: 'Quitar contraseña',
      suffixAdd: '-protegido',
      suffixRemove: '-desbloqueado',
    },
    scan: {
      addPhoto: 'Tomar foto',
      uploadImages: 'Subir imágenes',
      grayscale: 'Blanco y negro',
      emptyHint: 'Toma una foto o sube una imagen para empezar',
      building: 'Generando PDF...',
      fileName: 'documento-escaneado',
    },
    fillSign: {
      dropHint:
        'Añade texto, la fecha o tu firma. Si el PDF tiene un formulario, se detectará y podrás completarlo directamente.',
      formDetected: 'Se detectó un formulario en este PDF. Complétalo aquí:',
      formFieldsTitle: 'Campos del formulario',
      addSignature: 'Añadir firma',
      addDate: 'Añadir fecha',
      signatureModalTitle: 'Dibuja tu firma',
      signHere: 'Dibuja con el mouse o el dedo',
      clear: 'Borrar',
      useSignature: 'Usar esta firma',
      cancel: 'Cancelar',
      fillAndDownload: 'Rellenar y descargar',
      downloadSigned: 'Descargar PDF firmado',
      generating: 'Generando...',
      suffix: '-firmado',
    },
  },
  en: {
    common: {
      change: 'Change',
      loadError: "Couldn't open the PDF. Check that it isn't corrupted or password protected.",
      passwordProtectedError:
        'This PDF is password protected. Use the "Protect / Unlock" tool to remove the password first.',
    },
    header: {
      localBadge: '100% local — your files never leave your computer',
      footer: 'All processing happens in your browser. No file is ever uploaded to the internet.',
    },
    home: {
      title: 'Everything you need for your PDFs',
      subtitle:
        'Merge, split, compress, edit and protect your PDF files directly in your browser. Fast, free, and private.',
    },
    tools: {
      unir: { name: 'Merge PDFs', description: 'Combine several PDF files into one, in the order you choose.' },
      organizar: {
        name: 'Organize & split',
        description: 'Reorder, rotate, delete or extract pages and split a PDF into several.',
      },
      comprimir: {
        name: 'Compress PDF',
        description: 'Reduce file size by adjusting image quality.',
      },
      marcaDeAgua: {
        name: 'Watermark',
        description: 'Add text or an image as a watermark over every page.',
      },
      editar: {
        name: 'Edit PDF',
        description: 'Add text, images and shapes directly onto the document.',
      },
      escanear: {
        name: 'Scan document',
        description: 'Take photos with your camera or upload images and turn them into a PDF.',
      },
      rellenarFirmar: {
        name: 'Fill & Sign',
        description: 'Fill out a form and add your hand-drawn signature.',
      },
      ocr: { name: 'OCR - Extract text', description: 'Recognize text in scanned PDFs and download it as .txt.' },
      proteger: {
        name: 'Protect / Unlock',
        description: "Add or remove a PDF's opening password.",
      },
    },
    pageShell: {
      backLink: 'All tools',
    },
    dropzone: {
      single: 'Drag your PDF here or click to choose it',
      multiple: 'Drag your PDFs here or click to choose them',
    },
    merge: {
      dropLabel: 'Drag two or more PDFs here, or click to choose them',
      dropHint: "You'll be able to reorder them before combining",
      pages: ' · {{count}} pages',
      couldNotRead: " · couldn't be read",
      moveUp: 'Move up',
      moveDown: 'Move down',
      remove: 'Remove',
      merging: 'Merging...',
      mergeButton: 'Merge {{count}} PDFs',
      errorGeneric: "One of the PDFs couldn't be merged. Check that it isn't corrupted.",
      suffix: '-merged',
    },
    organize: {
      dropHint: "You'll be able to reorder, rotate, delete and split pages",
      loadingPages: 'Loading PDF pages…',
      downloadPdf: 'Download PDF',
      splitIndividual: 'Split into individual pages (.zip)',
      extractSelected: 'Extract selected ({{count}})',
      changeFile: 'Change file',
      select: 'Select',
      pageAlt: 'Page {{n}}',
      moveBefore: 'Move earlier',
      moveAfter: 'Move later',
      rotateLeft: 'Rotate left',
      rotateRight: 'Rotate right',
      deletePage: 'Delete page',
      genError: 'An error occurred while generating the PDF.',
      extractError: 'An error occurred while extracting the pages.',
      splitError: 'An error occurred while splitting the PDF.',
      suffixEdited: '-edited',
      suffixExtracted: '-extracted',
      suffixPages: '-pages',
      pageFile: '-page-{{n}}',
    },
    compress: {
      dropHint: 'Works best with PDFs that contain images or scans',
      levelLabel: 'Compression level',
      processingImages: 'Processing images… {{progress}}%',
      errorGeneric: "Couldn't compress the PDF. Check that it isn't corrupted.",
      successWithSavings:
        'Original size: {{original}} → compressed: {{compressed}} ({{percent}}% less). Optimized {{compressedImgs}} of {{totalImgs}} images.',
      successNoSavings:
        'No images could be compressed further in this PDF (final size: {{size}}). This document is already optimized or is mostly vector text.',
      compressing: 'Compressing...',
      compressButton: 'Compress PDF',
      download: 'Download',
      suffix: '-compressed',
      presets: {
        baja: { label: 'Light compression', description: 'Better image quality, moderate space savings.' },
        recomendada: { label: 'Recommended', description: 'Good balance between quality and file size.' },
        maxima: {
          label: 'Maximum compression',
          description: 'Smallest possible size; image quality is noticeably reduced.',
        },
      },
    },
    watermark: {
      defaultText: 'CONFIDENTIAL',
      textTab: 'Text',
      imageTab: 'Image',
      textLabel: 'Text',
      sizeLabel: 'Size',
      colorLabel: 'Color',
      opacityLabel: 'Opacity',
      rotationLabel: 'Rotation',
      imageLabel: 'Watermark image',
      positionLabel: 'Position',
      posCenter: 'Center',
      posTiled: 'Tiled',
      posBottom: 'Footer',
      errorGeneric: "Couldn't apply the watermark. Check that the PDF isn't corrupted.",
      success: 'Watermark applied and downloaded successfully.',
      applying: 'Applying...',
      applyButton: 'Apply watermark',
      suffix: '-watermarked',
    },
    edit: {
      dropHint: 'Add text, images or highlights to your PDF',
      loadingPdf: 'Loading PDF…',
      addText: 'Add text',
      addImage: 'Add image',
      addHighlight: 'Add highlight',
      pageOf: 'Page {{current}} of {{total}}',
      sizeLabel: 'Size',
      opacityLabel: 'Opacity',
      delete: 'Delete',
      genError: 'An error occurred while generating the edited PDF.',
      generating: 'Generating...',
      downloadEdited: 'Download edited PDF',
      defaultNewText: 'New text',
      suffix: '-edited',
    },
    ocr: {
      dropHint: 'Ideal for scanned or photographed documents',
      langLabel: 'Document language',
      langSpanish: 'Spanish',
      langEnglish: 'English',
      langBoth: 'Spanish + English',
      loadingPdf: 'Loading PDF...',
      statusLine: 'Page {{page}} of {{total}} — {{status}}',
      errorGeneric:
        "Couldn't process the PDF. Check your internet connection (needed to download the language model the first time) and that the file isn't corrupted.",
      recognizedText: 'Recognized text',
      copied: 'Copied',
      copy: 'Copy',
      downloadTxt: 'Download .txt',
      recognizing: 'Recognizing text...',
      extractButton: 'Extract text (OCR)',
    },
    protect: {
      addTab: 'Add password',
      removeTab: 'Remove password',
      dropHintAdd: 'Whoever opens it will be asked for this password',
      dropHintRemove: "You'll need the PDF's current password",
      newPasswordLabel: 'New password',
      currentPasswordLabel: 'Current password',
      confirmPasswordLabel: 'Confirm password',
      mismatchError: "Passwords don't match.",
      wrongPasswordError: 'The password is incorrect.',
      notEncryptedError: "This PDF isn't password protected.",
      genericError: "Couldn't process the PDF. Check that the file isn't corrupted.",
      successAdd: 'PDF protected and downloaded successfully.',
      successRemove: 'Password removed and PDF downloaded successfully.',
      processing: 'Processing...',
      protectButton: 'Protect PDF',
      removeButton: 'Remove password',
      suffixAdd: '-protected',
      suffixRemove: '-unlocked',
    },
    scan: {
      addPhoto: 'Take photo',
      uploadImages: 'Upload images',
      grayscale: 'Black & white',
      emptyHint: 'Take a photo or upload an image to get started',
      building: 'Generating PDF...',
      fileName: 'scanned-document',
    },
    fillSign: {
      dropHint:
        "Add text, the date, or your signature. If the PDF has a fillable form, it'll be detected so you can fill it in directly.",
      formDetected: 'A fillable form was detected in this PDF. Fill it out here:',
      formFieldsTitle: 'Form fields',
      addSignature: 'Add signature',
      addDate: 'Add date',
      signatureModalTitle: 'Draw your signature',
      signHere: 'Draw with your mouse or finger',
      clear: 'Clear',
      useSignature: 'Use this signature',
      cancel: 'Cancel',
      fillAndDownload: 'Fill & download',
      downloadSigned: 'Download signed PDF',
      generating: 'Generating...',
      suffix: '-signed',
    },
  },
} as const

type Vars = Record<string, string | number>

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return (acc as Record<string, unknown>)[part]
    return undefined
  }, obj)
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    return stored === 'en' || stored === 'es' ? stored : 'es'
  })

  const setLang = (next: Lang) => {
    setLangState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const t = useMemo(() => {
    return (key: string, vars?: Vars) => {
      const value = getPath(translations[lang], key) ?? getPath(translations.es, key)
      if (typeof value !== 'string') return key
      return interpolate(value, vars)
    }
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within a LanguageProvider')
  return ctx
}
