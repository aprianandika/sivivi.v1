import * as XLSX from 'xlsx';
import { isElectron } from './runtime';

const BIODATA_KEYS = [
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

const ALIASES = {
  full_name: ['name', 'fullname'],
  job_title: ['position', 'title', 'role', 'job'],
  place_of_birth: ['birthplace', 'place'],
  date_of_birth: ['dob', 'birthdate', 'birth_date'],
  last_education: ['education', 'degree'],
  phone: ['telephone', 'mobile', 'hp', 'no_hp'],
  address: ['alamat'],
};

function normalizeKey(k) {
  return String(k || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function pickField(row, key) {
  if (row[key] != null && row[key] !== '') return row[key];
  for (const alt of ALIASES[key] || []) {
    if (row[alt] != null && row[alt] !== '') return row[alt];
  }
  return '';
}

function sheetRows(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' }).map((row) => {
    const out = {};
    for (const k of Object.keys(row)) {
      out[normalizeKey(k)] = typeof row[k] === 'string' ? row[k].trim() : row[k];
    }
    return out;
  });
}

// Build full CVs (biodata + sections) per row of the contacts sheet.
// Section sheets attach by `contact_id` (or `full_name`) to the right contact.
function buildContactsFromWorkbook(wb) {
  const lower = Object.fromEntries(wb.SheetNames.map((n) => [n.toLowerCase(), n]));
  const baseSheet = lower.contacts || lower.people || lower.biodata || wb.SheetNames[0];
  if (!baseSheet) return [];

  const baseRows = sheetRows(wb, baseSheet);
  const contacts = baseRows
    .map((row, idx) => {
      const bio = {};
      for (const k of BIODATA_KEYS) bio[k] = String(pickField(row, k) || '').trim();
      const id = String(row.id || row.contact_id || idx + 1);
      return {
        _id: id,
        _nameKey: bio.full_name.toLowerCase(),
        biodata: bio,
        experiences: [],
        education: [],
        skills: [],
        trainings: [],
        certifications: [],
        projects: [],
      };
    })
    .filter((c) => c.biodata.full_name);

  const byId = new Map(contacts.map((c) => [c._id, c]));
  const byName = new Map(contacts.map((c) => [c._nameKey, c]));

  function attach(candidates, mapper, key) {
    const sheet = candidates.find((s) => lower[s]);
    if (!sheet) return;
    const rows = sheetRows(wb, lower[sheet]);
    for (const row of rows) {
      const id = String(row.contact_id || row.id || '');
      const name = String(row.full_name || row.name || '').toLowerCase();
      const target = byId.get(id) || byName.get(name);
      if (!target) continue;
      target[key].push(mapper(row));
    }
  }

  attach(['experiences', 'experience'], (r) => ({
    company: r.company || '',
    role: r.role || r.position || r.title || '',
    duration: r.duration || r.period || '',
    location: r.location || '',
    description: r.description || r.summary || '',
  }), 'experiences');

  attach(['education'], (r) => ({
    institution: r.institution || r.school || r.university || '',
    degree: r.degree || r.major || '',
    year: r.year || r.duration || '',
    description: r.description || '',
  }), 'education');

  attach(['skills'], (r) => ({
    name: r.name || r.skill || '',
    level: r.level || '',
  }), 'skills');

  attach(['trainings', 'training', 'courses', 'course'], (r) => ({
    name: r.name || r.training || r.course || '',
    organizer: r.organizer || r.organization || r.issuer || '',
    year: r.year || r.date || '',
    location: r.location || '',
    description: r.description || '',
  }), 'trainings');

  attach(['certifications'], (r) => ({
    name: r.name || r.certification || '',
    issuer: r.issuer || r.organization || '',
    year: r.year || r.date || '',
  }), 'certifications');

  attach(['projects'], (r) => ({
    project: r.project || r.name || '',
    time_schedule: r.time_schedule || r.schedule || r.duration || r.year || '',
    company: r.company || '',
    location: r.location || '',
    position: r.position || r.role || '',
    responsibility: r.responsibility || r.specific_responsibility || r.description || '',
    link: r.link || r.url || '',
  }), 'projects');

  return contacts.map(({ _id, _nameKey, ...c }) => c);
}

// Electron path: native file picker via IPC, parsing happens in main process.
async function importContactsElectron() {
  const result = await globalThis.api.excel.importContacts();
  if (result.canceled) return { canceled: true };
  if (result.error) throw new Error(result.error);
  return { canceled: false, contacts: result.contacts, file: result.file };
}

// Web/PWA path: <input type="file"> + parse with XLSX in-browser.
function importContactsWeb() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      document.body.removeChild(input);
      if (!file) return resolve({ canceled: true });
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const contacts = buildContactsFromWorkbook(wb);
        resolve({ canceled: false, contacts, file: file.name });
      } catch (err) {
        resolve({ canceled: false, error: err.message });
      }
    };
    document.body.appendChild(input);
    input.click();
  });
}

export const importContacts = isElectron ? importContactsElectron : importContactsWeb;
