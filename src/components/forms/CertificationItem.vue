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
    'onUpdate:modelValue': (v) => cv.updateItem('certifications', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <AppInput v-bind="bind('name')" label="Certification" placeholder="AWS Solutions Architect" />
    <AppInput v-bind="bind('issuer')" label="Issuer" placeholder="Amazon Web Services" />
    <AppInput v-bind="bind('year')" label="Year" placeholder="2024" />
  </div>
</template>
