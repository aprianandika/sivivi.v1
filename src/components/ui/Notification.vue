<script setup>
import { useUiStore } from '@/stores/uiStore';

const ui = useUiStore();

function colorClass(type) {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
    case 'error':
      return 'border-red-500/40 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    case 'warning':
      return 'border-amber-500/40 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
    default:
      return 'border-brand-500/40 bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200';
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
    <transition-group name="slide">
      <div
        v-for="n in ui.notifications"
        :key="n.id"
        class="border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 animate-slide-up"
        :class="colorClass(n.type)"
      >
        <div class="flex-1 min-w-0">
          <div v-if="n.title" class="font-semibold text-sm">{{ n.title }}</div>
          <div class="text-xs opacity-90 break-words">{{ n.message }}</div>
        </div>
        <button class="text-current opacity-60 hover:opacity-100" @click="ui.dismiss(n.id)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
