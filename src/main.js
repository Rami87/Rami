const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Store } = require('./store');
const InvoiceHtml = require('./invoice-html');
const { toCsv } = require('./csv');

let store;
const previews = new Map(); // webContents.id des Vorschaufensters -> Rechnung

const htmlUrl = (html) => 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

// Rechnung ohne Nummer (noch nicht gespeichert): Nummer nur für Anzeige/Druck vorschlagen
function withNumber(inv) { return inv.number ? inv : { ...inv, number: store.nextNumber(inv.date) }; }
const buildHtml = (inv) => InvoiceHtml.build(withNumber(inv), store.getSettings());

async function renderPdf(html) {
  const win = new BrowserWindow({ show: false, webPreferences: { javascript: false } });
  try {
    await win.loadURL(htmlUrl(html));
    return await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally { win.destroy(); }
}

// Speichern-Dialog öffnet im zuletzt benutzten Ordner (PDF und CSV teilen sich den Ordner)
function startDir() {
  const d = store.getSettings().lastDir;
  try { if (d && fs.statSync(d).isDirectory()) return d; } catch { /* Ordner existiert nicht mehr */ }
  return app.getPath('documents');
}
async function saveDialog(win, fileName, filters) {
  const { filePath, canceled } = await dialog.showSaveDialog(win, { defaultPath: path.join(startDir(), fileName), filters });
  if (canceled || !filePath) return null;
  store.saveSettings({ lastDir: path.dirname(filePath) });
  return filePath;
}

async function exportPdf(win, inv) {
  const pdf = await renderPdf(buildHtml(inv));
  const filePath = await saveDialog(win, `Rechnung-${withNumber(inv).number}.pdf`, [{ name: 'PDF', extensions: ['pdf'] }]);
  if (!filePath) return { ok: false };
  fs.writeFileSync(filePath, pdf);
  return { ok: true, filePath };
}

// Systemdruckdialog (Drucker wählen, Kopien, usw.)
async function printInvoice(inv) {
  const win = new BrowserWindow({ show: false, webPreferences: { javascript: false } });
  try {
    await win.loadURL(htmlUrl(buildHtml(inv)));
    return await new Promise((resolve) => {
      win.webContents.print({ printBackground: true, pageSize: 'A4' }, (success, reason) => resolve({ ok: success, reason }));
    });
  } finally { win.destroy(); }
}

function lockNavigation(win) {
  // Nur die Entwickler-Links dürfen extern geöffnet werden; sonst bleibt die App geschlossen für Navigation.
  const allowed = (u) => u.startsWith('https://horaniq.at') || u === 'mailto:Rami@horaniq.at';
  win.webContents.setWindowOpenHandler(({ url }) => { if (allowed(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (url !== win.webContents.getURL()) { e.preventDefault(); if (allowed(url)) shell.openExternal(url); } });
}
const webPrefs = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false };

function createWindow() {
  const win = new BrowserWindow({ width: 1180, height: 820, autoHideMenuBar: true, title: 'Rechnungen', webPreferences: webPrefs });
  lockNavigation(win);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function openPreview(parent, inv) {
  const win = new BrowserWindow({ width: 900, height: 1000, parent, autoHideMenuBar: true, title: 'Vorschau', webPreferences: webPrefs });
  lockNavigation(win);
  const id = win.webContents.id;
  previews.set(id, inv);
  win.on('closed', () => previews.delete(id));
  win.loadFile(path.join(__dirname, 'renderer', 'preview.html'));
}

app.whenReady().then(() => {
  store = new Store(path.join(app.getPath('userData'), 'data'));
  const winOf = (e) => BrowserWindow.fromWebContents(e.sender);
  ipcMain.handle('settings:get', () => store.getSettings());
  ipcMain.handle('settings:save', (_, s) => store.saveSettings(s));
  ipcMain.handle('invoices:list', (_, q, period) => store.listInvoices(q, period));
  ipcMain.handle('invoices:get', (_, id) => store.getInvoice(id));
  ipcMain.handle('invoices:save', (_, inv) => store.saveInvoice(inv));
  ipcMain.handle('invoices:delete', (_, id) => store.deleteInvoice(id));
  ipcMain.handle('invoices:nextNumber', (_, date) => store.nextNumber(date));
  ipcMain.handle('invoices:csv', async (e, q, period) => {
    const list = store.listInvoices(q, period);
    const filePath = await saveDialog(winOf(e), `Rechnungen-${period || 'alle'}.csv`, [{ name: 'CSV', extensions: ['csv'] }]);
    if (!filePath) return { ok: false };
    fs.writeFileSync(filePath, toCsv(list));
    return { ok: true, filePath, count: list.length };
  });
  // Rechnung wird als Objekt übergeben, damit auch ungespeicherte Rechnungen angezeigt, gedruckt und exportiert werden können
  ipcMain.handle('invoices:pdf', (e, inv) => exportPdf(winOf(e), inv));
  ipcMain.handle('invoices:print', (e, inv) => printInvoice(inv));
  ipcMain.handle('invoices:preview', (e, inv) => { openPreview(winOf(e), inv); return { ok: true }; });
  // Vorschaufenster
  ipcMain.handle('preview:get', (e) => { const inv = previews.get(e.sender.id); return inv ? { html: buildHtml(inv), number: withNumber(inv).number } : null; });
  ipcMain.handle('preview:print', (e) => printInvoice(previews.get(e.sender.id)));
  ipcMain.handle('preview:pdf', (e) => exportPdf(winOf(e), previews.get(e.sender.id)));
  createWindow();
});
app.on('window-all-closed', () => app.quit());
