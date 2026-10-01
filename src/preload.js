const { contextBridge, ipcRenderer } = require('electron');
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld('api', {
  getSettings: call('settings:get'), saveSettings: call('settings:save'),
  listInvoices: call('invoices:list'), getInvoice: call('invoices:get'),
  saveInvoice: call('invoices:save'), deleteInvoice: call('invoices:delete'),
  exportPdf: call('invoices:pdf'), exportCsv: call('invoices:csv'),
});
