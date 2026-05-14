const { ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const paths = require('../paths.cjs');
const { listTemplates } = require('./templates.cjs');
const { sanitizeFilename } = require('../utils.cjs');

// Loads template bytes, injects data, writes a new file. Original template file
// is read with a fresh stream each time and never modified.
//
// Note on photo: docxtemplater-image-module-free v1.x is not API-compatible
// with docxtemplater 3.x + custom delimiters, so we DON'T auto-inject the
// uploaded photo. The template leaves a dedicated cell open where the user
// inserts a picture manually in Word (Insert → Pictures). The photo data is
// still stored in biodata.photo for future re-introduction of an image module.
function generateDocx({ templateId, data }) {
  const templates = listTemplates();
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) throw new Error(`Template "${templateId}" not found`);
  if (!tpl.available) throw new Error(`Template file missing: ${tpl.file}`);

  const content = fs.readFileSync(tpl.absolutePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
  });

  doc.render(data);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const fullName = data?.biodata?.full_name || data?.full_name || 'CV';
  const fileName = `CV_${sanitizeFilename(fullName.toUpperCase())}.docx`;
  const outDir = paths.generatedDir();
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, buf);

  return {
    success: true,
    path: outPath,
    fileName,
    size: buf.length,
  };
}

// docxtemplater wraps render errors in a top-level "Multi error" and stashes
// the actual issues in err.properties.errors. We surface each inner error so
// the UI can show what placeholder / tag is broken.
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

module.exports = function register() {
  ipcMain.handle('docx:generate', async (_evt, payload) => {
    try {
      return generateDocx(payload);
    } catch (err) {
      const formatted = formatTemplateError(err);
      console.error('[docx:generate] failed:', formatted.message);
      if (formatted.details.length) {
        console.error('[docx:generate] details:');
        for (const d of formatted.details) console.error('  •', d);
      }
      return {
        success: false,
        error: formatted.message,
        details: formatted.details,
      };
    }
  });
};

module.exports.generateDocx = generateDocx;
