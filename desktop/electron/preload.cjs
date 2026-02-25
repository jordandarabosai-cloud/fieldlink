const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("fieldlink", {
  version: "0.1.0",
});
