// تخزين محلي بسيط (ملفات JSON) داخل مجلد بيانات المستخدم. لا يحتاج إنترنت.
const fs = require('fs');
const path = require('path');

const DEFAULT_SETTINGS = { companyName: 'اسم الشركة', address: '', color: '#1f6feb', logo: '', currency: 'ر.س', nextNumber: 1 };

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
  listInvoices(query = '') {
    const q = String(query).trim().toLowerCase();
    const all = this._read(this.invoicesFile, []);
    const res = q ? all.filter((i) => [i.number, i.customer, i.date, i.notes, ...(i.items || []).map((x) => x.description)]
      .some((v) => String(v || '').toLowerCase().includes(q))) : all;
    return res.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)));
  }
  getInvoice(id) { return this._read(this.invoicesFile, []).find((i) => i.id === id) || null; }
  saveInvoice(inv) {
    const all = this._read(this.invoicesFile, []);
    const now = new Date().toISOString();
    if (!inv.id) {
      const s = this.getSettings();
      inv = { ...inv, id: 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: now };
      if (!inv.number) { inv.number = String(s.nextNumber); }
      this.saveSettings({ nextNumber: (parseInt(s.nextNumber, 10) || 0) + 1 });
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
