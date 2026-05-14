const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const paths = require('../paths.cjs');

function readManifest() {
  const dir = paths.templatesDir();
  const manifestPath = path.join(dir, 'templates.json');
  if (!fs.existsSync(manifestPath)) return [];
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Failed to read templates.json', err);
    return [];
  }
}

function listTemplates() {
  const dir = paths.templatesDir();
  const manifest = readManifest();
  // Only return templates whose .docx files actually exist
  return manifest
    .map((tpl) => {
      const filePath = path.join(dir, tpl.file);
      const hasFile = fs.existsSync(filePath);
      const previewPath = tpl.preview ? path.join(dir, tpl.preview) : null;
      const hasPreview = previewPath && fs.existsSync(previewPath);
      return {
        id: tpl.id,
        name: tpl.name,
        description: tpl.description || '',
        file: tpl.file,
        preview: tpl.preview || null,
        available: hasFile,
        hasPreview,
        absolutePath: filePath,
      };
    })
    .filter((tpl) => tpl.id && tpl.file);
}

function readPreview(id) {
  const tpl = listTemplates().find((t) => t.id === id);
  if (!tpl || !tpl.hasPreview) return null;
  const previewPath = path.join(paths.templatesDir(), tpl.preview);
  const ext = path.extname(previewPath).toLowerCase().replace('.', '');
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'png'
        ? 'image/png'
        : ext === 'svg'
          ? 'image/svg+xml'
          : 'application/octet-stream';
  const buf = fs.readFileSync(previewPath);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

module.exports = function register() {
  ipcMain.handle('templates:list', () => listTemplates());
  ipcMain.handle('templates:preview', (_evt, id) => readPreview(id));
};

module.exports.listTemplates = listTemplates;
