<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const dragging = ref(false);
const fileInput = ref(null);

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => emit('update:modelValue', reader.result);
  reader.readAsDataURL(file);
}

function onDrop(e) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  handleFile(file);
}

function onPick(e) {
  handleFile(e.target.files?.[0]);
}

function remove() {
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div
      class="w-36 h-36 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors relative group"
      :class="dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-300 dark:border-slate-700 hover:border-brand-500'"
      @click="fileInput.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="modelValue" :src="modelValue" class="w-full h-full object-cover" alt="Profile" />
      <div v-else class="text-center text-slate-400 px-2">
        <svg class="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4-4m0 0l4-4m-4 4l4 4m4-12l4 4m0 0l-4 4m4-4H4" />
        </svg>
        <div class="text-xs">Drag photo or click</div>
      </div>
    </div>
    <button v-if="modelValue" class="btn-ghost text-xs" @click="remove">Remove photo</button>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPick" />
  </div>
</template>
