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
assert.strictEqual(s.nextNumber('2026-01-01'), '01012603'); // eine vergebene Nummer wird nie wieder vergeben
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
// Datensicherung
const { createBackup, parseBackup, mergeInvoices } = require('../src/backup');
const bs = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'inv-')));
bs.saveSettings({ companyName: 'Prince', color: '#0b7a4b', logo: 'data:image/png;base64,AAAA', lastDir: 'C:\\x', catalog: [{ description: 'Beratung', price: 90 }] });
const i1 = bs.saveInvoice({ date: '2026-10-02', customer: 'A', items: [{ description: 'x', qty: 2, price: 10 }], taxRate: 20 });
const text = createBackup(bs.getSettings(), bs.allInvoices(), new Date('2026-10-02T10:00:00Z'));
assert(!text.includes('lastDir') && !text.includes('lastBackup'));
const parsed = parseBackup(text);
assert.strictEqual(parsed.invoices.length, 1);
assert.strictEqual(parsed.invoices[0].number, i1.number);
assert.strictEqual(parsed.settings.companyName, 'Prince');
assert.strictEqual(parsed.settings.catalog[0].price, 90);
assert.strictEqual(parsed.settings.logo, 'data:image/png;base64,AAAA');
assert.throws(() => parseBackup('kein json'), /JSON/);
assert.throws(() => parseBackup('{"app":"anderes"}'), /nicht aus diesem Programm/);
assert.throws(() => parseBackup('{"app":"rechnungen-backup","format":9,"invoices":[]}'), /Format/);
const evil = parseBackup(JSON.stringify({ app: 'rechnungen-backup', format: 1, invoices: [{ id: 'a', customer: 5, items: 'x', date: 'kaputt' }, { nope: 1 }, { id: 'a' }], settings: { logo: 'javascript:alert(1)', color: 'red' } }));
assert.strictEqual(evil.invoices.length, 1);
assert.strictEqual(evil.invoices[0].date, '');
assert.strictEqual(evil.settings.logo, '');
assert.strictEqual(evil.settings.color, '#1f6feb');
// Zusammenführen: neue hinzufügen, neuere ersetzen, ältere behalten
const m = mergeInvoices([{ id: 'a', updatedAt: '2026-01-02' }, { id: 'b', updatedAt: '2026-05-01' }], [{ id: 'a', updatedAt: '2026-03-01' }, { id: 'b', updatedAt: '2026-01-01' }, { id: 'c', updatedAt: '' }]);
assert.deepStrictEqual([m.added, m.updated, m.list.length], [1, 1, 3]);
assert.strictEqual(m.list.find((x) => x.id === 'a').updatedAt, '2026-03-01');
assert.strictEqual(m.list.find((x) => x.id === 'b').updatedAt, '2026-05-01');
// EPC-QR («Zahlen mit Code»)
const st = { companyName: 'Prince Sattlerei Ä', iban: 'AT73 6000 0405 1011 7567', bic: 'BAWAATWW', currency: '€' };
const inv1 = { number: '02102601', currency: '€', taxRate: 0, items: [{ description: 'x', qty: 2, price: 150.5 }] };
const pl = H.epcPayload(inv1, st, 301).split('\n');
assert.deepStrictEqual(pl, ['BCD', '002', '1', 'SCT', 'BAWAATWW', 'Prince Sattlerei Ä', 'AT736000040510117567', 'EUR301.00', '', '', 'Rechnung 02102601', '']);
assert(H.build(inv1, st).includes('class="epc"') && H.build(inv1, st).includes('Zahlen mit Code'));
assert(!H.build(inv1, { ...st, epcQr: false }).includes('class="epc"'), 'abschaltbar');
assert(!H.build({ ...inv1, currency: 'USD' }, st).includes('class="epc"'), 'nur EUR');
assert(!H.build(inv1, { ...st, iban: 'kaputt' }).includes('class="epc"'), 'IBAN ungültig');
assert(!H.build({ ...inv1, items: [] }, st).includes('class="epc"'), 'Betrag 0');
assert(!H.epcPayload({ ...inv1, number: 'a\nb' }, st, 1).split('\n')[10].includes('\n') && H.epcPayload({ ...inv1, number: 'a\nb' }, st, 1).split('\n').length === 12, 'Zeilenumbruch eingeschleust');

