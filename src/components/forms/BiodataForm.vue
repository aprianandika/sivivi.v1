<script setup>
import { useCvStore } from '@/stores/cvStore';
import { useUiStore } from '@/stores/uiStore';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import PhotoUpload from './PhotoUpload.vue';
import NameAutocomplete from './NameAutocomplete.vue';

const cv = useCvStore();
const ui = useUiStore();

function model(field) {
  return {
    get: () => cv.cv.biodata[field],
    set: (v) => cv.setBiodata(field, v),
  };
}

// Fields auto-populated when a contact is picked. Photo is preserved unless the
// contact explicitly carries one.
const PERSONAL_FIELDS = [
  'full_name',
  'job_title',
  'place_of_birth',
  'date_of_birth',
  'sex',
  'nationality',
  'last_education',
  'email',
  'phone',
  'address',
  'linkedin',
  'website',
  'summary',
];

const SECTION_KEYS = [
  'experiences',
  'education',
  'skills',
  'trainings',
  'certifications',
  'projects',
];

function onContactSelected(contact) {
  // 1) Fill biodata fields from contact.biodata (nested shape from multi-sheet
  //    parser). Non-empty values only — preserve form state for fields the
  //    contact doesn't carry.
  const bio = contact?.biodata || {};
  for (const field of PERSONAL_FIELDS) {
    const incoming = bio[field];
    if (incoming != null && incoming !== '') {
      cv.setBiodata(field, incoming);
    }
  }

  // 2) Replace each section whose contact-side array has entries. Empty
  //    arrays leave the form's existing section alone.
  const sectionsFilled = [];
  for (const key of SECTION_KEYS) {
    if (Array.isArray(contact?.[key]) && contact[key].length > 0) {
      cv.setSection(key, contact[key]);
      sectionsFilled.push(key);
    }
  }

  let sectionsNote = '';
  if (sectionsFilled.length) {
    const plural = sectionsFilled.length === 1 ? '' : 's';
    sectionsNote = ` + ${sectionsFilled.length} section${plural} (${sectionsFilled.join(', ')})`;
  }
  ui.notify({
    type: 'success',
    title: 'Contact loaded',
    message: `Personal information${sectionsNote} filled from ${bio.full_name || 'contact'}.`,
  });
}
</script>

<template>
  <AppCard title="Personal information" description="Type a name to search imported contacts and auto-fill the rest.">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="md:col-span-1 flex justify-center md:justify-start">
        <PhotoUpload :model-value="cv.cv.biodata.photo" @update:model-value="cv.setPhoto" />
      </div>

      <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <NameAutocomplete
            :model-value="model('full_name').get()"
            @update:model-value="model('full_name').set"
            @select="onContactSelected"
          />
        </div>
        <AppInput :model-value="model('job_title').get()" @update:model-value="model('job_title').set" label="Proposed position / Job title" placeholder="Senior Software Engineer" />
        <AppInput :model-value="model('place_of_birth').get()" @update:model-value="model('place_of_birth').set" label="Place of birth" placeholder="Jakarta" />
        <AppInput :model-value="model('date_of_birth').get()" @update:model-value="model('date_of_birth').set" label="Date of birth" placeholder="01 January 1990" />
        <AppInput :model-value="model('sex').get()" @update:model-value="model('sex').set" label="Sex" placeholder="Male / Female" />
        <AppInput :model-value="model('nationality').get()" @update:model-value="model('nationality').set" label="Nationality" placeholder="Indonesian" />
        <AppInput :model-value="model('last_education').get()" @update:model-value="model('last_education').set" label="Last education" placeholder="S1 Informatika, Universitas X" />
        <AppInput :model-value="model('email').get()" @update:model-value="model('email').set" label="Email" type="email" placeholder="jane@example.com" />
        <AppInput :model-value="model('phone').get()" @update:model-value="model('phone').set" label="Phone" placeholder="+62 812 3456 7890" />
        <AppInput :model-value="model('linkedin').get()" @update:model-value="model('linkedin').set" label="LinkedIn" placeholder="linkedin.com/in/janedoe" />
        <AppInput :model-value="model('website').get()" @update:model-value="model('website').set" label="Website" placeholder="janedoe.dev" />
        <div class="sm:col-span-2">
          <AppInput :model-value="model('address').get()" @update:model-value="model('address').set" label="Address" placeholder="Jakarta, Indonesia" />
        </div>
        <div class="sm:col-span-2">
          <AppTextarea :model-value="model('summary').get()" @update:model-value="model('summary').set" label="Summary / Profile" placeholder="A short professional summary…" :rows="4" />
        </div>
      </div>
    </div>
  </AppCard>
</template>
