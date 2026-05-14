<script setup>
import { computed } from 'vue';
import draggable from 'vuedraggable';
import { useCvStore } from '@/stores/cvStore';
import AppCard from '@/components/ui/AppCard.vue';

const props = defineProps({
  /** State key on the cvStore, e.g. "experiences" */
  section: { type: String, required: true },
  /** Card title */
  title: { type: String, required: true },
  /** Card description shown under the title */
  description: { type: String, default: '' },
  /** Factory function for a new empty item */
  emptyItem: { type: Function, required: true },
  /** Add-button label */
  addLabel: { type: String, default: 'Add item' },
});

const cv = useCvStore();

const items = computed({
  get: () => cv.cv[props.section],
  set: (val) => cv.setSection(props.section, val),
});

// Stable per-object keys for vuedraggable. We map object identity → string id
// via a WeakMap so reordering doesn't reuse the wrong DOM node.
const keyMap = new WeakMap();
let keyCounter = 0;
function getKey(item) {
  if (!keyMap.has(item)) keyMap.set(item, `i_${++keyCounter}`);
  return keyMap.get(item);
}

function addItem() {
  cv.addItem(props.section, props.emptyItem());
}

function removeItem(index) {
  cv.removeItem(props.section, index);
}
</script>

<template>
  <AppCard :title="title" :description="description">
    <template #header>
      <button class="btn-secondary text-xs" @click="addItem">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {{ addLabel }}
      </button>
    </template>

    <draggable
      v-model="items"
      :animation="200"
      handle=".drag-handle"
      :item-key="getKey"
      class="space-y-3"
      ghost-class="opacity-40"
    >
      <template #item="{ element, index }">
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
          <div class="flex items-start gap-3">
            <button
              class="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1"
              title="Drag to reorder"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16" />
              </svg>
            </button>
            <div class="flex-1 min-w-0">
              <slot :item="element" :index="index" />
            </div>
            <button
              class="text-slate-400 hover:text-red-500 transition mt-1"
              title="Remove"
              @click="removeItem(index)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </draggable>

    <p v-if="!items.length" class="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
      No items yet. Click <span class="font-medium">{{ addLabel }}</span> to begin.
    </p>
  </AppCard>
</template>
