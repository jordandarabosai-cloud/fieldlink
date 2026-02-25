const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");
const ModbusRTU = require("modbus-serial");

const isDev = !app.isPackaged;
let activePort = null;
let modbusClient = null;
let modbusQueue = Promise.resolve();
const MODBUS_TIMEOUT_MS = 2000;

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
  if (!activePort || !modbusClient) {
    throw new Error("Serial port not open");
  }
}

function enqueueModbus(task) {
  const next = modbusQueue.then(task, task);
  modbusQueue = next.catch(() => {});
  return next;
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
  if (modbusClient) {
    await new Promise((resolve) => modbusClient.close(() => resolve()));
  }

  modbusClient = new ModbusRTU();

  try {
    await modbusClient.connectRTUBuffered(options.path, {
      baudRate: options.baudRate,
      parity: options.parity,
      dataBits: 8,
      stopBits: 1,
    });
    modbusClient.setTimeout(MODBUS_TIMEOUT_MS);
    activePort = options.path;
    return { open: true, path: options.path };
  } catch (error) {
    modbusClient = null;
    activePort = null;
    throw new Error(error?.message || String(error));
  }
});

ipcMain.handle("serial:close", async () => {
  if (!modbusClient) return { open: false };

  return new Promise((resolve) => {
    modbusClient.close(() => {
      modbusClient = null;
      activePort = null;
      resolve({ open: false });
    });
  });
});

ipcMain.handle("modbus:readHolding", async (_event, options) => {
  ensureSerialOpen();
  return enqueueModbus(async () => {
    try {
      modbusClient.setID(options.address);
      const response = await withTimeout(
        modbusClient.readHoldingRegisters(options.start, options.count),
        MODBUS_TIMEOUT_MS,
        "Read holding registers"
      );
      return { values: response.data };
    } catch (error) {
      throw new Error(error?.message || String(error));
    }
  });
});

ipcMain.handle("modbus:readInput", async (_event, options) => {
  ensureSerialOpen();
  return enqueueModbus(async () => {
    try {
      modbusClient.setID(options.address);
      const response = await withTimeout(
        modbusClient.readInputRegisters(options.start, options.count),
        MODBUS_TIMEOUT_MS,
        "Read input registers"
      );
      return { values: response.data };
    } catch (error) {
      throw new Error(error?.message || String(error));
    }
  });
});

ipcMain.handle("modbus:writeMultiple", async (_event, options) => {
  ensureSerialOpen();
  return enqueueModbus(async () => {
    try {
      modbusClient.setID(options.address);
      await withTimeout(
        modbusClient.writeRegisters(options.start, options.values),
        MODBUS_TIMEOUT_MS,
        "Write registers"
      );
      return { written: options.values.length };
    } catch (error) {
      throw new Error(error?.message || String(error));
    }
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
