<script setup>
import { onMounted } from 'vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import TopBar from '@/components/layout/TopBar.vue';
import Notification from '@/components/ui/Notification.vue';
import { useCvStore } from '@/stores/cvStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useContactsStore } from '@/stores/contactsStore';

const cv = useCvStore();
const tpl = useTemplateStore();
const contacts = useContactsStore();

onMounted(async () => {
  await Promise.all([cv.loadDraft(), tpl.loadTemplates(), contacts.load()]);
});
</script>

<template>
  <div class="h-full flex bg-slate-100 dark:bg-slate-950">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <TopBar />
      <main class="flex-1 overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <Notification />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
