<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  placeholder: String,
  rows: { type: Number, default: 4 },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <label class="block">
    <span v-if="label" class="app-label">{{ label }}</span>
    <textarea
      class="app-input resize-y"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>
