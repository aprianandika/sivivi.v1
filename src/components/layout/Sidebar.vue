<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

const links = [
  { to: '/editor', label: 'Editor', icon: 'M4 6h16M4 12h10M4 18h16' },
  { to: '/templates', label: 'Templates', icon: 'M3 4h7v7H3zM14 4h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { to: '/generated', label: 'Generated', icon: 'M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-7-3-7 3V6a2 2 0 012-2z' },
  { to: '/settings', label: 'Settings', icon: 'M12 6V4m0 16v-2M6 12H4m16 0h-2M7.05 7.05L5.636 5.636m12.728 12.728L16.95 16.95M7.05 16.95l-1.414 1.414M18.364 5.636L16.95 7.05M12 16a4 4 0 100-8 4 4 0 000 8z' },
];
</script>

<template>
  <aside class="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
    <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow flex items-center justify-center text-white font-bold">
        S
      </div>
      <div>
        <div class="font-semibold text-slate-900 dark:text-white">Sivivi</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">CV Generator</div>
      </div>
    </div>

    <nav class="flex-1 p-3 space-y-1">
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
        :class="
          route.path.startsWith(link.to)
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        "
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="link.icon" />
        </svg>
        {{ link.label }}
      </router-link>
    </nav>

    <div class="p-4 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
      Local · Offline · Private
    </div>
  </aside>
</template>
