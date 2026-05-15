import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve __dirname without depending on the surrounding workspace tree.
const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Expose /templates/* (the .docx files + manifest) to the renderer in dev
    // and copy them into dist/templates on build so the PWA can fetch them.
    viteStaticCopy({
      targets: [
        {
          src: 'templates/*',
          dest: 'templates',
        },
      ],
    }),
    // PWA / service worker is ONLY for the web build. In Electron, file://
    // protocol can't register a service worker — the auto-injected
    // registerSW.js fails and blanks the screen. Skip the plugin entirely.
    ...(mode === 'web'
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'Sivivi — CV Generator',
              short_name: 'Sivivi',
              description: 'Local CV generator. Fill, choose a template, get a .docx.',
              theme_color: '#1f3fe6',
              background_color: '#0f172a',
              display: 'standalone',
              orientation: 'any',
              start_url: '/',
              scope: '/',
              // SVG icon avoids shipping placeholder PNGs. Chrome / Edge /
              // most browsers accept SVG for PWA install prompts.
              icons: [
                {
                  src: 'favicon.svg',
                  sizes: 'any',
                  type: 'image/svg+xml',
                  purpose: 'any maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,docx,json,webp,jpg,jpeg}'],
              maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
              navigateFallback: 'index.html',
              // Critical: ensure each new deploy wipes the previous precache
              // and takes over the page immediately. Without these, an old
              // SW keeps serving a stale chunk while the new bundle also
              // loads, producing "Identifier '...' has already been declared".
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              skipWaiting: true,
            },
            devOptions: {
              enabled: true,
            },
          }),
        ]
      : []),
  ],
  // For Electron: relative paths work with file:// loading.
  // For Web (PWA): absolute path so service worker scope matches.
  base: mode === 'web' ? '/' : './',
  root: here,
  resolve: {
    alias: {
      '@': path.resolve(here, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      // Never rename top-level identifiers — that's what produced the
      // "var vb / function vb" collision in earlier deploys.
      mangle: { toplevel: false },
      // Belt: keep function and class names readable so even if Rollup
      // creates a duplicate, source identifiers (e.g. sanitizeFilename)
      // survive to the final output and can't collide with library aliases.
      keep_fnames: true,
      keep_classnames: true,
    },
    rollupOptions: {
      output: {
        // Suspenders: split heavy libraries into their own chunks so their
        // top-level scopes are physically separate files. Each chunk parses
        // in its own module scope — `var foo` in xlsx can't collide with
        // `function foo` in docxtemplater anymore.
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          xlsx: ['xlsx'],
          docx: ['docxtemplater', 'pizzip'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
}));
