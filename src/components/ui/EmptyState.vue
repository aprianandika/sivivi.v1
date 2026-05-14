<script setup>
defineProps({
  title: String,
  description: String,
  icon: { type: String, default: 'M9 13h6m-3-3v6m5-13H7a2 2 0 00-2 2v14l4-3 4 3 4-3 4 3V5a2 2 0 00-2-2z' },
});
</script>

<template>
  <div class="text-center py-12">
    <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="icon" />
      </svg>
    </div>
    <h3 v-if="title" class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ title }}</h3>
    <p v-if="description" class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{{ description }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
