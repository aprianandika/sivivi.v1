<script setup>
import AppCard from '@/components/ui/AppCard.vue';
import { useUiStore } from '@/stores/uiStore';
import { useCvStore } from '@/stores/cvStore';
import { useContactsStore } from '@/stores/contactsStore';

const ui = useUiStore();
const cv = useCvStore();
const contacts = useContactsStore();

async function clearAll() {
  if (!confirm('Erase the saved draft and reset everything? This cannot be undone.')) return;
  await cv.clearDraft();
  ui.notify({ type: 'success', title: 'Cleared', message: 'Draft reset.' });
}

async function importContactsExcel() {
  try {
    ui.startLoading('Importing contacts…');
    const result = await contacts.importFromExcel();
    if (result.canceled) return;
    ui.notify({
      type: 'success',
      title: 'Contacts imported',
      message: `${result.count} contact${result.count === 1 ? '' : 's'} loaded — autocomplete is now active in the Editor.`,
    });
  } catch (err) {
    ui.notify({ type: 'error', title: 'Import failed', message: err.message });
  } finally {
    ui.stopLoading();
  }
}

async function clearContacts() {
  if (!confirm(`Remove all ${contacts.count} loaded contacts?`)) return;
  await contacts.clear();
  ui.notify({ type: 'success', title: 'Contacts cleared' });
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <AppCard title="Appearance" description="Tweak the look of the editor.">
      <label class="flex items-center justify-between gap-4">
        <div>
          <div class="text-sm font-medium">Dark mode</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Easier on the eyes at night.</div>
        </div>
        <button
          class="relative inline-flex h-6 w-11 items-center rounded-full transition"
          :class="ui.darkMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'"
          @click="ui.toggleDarkMode"
        >
          <span
            class="inline-block h-5 w-5 transform rounded-full bg-white transition"
            :class="ui.darkMode ? 'translate-x-5' : 'translate-x-1'"
          />
        </button>
      </label>
    </AppCard>

    <AppCard
      title="Contacts (name autocomplete)"
      description="Import an Excel with multiple people. Typing in the Full Name field will search this list and auto-fill the rest of Personal Information."
    >
      <div class="text-sm text-slate-600 dark:text-slate-300 space-y-2">
        <p v-if="contacts.hasContacts">
          <span class="chip">{{ contacts.count }} contact{{ contacts.count === 1 ? '' : 's' }} loaded</span>
          <span v-if="contacts.sourceFile" class="text-xs text-slate-500 dark:text-slate-400 ml-2">
            from <code>{{ contacts.sourceFile }}</code>
          </span>
        </p>
        <p v-else class="text-slate-500 dark:text-slate-400">
          No contacts imported yet. Autocomplete will activate as soon as you import an Excel.
        </p>
        <details class="text-xs text-slate-500 dark:text-slate-400">
          <summary class="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">Expected Excel format</summary>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Sheet name <code>contacts</code> (or first sheet — whichever exists).</li>
            <li>Header row with any of: <code>full_name</code>, <code>job_title</code>, <code>place_of_birth</code>, <code>date_of_birth</code>, <code>sex</code>, <code>nationality</code>, <code>last_education</code>, <code>email</code>, <code>phone</code>, <code>address</code>, <code>linkedin</code>, <code>website</code>, <code>summary</code>.</li>
            <li>Aliases accepted: <code>name</code> → full_name, <code>position</code>/<code>title</code> → job_title, <code>dob</code> → date_of_birth, etc.</li>
            <li>One row = one person. Rows without a name are skipped.</li>
          </ul>
        </details>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn-primary" @click="importContactsExcel">
          {{ contacts.hasContacts ? 'Re-import contacts' : 'Import contacts Excel' }}
        </button>
        <button v-if="contacts.hasContacts" class="btn-ghost" @click="clearContacts">Clear contacts</button>
      </div>
    </AppCard>

    <AppCard title="Local data" description="Everything stays on your computer.">
      <div class="text-sm text-slate-600 dark:text-slate-300 space-y-2">
        <p>Sivivi stores your draft and selected template locally. Generated CVs are written to the local generated folder (desktop) or browser Downloads + IndexedDB (web).</p>
        <p>To start fresh, clear your saved draft.</p>
      </div>
      <div class="mt-4">
        <button class="btn-danger" @click="clearAll">Clear saved draft</button>
      </div>
    </AppCard>

    <AppCard title="About" description="Sivivi v0.1">
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Local CV generator. Works fully offline — no servers, no cloud, no telemetry.
      </p>
    </AppCard>
  </div>
</template>
