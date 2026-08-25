const { app, BrowserWindow, Menu, shell, powerSaveBlocker } = require('electron');
const path = require('node:path');

// A tournament clock is useless if the display sleeps during a level.
let sleepBlockerId = null;

function keepDisplayAwake() {
  if (sleepBlockerId === null || !powerSaveBlocker.isStarted(sleepBlockerId)) {
    sleepBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  }
}

function releaseDisplay() {
  if (sleepBlockerId !== null && powerSaveBlocker.isStarted(sleepBlockerId)) {
    powerSaveBlocker.stop(sleepBlockerId);
  }
  sleepBlockerId = null;
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'reload' },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit' }])
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, ...(isMac ? [{ role: 'zoom' }] : [{ role: 'close' }])]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 420,
    backgroundColor: '#0B0F14',
    title: 'Tournament Clock',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // The clock is entirely local. Anything trying to navigate away is either a
  // stray link or a mistake -- send real http(s) links to the user's browser
  // and refuse everything else.
  const openExternally = (url) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  };
  win.webContents.setWindowOpenHandler(({ url }) => openExternally(url));
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      openExternally(url);
    }
  });

  return win;
}

app.whenReady().then(() => {
  buildMenu();
  keepDisplayAwake();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', releaseDisplay);
