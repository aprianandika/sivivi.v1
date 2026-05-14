const { contextBridge, ipcRenderer } = require('electron');

// Whitelisted API surface exposed to the renderer.
// Renderer code never has direct node/electron access.
contextBridge.exposeInMainWorld('api', {
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    previewDataUrl: (id) => ipcRenderer.invoke('templates:preview', id),
  },
  excel: {
    importDialog: () => ipcRenderer.invoke('excel:import'),
    importContacts: () => ipcRenderer.invoke('excel:importContacts'),
  },
  docx: {
    generate: (payload) => ipcRenderer.invoke('docx:generate', payload),
  },
  generated: {
    list: () => ipcRenderer.invoke('generated:list'),
    open: (filePath) => ipcRenderer.invoke('generated:open', filePath),
    revealFolder: () => ipcRenderer.invoke('generated:reveal'),
    remove: (filePath) => ipcRenderer.invoke('generated:remove', filePath),
  },
  storage: {
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', { key, value }),
    clear: () => ipcRenderer.invoke('storage:clear'),
  },
  system: {
    platform: process.platform,
  },
});
