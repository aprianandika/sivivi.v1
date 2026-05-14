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
    'onUpdate:modelValue': (v) => cv.updateItem('experiences', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <AppInput v-bind="bind('role')" label="Role" placeholder="Senior Engineer" />
    <AppInput v-bind="bind('company')" label="Company" placeholder="Acme Corp" />
    <AppInput v-bind="bind('duration')" label="Duration" placeholder="Jan 2022 – Present" />
    <AppInput v-bind="bind('location')" label="Location" placeholder="Berlin, DE" />
    <div class="sm:col-span-2">
      <AppTextarea v-bind="bind('description')" label="Description" placeholder="Key achievements, impact, technologies…" :rows="3" />
    </div>
  </div>
</template>
