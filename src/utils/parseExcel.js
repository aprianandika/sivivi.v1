import * as XLSX from 'xlsx';

// Normalize header keys: trim, lowercase, replace spaces with underscores.
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

/**
 * Parse an XLSX workbook into the canonical CV shape used by the renderer.
 * Recognizes sheets: biodata, experiences, education, skills, certifications,
 * trainings (or training/course/courses), projects.
 *
 * Used by both Electron's main process (via ipc/excel.cjs that re-imports
 * this via xlsx directly) AND the browser PWA build.
 */
export function buildCvFromWorkbook(workbook) {
  const lower = Object.fromEntries(workbook.SheetNames.map((n) => [n.toLowerCase(), n]));

  const cv = {
    biodata: {},
    experiences: [],
    education: [],
    skills: [],
    trainings: [],
    certifications: [],
    projects: [],
  };

  if (lower.biodata) {
    const rows = sheetToRows(workbook, lower.biodata);
    if (rows.length === 1) {
      cv.biodata = rows[0];
    } else if (rows.length > 1 && rows[0].key !== undefined) {
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

  const trainingSheet =
    lower.trainings || lower.training || lower.course || lower.courses;
  if (trainingSheet) {
    cv.trainings = sheetToRows(workbook, trainingSheet).map((r) => ({
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

export function readWorkbookFromBuffer(buf) {
  return XLSX.read(buf, { type: 'array' });
}
