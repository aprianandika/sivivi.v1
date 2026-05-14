import { createRouter, createWebHashHistory } from 'vue-router';
import EditorPage from '@/pages/EditorPage.vue';
import TemplatesPage from '@/pages/TemplatesPage.vue';
import GeneratedPage from '@/pages/GeneratedPage.vue';
import SettingsPage from '@/pages/SettingsPage.vue';

const routes = [
  { path: '/', redirect: '/editor' },
  { path: '/editor', name: 'editor', component: EditorPage, meta: { title: 'Editor' } },
  { path: '/templates', name: 'templates', component: TemplatesPage, meta: { title: 'Templates' } },
  { path: '/generated', name: 'generated', component: GeneratedPage, meta: { title: 'Generated' } },
  { path: '/settings', name: 'settings', component: SettingsPage, meta: { title: 'Settings' } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
