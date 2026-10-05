const { contextBridge, ipcRenderer } = require('electron');
const call = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld('api', {
  getSettings: call('settings:get'), saveSettings: call('settings:save'),
  listInvoices: call('invoices:list'), getInvoice: call('invoices:get'),
  saveInvoice: call('invoices:save'), deleteInvoice: call('invoices:delete'), nextNumber: call('invoices:nextNumber'),
  exportPdf: call('invoices:pdf'), exportCsv: call('invoices:csv'),
  printInvoice: call('invoices:print'), previewInvoice: call('invoices:preview'),
  backupInfo: call('backup:info'), backupFolder: call('backup:showFolder'), backupCreate: call('backup:create'), backupRestore: call('backup:restore'), backupPdfs: call('backup:pdfs'),
  listExpenses: call('expenses:list'), pickReceipt: call('expenses:pickReceipt'), saveExpense: call('expenses:save'), discardPendingReceipt: call('expenses:discardPending'),
  deleteExpense: call('expenses:delete'), openReceipt: call('expenses:openReceipt'), exportExpenses: call('expenses:export'),
  listEstimates: call('estimates:list'), getEstimate: call('estimates:get'), saveEstimate: call('estimates:save'), deleteEstimate: call('estimates:delete'), nextEstimateNumber: call('estimates:nextNumber'),
  getPreview: call('preview:get'), printPreview: call('preview:print'), pdfPreview: call('preview:pdf'),
});
