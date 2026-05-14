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
    'onUpdate:modelValue': (v) => cv.updateItem('trainings', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <AppInput v-bind="bind('name')" label="Course / Training" placeholder="Advanced Project Management" />
    <AppInput v-bind="bind('organizer')" label="Organizer" placeholder="PMI Indonesia" />
    <AppInput v-bind="bind('year')" label="Year" placeholder="2024" />
    <AppInput v-bind="bind('location')" label="Location" placeholder="Jakarta" />
    <div class="sm:col-span-2">
      <AppTextarea v-bind="bind('description')" label="Description (optional)" placeholder="What you learned, certification earned…" :rows="2" />
    </div>
  </div>
</template>