// Ausgaben: Vorsteuer, Summen, CSV, Belege, Sicherung
const Ex = require('../src/expenses');
assert.deepStrictEqual(Ex.amounts({ gross: 120, taxRate: 20 }), { gross: 120, rate: 20, vat: 20, net: 100 });
assert.deepStrictEqual(Ex.amounts({ gross: 110, taxRate: 10 }), { gross: 110, rate: 10, vat: 10, net: 100 });
assert.strictEqual(Ex.amounts({ gross: 113, taxRate: 13 }).vat, 13);
assert.strictEqual(Ex.amounts({ gross: 19.99, taxRate: 20 }).vat, 3.33);
assert.strictEqual(Ex.amounts({ gross: 50, taxRate: 0 }).vat, 0);
assert.strictEqual(Ex.amounts({ gross: 50, taxRate: 7 }).vat, 0, 'unbekannter Satz wird 0');
const PDF = Buffer.from('%PDF-1.4\n%test file\n');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(8)]);
assert.strictEqual(Ex.sniffExt(PDF), 'pdf'); assert.strictEqual(Ex.sniffExt(PNG), 'png');
assert.strictEqual(Ex.sniffExt(Buffer.from('MZ\x90\x00 programm.exe geht nicht durch')), '', 'exe als pdf getarnt');
assert.strictEqual(Ex.sniffExt(Buffer.from('<html><script>alert(1)</script></html>')), '');
const xs = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'exp-')));
const x1 = xs.saveExpense({ date: '2026-10-02', supplier: 'Hornbach', description: 'Material', category: 'Material / Waren', gross: 120, taxRate: 20, receipt: { name: 'hack', ext: 'pdf' }, id: '../../x' });
assert(x1.id.startsWith('exp_') && x1.receipt === null, 'Beleg und id kommen nie aus der Oberfläche');
const x2 = xs.saveExpense({ date: '2026-10-15', supplier: '=SUM(A1)', category: 'Erfunden', gross: 55, taxRate: 10 });
const x3 = xs.saveExpense({ date: '2026-11-03', supplier: 'A1', gross: 30, taxRate: 20 });
assert.strictEqual(x2.category, 'Sonstiges');
xs.setReceipt(x1.id, { name: 'beleg.pdf', ext: 'pdf' }, PDF);
assert(fs.existsSync(path.join(xs.receiptsDir, x1.id + '.pdf')) && xs.getExpense(x1.id).receipt.name === 'beleg.pdf');
xs.saveExpense({ id: x1.id, date: '2026-10-02', supplier: 'Hornbach 2', gross: 120, taxRate: 20 });
assert(xs.getExpense(x1.id).receipt && xs.getExpense(x1.id).supplier === 'Hornbach 2', 'Bearbeiten behält den Beleg');
assert.strictEqual(xs.listExpenses('', '2026-10').length, 2);
assert.strictEqual(xs.listExpenses('', '2026').length, 3);
assert.strictEqual(xs.listExpenses('hornbach', '').length, 1);
const sm = Ex.summarize(xs.listExpenses('', '2026-10'));
assert.deepStrictEqual([sm.n, sm.gross, sm.vat, sm.net], [2, 175, 25, 150]);
assert.deepStrictEqual(sm.byRate.map((r) => [r.rate, r.vat]), [[20, 20], [10, 5]]);
const csvX = Ex.toCsv(xs.listExpenses('', '2026-10'));
assert(csvX.startsWith('﻿') && csvX.includes("'=SUM(A1)") && csvX.includes('Summe (2 Belege)') && csvX.includes('001_Hornbach_2_2026-10-02.pdf'), csvX);
assert(Ex.summaryHtml([{ ...x2, supplier: '<img src=x onerror=alert(1)>' }], { companyName: 'F' }, 'T').includes('&lt;img'), 'HTML in Zusammenfassung escaped');
// Sicherung mit Belegen
const bk = require('../src/backup').createBackup(xs.getSettings(), [], new Date(), { expenses: xs.allExpenses(), receipts: xs.readReceipts() });
const pb = require('../src/backup').parseBackup(bk);
assert.strictEqual(pb.expenses.length, 3); assert(pb.receipts[x1.id].buf.equals(PDF));
const ys = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'exp-')));
ys.restoreExpenses(pb.expenses, pb.receipts);
assert(fs.readFileSync(path.join(ys.receiptsDir, x1.id + '.pdf')).equals(PDF) && ys.allExpenses().length === 3);
assert.strictEqual(require('../src/backup').parseBackup(JSON.stringify({ app: 'rechnungen-backup', format: 1, invoices: [] })).expenses, null, 'alte Sicherung ohne Ausgaben');
const badB = require('../src/backup').parseBackup(JSON.stringify({ app: 'rechnungen-backup', format: 1, invoices: [],
  expenses: [{ id: 'e1', receipt: { name: 'x', ext: 'pdf' }, gross: 'abc' }, { id: '../x', receipt: { ext: 'pdf' } }, { id: 'e2', receipt: { name: 'y', ext: 'exe' } }, { id: 'e3', receipt: { name: 'z', ext: 'png' } }],
  receipts: { e1: { ext: 'pdf', data: Buffer.from('MZ-kein-pdf-----').toString('base64') }, e3: { ext: 'png', data: PDF.toString('base64') } } }));
