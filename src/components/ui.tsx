import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-900',
  secondary:
    'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-white/5 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-white/10',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10',
  danger:
    'bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

export function Button({ variant = 'primary', icon, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/5 ${className}`}
    >
      {children}
    </div>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Alert({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900',
  }[kind]
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
}
