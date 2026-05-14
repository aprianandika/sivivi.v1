<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: String,
  placeholder: String,
  type: { type: String, default: 'text' },
  hint: String,
  required: Boolean,
});
defineEmits(['update:modelValue']);
</script>

<template>
  <label class="block">
    <span v-if="label" class="app-label">{{ label }}<span v-if="required" class="text-red-500"> *</span></span>
    <input
      class="app-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="hint" class="text-xs text-slate-400 mt-1 block">{{ hint }}</span>
  </label>
</template>