assert.deepStrictEqual(badB.expenses.map((e) => [e.id, e.receipt]), [['e1', null], ['e2', null], ['e3', null]], 'Belege mit falschem Inhalt/Typ werden verworfen, ungültige IDs entfernt');
xs.deleteExpense(x1.id);
assert(!fs.existsSync(path.join(xs.receiptsDir, x1.id + '.pdf')) && xs.allExpenses().length === 2, 'Löschen entfernt die Belegdatei');

// Kostenvoranschlag: Nummern, Bereinigung, Vorlage, Sicherung
const Est = require('../src/estimate');
const es = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'kv-')));
const q1 = es.saveEstimate({ date: '2026-10-05', customer: 'A', kind: 'verbindlich', items: [{ description: 'x', qty: 1, price: 10 }], status: 'angenommen', docType: 'invoice' });
const q2 = es.saveEstimate({ date: '2026-10-05', customer: 'B', kind: 'quatsch', status: 'hack', items: [] });
assert.deepStrictEqual([q1.number, q2.number], ['KV-05102601', 'KV-05102602']);
assert.strictEqual(q1.docType, 'estimate'); assert.strictEqual(q2.kind, 'unverbindlich'); assert.strictEqual(q2.status, 'offen');
assert.strictEqual(es.nextEstimateNumber('2026-10-06'), 'KV-06102601');
es.deleteEstimate(q2.id); assert.strictEqual(es.nextEstimateNumber('2026-10-05'), 'KV-05102602');
assert.strictEqual(es.saveEstimate({ ...q1, customer: 'A2' }).number, 'KV-05102601', 'Bearbeiten behält die Nummer');
assert.strictEqual(es.listEstimates('', 'angenommen').length, 1); assert.strictEqual(es.listEstimates('a2', 'offen').length, 0);
assert.strictEqual(Est.cleanEstimate({ id: '../x' }), null);
assert.deepStrictEqual(Est.cleanEstimate({ id: 'k1', clauses: [{ id: 'a b', text: 'x' }, { id: 'ok', text: 'y', extra: 1 }] }).clauses, [{ id: 'ok', text: 'y' }]);
assert.strictEqual(Est.addDays('2026-10-05', 30), '2026-11-04'); assert.strictEqual(Est.addDays('2026-12-15', 30), '2027-01-14'); assert.strictEqual(Est.addDays('x', 3), '');
const hv = Est.build({ number: 'KV-1', kind: 'unverbindlich', date: '2026-10-05', validUntil: '2026-11-04', customer: '<b>X</b>', items: [{ description: '<i>y</i>', qty: 1, price: 5 }], clauses: [{ id: 'z', text: '<script>1</script>' }] }, { companyName: 'F' });
assert(hv.includes('Unverbindlicher Kostenvoranschlag') && hv.includes('§ 1170a Abs. 2 ABGB') && hv.includes('gültig bis 04.11.2026') && !hv.includes('<script>1') && !hv.includes('<b>X</b>'));
assert(!Est.build({ kind: 'verbindlich', items: [] }, { companyName: 'F' }).includes('unverbindlich'), 'verbindlich ohne Unverbindlich-Text');
assert(!hv.includes('Zahlen mit Code'), 'kein EPC-QR beim Kostenvoranschlag');
assert.strictEqual(new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'kv-'))).getSettings().kvClauses.length, Est.DEFAULT_CLAUSES.length);
const ks = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'kv-')));
ks.saveSettings({ kvValidDays: 9999, kvClauses: [{ id: 'a', text: 'T', title: 'x' }, { id: '<bad>', text: 'weg' }, 'quatsch'] });
assert.strictEqual(ks.getSettings().kvValidDays, 365); assert.deepStrictEqual(ks.getSettings().kvClauses.map((c) => c.id), ['a']);
const BK = require('../src/backup');
const pbk = BK.parseBackup(BK.createBackup(es.getSettings(), [], new Date(), { estimates: es.allEstimates() }));
assert.strictEqual(pbk.estimates.length, 1); assert.strictEqual(pbk.settings.kvClauses.length, Est.DEFAULT_CLAUSES.length);
assert.strictEqual(BK.parseBackup(JSON.stringify({ app: 'rechnungen-backup', format: 1, invoices: [] })).estimates, null, 'alte Sicherung ohne Kostenvoranschläge');
assert.strictEqual(BK.parseBackup(JSON.stringify({ app: 'rechnungen-backup', format: 1, invoices: [], settings: { kvClauses: 'x', kvValidDays: -5 } })).settings.kvValidDays, 1);

