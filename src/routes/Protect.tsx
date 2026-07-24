import { useState } from 'react'
import { Lock, Unlock, Loader2, FileText, Eye, EyeOff } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { Dropzone } from '../components/Dropzone'
import { Button, Card, Alert } from '../components/ui'
import { download, formatBytes, withSuffix } from '../lib/files'
import { addPassword, removePassword } from '../lib/protect'
import { getTool } from '../lib/tools'
import { useI18n } from '../lib/i18n'

export function Protect() {
  const tool = getTool('proteger')!
  const { t } = useI18n()
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset(nextMode?: typeof mode) {
    if (nextMode) setMode(nextMode)
    setFile(null)
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setDone(false)
  }

  async function run() {
    if (!file || !password) return
    if (mode === 'add' && password !== confirmPassword) {
      setError(t('protect.mismatchError'))
      return
    }
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (mode === 'add') {
        const out = await addPassword(bytes, password)
        download(out, withSuffix(file.name, t('protect.suffixAdd')))
      } else {
        const result = await removePassword(bytes, password)
        if (!result.ok) {
          setError(result.reason === 'wrong-password' ? t('protect.wrongPasswordError') : t('protect.notEncryptedError'))
          return
        }
        download(result.bytes, withSuffix(file.name, t('protect.suffixRemove')))
      }
      setDone(true)
    } catch (e) {
      console.error(e)
      setError(t('protect.genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell icon={tool.icon} title={t(`tools.${tool.key}.name`)} description={t(`tools.${tool.key}.description`)}>
      <div className="space-y-5">
        <div className="flex gap-2">
          <button
            onClick={() => reset('add')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${mode === 'add' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 text-gray-600 dark:border-gray-700'}`}
          >
            <Lock className="mr-1.5 inline h-4 w-4" /> {t('protect.addTab')}
          </button>
          <button
            onClick={() => reset('remove')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${mode === 'remove' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-gray-200 text-gray-600 dark:border-gray-700'}`}
          >
            <Unlock className="mr-1.5 inline h-4 w-4" /> {t('protect.removeTab')}
          </button>
        </div>

        {!file && (
          <Dropzone
            onFiles={(f) => setFile(f[0] ?? null)}
            hint={mode === 'add' ? t('protect.dropHintAdd') : t('protect.dropHintRemove')}
          />
        )}

        {file && (
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-brand-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button onClick={() => setFile(null)} className="text-sm font-medium text-brand-600 hover:underline">
                {t('common.change')}
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                {mode === 'add' ? t('protect.newPasswordLabel') : t('protect.currentPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm dark:border-gray-700 dark:bg-white/5"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'add' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('protect.confirmPasswordLabel')}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/5"
                  autoComplete="new-password"
                />
              </div>
            )}
          </Card>
        )}

        {error && <Alert kind="error">{error}</Alert>}
        {done && <Alert kind="success">{mode === 'add' ? t('protect.successAdd') : t('protect.successRemove')}</Alert>}

        <Button
          onClick={run}
          disabled={!file || !password || busy}
          icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'add' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        >
          {busy ? t('protect.processing') : mode === 'add' ? t('protect.protectButton') : t('protect.removeButton')}
        </Button>
      </div>
    </PageShell>
  )
}
