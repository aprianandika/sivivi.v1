const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

function templatesDir() {
  if (isDev) return path.join(__dirname, '..', 'templates');
  // electron-builder extraResources places /templates under process.resourcesPath
  return path.join(process.resourcesPath, 'templates');
}

function generatedDir() {
  if (isDev) return path.join(__dirname, '..', 'generated');
  return path.join(app.getPath('userData'), 'generated');
}

function ensureDirs() {
  for (const dir of [generatedDir()]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = {
  templatesDir,
  generatedDir,
  ensureDirs,
  isDev,
};
