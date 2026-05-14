/**
 * Web/PWA shim — polyfills `window.api` (normally provided by Electron's
 * preload bridge) using browser-only primitives so the same Vue/Pinia code
 * runs in a tablet's Chrome.
 *
 * Loaded UNCONDITIONALLY first in main.js. In Electron, the preload script
 * has already populated window.api, so this file is a no-op. In a browser,
 * it builds the same shape from fetch + localStorage + IndexedDB.
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as XLSX from 'xlsx';

if (!globalThis.api) {
  // ------------------------------------------------------------- helpers ---

  const TEMPLATE_BASE = './templates';
  const STORAGE_PREFIX = 'sivivi:';

  const json = (v) => (v == null ? null : JSON.parse(v));

  function sanitizeFilename(name) {
    return (
      String(name || 'CV')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'CV'
    );
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  function triggerDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ------------------------------------------------------------- IndexedDB
  // Stores generated .docx blobs so the user can re-download history.

  const DB_NAME = 'sivivi-files';
  const STORE = 'generated';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'name' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbPut(record) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGet(name) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(name);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDel(name) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(name);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ------------------------------------------------------------- templates

  let templatesCache = null;

  async function listTemplates() {
    if (templatesCache) return templatesCache;
    const res = await fetch(`${TEMPLATE_BASE}/templates.json`);
    if (!res.ok) return [];
    const manifest = await res.json();
    if (!Array.isArray(manifest)) return [];

    // HEAD-check each .docx so unavailable templates are flagged like the
    // Electron handler does (UI uses `available` to filter the cards).
    const enriched = await Promise.all(
      manifest.map(async (tpl) => {
        const headOk = await fetch(`${TEMPLATE_BASE}/${tpl.file}`, { method: 'HEAD' })
          .then((r) => r.ok)
          .catch(() => false);
        const previewOk = tpl.preview
          ? await fetch(`${TEMPLATE_BASE}/${tpl.preview}`, { method: 'HEAD' })
              .then((r) => r.ok)
              .catch(() => false)
          : false;
        return {
          id: tpl.id,
          name: tpl.name,
          description: tpl.description || '',
          file: tpl.file,
          preview: tpl.preview || null,
          available: headOk,
          hasPreview: previewOk,
          absolutePath: `${TEMPLATE_BASE}/${tpl.file}`,
        };
      })
    );

    templatesCache = enriched.filter((t) => t.id && t.file);
    return templatesCache;
  }

  async function previewDataUrl(id) {
    const tpls = await listTemplates();
    const tpl = tpls.find((t) => t.id === id);
    if (!tpl?.hasPreview) return null;
    const res = await fetch(`${TEMPLATE_BASE}/${tpl.preview}`);
    if (!res.ok) return null;
    return blobToDataUrl(await res.blob());
  }

  // ------------------------------------------------------------- excel

  function normalizeKey(k) {
    return String(k || '').trim().toLowerCase().replace(/\s+/g, '_');
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

  function buildCvFromWorkbook(wb) {
    const lower = Object.fromEntries(wb.SheetNames.map((n) => [n.toLowerCase(), n]));
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
      const rows = sheetRows(wb, lower.biodata);
      if (rows.length === 1) cv.biodata = rows[0];
      else if (rows.length > 1 && rows[0].key !== undefined) {
        const bio = {};
        for (const r of rows) bio[normalizeKey(r.key)] = r.value;
        cv.biodata = bio;
      } else if (rows.length > 0) cv.biodata = rows[0];
    }
    if (lower.experiences) {
      cv.experiences = sheetRows(wb, lower.experiences).map((r) => ({
        company: r.company || '',
        role: r.role || r.position || r.title || '',
        duration: r.duration || r.period || '',
        location: r.location || '',
        description: r.description || r.summary || '',
      }));
    }
    if (lower.education) {
      cv.education = sheetRows(wb, lower.education).map((r) => ({
        institution: r.institution || r.school || r.university || '',
        degree: r.degree || r.major || '',
        year: r.year || r.duration || '',
        description: r.description || '',
      }));
    }
    if (lower.skills) {
      cv.skills = sheetRows(wb, lower.skills).map((r) => ({
        name: r.name || r.skill || '',
        level: r.level || '',
      }));
    }
    if (lower.certifications) {
      cv.certifications = sheetRows(wb, lower.certifications).map((r) => ({
        name: r.name || r.certification || '',
        issuer: r.issuer || r.organization || '',
        year: r.year || r.date || '',
      }));
    }
    const trainSheet = lower.trainings || lower.training || lower.course || lower.courses;
    if (trainSheet) {
      cv.trainings = sheetRows(wb, trainSheet).map((r) => ({
        name: r.name || r.training || r.course || '',
        organizer: r.organizer || r.organization || r.issuer || '',
        year: r.year || r.date || '',
        location: r.location || '',
        description: r.description || '',
      }));
    }
    if (lower.projects) {
      cv.projects = sheetRows(wb, lower.projects).map((r) => ({
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

  function excelImportDialog() {
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
          resolve({ canceled: false, data: buildCvFromWorkbook(wb), file: file.name });
        } catch (err) {
          resolve({ canceled: false, error: err.message });
        }
      };
      document.body.appendChild(input);
      input.click();
    });
  }

  // --- contacts: multi-row biodata pool for the Full Name autocomplete --

  const CONTACT_BIODATA_KEYS = [
    'full_name', 'job_title', 'place_of_birth', 'date_of_birth', 'sex',
    'nationality', 'last_education', 'email', 'phone', 'address',
    'linkedin', 'website', 'summary',
  ];

  const CONTACT_ALIASES = {
    full_name: ['name', 'fullname'],
    job_title: ['position', 'title', 'role', 'job'],
    place_of_birth: ['birthplace', 'place'],
    date_of_birth: ['dob', 'birthdate', 'birth_date'],
    last_education: ['education', 'degree'],
    phone: ['telephone', 'mobile', 'hp', 'no_hp'],
    address: ['alamat'],
  };

  function pickContactField(row, key) {
    if (row[key] != null && row[key] !== '') return row[key];
    for (const alt of CONTACT_ALIASES[key] || []) {
      if (row[alt] != null && row[alt] !== '') return row[alt];
    }
    return '';
  }

  function buildContactsFromWorkbook(wb) {
    const lower = Object.fromEntries(wb.SheetNames.map((n) => [n.toLowerCase(), n]));
    const sheetName = lower.contacts || lower.people || lower.biodata || wb.SheetNames[0];
    if (!sheetName) return [];
    const rows = sheetRows(wb, sheetName);
    return rows
      .map((row) => {
        const bio = {};
        for (const k of CONTACT_BIODATA_KEYS) {
          bio[k] = String(pickContactField(row, k) || '').trim();
        }
        return bio;
      })
      .filter((bio) => bio.full_name);
  }

  function excelImportContacts() {
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
          resolve({ canceled: false, contacts: buildContactsFromWorkbook(wb), file: file.name });
        } catch (err) {
          resolve({ canceled: false, error: err.message });
        }
      };
      document.body.appendChild(input);
      input.click();
    });
  }

  // ------------------------------------------------------------- docx

  function formatTemplateError(err) {
    const inner = err?.properties?.errors;
    if (!Array.isArray(inner) || inner.length === 0) {
      return { message: err.message, details: [] };
    }
    const details = inner.map((e) => {
      const p = e?.properties || {};
      const explanation = p.explanation || e.message || 'Unknown error';
      const context = p.xtag || p.id || p.file || '';
      return context ? `${explanation} (tag: ${context})` : explanation;
    });
    return {
      message: `Template has ${details.length} issue${details.length === 1 ? '' : 's'}: ${details[0]}`,
      details,
    };
  }

  async function docxGenerate({ templateId, data }) {
    const tpls = await listTemplates();
    const tpl = tpls.find((t) => t.id === templateId);
    if (!tpl) return { success: false, error: `Template "${templateId}" not found` };
    if (!tpl.available) return { success: false, error: `Template file missing: ${tpl.file}` };

    try {
      const res = await fetch(`${TEMPLATE_BASE}/${tpl.file}`);
      const buf = await res.arrayBuffer();
      const zip = new PizZip(buf);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
        nullGetter: () => '',
      });
      doc.render(data);
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
      });

      const fullName = data?.biodata?.full_name || data?.full_name || 'CV';
      const fileName = `CV_${sanitizeFilename(fullName.toUpperCase())}.docx`;
      await dbPut({ name: fileName, blob, size: blob.size, modified: Date.now() });
      triggerDownload(fileName, blob);

      return { success: true, path: fileName, fileName, size: blob.size };
    } catch (err) {
      const formatted = formatTemplateError(err);
      return { success: false, error: formatted.message, details: formatted.details };
    }
  }

  // ------------------------------------------------------------- generated

  async function generatedList() {
    const rows = await dbAll();
    return rows
      .map((r) => ({ name: r.name, path: r.name, size: r.size, modified: r.modified }))
      .sort((a, b) => b.modified - a.modified);
  }

  async function generatedOpen(name) {
    const row = await dbGet(name);
    if (!row?.blob) return { success: false, error: 'File not found' };
    triggerDownload(row.name, row.blob);
    return { success: true };
  }

  async function generatedRemove(name) {
    await dbDel(name);
    return { success: true };
  }

  async function generatedReveal() {
    // No file-system access in the browser sandbox; emulate by listing
    // recent downloads via the IndexedDB cache.
    return { success: true, path: 'browser: Downloads folder (see browser settings)' };
  }

  // ------------------------------------------------------------- storage

  const storage = {
    get(key) {
      if (!key) {
        return {
          draft: json(localStorage.getItem(`${STORAGE_PREFIX}draft`)),
          selectedTemplate: json(localStorage.getItem(`${STORAGE_PREFIX}selectedTemplate`)),
          settings: json(localStorage.getItem(`${STORAGE_PREFIX}settings`)) || { darkMode: false },
        };
      }
      return json(localStorage.getItem(`${STORAGE_PREFIX}${key}`));
    },
    set(key, value) {
      if (value == null) localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      else localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    },
    clear() {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
      }
      return true;
    },
  };

  // ------------------------------------------------------------- expose

  globalThis.api = {
    templates: {
      list: listTemplates,
      previewDataUrl,
    },
    excel: {
      importDialog: excelImportDialog,
      importContacts: excelImportContacts,
    },
    docx: {
      generate: docxGenerate,
    },
    generated: {
      list: generatedList,
      open: generatedOpen,
      revealFolder: generatedReveal,
      remove: generatedRemove,
    },
    storage,
    system: {
      platform: navigator.platform || 'web',
    },
  };

  console.info('[sivivi] running as PWA — window.api shimmed for browser');
}
