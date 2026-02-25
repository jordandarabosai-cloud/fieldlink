const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fieldlink", {
  version: "0.2.0",
  serial: {
    listPorts: () => ipcRenderer.invoke("serial:list"),
    open: (options) => ipcRenderer.invoke("serial:open", options),
    close: () => ipcRenderer.invoke("serial:close"),
    consoleOpen: (options) => ipcRenderer.invoke("serial:consoleOpen", options),
    consoleWrite: (options) => ipcRenderer.invoke("serial:consoleWrite", options),
    consoleClose: () => ipcRenderer.invoke("serial:consoleClose"),
    onConsoleData: (callback) => ipcRenderer.on("serial:consoleData", (_event, payload) => callback(payload)),
  },
  modbus: {
    readHolding: (options) => ipcRenderer.invoke("modbus:readHolding", options),
    readInput: (options) => ipcRenderer.invoke("modbus:readInput", options),
    writeMultiple: (options) => ipcRenderer.invoke("modbus:writeMultiple", options),
  },
  snmp: {
    configure: (options) => ipcRenderer.invoke("snmp:configure", options),
    get: (options) => ipcRenderer.invoke("snmp:get", options),
    walk: (options) => ipcRenderer.invoke("snmp:walk", options),
    sendTrap: (options) => ipcRenderer.invoke("snmp:sendTrap", options),
    stopReceiver: () => ipcRenderer.invoke("snmp:stopReceiver"),
    onTrap: (callback) => ipcRenderer.on("snmp:trap", (_event, payload) => callback(payload)),
  },
});