// ---- Phase 1: Sperre, Storno-Felder, Rundung, Zähler ----
{
  const t = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'lock-')));
  const x = t.saveInvoice({ date: '2026-10-06', customer: 'A', items: [{ description: 'x', qty: 1, price: 5 }] });
  t.lockInvoice(x.id);
  assert(t.getInvoice(x.id).lockedAt, 'gesperrt');
  assert.throws(() => t.saveInvoice({ ...x, customer: 'B' }), /gesperrt/);
  assert.throws(() => t.deleteInvoice(x.id), /esperrt/);
  assert.strictEqual(t.getInvoice(x.id).customer, 'A');
  const forged = t.saveInvoice({ date: '2026-10-06', customer: 'C', lockedAt: '2020-01-01', items: [] });
  assert(!forged.lockedAt, 'lockedAt kommt nie von außen');
  const y = t.saveInvoice({ date: '2026-10-06', customer: 'D', items: [] });
  t.deleteInvoice(y.id); t.deleteInvoice(forged.id);
  assert.strictEqual(t.nextNumber('2026-10-06'), '06102604', 'Zähler sinkt nach dem Löschen nicht');
  const bk = BK.parseBackup(BK.createBackup(t.getSettings(), t.allInvoices()));
  assert(bk.invoices[0].lockedAt, 'Sperre bleibt in der Sicherung');
  const st = BK.parseBackup(BK.createBackup(t.getSettings(), [{ ...x, type: 'storno', stornoOf: x.id, stornoOfNumber: x.number }])).invoices[0];
  assert.strictEqual(st.type, 'storno'); assert.strictEqual(st.stornoOf, x.id);
  const r = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'lock-'))); r.replaceInvoices(bk.invoices);
  assert.strictEqual(r.nextNumber('2026-10-06'), '06102602', 'Zähler nach Wiederherstellung');
}
{
  const IH = require('../src/invoice-html');
  const t1 = IH.totals({ items: [{ qty: 1, price: 0.5 }], taxRate: 13 });
  assert.deepStrictEqual([t1.net, t1.tax, t1.total], [0.5, 0.07, 0.57], 'Rundung: Netto + Steuer = Gesamt');
  const t2 = IH.totals({ items: [{ qty: -2, price: 10 }], discount: -5, taxRate: 20 });
  assert.deepStrictEqual([t2.net, t2.tax, t2.total], [-15, -3, -18], 'Stornorechnung negativ');
  const html = IH.build({ number: '07102601', date: '2026-10-07', type: 'storno', stornoOfNumber: '06102601', stornoOfDate: '2026-10-06', customer: 'K', items: [{ description: 'x', qty: -1, price: 10 }], taxRate: 0, currency: '€' }, { companyName: 'F', footerExtra: 'FN 1a <b>', color: '#112233' });
  assert(html.includes('Stornorechnung') && html.includes('06102601') && html.includes('FN 1a &lt;b&gt;') && html.includes('Leistungsdatum:</b> 07.10.2026'), 'Storno-Titel, Verweis, Fußzeile, Leistungsdatum');
  assert(!/Zahlen mit Code/.test(html), 'kein QR bei negativem Betrag');
  assert.strictEqual(require('../src/store').localDate(new Date(2026, 9, 6, 0, 30)), '2026-10-06', 'lokales Datum');
}

console.log('Alle Tests bestanden');
