// تخزين محلي بسيط (ملفات JSON) داخل مجلد بيانات المستخدم. لا يحتاج إنترنت.
const fs = require('fs');
const path = require('path');
const Ex = require('./expenses');
const Est = require('./estimate');

const DEFAULT_SETTINGS = {
  companyName: 'Firmenname', address: '', uid: '', bank: '', iban: '', bic: '', phone: '', email: '',
  color: '#1f6feb', logo: '', currency: '€',
  lastDir: '', // zuletzt benutzter Ordner beim Speichern von PDF/CSV
  lastBackup: '', // ISO-Zeitpunkt der letzten Sicherung
  epcQr: true, // EPC-QR-Code («Zahlen mit Code») auf der Rechnung
  taxRate: 0, taxNote: 'Umsatzsteuerfrei gemäß § 6 Abs. 1 Z 27 UStG.',
  catalog: [], // vordefinierte Positionen: [{ description, price }]
  kvClauses: Est.DEFAULT_CLAUSES, // Textbausteine für Kostenvoranschläge
  kvValidDays: Est.DEFAULT_VALID_DAYS, // Gültigkeit eines Kostenvoranschlags in Tagen
};

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.settingsFile = path.join(dir, 'settings.json');
    this.invoicesFile = path.join(dir, 'invoices.json');
    this.expensesFile = path.join(dir, 'expenses.json');
    this.estimatesFile = path.join(dir, 'estimates.json');
    this.receiptsDir = path.join(dir, 'belege'); // Belegdateien: <id>.<pdf|png|jpg|webp|gif>
  }
  _read(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
  }
  _write(file, data) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file); // كتابة آمنة حتى لا يتلف الملف عند انقطاع الكهرباء
  }
  getSettings() { return { ...DEFAULT_SETTINGS, ...this._read(this.settingsFile, {}) }; }
  saveSettings(s) {
    s = { ...s };
    if ('kvClauses' in s) s.kvClauses = Est.cleanClauses(s.kvClauses);
    if ('kvValidDays' in s) s.kvValidDays = Math.min(365, Math.max(1, Math.round(Number(s.kvValidDays)) || Est.DEFAULT_VALID_DAYS));
    const merged = { ...this.getSettings(), ...s }; this._write(this.settingsFile, merged); return merged;
  }
  // period: '' (alle) | 'JJJJ' | 'JJJJ-MM' | 'JJJJ-MM-TT' (Präfix des ISO-Datums)
  listInvoices(query = '', period = '') {
    const q = String(query).trim().toLowerCase();
    const all = this._read(this.invoicesFile, []);
    let res = period ? all.filter((i) => String(i.date || '').startsWith(String(period))) : all;
    res = q ? res.filter((i) => [i.number, i.customer, i.date, i.notes, i.customerUid, ...(i.items || []).map((x) => x.description)]
      .some((v) => String(v || '').toLowerCase().includes(q))) : res;
    return res.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)));
  }
  // Rechnungsnummer = TTMMJJ + laufende Nummer des Tages, z. B. 02102601, 02102602 ...
  nextNumber(date) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : new Date().toISOString().slice(0, 10);
    const prefix = d.slice(8, 10) + d.slice(5, 7) + d.slice(2, 4);
    let max = 0;
    for (const i of this._read(this.invoicesFile, [])) {
      const m = String(i.number || '').match(/^(\d{6})(\d{2,})$/);
      if (m && m[1] === prefix) max = Math.max(max, parseInt(m[2], 10));
    }
    return prefix + String(max + 1).padStart(2, '0');
  }
  getInvoice(id) { return this._read(this.invoicesFile, []).find((i) => i.id === id) || null; }
  saveInvoice(inv) {
    const all = this._read(this.invoicesFile, []);
    const now = new Date().toISOString();
    if (!inv.id) {
      inv = { ...inv, id: 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: now };
      if (!inv.number) inv.number = this.nextNumber(inv.date);
      all.push({ ...inv, updatedAt: now });
    } else {
      const idx = all.findIndex((i) => i.id === inv.id);
      if (idx < 0) all.push({ ...inv, updatedAt: now }); else all[idx] = { ...all[idx], ...inv, updatedAt: now };
    }
    this._write(this.invoicesFile, all);
    return all.find((i) => i.id === inv.id);
  }
  // ---- Kostenvoranschläge: Nummer KV-TTMMJJ + laufende Nummer des Tages, z. B. KV-05102601 ----
  allEstimates() { return this._read(this.estimatesFile, []); }
  replaceEstimates(list) { this._write(this.estimatesFile, list); }
  getEstimate(id) { return this.allEstimates().find((e) => e.id === id) || null; }
  nextEstimateNumber(date) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : new Date().toISOString().slice(0, 10);
    const prefix = 'KV-' + d.slice(8, 10) + d.slice(5, 7) + d.slice(2, 4);
    let max = 0;
    for (const e of this.allEstimates()) {
      const m = String(e.number || '').match(/^KV-(\d{6})(\d{2,})$/);
      if (m && 'KV-' + m[1] === prefix) max = Math.max(max, parseInt(m[2], 10));
    }
    return prefix + String(max + 1).padStart(2, '0');
  }
  listEstimates(query = '', status = '') {
    const q = String(query).trim().toLowerCase();
    let res = this.allEstimates();
    if (status) res = res.filter((e) => e.status === status);
    if (q) res = res.filter((e) => [e.number, e.customer, e.date, e.subject, e.notes, ...(e.items || []).map((x) => x.description)].some((v) => String(v || '').toLowerCase().includes(q)));
    return res.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)));
  }
  saveEstimate(x) {
    x = x && typeof x === 'object' ? x : {};
    const all = this.allEstimates();
    const now = new Date().toISOString();
    const idx = x.id ? all.findIndex((e) => e.id === x.id) : -1;
    const base = idx >= 0 ? all[idx] : null;
    const id = base ? base.id : 'kv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const c = Est.cleanEstimate({ ...x, id, createdAt: base ? base.createdAt : now, updatedAt: now });
    if (!c.number) c.number = base && base.number ? base.number : this.nextEstimateNumber(c.date);
    if (idx >= 0) all[idx] = c; else all.push(c);
    this._write(this.estimatesFile, all);
    return c;
  }
  deleteEstimate(id) { this._write(this.estimatesFile, this.allEstimates().filter((e) => e.id !== id)); }
  // ---- Ausgaben (Belege für den Steuerberater) ----
  allExpenses() { return this._read(this.expensesFile, []); }
  replaceExpenses(list) { this._write(this.expensesFile, list); }
  getExpense(id) { return this.allExpenses().find((e) => e.id === id) || null; }
  listExpenses(query = '', period = '') {
    const q = String(query).trim().toLowerCase();
    let res = this.allExpenses();
    if (period) res = res.filter((e) => String(e.date || '').startsWith(String(period)));
    if (q) res = res.filter((e) => [e.supplier, e.description, e.category, e.number, e.date].some((v) => String(v || '').toLowerCase().includes(q)));
    return res.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  // Der Beleg (receipt) wird nie aus der Oberfläche übernommen, nur über setReceipt
  saveExpense(x) {
    const all = this.allExpenses();
    const now = new Date().toISOString();
    const idx = x && x.id ? all.findIndex((e) => e.id === x.id) : -1;
    const base = idx >= 0 ? all[idx] : null;
    const id = base ? base.id : 'exp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const c = Ex.cleanExpense({ ...x, id, receipt: base ? base.receipt : null, createdAt: base ? base.createdAt : now, updatedAt: now });
    if (idx >= 0) all[idx] = c; else all.push(c);
    this._write(this.expensesFile, all);
    return c;
  }
  receiptPath(e) {
    if (!e || !Ex.safeId(e.id) || !e.receipt || !Ex.RECEIPT_EXTS.includes(e.receipt.ext)) return '';
    return path.join(this.receiptsDir, e.id + '.' + e.receipt.ext);
  }
  _rmReceipt(e) { const p = this.receiptPath(e); if (p) try { fs.unlinkSync(p); } catch { /* war schon weg */ } }
  setReceipt(id, receipt, data) {
    const all = this.allExpenses();
    const e = all.find((x) => x.id === id);
    if (!e) return null;
    this._rmReceipt(e);
    if (receipt && data) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
      e.receipt = { name: String(receipt.name || '').slice(0, 120), ext: receipt.ext };
      fs.writeFileSync(this.receiptPath(e), data);
    } else e.receipt = null;
    e.updatedAt = new Date().toISOString();
    this._write(this.expensesFile, all);
    return e;
  }
  deleteExpense(id) {
    const all = this.allExpenses();
    const e = all.find((x) => x.id === id);
    if (e) this._rmReceipt(e);
    this._write(this.expensesFile, all.filter((x) => x.id !== id));
  }
  // Sicherung: alle Belegdateien als { id: { ext, data(base64) } }
  readReceipts() {
    const out = {};
    for (const e of this.allExpenses()) {
      const p = this.receiptPath(e);
      try { if (p) out[e.id] = { ext: e.receipt.ext, data: fs.readFileSync(p).toString('base64') }; } catch { /* Datei fehlt */ }
    }
    return out;
  }
  // Wiederherstellung: Liste übernehmen, Belegdateien schreiben, Beleg-Verweise ohne Datei entfernen, verwaiste Dateien löschen
  restoreExpenses(list, receipts = {}) {
    fs.mkdirSync(this.receiptsDir, { recursive: true });
    const out = list.map((e) => {
      const r = receipts[e.id];
      if (r && e.receipt && r.ext === e.receipt.ext) fs.writeFileSync(this.receiptPath(e), r.buf);
      const has = e.receipt && fs.existsSync(this.receiptPath(e));
      return { ...e, receipt: has ? e.receipt : null };
    });
    const keep = new Set(out.filter((e) => e.receipt).map((e) => path.basename(this.receiptPath(e))));
    for (const f of fs.readdirSync(this.receiptsDir)) if (!keep.has(f)) try { fs.unlinkSync(path.join(this.receiptsDir, f)); } catch { /* ignorieren */ }
    this._write(this.expensesFile, out);
  }
  allInvoices() { return this._read(this.invoicesFile, []); }
  replaceInvoices(list) { this._write(this.invoicesFile, list); }
  deleteInvoice(id) { this._write(this.invoicesFile, this._read(this.invoicesFile, []).filter((i) => i.id !== id)); }
}
module.exports = { Store, DEFAULT_SETTINGS };
