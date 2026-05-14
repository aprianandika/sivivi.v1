const { ipcMain } = require('electron');
const Store = require('electron-store');

// Lazily instantiate the Store inside register() so it runs after
// app.whenReady() and app.getPath('userData') is available.
let store;

module.exports = function register() {
  store = new Store({
    name: 'sivivi-state',
    defaults: {
      draft: null,
      selectedTemplate: null,
      settings: { darkMode: false },
    },
  });

  ipcMain.handle('storage:get', (_evt, key) => {
    if (!key) return store.store;
    return store.get(key);
  });

  ipcMain.handle('storage:set', (_evt, { key, value }) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle('storage:clear', () => {
    store.clear();
    return true;
  });
};
