// MUST be the first import: populates globalThis.api with browser-native
// implementations when running outside Electron. In Electron, the preload
// bridge has already set window.api so the shim is a no-op.
import './web-shim';

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
