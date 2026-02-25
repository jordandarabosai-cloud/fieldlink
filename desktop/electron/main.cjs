const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");
const ModbusRTU = require("modbus-serial");

const isDev = !app.isPackaged;
let activePort = null;
let modbusClient = null;

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

function ensureSerialOpen() {
  if (!activePort || !activePort.isOpen || !modbusClient) {
    throw new Error("Serial port not open");
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
    dataBits: 8,
    stopBits: 1,
  });

  return new Promise((resolve, reject) => {
    activePort.open(async (err) => {
      if (err) return reject(err.message);
      try {
        modbusClient = new ModbusRTU();
        await modbusClient.connectRTUBuffered(activePort, {
          baudRate: options.baudRate,
          parity: options.parity,
          dataBits: 8,
          stopBits: 1,
        });
        resolve({ open: true, path: options.path });
      } catch (error) {
        reject(error?.message || String(error));
      }
    });
  });
});

ipcMain.handle("serial:close", async () => {
  if (!activePort) return { open: false };
  if (!activePort.isOpen) return { open: false };

  return new Promise((resolve) => {
    activePort.close(() => {
      if (modbusClient) {
        modbusClient.close(() => resolve({ open: false }));
        modbusClient = null;
        return;
      }
      resolve({ open: false });
    });
  });
});

ipcMain.handle("modbus:readHolding", async (_event, options) => {
  ensureSerialOpen();
  modbusClient.setID(options.address);
  const response = await modbusClient.readHoldingRegisters(options.start, options.count);
  return { values: response.data };
});

ipcMain.handle("modbus:readInput", async (_event, options) => {
  ensureSerialOpen();
  modbusClient.setID(options.address);
  const response = await modbusClient.readInputRegisters(options.start, options.count);
  return { values: response.data };
});

ipcMain.handle("modbus:writeMultiple", async (_event, options) => {
  ensureSerialOpen();
  modbusClient.setID(options.address);
  await modbusClient.writeRegisters(options.start, options.values);
  return { written: options.values.length };
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
