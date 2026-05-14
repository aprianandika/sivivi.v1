<script setup>
import { useTemplateStore } from '@/stores/templateStore';
import { useCvStore } from '@/stores/cvStore';
import { useUiStore } from '@/stores/uiStore';
import TemplateCard from '@/components/template/TemplateCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import AppCard from '@/components/ui/AppCard.vue';

const tpl = useTemplateStore();
const cv = useCvStore();
const ui = useUiStore();

async function select(id) {
  await cv.selectTemplate(id);
  ui.notify({ type: 'success', title: 'Template selected', message: 'Active template updated.' });
}

async function refresh() {
  await tpl.loadTemplates();
  ui.notify({ type: 'info', message: 'Templates refreshed.' });
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <AppCard padding="p-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold">Choose a template</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Templates are loaded from the local <code>/templates</code> folder. Drop a new <code>.docx</code> in there and refresh.
          </p>
        </div>
        <button class="btn-secondary" @click="refresh">Refresh</button>
      </div>
    </AppCard>

    <div v-if="tpl.loading" class="text-center text-slate-500 py-10">Loading templates…</div>

    <div v-else-if="!tpl.templates.length">
      <EmptyState
        title="No templates found"
        description="Add .docx files to the /templates folder and register them in templates.json."
      />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <TemplateCard
        v-for="t in tpl.templates"
        :key="t.id"
        :template="t"
        :selected="cv.selectedTemplateId === t.id"
        @select="select"
      />
    </div>
  </div>
</template>
