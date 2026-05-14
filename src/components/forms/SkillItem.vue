<script setup>
import AppInput from '@/components/ui/AppInput.vue';
import { useCvStore } from '@/stores/cvStore';

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
});
const cv = useCvStore();

function bind(field) {
  return {
    'model-value': props.item[field],
    'onUpdate:modelValue': (v) => cv.updateItem('skills', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <AppInput v-bind="bind('name')" label="Skill" placeholder="TypeScript" />
    <AppInput v-bind="bind('level')" label="Level (optional)" placeholder="Expert" />
  </div>
</template>
