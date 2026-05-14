<script setup>
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useCvStore } from '@/stores/cvStore';

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
});
const cv = useCvStore();

function bind(field) {
  return {
    'model-value': props.item[field],
    'onUpdate:modelValue': (v) => cv.updateItem('education', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <AppInput v-bind="bind('institution')" label="Institution" placeholder="Stanford University" />
    <AppInput v-bind="bind('degree')" label="Degree / Major" placeholder="BSc Computer Science" />
    <AppInput v-bind="bind('year')" label="Year" placeholder="2018 – 2022" />
    <div class="sm:col-span-2">
      <AppTextarea v-bind="bind('description')" label="Description" placeholder="Honors, focus areas, thesis…" :rows="2" />
    </div>
  </div>
</template>
