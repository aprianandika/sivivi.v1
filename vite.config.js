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
            includeAssets: ['favicon.svg', 'icons/*.png'],
            manifest: {
              name: 'Sivivi — CV Generator',
              short_name: 'Sivivi',
              description: 'Local CV generator. Fill, choose a template, get a .docx.',
              theme_color: '#1f3fe6',
              background_color: '#0f172a',
              display: 'standalone',
              orientation: 'any',
              start_url: './',
              scope: './',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,docx,json,webp,jpg,jpeg}'],
              maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
              navigateFallback: 'index.html',
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
  },
}));
