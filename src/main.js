// MUST be the first import: populates globalThis.api with browser-native
// implementations when running outside Electron. In Electron, the preload
// bridge has already set window.api so the shim is a no-op.
import './web-shim';

// Cleanup pass for stale service workers. Previous builds that shipped
// vite-plugin-pwa register a SW that survives a re-install — when the new
// bundle loads, that SW serves its cached copy too and we get
// "Identifier 'xb' has already been declared". Unregister + nuke caches
// once at startup so file:// (Electron) and stale browser sessions recover.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister();
  }).catch(() => {});
}
if ('caches' in globalThis) {
  caches.keys().then((keys) => {
    for (const k of keys) caches.delete(k);
  }).catch(() => {});
}

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useUiStore } from './stores/uiStore';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Apply persisted dark mode before mounting to avoid flash
const ui = useUiStore();
ui.init();

app.mount('#app');
