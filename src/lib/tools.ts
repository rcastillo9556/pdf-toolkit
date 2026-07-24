import {
  Combine,
  LayoutGrid,
  Minimize2,
  Droplets,
  PenLine,
  Camera,
  FileSignature,
  ScanText,
  Lock,
  type LucideIcon,
} from 'lucide-react'

export interface ToolMeta {
  slug: string
  key: string
  icon: LucideIcon
  accent: string
}

export const tools: ToolMeta[] = [
  {
    slug: 'unir',
    key: 'unir',
    icon: Combine,
    accent: 'from-brand-500 to-brand-700',
  },
  {
    slug: 'organizar',
    key: 'organizar',
    icon: LayoutGrid,
    accent: 'from-sky-500 to-blue-700',
  },
  {
    slug: 'comprimir',
    key: 'comprimir',
    icon: Minimize2,
    accent: 'from-emerald-500 to-teal-700',
  },
  {
    slug: 'marca-de-agua',
    key: 'marcaDeAgua',
    icon: Droplets,
    accent: 'from-cyan-500 to-sky-700',
  },
  {
    slug: 'editar',
    key: 'editar',
    icon: PenLine,
    accent: 'from-fuchsia-500 to-purple-700',
  },
  {
    slug: 'escanear',
    key: 'escanear',
    icon: Camera,
    accent: 'from-lime-500 to-green-700',
  },
  {
    slug: 'rellenar-firmar',
    key: 'rellenarFirmar',
    icon: FileSignature,
    accent: 'from-indigo-500 to-violet-700',
  },
  {
    slug: 'ocr',
    key: 'ocr',
    icon: ScanText,
    accent: 'from-amber-500 to-orange-700',
  },
  {
    slug: 'proteger',
    key: 'proteger',
    icon: Lock,
    accent: 'from-rose-500 to-red-700',
  },
]

export function getTool(slug: string | undefined) {
  return tools.find((t) => t.slug === slug)
}
