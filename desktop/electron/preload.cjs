const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fieldlink", {
  version: "0.2.0",
  serial: {
    listPorts: () => ipcRenderer.invoke("serial:list"),
    open: (options) => ipcRenderer.invoke("serial:open", options),
    close: () => ipcRenderer.invoke("serial:close"),
  },
});
