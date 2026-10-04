// CSV-Export (Semikolon-getrennt, Dezimalkomma, UTF-8 mit BOM: öffnet sich direkt in Excel).
const { totals } = require('./invoice-html');

const dec = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const fmtDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d.split('-').reverse().join('.') : d || '');
// Zellen, die mit = + - @ beginnen, würden in Excel als Formel ausgeführt: mit ' entschärfen
const cell = (v) => {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function toCsv(invoices) {
  const head = ['Rechnungsnummer', 'Rechnungsdatum', 'Leistungsdatum', 'Kunde', 'UID Kunde', 'Netto', 'USt-Satz %', 'USt', 'Brutto', 'Währung'];
  const rows = invoices.map((i) => {
    const t = totals(i);
    return [i.number, fmtDate(i.date), fmtDate(i.serviceDate), i.customer, i.customerUid, dec(t.net), String(Number(i.taxRate) || 0).replace('.', ','), dec(t.tax), dec(t.total), i.currency || '€'];
  });
  const sum = invoices.reduce((a, i) => { const t = totals(i); a.net += t.net; a.tax += t.tax; a.total += t.total; return a; }, { net: 0, tax: 0, total: 0 });
  rows.push(['Summe (' + invoices.length + ' Rechnungen)', '', '', '', '', dec(sum.net), '', dec(sum.tax), dec(sum.total), '']);
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}
module.exports = { toCsv, cell, dec, fmtDate };
