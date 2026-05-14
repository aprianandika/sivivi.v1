<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  padding: { type: String, default: 'p-6' },
});
</script>

<template>
  <section class="app-card animate-fade-in" :class="padding">
    <header v-if="title || $slots.header" class="flex items-start justify-between mb-4">
      <div>
        <h2 v-if="title" class="text-base font-semibold text-slate-900 dark:text-white">{{ title }}</h2>
        <p v-if="description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ description }}</p>
      </div>
      <div>
        <slot name="header" />
      </div>
    </header>
    <slot />
  </section>
</template>
