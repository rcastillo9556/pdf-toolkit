import { Link, Outlet } from 'react-router-dom'
import { FileText, ShieldCheck } from 'lucide-react'
import { useI18n } from './lib/i18n'

function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold dark:border-gray-700 dark:bg-white/5">
      <button
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === 'es' ? 'bg-brand-600 text-white' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          lang === 'en' ? 'bg-brand-600 text-white' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        EN
      </button>
    </div>
  )
}

function App() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileText className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            PDF Toolkit
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-xs font-medium text-gray-500 sm:flex dark:text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {t('header.localBadge')}
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-800">
        {t('header.footer')}
      </footer>
    </div>
  )
}

export default App
