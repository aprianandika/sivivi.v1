import { defineStore } from 'pinia';
import { storage } from '@/services/storageService';
import { importContacts } from '@/services/contactsImport';

const STORAGE_KEY = 'contacts';

// Old (biodata-only) format had fields at the root; new shape nests them under
// `biodata` and adds section arrays. Migrate on load so existing storage keeps
// working after the upgrade.
function migrate(contact) {
  if (contact && typeof contact === 'object' && contact.biodata) return contact;
  return {
    biodata: { ...contact },
    experiences: [],
    education: [],
    skills: [],
    trainings: [],
    certifications: [],
    projects: [],
  };
}

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [], // [{ biodata: {...}, experiences: [...], education: [...], ... }]
    sourceFile: null,
    loading: false,
    error: null,
  }),

  getters: {
    count: (state) => state.contacts.length,
    hasContacts: (state) => state.contacts.length > 0,
  },

  actions: {
    async load() {
      const saved = await storage.get(STORAGE_KEY);
      if (saved && Array.isArray(saved.contacts)) {
        this.contacts = saved.contacts.map(migrate);
        this.sourceFile = saved.sourceFile || null;
      }
    },

    async importFromExcel() {
      this.loading = true;
      this.error = null;
      try {
        const result = await importContacts();
        if (result.canceled) return { canceled: true };
        if (result.error) throw new Error(result.error);
        this.contacts = (result.contacts || []).map(migrate);
        this.sourceFile = result.file;
        await storage.set(STORAGE_KEY, {
          contacts: this.contacts,
          sourceFile: this.sourceFile,
        });
        return { canceled: false, count: this.contacts.length };
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async clear() {
      this.contacts = [];
      this.sourceFile = null;
      await storage.set(STORAGE_KEY, null);
    },

    /**
     * Case-insensitive substring match on biodata.full_name. Prefix matches
     * float to the top so "joh" puts "John Doe" before "Sarah Johnson".
     * Returns at most `limit` results.
     */
    search(query, limit = 8) {
      const q = String(query || '').trim().toLowerCase();
      if (!q) return this.contacts.slice(0, limit);
      const prefix = [];
      const contains = [];
      for (const c of this.contacts) {
        const name = String(c.biodata?.full_name || '').toLowerCase();
        if (!name) continue;
        if (name.startsWith(q)) prefix.push(c);
        else if (name.includes(q)) contains.push(c);
        if (prefix.length + contains.length >= limit * 2) break;
      }
      return [...prefix, ...contains].slice(0, limit);
    },
  },
});
