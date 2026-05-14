const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('node:fs');
const XLSX = require('xlsx');

// Normalize header keys: trim, lowercase, replace spaces with underscores
function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function sheetToRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row) => {
    const out = {};
    for (const k of Object.keys(row)) {
      out[normalizeKey(k)] = typeof row[k] === 'string' ? row[k].trim() : row[k];
    }
    return out;
  });
}

// Map flexible sheet/column names to our normalized CV structure
function buildCvFromWorkbook(workbook) {
  const lower = Object.fromEntries(workbook.SheetNames.map((n) => [n.toLowerCase(), n]));

  const cv = {
    biodata: {},
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
  };

  // Biodata: a single-row sheet OR key/value pairs
  if (lower.biodata) {
    const rows = sheetToRows(workbook, lower.biodata);
    if (rows.length === 1) {
      cv.biodata = rows[0];
    } else if (rows.length > 1 && rows[0].key !== undefined) {
      // key/value layout
      const bio = {};
      for (const r of rows) bio[normalizeKey(r.key)] = r.value;
      cv.biodata = bio;
    } else if (rows.length > 0) {
      cv.biodata = rows[0];
    }
  }

  if (lower.experiences) {
    cv.experiences = sheetToRows(workbook, lower.experiences).map((r) => ({
      company: r.company || '',
      role: r.role || r.position || r.title || '',
      duration: r.duration || r.period || '',
      location: r.location || '',
      description: r.description || r.summary || '',
    }));
  }

  if (lower.education) {
    cv.education = sheetToRows(workbook, lower.education).map((r) => ({
      institution: r.institution || r.school || r.university || '',
      degree: r.degree || r.major || '',
      year: r.year || r.duration || '',
      description: r.description || '',
    }));
  }

  if (lower.skills) {
    cv.skills = sheetToRows(workbook, lower.skills).map((r) => ({
      name: r.name || r.skill || '',
      level: r.level || '',
    }));
  }

  if (lower.certifications) {
    cv.certifications = sheetToRows(workbook, lower.certifications).map((r) => ({
      name: r.name || r.certification || '',
      issuer: r.issuer || r.organization || '',
      year: r.year || r.date || '',
    }));
  }

  if (lower.trainings || lower.training || lower.course || lower.courses) {
    const sheetName = lower.trainings || lower.training || lower.course || lower.courses;
    cv.trainings = sheetToRows(workbook, sheetName).map((r) => ({
      name: r.name || r.training || r.course || '',
      organizer: r.organizer || r.organization || r.issuer || '',
      year: r.year || r.date || '',
      location: r.location || '',
      description: r.description || '',
    }));
  }

  if (lower.projects) {
    cv.projects = sheetToRows(workbook, lower.projects).map((r) => ({
      project: r.project || r.name || '',
      time_schedule: r.time_schedule || r.schedule || r.duration || r.year || '',
      company: r.company || '',
      location: r.location || '',
      position: r.position || r.role || '',
      responsibility: r.responsibility || r.specific_responsibility || r.description || '',
      link: r.link || r.url || '',
    }));
  }

  return cv;
}

// Parse a multi-row "contacts" workbook into a list of biodata snapshots.
// Each row becomes one selectable contact in the autocomplete dropdown.
// Accepts either a sheet named "contacts" or the first available sheet.
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

function pickField(row, key) {
  if (row[key] != null && row[key] !== '') return row[key];
  for (const alt of ALIASES[key] || []) {
    if (row[alt] != null && row[alt] !== '') return row[alt];
  }
  return '';
}

// Build a CV per row of the contacts sheet, then attach any rows from
// section sheets (experiences/education/skills/trainings/certifications/projects)
// whose `contact_id` (or `full_name`) matches the contact.
//
// Each contact ends up shaped like the canonical CV:
//   { biodata, experiences[], education[], skills[], trainings[],
//     certifications[], projects[] }
function buildContactsFromWorkbook(workbook) {
  const lower = Object.fromEntries(workbook.SheetNames.map((n) => [n.toLowerCase(), n]));
  const baseSheet =
    lower.contacts || lower.people || lower.biodata || workbook.SheetNames[0];
  if (!baseSheet) return [];

  const baseRows = sheetToRows(workbook, baseSheet);
  const contacts = baseRows
    .map((row, idx) => {
      const bio = {};
      for (const key of BIODATA_KEYS) bio[key] = String(pickField(row, key) || '').trim();
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

  // Lookup tables for fast linking
  const byId = new Map(contacts.map((c) => [c._id, c]));
  const byName = new Map(contacts.map((c) => [c._nameKey, c]));

  function attachSection(sheetCandidates, mapper, key) {
    const sheet = sheetCandidates.find((s) => lower[s]);
    if (!sheet) return;
    const rows = sheetToRows(workbook, lower[sheet]);
    for (const row of rows) {
      const id = String(row.contact_id || row.id || '');
      const name = String(row.full_name || row.name || '').toLowerCase();
      const target = byId.get(id) || byName.get(name);
      if (!target) continue;
      target[key].push(mapper(row));
    }
  }

  attachSection(['experiences', 'experience'], (r) => ({
    company: r.company || '',
    role: r.role || r.position || r.title || '',
    duration: r.duration || r.period || '',
    location: r.location || '',
    description: r.description || r.summary || '',
  }), 'experiences');

  attachSection(['education'], (r) => ({
    institution: r.institution || r.school || r.university || '',
    degree: r.degree || r.major || '',
    year: r.year || r.duration || '',
    description: r.description || '',
  }), 'education');

  attachSection(['skills'], (r) => ({
    name: r.name || r.skill || '',
    level: r.level || '',
  }), 'skills');

  attachSection(['trainings', 'training', 'courses', 'course'], (r) => ({
    name: r.name || r.training || r.course || '',
    organizer: r.organizer || r.organization || r.issuer || '',
    year: r.year || r.date || '',
    location: r.location || '',
    description: r.description || '',
  }), 'trainings');

  attachSection(['certifications'], (r) => ({
    name: r.name || r.certification || '',
    issuer: r.issuer || r.organization || '',
    year: r.year || r.date || '',
  }), 'certifications');

  attachSection(['projects'], (r) => ({
    project: r.project || r.name || '',
    time_schedule: r.time_schedule || r.schedule || r.duration || r.year || '',
    company: r.company || '',
    location: r.location || '',
    position: r.position || r.role || '',
    responsibility: r.responsibility || r.specific_responsibility || r.description || '',
    link: r.link || r.url || '',
  }), 'projects');

  // Drop the internal _id/_nameKey before returning.
  return contacts.map(({ _id, _nameKey, ...c }) => c);
}

module.exports = function register() {
  ipcMain.handle('excel:import', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Import CV data from Excel',
      filters: [{ name: 'Excel files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile'],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    try {
      const buf = fs.readFileSync(filePath);
      const workbook = XLSX.read(buf, { type: 'buffer' });
      const cv = buildCvFromWorkbook(workbook);
      return { canceled: false, data: cv, file: filePath };
    } catch (err) {
      return { canceled: false, error: err.message };
    }
  });

  ipcMain.handle('excel:importContacts', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Import contacts from Excel',
      filters: [{ name: 'Excel files', extensions: ['xlsx', 'xls'] }],
      properties: ['openFile'],
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    try {
      const buf = fs.readFileSync(filePath);
      const workbook = XLSX.read(buf, { type: 'buffer' });
      const contacts = buildContactsFromWorkbook(workbook);
      return { canceled: false, contacts, file: filePath };
    } catch (err) {
      return { canceled: false, error: err.message };
    }
  });
};
