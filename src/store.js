// تخزين محلي بسيط (ملفات JSON) داخل مجلد بيانات المستخدم. لا يحتاج إنترنت.
const fs = require('fs');
const path = require('path');

const DEFAULT_SETTINGS = {
  companyName: 'Firmenname', address: '', uid: '', bank: '', iban: '', bic: '', phone: '', email: '',
  color: '#1f6feb', logo: '', currency: '€',
  lastDir: '', // zuletzt benutzter Ordner beim Speichern von PDF/CSV
  taxRate: 0, taxNote: 'Umsatzsteuerfrei gemäß § 6 Abs. 1 Z 27 UStG.',
  catalog: [], // vordefinierte Positionen: [{ description, price }]
};

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.settingsFile = path.join(dir, 'settings.json');
    this.invoicesFile = path.join(dir, 'invoices.json');
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
  saveSettings(s) { const merged = { ...this.getSettings(), ...s }; this._write(this.settingsFile, merged); return merged; }
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
  deleteInvoice(id) { this._write(this.invoicesFile, this._read(this.invoicesFile, []).filter((i) => i.id !== id)); }
}
module.exports = { Store, DEFAULT_SETTINGS };
