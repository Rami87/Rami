const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Store } = require('../src/store');
const H = require('../src/invoice-html');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-'));
const s = new Store(dir);
assert.strictEqual(s.getSettings().color, '#1f6feb');
assert(s.getSettings().taxNote.includes('§ 6 Abs. 1 Z 27 UStG'));
assert.strictEqual(s.getSettings().taxRate, 0);
s.saveSettings({ catalog: [{ description: 'Beratung', price: 90 }] });
assert.strictEqual(s.getSettings().catalog[0].price, 90);
s.saveSettings({ companyName: 'س' });
assert.strictEqual(s.getSettings().companyName, 'س');

const a = s.saveInvoice({ date: '2026-01-01', customer: 'أحمد', items: [{ description: 'كرسي', qty: 2, price: 10 }] });
const b = s.saveInvoice({ date: '2026-02-01', customer: 'سالم', items: [{ description: 'طاولة', qty: 1, price: 50 }] });
// Rechnungsnummer: TTMMJJ + laufende Nummer pro Tag
assert.deepStrictEqual([a.number, b.number], ['01012601', '01022601']);
const a2 = s.saveInvoice({ date: '2026-01-01', customer: 'Zweite', items: [] });
assert.strictEqual(a2.number, '01012602');
s.deleteInvoice(a2.id);
assert.strictEqual(s.nextNumber('2026-01-01'), '01012602'); // nach Löschen der letzten wird die Nummer wieder frei
assert.strictEqual(s.nextNumber('2026-10-02'), '02102601'); // neuer Tag beginnt wieder bei 01
const old = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'inv-')));
old.saveInvoice({ date: '2026-10-02', customer: 'X', number: '1102604', items: [] }); // alte Nummern stören nicht
assert.strictEqual(old.nextNumber('2026-10-02'), '02102601');
assert.strictEqual(s.listInvoices('أحمد').length, 1);
assert.strictEqual(s.listInvoices('طاولة')[0].id, b.id);
assert.strictEqual(s.listInvoices()[0].id, b.id);
s.saveInvoice({ ...a, customer: 'أحمد علي' });
assert.strictEqual(s.getInvoice(a.id).customer, 'أحمد علي');
s.deleteInvoice(a.id);
assert.strictEqual(s.listInvoices().length, 1);

const t = H.totals({ items: [{ qty: 2, price: 100 }], discount: 50, taxRate: 10 });
assert.strictEqual(t.total, 165);
assert(H.build({ number: '1', date: '2026-10-01', items: [{ description: 'x', qty: 1, price: 1234.5 }], taxRate: 20, taxNote: '' }, { companyName: 'A' }).includes('1.234,50'));
assert(H.build({ number: '1', date: '2026-10-01', items: [], taxNote: H.DEFAULT_TAX_NOTE }, {}).includes('01.10.2026'));
const html = H.build({ number: '<x>', items: [], customer: '' }, { companyName: '<script>', color: 'red', logo: 'javascript:1' });
assert(!html.includes('<script>') && !html.includes('javascript:') && html.includes('lang="de"'));
const { toCsv } = require('../src/csv');
const csv = toCsv([{ number: '7', date: '2025-12-31', customer: '=cmd;"x"', taxRate: 20, items: [{ description: 'a', qty: 1, price: 100 }] },
  { number: '8', date: '2026-01-02', customer: 'B', taxRate: 0, items: [{ description: 'b', qty: 2, price: 50.5 }] }]);
assert(csv.startsWith('﻿Rechnungsnummer;'));
assert(csv.includes(`"'=cmd;""x"""`)); // Formel-Injection entschärft, Quotes escaped
assert(csv.includes('7;31.12.2025;;') && csv.includes('100,00;20;20,00;120,00'));
assert(csv.includes('Summe (2 Rechnungen);;;;;201,00;;20,00;221,00'));
const y = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'inv-')));
y.saveInvoice({ date: '2025-05-01', customer: 'A', items: [] }); y.saveInvoice({ date: '2026-05-01', customer: 'B', items: [] });
assert.strictEqual(y.listInvoices('', '2025').length, 1);
assert.strictEqual(y.listInvoices('B', '2025').length, 0);
assert.strictEqual(y.listInvoices('', '2026-05').length, 1);
assert.strictEqual(y.listInvoices('', '2026-05-01').length, 1);
assert.strictEqual(y.listInvoices('', '2026-05-02').length, 0);
assert.strictEqual(y.listInvoices('', '2026-04').length, 0);
// Fußzeile: drei Spalten, IBAN in 4er-Gruppen
const foot = H.build({ number: '1', items: [] }, { companyName: 'Prince', address: 'Wien', bank: 'BAWAG', iban: 'AT736000040510117567', bic: 'BAWAATWW', phone: '0681', email: 'a@b.at' });
assert(foot.includes('IBAN: AT73 6000 0405 1011 7567') && foot.includes('Bank: BAWAG') && foot.includes('Tel.: 0681') && foot.includes('E-Mail: a@b.at'));
console.log('Alle Tests bestanden');
