const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

const registerTemplateHandlers = require('./ipc/templates.cjs');
const registerExcelHandlers = require('./ipc/excel.cjs');
const registerDocxHandlers = require('./ipc/docx.cjs');
const registerStorageHandlers = require('./ipc/storage.cjs');
const registerGeneratedHandlers = require('./ipc/generated.cjs');
const paths = require('./paths.cjs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0f172a',
    title: 'Sivivi — CV Generator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
    // Surface load errors so a blank screen isn't silent. Press F12 / Ctrl+Shift+I
    // to open DevTools at any time.
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      console.error(`[did-fail-load] ${code} ${desc} → ${url}`);
    });
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
      console.error('[render-process-gone]', details);
    });
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  paths.ensureDirs();

  // Wipe any service worker / cache storage left over from earlier builds
  // that shipped vite-plugin-pwa. Those SWs intercept file:// requests and
  // serve a stale bundle on top of the new one, producing
  // "Identifier 'xb' has already been declared" / blank-screen errors.
  try {
    await session.defaultSession.clearStorageData({
      storages: ['serviceworkers', 'cachestorage'],
    });
  } catch (err) {
    console.warn('[startup] could not clear service worker storage:', err.message);
  }

  registerTemplateHandlers();
  registerExcelHandlers();
  registerDocxHandlers();
  registerStorageHandlers();
  registerGeneratedHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
