<script setup>
import { onMounted, ref } from 'vue';
import { generatedFiles } from '@/services/generateDocx';
import { formatBytes, formatDate } from '@/utils/filename';
import AppCard from '@/components/ui/AppCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useUiStore } from '@/stores/uiStore';

const files = ref([]);
const loading = ref(false);
const ui = useUiStore();

async function refresh() {
  loading.value = true;
  try {
    files.value = await generatedFiles.list();
  } finally {
    loading.value = false;
  }
}

async function open(file) {
  await generatedFiles.open(file.path);
}

async function reveal() {
  await generatedFiles.revealFolder();
}

async function remove(file) {
  await generatedFiles.remove(file.path);
  await refresh();
  ui.notify({ type: 'info', message: `Deleted ${file.name}` });
}

onMounted(refresh);
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <AppCard padding="p-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold">Generated CVs</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Local files in your generated folder.</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-ghost" @click="refresh">Refresh</button>
          <button class="btn-secondary" @click="reveal">Open folder</button>
        </div>
      </div>
    </AppCard>

    <div v-if="loading" class="text-center text-slate-500 py-10">Loading…</div>

    <AppCard v-else-if="files.length" padding="p-0">
      <ul class="divide-y divide-slate-200 dark:divide-slate-800">
        <li
          v-for="f in files"
          :key="f.path"
          class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 flex items-center justify-center font-semibold">
              W
            </div>
            <div class="min-w-0">
              <div class="font-medium text-sm truncate">{{ f.name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ formatBytes(f.size) }} · {{ formatDate(f.modified) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary text-xs" @click="open(f)">Open</button>
            <button class="btn-ghost text-xs text-red-600 dark:text-red-400" @click="remove(f)">Delete</button>
          </div>
        </li>
      </ul>
    </AppCard>

    <EmptyState
      v-else
      title="No CVs generated yet"
      description="Head to the Editor, pick a template, and generate your first CV."
    />
  </div>
</template>
