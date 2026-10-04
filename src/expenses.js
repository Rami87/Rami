// Ausgaben (Belege) für den Steuerberater: Berechnung der Vorsteuer, Summen, CSV und PDF-Zusammenfassung.
const { esc } = require('./invoice-html');
const { cell, dec, fmtDate } = require('./csv');

const TAX_RATES = [0, 10, 13, 20];
const CATEGORIES = ['Material / Waren', 'Werkzeug / Geräte', 'Büro / Software', 'Fahrzeug / Treibstoff', 'Telefon / Internet', 'Miete / Betriebskosten',
  'Versicherung', 'Reise / Bewirtung', 'Werbung / Marketing', 'Fremdleistungen', 'Sonstiges'];
const RECEIPT_EXTS = ['pdf', 'png', 'jpg', 'webp', 'gif'];
const MAX_RECEIPT = 25 * 1024 * 1024;

const str = (v, max) => String(v == null ? '' : v).slice(0, max);
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
const safeId = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v) ? v : '');

// Der Beleg enthält den Bruttobetrag und den Steuersatz: Vorsteuer = Brutto - Brutto / (1 + Satz)
function amounts(e) {
  const gross = r2(e && e.gross);
  const rate = TAX_RATES.includes(Number(e && e.taxRate)) ? Number(e.taxRate) : 0;
  const vat = r2(gross - gross / (1 + rate / 100));
  return { gross, rate, vat, net: r2(gross - vat) };
}

// Dateityp nach dem Inhalt (nicht nach dem Namen) bestimmen: nur PDF und Bilder sind erlaubt
function sniffExt(buf) {
  if (!buf || buf.length < 12) return '';
  if (buf.slice(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (/^GIF8[79]a/.test(buf.slice(0, 6).toString('latin1'))) return 'gif';
  return '';
}

// Gespeicherte/eingelesene Ausgabe bereinigen (kommt aus Dateien oder aus der Oberfläche)
function cleanExpense(e) {
  const id = safeId(e && e.id);
  if (!id) return null;
  const rc = e.receipt && typeof e.receipt === 'object' && RECEIPT_EXTS.includes(e.receipt.ext) ? { name: str(e.receipt.name, 120), ext: e.receipt.ext } : null;
  return {
    id, date: isDate(e.date) ? e.date : '', supplier: str(e.supplier, 200), description: str(e.description, 500),
    category: CATEGORIES.includes(e.category) ? e.category : 'Sonstiges', number: str(e.number, 60),
    gross: r2(e.gross), taxRate: TAX_RATES.includes(Number(e.taxRate)) ? Number(e.taxRate) : 0,
    receipt: rc, createdAt: str(e.createdAt, 40), updatedAt: str(e.updatedAt, 40),
  };
}

function summarize(list) {
  const out = { n: 0, gross: 0, net: 0, vat: 0, byRate: [], byCategory: [] };
  const rates = {}, cats = {};
  for (const e of list) {
    const a = amounts(e);
    out.n++; out.gross += a.gross; out.net += a.net; out.vat += a.vat;
    const r = (rates[a.rate] = rates[a.rate] || { rate: a.rate, n: 0, net: 0, vat: 0, gross: 0 });
    r.n++; r.net += a.net; r.vat += a.vat; r.gross += a.gross;
    const c = (cats[e.category] = cats[e.category] || { category: e.category, n: 0, vat: 0, gross: 0 });
    c.n++; c.vat += a.vat; c.gross += a.gross;
  }
  for (const k of ['gross', 'net', 'vat']) out[k] = r2(out[k]);
  out.byRate = Object.values(rates).sort((a, b) => b.rate - a.rate).map((r) => ({ ...r, net: r2(r.net), vat: r2(r.vat), gross: r2(r.gross) }));
  out.byCategory = Object.values(cats).sort((a, b) => b.gross - a.gross).map((c) => ({ ...c, vat: r2(c.vat), gross: r2(c.gross) }));
  return out;
}

// Für den Export: nach Datum aufsteigend, die laufende Nummer verbindet CSV, PDF und Belegdatei
const forExport = (list) => [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)));
const nr = (i) => String(i + 1).padStart(3, '0');
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'Beleg';
function receiptFileName(e, i) { return e.receipt ? `${nr(i)}_${slug(e.supplier)}_${e.date || 'ohne-Datum'}.${e.receipt.ext}` : ''; }

