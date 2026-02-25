const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");
const ModbusRTU = require("modbus-serial");
const snmp = require("net-snmp");

const isDev = !app.isPackaged;
let activePort = null;
let modbusClient = null;
let consolePort = null;
let modbusQueue = Promise.resolve();
const MODBUS_TIMEOUT_MS = 2000;

let snmpReceiver = null;
let snmpReceiverConfig = { port: 162, address: "0.0.0.0", communities: ["public"] };

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

function createSnmpSession(options) {
  const { host, port, version, community, v3 } = options;
  const versionMap = { v1: snmp.Version1, v2c: snmp.Version2c, v3: snmp.Version3 };
  const snmpVersion = versionMap[version] ?? snmp.Version2c;

  if (snmpVersion === snmp.Version3) {
    return snmp.createV3Session(host, v3?.user || "", {
      port: Number(port) || 161,
      version: snmpVersion,
      engineID: v3?.engineId || undefined,
      authProtocol: v3?.authProtocol || undefined,
      authKey: v3?.authKey || undefined,
      privProtocol: v3?.privProtocol || undefined,
      privKey: v3?.privKey || undefined,
    });
  }

  return snmp.createSession(host, community || "public", {
    port: Number(port) || 161,
    version: snmpVersion,
  });
}

function startSnmpReceiver(config) {
  if (snmpReceiver) {
    try {
      snmpReceiver.close();
    } catch {}
    snmpReceiver = null;
  }

  const communityList = String(config.community || "public")
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  snmpReceiverConfig = {
    port: Number(config.port) || 162,
    address: config.address || "0.0.0.0",
    communities: communityList.length ? communityList : ["public"],
  };

  snmpReceiver = snmp.createReceiver(
    {
      port: snmpReceiverConfig.port,
      transport: "udp4",
      address: snmpReceiverConfig.address,
      includeAuthentication: true,
    },
    (error, msg) => {
      if (error) {
        console.error("SNMP receiver error", error);
        return;
      }

      const payload = {
        receivedAt: new Date().toISOString(),
        raw: msg,
        varbinds: msg?.pdu?.varbinds || [],
      };

      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("snmp:trap", payload);
      });
    }
  );

  const authorizer = snmpReceiver.getAuthorizer();
  snmpReceiverConfig.communities.forEach((community) => authorizer.addCommunity(community));
}

ipcMain.handle("serial:list", async () => {
  const ports = await SerialPort.list();
  return ports.map((port) => ({
    path: port.path,
    friendlyName: port.friendlyName || port.manufacturer || "Serial Device",
    serialNumber: port.serialNumber || null,
  }));
});

ipcMain.handle("serial:consoleOpen", async (_event, options) => {
  if (consolePort) {
    await new Promise((resolve) => consolePort.close(() => resolve()));
  }

  consolePort = new SerialPort({
    path: options.path,
    baudRate: options.baudRate,
    parity: options.parity,
    dataBits: 8,
    stopBits: 1,
    autoOpen: false,
  });

  return new Promise((resolve, reject) => {
    consolePort.open((error) => {
      if (error) {
        consolePort = null;
        reject(new Error(error?.message || String(error)));
        return;
      }

      consolePort.on("data", (data) => {
        const payload = { data: data.toString("utf8") };
        BrowserWindow.getAllWindows().forEach((win) => {
          win.webContents.send("serial:consoleData", payload);
        });
      });

      resolve({ open: true, path: options.path });
    });
  });
});

ipcMain.handle("serial:consoleWrite", async (_event, options) => {
  if (!consolePort) throw new Error("Console port not open");
  return new Promise((resolve, reject) => {
    consolePort.write(options.data, (error) => {
      if (error) return reject(error);
      resolve({ written: options.data.length });
    });
  });
});

ipcMain.handle("serial:consoleClose", async () => {
  if (!consolePort) return { open: false };
  return new Promise((resolve) => {
    consolePort.close(() => {
      consolePort = null;
      resolve({ open: false });
    });
  });
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

ipcMain.handle("snmp:configure", async (_event, options) => {
  startSnmpReceiver(options.receiver || { port: 162, address: "0.0.0.0" });
  return { listening: true, port: snmpReceiverConfig.port, address: snmpReceiverConfig.address };
});

ipcMain.handle("snmp:get", async (_event, options) => {
  const session = createSnmpSession(options);
  const oids = options.oids || [];
  if (!oids.length) throw new Error("No OIDs provided");

  return new Promise((resolve, reject) => {
    session.get(oids, (error, varbinds) => {
      session.close();
      if (error) return reject(error);
      resolve({ varbinds });
    });
  });
});

ipcMain.handle("snmp:walk", async (_event, options) => {
  const session = createSnmpSession(options);
  const baseOid = options.baseOid;
  if (!baseOid) throw new Error("Missing base OID");

  return new Promise((resolve, reject) => {
    const results = [];
    session.walk(
      baseOid,
      20,
      (varbinds) => {
        results.push(...varbinds);
      },
      (error) => {
        session.close();
        if (error) return reject(error);
        resolve({ varbinds: results });
      }
    );
  });
});

ipcMain.handle("snmp:sendTrap", async (_event, options) => {
  const session = createSnmpSession(options);
  if (typeof session.trap !== "function") {
    session.close();
    return { success: false, error: "Trap sending not supported by this SNMP session." };
  }
  const trapOid = options.trapOid || "1.3.6.1.6.3.1.1.5.1";
  const varbinds = [
    {
      oid: "1.3.6.1.2.1.1.3.0",
      type: snmp.ObjectType.TimeTicks,
      value: Math.floor(process.uptime() * 100),
    },
    {
      oid: "1.3.6.1.6.3.1.1.4.1.0",
      type: snmp.ObjectType.OID,
      value: trapOid,
    },
  ];
  if (options.message) {
    varbinds.push({
      oid: "1.3.6.1.4.1.32473.1.1.0",
      type: snmp.ObjectType.OctetString,
      value: options.message,
    });
  }
  return new Promise((resolve) => {
    session.trap(trapOid, varbinds, (err) => {
      session.close();
      if (err) {
        resolve({ success: false, error: String(err) });
        return;
      }
      resolve({ success: true });
    });
  });
});

ipcMain.handle("snmp:stopReceiver", async () => {
  if (snmpReceiver) {
    try {
      snmpReceiver.close();
    } catch {}
    snmpReceiver = null;
  }
  return { listening: false };
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
