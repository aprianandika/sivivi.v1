const { app, BrowserWindow, shell } = require('electron');
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
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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

app.whenReady().then(() => {
  paths.ensureDirs();

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
