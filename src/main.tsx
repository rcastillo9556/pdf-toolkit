import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import './index.css'
import App from './App.tsx'
import { Home } from './routes/Home.tsx'
import { LanguageProvider, useI18n } from './lib/i18n.tsx'

const Merge = lazy(() => import('./routes/Merge.tsx').then((m) => ({ default: m.Merge })))
const Organize = lazy(() => import('./routes/Organize.tsx').then((m) => ({ default: m.Organize })))
const Compress = lazy(() => import('./routes/Compress.tsx').then((m) => ({ default: m.Compress })))
const Watermark = lazy(() => import('./routes/Watermark.tsx').then((m) => ({ default: m.Watermark })))
const Edit = lazy(() => import('./routes/Edit.tsx').then((m) => ({ default: m.Edit })))
const Scan = lazy(() => import('./routes/Scan.tsx').then((m) => ({ default: m.Scan })))
const FillSign = lazy(() => import('./routes/FillSign.tsx').then((m) => ({ default: m.FillSign })))
const Ocr = lazy(() => import('./routes/Ocr.tsx').then((m) => ({ default: m.Ocr })))
const Protect = lazy(() => import('./routes/Protect.tsx').then((m) => ({ default: m.Protect })))

function RouteFallback() {
  const { lang } = useI18n()
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" /> {lang === 'en' ? 'Loading tool...' : 'Cargando herramienta...'}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <HashRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<App />}>
              <Route index element={<Home />} />
              <Route path="unir" element={<Merge />} />
              <Route path="organizar" element={<Organize />} />
              <Route path="comprimir" element={<Compress />} />
              <Route path="marca-de-agua" element={<Watermark />} />
              <Route path="editar" element={<Edit />} />
              <Route path="escanear" element={<Scan />} />
              <Route path="rellenar-firmar" element={<FillSign />} />
              <Route path="ocr" element={<Ocr />} />
              <Route path="proteger" element={<Protect />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </LanguageProvider>
  </StrictMode>,
)
