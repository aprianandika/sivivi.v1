function sanitizeFilename(name) {
  return String(name || 'CV')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'CV';
}

module.exports = { sanitizeFilename };
