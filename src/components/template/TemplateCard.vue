<script setup>
import { useTemplateStore } from '@/stores/templateStore';
import { computed } from 'vue';

const props = defineProps({
  template: { type: Object, required: true },
  selected: Boolean,
});
defineEmits(['select']);

const tplStore = useTemplateStore();
const preview = computed(() => tplStore.getPreview(props.template.id));
</script>

<template>
  <button
    class="text-left app-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
    :class="selected ? 'ring-2 ring-brand-500 border-brand-500/40' : ''"
    @click="$emit('select', template.id)"
  >
    <div class="aspect-[3/4] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
      <img v-if="preview" :src="preview" :alt="template.name" class="w-full h-full object-cover" />
      <div v-else class="text-slate-400 text-xs px-4 text-center">
        <div class="text-2xl mb-1">📄</div>
        No preview image
      </div>
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between">
        <div class="font-semibold text-slate-900 dark:text-white">{{ template.name }}</div>
        <span v-if="selected" class="chip">Selected</span>
        <span v-else-if="!template.available" class="chip bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">Missing file</span>
      </div>
      <p v-if="template.description" class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ template.description }}</p>
    </div>
  </button>
</template>
