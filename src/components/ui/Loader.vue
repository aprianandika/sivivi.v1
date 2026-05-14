<script setup>
defineProps({ label: { type: String, default: '' } });
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
    <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <span v-if="label">{{ label }}</span>
  </div>
</template>
