import { defineStore } from 'pinia';
import { templateService } from '@/services/templateService';

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [],
    previews: {},
    loading: false,
    error: null,
  }),

  actions: {
    async loadTemplates() {
      this.loading = true;
      this.error = null;
      try {
        this.templates = await templateService.list();
        // Lazy-load previews in parallel for templates that declare one
        await Promise.all(
          this.templates
            .filter((t) => t.hasPreview)
            .map(async (t) => {
              this.previews[t.id] = await templateService.preview(t.id);
            })
        );
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    getPreview(id) {
      return this.previews[id] || null;
    },
  },
});
