import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
const base = process.env.GITHUB_PAGES ? '/pdf-toolkit/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PDF Toolkit',
        short_name: 'PDF Toolkit',
        description: 'Une, divide, comprime, edita y protege tus archivos PDF, todo en tu navegador.',
        lang: 'es',
        theme_color: '#4740d4',
        background_color: '#f5f6fb',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Heavy WASM engines (mupdf, pdf.js worker, tesseract) are code-split
        // per tool and shouldn't block install; cache them on first use instead.
        globIgnores: ['**/*.wasm', '**/pdf.worker-*.mjs'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:wasm|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-toolkit-engines',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  server: {
    fs: {
      strict: false,
    },
  },
})
