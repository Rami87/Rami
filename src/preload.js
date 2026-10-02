const { contextBridge, ipcRenderer } = require('electron');
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld('api', {
  getSettings: call('settings:get'), saveSettings: call('settings:save'),
  listInvoices: call('invoices:list'), getInvoice: call('invoices:get'),
  saveInvoice: call('invoices:save'), deleteInvoice: call('invoices:delete'), nextNumber: call('invoices:nextNumber'),
  exportPdf: call('invoices:pdf'), exportCsv: call('invoices:csv'),
  printInvoice: call('invoices:print'), previewInvoice: call('invoices:preview'),
  getPreview: call('preview:get'), printPreview: call('preview:print'), pdfPreview: call('preview:pdf'),
});
