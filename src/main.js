const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Store } = require('./store');
const InvoiceHtml = require('./invoice-html');

let store;

async function renderPdf(html) {
  const win = new BrowserWindow({ show: false, webPreferences: { javascript: false } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    return await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { win.destroy(); }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 780, autoHideMenuBar: true, title: 'Rechnungen',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  store = new Store(path.join(app.getPath('userData'), 'data'));
  ipcMain.handle('settings:get', () => store.getSettings());
  ipcMain.handle('settings:save', (_, s) => store.saveSettings(s));
  ipcMain.handle('invoices:list', (_, q) => store.listInvoices(q));
  ipcMain.handle('invoices:get', (_, id) => store.getInvoice(id));
  ipcMain.handle('invoices:save', (_, inv) => store.saveInvoice(inv));
  ipcMain.handle('invoices:delete', (_, id) => store.deleteInvoice(id));
  ipcMain.handle('invoices:pdf', async (e, id) => {
    const inv = store.getInvoice(id);
    if (!inv) return { ok: false };
    const pdf = await renderPdf(InvoiceHtml.build(inv, store.getSettings()));
    const win = BrowserWindow.fromWebContents(e.sender);
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), `Rechnung-${inv.number}.pdf`),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { ok: false };
    fs.writeFileSync(filePath, pdf);
    return { ok: true, filePath };
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
