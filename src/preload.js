const { contextBridge } = require('electron');

// Expose nothing special - renderer uses fetch directly
// This file exists to maintain contextIsolation security model
contextBridge.exposeInMainWorld('widgetAPI', {
  version: '1.0.0'
});
