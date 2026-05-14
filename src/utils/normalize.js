/**
 * Returns the canonical empty CV shape. All UI code reads/writes through this
 * shape; importers and persistence layers must conform to it.
 */
export function defaultCv() {
  return {
    biodata: {
      full_name: '',
      job_title: '',
      place_of_birth: '',
      date_of_birth: '',
      sex: '',
      nationality: '',
      last_education: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      website: '',
      summary: '',
      photo: '', // base64 data URL (optional)
    },
    experiences: [],
    education: [],
    skills: [],
    trainings: [],
    certifications: [],
    projects: [],
  };
}

/**
 * Coerces an arbitrary partial CV blob (e.g. from Excel or a saved draft) into
 * the canonical shape without losing extra fields. Missing arrays become empty
 * arrays so the templates' loop sections never error.
 */
export function normalizeCv(input) {
  const base = defaultCv();
  if (!input || typeof input !== 'object') return base;

  return {
    biodata: { ...base.biodata, ...input.biodata },
    experiences: Array.isArray(input.experiences) ? input.experiences : [],
    education: Array.isArray(input.education) ? input.education : [],
    skills: Array.isArray(input.skills) ? input.skills : [],
    trainings: Array.isArray(input.trainings) ? input.trainings : [],
    certifications: Array.isArray(input.certifications) ? input.certifications : [],
    projects: Array.isArray(input.projects) ? input.projects : [],
  };
}

/**
 * Flattens the CV into the payload docxtemplater receives.
 *
 * Templates may use either the flat `{{full_name}}` style *or* dotted
 * `{{biodata.full_name}}`. Loop sections use the array names directly
 * (`{{#experiences}}…{{/experiences}}`).
 */
// Inject a 1-based `index` field into each row so templates can render
// numbered lists like "1.", "2." inside {{#projects}}…{{/projects}}.
function withIndex(items) {
  return items.map((item, i) => ({ index: i + 1, ...item }));
}

// Split a multi-line text field into an array of trimmed bullet points.
// Empty / whitespace-only lines are dropped.
function splitLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Projects support TWO multi-bullet fields:
//   - "Project" itself can contain multiple scopes (one per line) → project_items
//   - "Specific Responsibility" can contain multiple bullets → responsibilities
// Templates loop these via {{#project_items}}…{{/project_items}} and
// {{#responsibilities}}…{{/responsibilities}}.
function expandProjects(items) {
  return items.map((item, i) => ({
    index: i + 1,
    ...item,
    project_items: splitLines(item.project),
    responsibilities: splitLines(item.responsibility),
  }));
}

// Same trick for experience descriptions — often a list of achievements.
function expandExperiences(items) {
  return items.map((item, i) => ({
    index: i + 1,
    ...item,
    points: splitLines(item.description),
  }));
}

export function toTemplatePayload(cv) {
  const normalized = normalizeCv(cv);
  return {
    ...normalized.biodata,
    biodata: normalized.biodata,
    experiences: expandExperiences(normalized.experiences),
    education: withIndex(normalized.education),
    skills: withIndex(normalized.skills),
    trainings: withIndex(normalized.trainings),
    certifications: withIndex(normalized.certifications),
    projects: expandProjects(normalized.projects),
    has_experiences: normalized.experiences.length > 0,
    has_education: normalized.education.length > 0,
    has_skills: normalized.skills.length > 0,
    has_trainings: normalized.trainings.length > 0,
    has_certifications: normalized.certifications.length > 0,
    has_projects: normalized.projects.length > 0,
  };
}
