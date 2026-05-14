<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useContactsStore } from '@/stores/contactsStore';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Full name' },
  placeholder: { type: String, default: 'Type to search contacts…' },
});

const emit = defineEmits(['update:modelValue', 'select']);

const contacts = useContactsStore();
const rootEl = ref(null);
const open = ref(false);
const highlight = ref(0);

const suggestions = computed(() => contacts.search(props.modelValue));

function onInput(e) {
  emit('update:modelValue', e.target.value);
  open.value = true;
  highlight.value = 0;
}

function onFocus() {
  if (contacts.hasContacts) open.value = true;
}

function choose(contact) {
  // Push the chosen contact (full CV) up to the form. The form decides
  // which fields/sections to apply.
  emit('select', contact);
  emit('update:modelValue', contact.biodata?.full_name || '');
  open.value = false;
}

function onKey(e) {
  if (!open.value || !suggestions.value.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlight.value = (highlight.value + 1) % suggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlight.value =
      (highlight.value - 1 + suggestions.value.length) % suggestions.value.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    choose(suggestions.value[highlight.value]);
  } else if (e.key === 'Escape') {
    open.value = false;
  }
}

function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) open.value = false;
}

watch(() => props.modelValue, () => {
  highlight.value = 0;
});

onMounted(() => document.addEventListener('mousedown', onDocClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));
</script>

<template>
  <div ref="rootEl" class="relative">
    <label class="app-label">{{ label }} <span class="text-red-500">*</span></label>
    <div class="relative">
      <input
        :value="modelValue"
        type="text"
        class="app-input pr-9"
        :placeholder="placeholder"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKey"
      />
      <span
        v-if="contacts.hasContacts"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400"
        :title="`${contacts.count} contacts loaded`"
      >
        🔍
      </span>
    </div>

    <ul
      v-if="open && suggestions.length"
      class="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-lg border
             border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900
             shadow-lg animate-fade-in"
    >
      <li
        v-for="(c, i) in suggestions"
        :key="i"
        class="px-3 py-2 cursor-pointer text-sm"
        :class="
          i === highlight
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        "
        @mousedown.prevent="choose(c)"
        @mouseenter="highlight = i"
      >
        <div class="font-medium">{{ c.biodata?.full_name }}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
          <span v-if="c.biodata?.job_title">{{ c.biodata.job_title }}</span>
          <span v-if="c.biodata?.job_title && c.biodata?.email"> · </span>
          <span v-if="c.biodata?.email">{{ c.biodata.email }}</span>
          <span
            v-if="c.experiences?.length || c.education?.length || c.projects?.length"
            class="ml-1 text-brand-500"
            title="Full CV (with sections)"
          >• full CV</span>
        </div>
      </li>
    </ul>

    <p
      v-if="!contacts.hasContacts"
      class="text-xs text-slate-500 dark:text-slate-400 mt-1"
    >
      Tip: import contacts Excel in
      <router-link to="/settings" class="text-brand-600 dark:text-brand-300 underline">Settings</router-link>
      to enable name search.
    </p>
  </div>
</template>