function toCsv(list) {
  const rows = forExport(list);
  const head = ['Nr.', 'Belegdatum', 'Lieferant', 'Beschreibung', 'Kategorie', 'Belegnummer', 'Netto', 'USt-Satz %', 'Vorsteuer (USt)', 'Brutto', 'Beleg-Datei'];
  const body = rows.map((e, i) => { const a = amounts(e); return [nr(i), fmtDate(e.date), e.supplier, e.description, e.category, e.number, dec(a.net), String(a.rate), dec(a.vat), dec(a.gross), receiptFileName(e, i)]; });
  const s = summarize(rows);
  body.push(['', 'Summe (' + s.n + ' Belege)', '', '', '', '', dec(s.net), '', dec(s.vat), dec(s.gross), '']);
  return '﻿' + [head, ...body].map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

function summaryHtml(list, settings, title) {
  const rows = forExport(list);
  const s = summarize(rows);
  const m = (n) => esc(dec(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + ' €';
  const color = /^#[0-9a-fA-F]{6}$/.test(settings.color || '') ? settings.color : '#1f6feb';
  const tr = rows.map((e, i) => { const a = amounts(e); return `<tr><td>${nr(i)}</td><td>${esc(fmtDate(e.date))}</td><td>${esc(e.supplier)}${e.description ? `<br><small>${esc(e.description)}</small>` : ''}</td><td>${esc(e.category)}</td><td class="r">${m(a.net)}</td><td class="r">${a.rate} %</td><td class="r">${m(a.vat)}</td><td class="r">${m(a.gross)}</td><td>${e.receipt ? 'ja' : '–'}</td></tr>`; }).join('');
  const byRate = s.byRate.map((r) => `<tr><td>${r.rate} %</td><td class="r">${r.n}</td><td class="r">${m(r.net)}</td><td class="r">${m(r.vat)}</td><td class="r">${m(r.gross)}</td></tr>`).join('');
  const byCat = s.byCategory.map((c) => `<tr><td>${esc(c.category)}</td><td class="r">${c.n}</td><td class="r">${m(c.vat)}</td><td class="r">${m(c.gross)}</td></tr>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Ausgaben ${esc(title)}</title><style>
@page { size: A4 landscape; margin: 12mm; } * { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #222; font-size: 11px; margin: 0; }
h1 { font-size: 20px; margin: 0 0 2px; color: ${color}; } h2 { font-size: 13px; margin: 18px 0 6px; color: ${color}; }
.sub { color: #555; margin-bottom: 12px; } table { width: 100%; border-collapse: collapse; }
th { text-align: left; background: ${color}; color: #fff; padding: 5px 6px; } td { padding: 4px 6px; border-bottom: 1px solid #ddd; vertical-align: top; }
.r { text-align: right; white-space: nowrap; } small { color: #666; } tr { page-break-inside: avoid; }
.tot td { font-weight: 700; border-top: 2px solid #222; } .half { display: flex; gap: 24px; } .half > div { flex: 1; }
</style></head><body>
<h1>Ausgaben ${esc(title)}</h1><div class="sub">${esc(settings.companyName || '')} · ${s.n} Belege · Vorsteuer gesamt <b>${m(s.vat)}</b></div>
<table><thead><tr><th>Nr.</th><th>Datum</th><th>Lieferant / Beschreibung</th><th>Kategorie</th><th class="r">Netto</th><th class="r">USt</th><th class="r">Vorsteuer</th><th class="r">Brutto</th><th>Beleg</th></tr></thead><tbody>${tr}
<tr class="tot"><td colspan="4">Summe</td><td class="r">${m(s.net)}</td><td></td><td class="r">${m(s.vat)}</td><td class="r">${m(s.gross)}</td><td></td></tr></tbody></table>
<div class="half"><div><h2>Vorsteuer nach Steuersatz</h2><table><thead><tr><th>Satz</th><th class="r">Belege</th><th class="r">Netto</th><th class="r">Vorsteuer</th><th class="r">Brutto</th></tr></thead><tbody>${byRate}</tbody></table></div>
<div><h2>Nach Kategorie</h2><table><thead><tr><th>Kategorie</th><th class="r">Belege</th><th class="r">Vorsteuer</th><th class="r">Brutto</th></tr></thead><tbody>${byCat}</tbody></table></div></div>
</body></html>`;
}

module.exports = { TAX_RATES, CATEGORIES, RECEIPT_EXTS, MAX_RECEIPT, amounts, sniffExt, cleanExpense, summarize, forExport, receiptFileName, toCsv, summaryHtml, safeId };
