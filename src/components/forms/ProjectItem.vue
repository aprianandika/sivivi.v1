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
    'onUpdate:modelValue': (v) => cv.updateItem('projects', props.index, field, v),
  };
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div class="sm:col-span-2">
      <AppTextarea
        v-bind="bind('project')"
        label="Project (one scope per line)"
        placeholder="Fabrikasi, Instalasi Dan Pemeliharaan Konstruksi Struktur, Pipa, Dan Sipil…&#10;Penyisihan (Segmental Partial Replacement) Main Oil Line XAP ke MGS Balongan&#10;Reaktivasi Reparator V-620 di L-PRO"
        :rows="3"
      />
      <p class="text-xs text-slate-500 mt-1">
        Each line becomes one bullet in <code v-pre>{{#project_items}}…{{/project_items}}</code>.
      </p>
    </div>
    <AppInput v-bind="bind('time_schedule')" label="Time schedule" placeholder="Oct 2012 — Now" />
    <AppInput v-bind="bind('company')" label="Company" placeholder="PT Elnusa Tbk" />
    <AppInput v-bind="bind('location')" label="Location" placeholder="Indonesia" />
    <AppInput v-bind="bind('position')" label="Position" placeholder="Specialist Crane Technician/Operator" />
    <AppInput v-bind="bind('link')" label="Link (optional)" placeholder="github.com/me/project" />
    <div class="sm:col-span-2">
      <AppTextarea
        v-bind="bind('responsibility')"
        label="Specific responsibility (one point per line)"
        placeholder="Perform preventive, corrective, and breakdown maintenance for offshore cranes.&#10;Inspect mechanical, hydraulic, pneumatic, and electrical systems…&#10;Diagnose and troubleshoot crane system failures."
        :rows="6"
      />
      <p class="text-xs text-slate-500 mt-1">
        Each line becomes one bullet in <code v-pre>{{#responsibilities}}…{{/responsibilities}}</code>.
      </p>
    </div>
  </div>
</template>
