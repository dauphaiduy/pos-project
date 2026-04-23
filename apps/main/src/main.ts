import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerOrderHandlers } from './ipc/order.handler';
import { registerProductHandlers } from './ipc/product.handler';

function createWindow(): void {
  const preloadPath = path.join(__dirname, '../../preload/dist/preload.js');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerOrderHandlers();
  registerProductHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
