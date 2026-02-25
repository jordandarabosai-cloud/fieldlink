const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");

const isDev = !app.isPackaged;
let activePort = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    title: "FieldLink",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("serial:list", async () => {
  const ports = await SerialPort.list();
  return ports.map((port) => ({
    path: port.path,
    friendlyName: port.friendlyName || port.manufacturer || "Serial Device",
    serialNumber: port.serialNumber || null,
  }));
});

ipcMain.handle("serial:open", async (_event, options) => {
  if (activePort?.isOpen) {
    await new Promise((resolve) => activePort.close(() => resolve()));
  }

  activePort = new SerialPort({
    path: options.path,
    baudRate: options.baudRate,
    parity: options.parity,
    autoOpen: false,
  });

  return new Promise((resolve, reject) => {
    activePort.open((err) => {
      if (err) return reject(err.message);
      resolve({ open: true, path: options.path });
    });
  });
});

ipcMain.handle("serial:close", async () => {
  if (!activePort) return { open: false };
  if (!activePort.isOpen) return { open: false };

  return new Promise((resolve) => {
    activePort.close(() => resolve({ open: false }));
  });
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
