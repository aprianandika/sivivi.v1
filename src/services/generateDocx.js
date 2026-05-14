import { toTemplatePayload } from '@/utils/normalize';

/**
 * Renderer-side wrapper around the main-process docxtemplater pipeline.
 *
 * Why this lives here even though heavy lifting happens in main: keeping a
 * single import path (`@/services/generateDocx`) for the UI lets us swap the
 * implementation (e.g. add PDF export) without touching pages or components.
 */

// Strips Vue reactive Proxies before IPC. structuredClone() would hit the same
// "could not be cloned" error that Electron's IPC bridge throws — JSON round-trip
// is the deliberate choice here.
function toPlain(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)); // NOSONAR
}

export async function generateDocx({ templateId, cv }) {
  if (!templateId) throw new Error('No template selected');
  if (!cv) throw new Error('CV data is empty');

  const data = toPlain(toTemplatePayload(cv));
  const result = await globalThis.api.docx.generate({ templateId, data });
  if (!result?.success) {
    const head = result?.error || 'Failed to generate DOCX';
    const tail = Array.isArray(result?.details) && result.details.length
      ? '\n• ' + result.details.join('\n• ')
      : '';
    throw new Error(head + tail);
  }
  return result;
}

const SECTION_KEYS = [
  'experiences',
  'education',
  'skills',
  'trainings',
  'certifications',
  'projects',
];

// Merge one contact onto the shared form base. Contact biodata + non-empty
// sections win; empty sections fall back to baseCv so a biodata-only contact
// still produces a CV with the form's current experiences/projects/etc.
function mergeContactWithBase(baseCv, contact, baseBiodata) {
  const cBio = contact?.biodata || {};
  const mergedBiodata = { ...baseBiodata };
  for (const k of Object.keys(cBio)) {
    if (cBio[k] !== '' && cBio[k] != null) mergedBiodata[k] = cBio[k];
  }
  const cv = { ...baseCv, biodata: mergedBiodata };
  for (const key of SECTION_KEYS) {
    const fromContact = Array.isArray(contact?.[key]) ? contact[key] : [];
    cv[key] = fromContact.length > 0 ? fromContact : (baseCv?.[key] || []);
  }
  return cv;
}

/**
 * Bulk-generate one .docx per contact.
 *
 * Contact shape is the multi-sheet form:
 *   { biodata: {...}, experiences: [], education: [], skills: [], ... }
 *
 * Continues on per-contact failure so partial batches still produce useful
 * output. Each result row reports success or the docxtemplater error.
 */
export async function generateBulk({ templateId, baseCv, contacts, onProgress }) {
  if (!templateId) throw new Error('No template selected');
  if (!Array.isArray(contacts) || contacts.length === 0) {
    throw new Error('No contacts to generate');
  }

  const results = [];
  const baseBiodata = { ...baseCv?.biodata, photo: '' };

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    onProgress?.({ index: i, total: contacts.length, contact });

    const cv = mergeContactWithBase(baseCv, contact, baseBiodata);
    const fullName = contact?.biodata?.full_name || 'CV';
    try {
      const result = await generateDocx({ templateId, cv });
      results.push({ success: true, contact: fullName, ...result });
    } catch (err) {
      results.push({ success: false, contact: fullName, error: err.message });
    }
  }
  return results;
}

export const generatedFiles = {
  list: () => globalThis.api.generated.list(),
  open: (path) => globalThis.api.generated.open(path),
  revealFolder: () => globalThis.api.generated.revealFolder(),
  remove: (path) => globalThis.api.generated.remove(path),
};
