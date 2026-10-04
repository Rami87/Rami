// Datensicherung: eine einzelne JSON-Datei mit Einstellungen (inkl. Logo), allen Rechnungen, Ausgaben und Belegdateien.
// Eine Sicherungsdatei kommt von außen und wird deshalb beim Einlesen geprüft und bereinigt.
const { DEFAULT_SETTINGS } = require('./store');
const Ex = require('./expenses');

const APP = 'rechnungen-backup';
const FORMAT = 1;
const MAX_INVOICES = 200000;

const str = (v, max = 5000) => String(v == null ? '' : v).slice(0, max);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');

function cleanItem(it) {
  return { description: str(it && it.description, 500), qty: num(it && it.qty), price: num(it && it.price) };
}
function cleanInvoice(i) {
  if (!i || typeof i !== 'object' || typeof i.id !== 'string' || !i.id || i.id.length > 100) return null;
  return {
    id: i.id, number: str(i.number, 50), date: isDate(i.date) ? i.date : '', serviceDate: isDate(i.serviceDate) ? i.serviceDate : '',
    customer: str(i.customer, 300), customerAddress: str(i.customerAddress, 1000), customerUid: str(i.customerUid, 50),
    items: (Array.isArray(i.items) ? i.items.slice(0, 1000) : []).map(cleanItem),
    discount: num(i.discount), taxRate: num(i.taxRate), taxNote: str(i.taxNote, 1000), notes: str(i.notes, 3000), currency: str(i.currency, 10),
    createdAt: str(i.createdAt, 40), updatedAt: str(i.updatedAt, 40),
  };
}
function cleanSettings(s) {
  const o = s && typeof s === 'object' ? s : {};
  const out = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (k === 'lastDir' || k === 'lastBackup') continue; // gehören zum Computer, nicht zu den Daten
    const d = DEFAULT_SETTINGS[k];
    if (k === 'catalog') out.catalog = (Array.isArray(o.catalog) ? o.catalog.slice(0, 2000) : []).map((c) => ({ description: str(c && c.description, 500), price: num(c && c.price) })).filter((c) => c.description);
    else if (k === 'taxRate') out.taxRate = num(o.taxRate);
    else if (k === 'epcQr') out.epcQr = o.epcQr !== false;
    else if (k === 'color') out.color = /^#[0-9a-fA-F]{6}$/.test(o.color || '') ? o.color : d;
    else if (k === 'logo') out.logo = /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(o.logo || '') ? o.logo : '';
    else out[k] = o[k] == null ? d : str(o[k], 3000);
  }
  return out;
}

// extra: { expenses, receipts } (Ausgaben und Belegdateien als base64); ältere Sicherungen haben beides nicht
function createBackup(settings, invoices, now = new Date(), extra = {}) {
  const { lastDir, lastBackup, ...data } = settings; // eslint-disable-line no-unused-vars
  const o = { app: APP, format: FORMAT, exportedAt: now.toISOString(), settings: data, invoices };
  if (extra.expenses) { o.expenses = extra.expenses; o.receipts = extra.receipts || {}; }
  return JSON.stringify(o, null, 2);
}

function cleanExpenses(d) {
  if (!Array.isArray(d.expenses)) return { expenses: null, receipts: {} };
  const seen = new Set(), expenses = [];
  for (const raw of d.expenses.slice(0, MAX_INVOICES)) { const c = Ex.cleanExpense(raw); if (c && !seen.has(c.id)) { seen.add(c.id); expenses.push(c); } }
  const receipts = {};
  const src = d.receipts && typeof d.receipts === 'object' ? d.receipts : {};
  for (const e of expenses) {
    const r = e.receipt && src[e.id];
    if (!r || typeof r.data !== 'string' || r.data.length > Math.ceil(Ex.MAX_RECEIPT * 4 / 3) + 8) { e.receipt = null; continue; }
    const buf = Buffer.from(r.data, 'base64');
    // Dateityp muss zum Inhalt passen (nur PDF und Bilder)
    if (buf.length > Ex.MAX_RECEIPT || Ex.sniffExt(buf) !== e.receipt.ext) { e.receipt = null; continue; }
    receipts[e.id] = { ext: e.receipt.ext, buf };
  }
  return { expenses, receipts };
}

// wirft Error mit deutscher Meldung, wenn die Datei keine gültige Sicherung ist
function parseBackup(text) {
  let d;
  try { d = JSON.parse(String(text).replace(/^\uFEFF/, '')); } catch { throw new Error('Die Datei ist keine gültige Sicherung (kein lesbares JSON).'); }
  if (!d || d.app !== APP) throw new Error('Die Datei stammt nicht aus diesem Programm.');
  if (d.format !== FORMAT) throw new Error('Diese Sicherung hat ein unbekanntes Format (Version ' + d.format + ').');
  if (!Array.isArray(d.invoices) || d.invoices.length > MAX_INVOICES) throw new Error('Die Sicherung enthält keine gültige Rechnungsliste.');
  const seen = new Set();
  const invoices = [];
  for (const raw of d.invoices) { const c = cleanInvoice(raw); if (c && !seen.has(c.id)) { seen.add(c.id); invoices.push(c); } }
  return { exportedAt: str(d.exportedAt, 40), settings: cleanSettings(d.settings), invoices, ...cleanExpenses(d) };
}

// Zusammenführen: gleiche ID -> die zuletzt geänderte Version gewinnt
function mergeInvoices(existing, incoming) {
  const byId = new Map(existing.map((i) => [i.id, i]));
  let added = 0, updated = 0;
  for (const inc of incoming) {
    const cur = byId.get(inc.id);
    if (!cur) { byId.set(inc.id, inc); added++; }
    else if (String(inc.updatedAt || '') > String(cur.updatedAt || '')) { byId.set(inc.id, inc); updated++; }
  }
  return { list: [...byId.values()], added, updated };
}

module.exports = { createBackup, parseBackup, mergeInvoices };
