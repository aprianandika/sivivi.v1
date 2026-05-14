<script setup>
import { useRouter } from 'vue-router';
import { useCvStore } from '@/stores/cvStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useUiStore } from '@/stores/uiStore';
import { useContactsStore } from '@/stores/contactsStore';
import { importExcel } from '@/services/excelImport';
import { generateDocx, generateBulk } from '@/services/generateDocx';

import BiodataForm from '@/components/forms/BiodataForm.vue';
import DynamicSection from '@/components/forms/DynamicSection.vue';
import ExperienceItem from '@/components/forms/ExperienceItem.vue';
import EducationItem from '@/components/forms/EducationItem.vue';
import SkillItem from '@/components/forms/SkillItem.vue';
import CertificationItem from '@/components/forms/CertificationItem.vue';
import TrainingItem from '@/components/forms/TrainingItem.vue';
import ProjectItem from '@/components/forms/ProjectItem.vue';
import AppCard from '@/components/ui/AppCard.vue';

const router = useRouter();
const cv = useCvStore();
const tpl = useTemplateStore();
const ui = useUiStore();
const contacts = useContactsStore();

const emptyExperience = () => ({ role: '', company: '', duration: '', location: '', description: '' });
const emptyEducation = () => ({ institution: '', degree: '', year: '', description: '' });
const emptySkill = () => ({ name: '', level: '' });
const emptyCertification = () => ({ name: '', issuer: '', year: '' });
const emptyTraining = () => ({ name: '', organizer: '', year: '', location: '', description: '' });
const emptyProject = () => ({
  project: '',
  time_schedule: '',
  company: '',
  location: '',
  position: '',
  responsibility: '',
  link: '',
});

async function onImportExcel() {
  try {
    ui.startLoading('Importing Excel…');
    const result = await importExcel();
    if (result.canceled) return;
    cv.setCv(result.data);
    await cv.saveDraft();
    ui.notify({
      type: 'success',
      title: 'Excel imported',
      message: 'Form has been auto-filled from your spreadsheet.',
    });
  } catch (err) {
    ui.notify({ type: 'error', title: 'Import failed', message: err.message });
  } finally {
    ui.stopLoading();
  }
}

async function onGenerateBulk() {
  if (!cv.selectedTemplateId) {
    ui.notify({
      type: 'warning',
      title: 'No template selected',
      message: 'Pick a template before bulk generating.',
    });
    router.push('/templates');
    return;
  }
  if (!contacts.hasContacts) {
    ui.notify({
      type: 'warning',
      title: 'No contacts',
      message: 'Import a contacts Excel in Settings first.',
    });
    return;
  }
  const total = contacts.count;
  if (!confirm(
    `Generate ${total} CV${total === 1 ? '' : 's'} — one per contact?\n` +
      'Each CV uses the contact’s biodata plus the experiences, education, ' +
      'projects, etc. currently in this form.'
  )) {
    return;
  }
  try {
    ui.startLoading(`Generating 0/${total}…`);
    await cv.saveDraft();
    const results = await generateBulk({
      templateId: cv.selectedTemplateId,
      baseCv: cv.cv,
      contacts: contacts.contacts,
      onProgress: ({ index }) => {
        ui.startLoading(`Generating ${index + 1}/${total}…`);
      },
    });
    const ok = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    const plural = ok === 1 ? '' : 's';
    let message;
    if (fail === 0) message = `Generated ${ok} CV${plural}.`;
    else message = `${ok} succeeded, ${fail} failed. See Generated tab.`;
    ui.notify({
      type: fail === 0 ? 'success' : 'warning',
      title: 'Bulk generation done',
      message,
    });
    router.push('/generated');
  } catch (err) {
    ui.notify({ type: 'error', title: 'Bulk generation failed', message: err.message });
  } finally {
    ui.stopLoading();
  }
}

async function onGenerate() {
  if (!cv.selectedTemplateId) {
    ui.notify({
      type: 'warning',
      title: 'No template selected',
      message: 'Pick a template first.',
    });
    router.push('/templates');
    return;
  }
  if (!cv.cv.biodata.full_name?.trim()) {
    ui.notify({ type: 'warning', title: 'Name required', message: 'Please enter your full name.' });
    return;
  }
  try {
    ui.startLoading('Generating DOCX…');
    await cv.saveDraft();
    const result = await generateDocx({
      templateId: cv.selectedTemplateId,
      cv: cv.cv,
    });
    ui.notify({
      type: 'success',
      title: 'CV generated',
      message: `Saved as ${result.fileName}`,
    });
    router.push('/generated');
  } catch (err) {
    ui.notify({ type: 'error', title: 'Generation failed', message: err.message });
  } finally {
    ui.stopLoading();
  }
}

function selectedTemplateName() {
  const t = tpl.templates.find((x) => x.id === cv.selectedTemplateId);
  return t?.name || 'None selected';
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <AppCard padding="p-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <div class="text-xs uppercase tracking-wider text-slate-400">Active template</div>
          <div class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedTemplateName() }}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-secondary" @click="onImportExcel">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            Import Excel
          </button>
          <router-link to="/templates" class="btn-ghost">Choose template</router-link>
          <button
            v-if="contacts.hasContacts"
            class="btn-secondary"
            :title="`Generate one CV per contact (${contacts.count} total)`"
            @click="onGenerateBulk"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m0 0a4 4 0 015.46 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Generate all ({{ contacts.count }})
          </button>
          <button class="btn-primary" @click="onGenerate">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Generate CV
          </button>
        </div>
      </div>
    </AppCard>

    <BiodataForm />

    <DynamicSection
      section="experiences"
      title="Work experience"
      description="Drag the handle to reorder positions chronologically."
      add-label="Add experience"
      :empty-item="emptyExperience"
    >
      <template #default="{ item, index }">
        <ExperienceItem :item="item" :index="index" />
      </template>
    </DynamicSection>

    <DynamicSection
      section="education"
      title="Education"
      add-label="Add education"
      :empty-item="emptyEducation"
    >
      <template #default="{ item, index }">
        <EducationItem :item="item" :index="index" />
      </template>
    </DynamicSection>

    <DynamicSection
      section="skills"
      title="Skills"
      add-label="Add skill"
      :empty-item="emptySkill"
    >
      <template #default="{ item, index }">
        <SkillItem :item="item" :index="index" />
      </template>
    </DynamicSection>

    <DynamicSection
      section="trainings"
      title="Course and training"
      add-label="Add course / training"
      :empty-item="emptyTraining"
    >
      <template #default="{ item, index }">
        <TrainingItem :item="item" :index="index" />
      </template>
    </DynamicSection>

    <DynamicSection
      section="certifications"
      title="Certifications"
      add-label="Add certification"
      :empty-item="emptyCertification"
    >
      <template #default="{ item, index }">
        <CertificationItem :item="item" :index="index" />
      </template>
    </DynamicSection>

    <DynamicSection
      section="projects"
      title="Projects"
      add-label="Add project"
      :empty-item="emptyProject"
    >
      <template #default="{ item, index }">
        <ProjectItem :item="item" :index="index" />
      </template>
    </DynamicSection>
  </div>
</template>
