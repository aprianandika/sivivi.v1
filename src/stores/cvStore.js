import { defineStore } from 'pinia';
import { storage } from '@/services/storageService';
import { defaultCv, normalizeCv } from '@/utils/normalize';
import { sanitizeFilename } from '@/utils/filename';

export const useCvStore = defineStore('cv', {
  state: () => ({
    cv: defaultCv(),
    selectedTemplateId: null,
    dirty: false,
  }),

  getters: {
    fileName(state) {
      const name = state.cv.biodata.full_name || 'CV';
      return `CV_${sanitizeFilename(name).toUpperCase()}.docx`;
    },
  },

  actions: {
    async loadDraft() {
      const draft = await storage.get('draft');
      const tplId = await storage.get('selectedTemplate');
      if (draft) this.cv = normalizeCv(draft);
      if (tplId) this.selectedTemplateId = tplId;
    },

    async saveDraft() {
      await storage.set('draft', this.cv);
      this.dirty = false;
    },

    async clearDraft() {
      this.cv = defaultCv();
      this.selectedTemplateId = null;
      await storage.set('draft', null);
      await storage.set('selectedTemplate', null);
    },

    async selectTemplate(id) {
      this.selectedTemplateId = id;
      await storage.set('selectedTemplate', id);
    },

    setBiodata(field, value) {
      this.cv.biodata[field] = value;
      this.dirty = true;
    },

    setPhoto(dataUrl) {
      this.cv.biodata.photo = dataUrl;
      this.dirty = true;
    },

    /**
     * Generic helpers for dynamic sections. Section keys: experiences,
     * education, skills, certifications, projects.
     */
    addItem(section, item) {
      this.cv[section].push(item);
      this.dirty = true;
    },
    removeItem(section, index) {
      this.cv[section].splice(index, 1);
      this.dirty = true;
    },
    updateItem(section, index, key, value) {
      this.cv[section][index][key] = value;
      this.dirty = true;
    },
    setSection(section, items) {
      this.cv[section] = items;
      this.dirty = true;
    },

    /** Replace entire CV (used by Excel import). */
    setCv(data) {
      this.cv = normalizeCv(data);
      this.dirty = true;
    },
  },
});
