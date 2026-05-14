import { defineStore } from 'pinia';
import { storage } from '@/services/storageService';

let notifId = 0;

export const useUiStore = defineStore('ui', {
  state: () => ({
    darkMode: false,
    notifications: [],
    loading: false,
    loadingLabel: '',
  }),

  actions: {
    async init() {
      const settings = await storage.get('settings');
      this.darkMode = !!settings?.darkMode;
      this.applyTheme();
    },

    applyTheme() {
      const root = document.documentElement;
      if (this.darkMode) root.classList.add('dark');
      else root.classList.remove('dark');
    },

    async toggleDarkMode() {
      this.darkMode = !this.darkMode;
      this.applyTheme();
      await storage.set('settings', { darkMode: this.darkMode });
    },

    notify({ type = 'info', title = '', message = '', duration = 3500 }) {
      const id = ++notifId;
      this.notifications.push({ id, type, title, message });
      if (duration > 0) {
        setTimeout(() => this.dismiss(id), duration);
      }
      return id;
    },

    dismiss(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id);
    },

    startLoading(label = 'Working…') {
      this.loading = true;
      this.loadingLabel = label;
    },
    stopLoading() {
      this.loading = false;
      this.loadingLabel = '';
    },
  },
});
