import { Link } from 'react-router-dom'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../lib/i18n'

interface PageShellProps {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

export function PageShell({ icon: Icon, title, description, children }: PageShellProps) {
  const { t } = useI18n()
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('pageShell.backLink')}
      </Link>
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
