import { Link } from 'react-router-dom'
import { tools } from '../lib/tools'
import { useI18n } from '../lib/i18n'

export function Home() {
  const { t } = useI18n()
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl dark:text-white">{t('home.title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-500 dark:text-gray-400">{t('home.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.slug}
              to={`/${tool.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/5"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white`}
              >
                <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t(`tools.${tool.key}.name`)}
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {t(`tools.${tool.key}.description`)}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
