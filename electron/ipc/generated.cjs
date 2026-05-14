const { ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const paths = require('../paths.cjs');

function listGenerated() {
  const dir = paths.generatedDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.docx'))
    .map((f) => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return {
        name: f,
        path: full,
        size: stat.size,
        modified: stat.mtimeMs,
      };
    })
    .sort((a, b) => b.modified - a.modified);
}

module.exports = function register() {
  ipcMain.handle('generated:list', () => listGenerated());

  ipcMain.handle('generated:open', (_evt, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return { success: false, error: 'File not found' };
    shell.openPath(filePath);
    return { success: true };
  });

  ipcMain.handle('generated:reveal', () => {
    const dir = paths.generatedDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir);
    return { success: true, path: dir };
  });

  ipcMain.handle('generated:remove', (_evt, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return { success: false };
    // Make sure caller cannot delete files outside the generated dir
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(paths.generatedDir()))) {
      return { success: false, error: 'Invalid path' };
    }
    fs.unlinkSync(resolved);
    return { success: true };
  });
};
