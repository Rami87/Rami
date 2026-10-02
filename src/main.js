const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { Store } = require('./store');
const InvoiceHtml = require('./invoice-html');
const { toCsv } = require('./csv');
const { createBackup, parseBackup, mergeInvoices } = require('./backup');

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

  // ---- Datensicherung ----
  const day = () => new Date().toISOString().slice(0, 10);
  ipcMain.handle('backup:info', () => ({ dir: store.dir, lastBackup: store.getSettings().lastBackup, count: store.allInvoices().length }));
  ipcMain.handle('backup:showFolder', () => shell.openPath(store.dir));
  ipcMain.handle('backup:create', async (e) => {
    const filePath = await saveDialog(winOf(e), `Rechnungen-Backup-${day()}.json`, [{ name: 'Sicherung (JSON)', extensions: ['json'] }]);
    if (!filePath) return { ok: false };
    const invoices = store.allInvoices();
    fs.writeFileSync(filePath, createBackup(store.getSettings(), invoices));
    store.saveSettings({ lastBackup: new Date().toISOString() });
    return { ok: true, filePath, count: invoices.length };
  });
  ipcMain.handle('backup:restore', async (e) => {
    const win = winOf(e);
    const { filePaths, canceled } = await dialog.showOpenDialog(win, { defaultPath: startDir(), properties: ['openFile'], filters: [{ name: 'Sicherung (JSON)', extensions: ['json'] }] });
    if (canceled || !filePaths[0]) return { ok: false };
    let data;
    try {
      if (fs.statSync(filePaths[0]).size > 200 * 1024 * 1024) throw new Error('Die Datei ist zu groß für eine Sicherung.');
      data = parseBackup(fs.readFileSync(filePaths[0], 'utf8'));
    } catch (err) { return { ok: false, error: err.message }; }
    const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString('de-AT') : 'unbekannt';
    const { response } = await dialog.showMessageBox(win, {
      type: 'question', title: 'Sicherung wiederherstellen', cancelId: 2, defaultId: 0,
      buttons: ['Zusammenführen', 'Alles ersetzen', 'Abbrechen'],
      message: `Sicherung vom ${when}: ${data.invoices.length} Rechnungen.`,
      detail: 'Zusammenführen: vorhandene Rechnungen bleiben, neue werden hinzugefügt (bei gleicher Rechnung gewinnt die neuere Version). Einstellungen bleiben unverändert.\n\nAlles ersetzen: Einstellungen und Rechnungen werden durch die Sicherung ersetzt. Der aktuelle Stand wird vorher automatisch im Programmordner gesichert.',
    });
    if (response === 2) return { ok: false };
    if (response === 1) {
      const dir = path.join(store.dir, 'backups'); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `vor-Wiederherstellung-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), createBackup(store.getSettings(), store.allInvoices()));
      const keep = { lastDir: store.getSettings().lastDir, lastBackup: store.getSettings().lastBackup };
      store.replaceInvoices(data.invoices);
      store.saveSettings({ ...data.settings, ...keep });
      return { ok: true, mode: 'replace', count: data.invoices.length };
    }
    const m = mergeInvoices(store.allInvoices(), data.invoices);
    store.replaceInvoices(m.list);
    return { ok: true, mode: 'merge', added: m.added, updated: m.updated, count: m.list.length };
  });
  // Alle Rechnungen als einzelne PDF-Dateien in einen Ordner (z. B. für den Steuerberater)
  ipcMain.handle('backup:pdfs', async (e) => {
    const { filePaths, canceled } = await dialog.showOpenDialog(winOf(e), { defaultPath: startDir(), title: 'Ordner für die PDF-Dateien', properties: ['openDirectory', 'createDirectory'] });
    if (canceled || !filePaths[0]) return { ok: false };
    const dir = filePaths[0];
    store.saveSettings({ lastDir: dir });
    const list = store.allInvoices();
    for (const inv of list) {
      const name = `Rechnung-${String(inv.number || inv.id).replace(/[^\w.-]+/g, '_')}.pdf`;
      fs.writeFileSync(path.join(dir, name), await renderPdf(buildHtml(inv)));
    }
    return { ok: true, dir, count: list.length };
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
