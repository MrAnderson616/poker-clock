const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024, height: 1024, show: false, frame: false,
    transparent: true, backgroundColor: '#00000000',
    useContentSize: true,
    webPreferences: { offscreen: true }
  });
  await win.loadFile(path.join(__dirname, 'icon.html'));
  await new Promise(r => setTimeout(r, 700));
  const img = await win.webContents.capturePage();
  const png = img.toPNG();
  fs.writeFileSync(path.join(__dirname, 'icon.png'), png);
  console.log('icon.png', png.length, 'bytes', JSON.stringify(img.getSize()));
  app.quit();
});
