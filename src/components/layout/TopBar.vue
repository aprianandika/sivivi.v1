<script setup>
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/uiStore';
import { useCvStore } from '@/stores/cvStore';
import Loader from '@/components/ui/Loader.vue';

const route = useRoute();
const ui = useUiStore();
const cv = useCvStore();

function title() {
  return route.meta?.title || 'Sivivi';
}

async function quickSave() {
  await cv.saveDraft();
  ui.notify({ type: 'success', title: 'Draft saved', message: 'Your CV draft was saved locally.' });
}
</script>

<template>
  <header class="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
    <div>
      <h1 class="text-lg font-semibold text-slate-900 dark:text-white">{{ title() }}</h1>
      <p v-if="cv.dirty" class="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</p>
      <p v-else class="text-xs text-slate-400 dark:text-slate-500">All changes saved</p>
    </div>

    <div class="flex items-center gap-3">
      <Loader v-if="ui.loading" :label="ui.loadingLabel" />
      <button class="btn-ghost" @click="ui.toggleDarkMode">
        <svg v-if="ui.darkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
        </svg>
      </button>
      <button class="btn-secondary" @click="quickSave">
        Save draft
      </button>
    </div>
  </header>
</template>
