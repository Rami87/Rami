const $ = (s) => document.querySelector(s);
const eur = (n, cur) => (Math.round(n * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (cur || '');
const SWATCHES = ['#1f6feb', '#0b7a4b', '#16a34a', '#d1242f', '#e36209', '#8250df', '#24292f', '#0e7490'];
let settings = {};
let currentId = null;
let suggested = ''; // vorgeschlagene Rechnungsnummer (TTMMJJ01 ...)


// ---- Toast ----
let toastTimer;
function toast(text, isErr) {
  const t = $('#toast'); t.textContent = text; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), isErr ? 6000 : 4000);
}

// ---- Markenfarbe: die Oberfläche übernimmt die Firmenfarbe ----
function onBrand(hex) {
  const n = parseInt(hex.slice(1), 16), lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.4 ? '#17221c' : '#ffffff';
}
function applyBrand(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return;
  document.documentElement.style.setProperty('--brand', hex);
  document.documentElement.style.setProperty('--on-brand', onBrand(hex));
  renderLetterhead();
}
function renderRail() {
  $('#railName').textContent = settings.companyName || 'Rechnungen';
  const m = $('#railMark');
  m.innerHTML = '';
  if (/^data:image\//.test(settings.logo || '')) { const i = document.createElement('img'); i.src = settings.logo; i.alt = ''; m.appendChild(i); }
  else m.textContent = (settings.companyName || 'R').trim().charAt(0).toUpperCase() || 'R';
}

// ---- Vorschau passend skalieren (A4 = 794 px Breite) ----
function fitPreview() {
  [['#sheetwrap', '#preview'], ['#kvSheetwrap', '#kvPreview']].forEach(([wrap, frame]) => {
    const w = $(wrap).clientWidth;
    if (w) $(frame).style.transform = 'scale(' + w / 794 + ')';
  });
}
new ResizeObserver(fitPreview).observe($('#sheetwrap'));
new ResizeObserver(fitPreview).observe($('#kvSheetwrap'));

// ---- Navigation ----
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
function show(v) {
  applyBrand(settings.color); // ungespeicherte Farbänderung verwerfen
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  ['new', 'archive', 'kv', 'kvlist', 'expenses', 'backup', 'settings'].forEach((n) => ($('#view-' + n).hidden = n !== v));
  if (v === 'backup') loadBackup();
  if (v === 'archive') loadList();
  if (v === 'expenses') { fillExpenseForm(null); loadExpenses(); }
  if (v === 'settings') fillSettings();
  if (v === 'new') { fillCatalogList(); refreshPreview(); fitPreview(); }
  if (v === 'kv') { fillCatalogList(); if (!kvInit) { kvInit = true; fillKv({}); } refreshKv(); fitPreview(); }
  if (v === 'kvlist') loadKvList();
}

document.addEventListener('click', (e) => { const g = e.target.closest('[data-goto]'); if (g) show(g.dataset.goto); });

function fillTaxSelect(sel, value) {
  sel.innerHTML = '';
  InvoiceHtml.TAX_RATES.forEach((r) => {
    const o = document.createElement('option'); o.value = r; o.textContent = r + ' %'; sel.appendChild(o);
  });
  sel.value = String(value);
}
function fillCatalogList() {
  const dl = $('#catalogList'); dl.innerHTML = '';
  (settings.catalog || []).forEach((c) => { const o = document.createElement('option'); o.value = c.description; dl.appendChild(o); });
}

// ---- Rechnung ----
const today = () => new Date().toISOString().slice(0, 10);
function addItem(it = { description: '', qty: 1, price: 0 }) {
  const d = document.createElement('div');
  d.className = 'item';
  d.innerHTML = '<input class="desc" list="catalogList" placeholder="Bezeichnung" aria-label="Bezeichnung"><input class="qty" type="number" step="any" aria-label="Menge"><input class="price" type="number" min="0" step="any" aria-label="Preis netto"><span class="amt">0,00</span><button type="button" class="danger icon" title="Position entfernen" aria-label="Position entfernen"><svg><use href="#i-x"/></svg></button>';
  d.querySelector('.desc').value = it.description;
  d.querySelector('.qty').value = it.qty;
  d.querySelector('.price').value = it.price;
  d.querySelector('.desc').addEventListener('change', (e) => {
    const c = (settings.catalog || []).find((x) => x.description === e.target.value);
    if (c) { d.querySelector('.price').value = c.price; refreshPreview(); }
  });
  d.querySelector('button').onclick = () => { d.remove(); refreshPreview(); };
  $('#items').appendChild(d);
}
async function updateSuggested() {
  const f = $('#form').elements;
  suggested = await api.nextNumber(f.date.value);
  f.number.placeholder = suggested + ' (automatisch)';
  if (!currentId) refreshPreview();
}
let invExtra = {}; // type / stornoOf... einer Stornorechnung
function readInvoice() {
  const f = $('#form').elements;
  return {
    ...invExtra,
    id: currentId || undefined, number: f.number.value.trim(), date: f.date.value, serviceDate: f.serviceDate.value,
    customer: f.customer.value.trim(), customerAddress: f.customerAddress.value.trim(), customerUid: f.customerUid.value.trim(),
    discount: +f.discount.value || 0, taxRate: +f.taxRate.value || 0, taxNote: f.taxNote.value.trim(),
    notes: f.notes.value.trim(), currency: settings.currency,
    items: [...document.querySelectorAll('.item:not(.head)')].map((d) => ({
      description: d.querySelector('.desc').value.trim(), qty: +d.querySelector('.qty').value || 0, price: +d.querySelector('.price').value || 0,
    })).filter((i) => i.description || i.price),
  };
}
function fillForm(inv) {
  const f = $('#form').elements;
  currentId = inv.id || null;
  invExtra = inv.type === 'storno' ? { type: 'storno', stornoOf: inv.stornoOf, stornoOfNumber: inv.stornoOfNumber, stornoOfDate: inv.stornoOfDate } : {};
  $('#formTitle').textContent = inv.id ? (inv.type === 'storno' ? 'Stornorechnung ' : 'Rechnung ') + inv.number : inv.type === 'storno' ? 'Neue Stornorechnung' : 'Neue Rechnung';
  const isNew = !inv.id;
  const rate = inv.taxRate != null ? inv.taxRate : (settings.taxRate || 0);
  fillTaxSelect(f.taxRate, rate);
  f.number.value = inv.number || ''; f.date.value = inv.date || today(); f.serviceDate.value = inv.serviceDate || '';
  f.customer.value = inv.customer || ''; f.customerAddress.value = inv.customerAddress || ''; f.customerUid.value = inv.customerUid || '';
  f.discount.value = inv.discount || 0; f.notes.value = inv.notes || '';
  f.taxNote.value = isNew ? (inv.taxNote != null ? inv.taxNote : rate === 0 ? settings.taxNote || '' : '') : (inv.taxNote || '');
  $('#items').innerHTML = '';
  (inv.items && inv.items.length ? inv.items : [undefined]).forEach((i) => addItem(i));
  fillCatalogList();
  refreshPreview();
  updateSuggested();
}
function refreshPreview() {
  const inv = readInvoice();
  if (!inv.number && !inv.id) inv.number = suggested;
  document.querySelectorAll('.item:not(.head)').forEach((d) => { d.querySelector('.amt').textContent = eur((+d.querySelector('.qty').value || 0) * (+d.querySelector('.price').value || 0), ''); });
  $('#total').textContent = eur(InvoiceHtml.totals(inv).total, settings.currency);
  $('#preview').srcdoc = InvoiceHtml.build(inv, settings);
}
$('#form').addEventListener('input', refreshPreview);
$('#form').elements.date.addEventListener('change', updateSuggested);
// Steuerhinweis automatisch anpassen: bei 0 % der Standardhinweis, sonst leer
$('#form').elements.taxRate.addEventListener('change', (e) => {
  const note = $('#form').elements.taxNote;
  if (+e.target.value === 0) { if (!note.value.trim()) note.value = settings.taxNote || ''; }
  else if (note.value.trim() === (settings.taxNote || '').trim()) note.value = '';
  refreshPreview();
});
$('#addItem').onclick = () => addItem();
$('#reset').onclick = () => { if (confirm('Wirklich neu beginnen?\n\nAlle Eingaben dieser Rechnung gehen verloren.')) fillForm({}); };
// Hinweise nach dem Speichern (verhindern nichts): Pflichtangaben nach § 11 UStG
function invoiceWarnings(inv) {
  const gross = Math.abs(InvoiceHtml.totals(inv).total), w = [];
  if (gross > 400 && !inv.customerAddress) w.push('Über 400 €: Die Anschrift des Kunden ist Pflicht (§ 11 UStG).');
  if (gross > 10000 && !inv.customerUid) w.push('Über 10.000 €: Die UID-Nr. des Kunden ist Pflicht (§ 11 UStG).');
  return w;
}
async function save() {
  const inv = readInvoice();
  if (!inv.customer || !inv.items.length) { toast('Bitte Kunde und mindestens eine Position eingeben.', true); return null; }
  let saved;
  try { saved = await api.saveInvoice(inv); } catch (err) { toast(String(err.message || err).replace(/^Error invoking remote method '[^']*': (Error: )?/, ''), true); return null; }
  currentId = saved.id; $('#form').elements.number.value = saved.number;
  settings = await api.getSettings();
  $('#formTitle').textContent = (saved.type === 'storno' ? 'Stornorechnung ' : 'Rechnung ') + saved.number;
  const w = invoiceWarnings(saved);
  toast('Gespeichert: ' + (saved.type === 'storno' ? 'Stornorechnung ' : 'Rechnung ') + saved.number + (w.length ? ' – Achtung: ' + w.join(' ') : ''), w.length > 0);
  return saved;
}
// PDF und Druck sperren die Rechnung: vorher einmal bestätigen lassen
const confirmLock = () => confirm('Nach dem Speichern als PDF oder Drucken ist die Rechnung gesperrt.\n\nÄnderungen sind danach nur noch mit einer Stornorechnung möglich, und die Rechnung kann nicht mehr gelöscht werden.\n\nFortfahren?');
$('#form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
$('#savePdf').onclick = async () => {
  const cur = readInvoice();
  if (!currentId && !cur.customer) { toast('Bitte Kunde und mindestens eine Position eingeben.', true); return; }
  if (!confirmLock()) return;
  const saved = await save(); if (!saved) return;
  const r = await api.exportPdf(saved);
  if (r.ok) toast('PDF gespeichert: ' + r.filePath);
};
$('#previewBtn').onclick = () => api.previewInvoice(readInvoice());
$('#printBtn').onclick = async () => {
  if (!confirmLock()) return;
  const saved = await save(); if (!saved) return; // gedruckte Rechnungen landen immer im Archiv
  const r = await api.printInvoice(saved);
  if (r && r.ok === false && r.reason && r.reason !== 'cancelled') toast('Drucken nicht möglich: ' + r.reason, true);
};

// ---- Archiv: Zeitraum (Tag / Monat / Jahr / Alle) mit Summen ----
let timer;
let mode = 'month';
const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const deDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('.') : iso || '');
const monthName = (m) => new Date(2000, m - 1, 1).toLocaleString('de-DE', { month: 'long' });
const period = { day: todayStr(), month: todayStr().slice(0, 7), year: todayStr().slice(0, 4) };
const prefix = () => (mode === 'all' ? '' : period[mode]);
const sum = (list) => list.reduce((a, inv) => { const t = InvoiceHtml.totals(inv); a.n++; a.net += t.net; a.tax += t.tax; a.total += t.total; return a; }, { n: 0, net: 0, tax: 0, total: 0 });
function periodLabel() {
  if (mode === 'all') return 'Alle Rechnungen';
  if (mode === 'year') return 'Jahr ' + period.year;
  if (mode === 'month') return monthName(+period.month.slice(5)) + ' ' + period.month.slice(0, 4);
  return deDate(period.day);
}
function shiftPeriod(dir) {
  if (mode === 'day') { const d = new Date(period.day + 'T12:00:00'); d.setDate(d.getDate() + dir); period.day = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  else if (mode === 'month') { const [y, m] = period.month.split('-').map(Number); const d = new Date(y, m - 1 + dir, 1); period.month = d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  else if (mode === 'year') period.year = String(+period.year + dir);
  loadList();
}
function setMode(m) { mode = m; loadList(); }
document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('#prevPeriod').onclick = () => shiftPeriod(-1);
$('#nextPeriod').onclick = () => shiftPeriod(1);
$('#todayBtn').onclick = () => { const t = todayStr(); Object.assign(period, { day: t, month: t.slice(0, 7), year: t.slice(0, 4) }); loadList(); };
$('#pDay').addEventListener('change', (e) => { if (e.target.value) { period.day = e.target.value; loadList(); } });
$('#pMonth').addEventListener('change', (e) => { if (e.target.value) { period.month = e.target.value; loadList(); } });
$('#pYear').addEventListener('change', (e) => { period.year = e.target.value; loadList(); });
$('#search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadList, 200); });
$('#exportCsv').onclick = async () => {
  const r = await api.exportCsv($('#search').value, prefix());
  if (r.ok) toast(r.count + ' Rechnungen als CSV exportiert: ' + r.filePath);
};

function renderKpis(t) {
  const c = settings.currency;
  const box = $('#kpis'); box.innerHTML = '';
  [['Rechnungen', String(t.n), '', false], ['Netto', eur(t.net, c), '', false], ['Umsatzsteuer', eur(t.tax, c), '', false], ['Gesamt (brutto)', eur(t.total, c), '', true]].forEach(([l, v, , main]) => {
    const d = document.createElement('div'); d.className = 'kpi' + (main ? ' main' : '');
    const a = document.createElement('span'); a.className = 'kl'; a.textContent = l;
    const b = document.createElement('span'); b.className = 'kv'; b.textContent = v;
    d.append(a, b); box.appendChild(d);
  });
}
// Aufschlüsselung: Alle -> Jahre, Jahr -> Monate, Monat -> Tage (Klick wechselt in den Zeitraum)
function renderBreakdown(inPeriod) {
  const box = $('#breakdown'); box.innerHTML = '';
  if (mode === 'day') return;
  const keyLen = mode === 'all' ? 4 : mode === 'year' ? 7 : 10;
  const groups = {};
  inPeriod.forEach((inv) => { const k = String(inv.date || '').slice(0, keyLen) || '—'; (groups[k] = groups[k] || []).push(inv); });
  const keys = Object.keys(groups).sort().reverse();
  const totals = keys.map((k) => sum(groups[k]));
  const max = Math.max(1, ...totals.map((t) => t.total));
  keys.forEach((k, i) => {
    const t = totals[i];
    const el = document.createElement('button'); el.type = 'button'; el.className = 'yrow';
    el.innerHTML = '<span class="y"></span><span class="bar" aria-hidden="true"><i></i></span><span class="n"></span><span class="amt"></span>';
    el.querySelector('.y').textContent = mode === 'all' ? k : mode === 'year' ? monthName(+k.slice(5)) : deDate(k).slice(0, 6);
    el.querySelector('.y').style.fontSize = mode === 'all' ? '' : '17px';
    el.querySelector('i').style.width = Math.max(2, (t.total / max) * 100) + '%';
    el.querySelector('.n').textContent = t.n + (t.n === 1 ? ' Rechnung' : ' Rechnungen');
    const amt = el.querySelector('.amt'); amt.append(eur(t.total, settings.currency));
    const sm = document.createElement('small'); sm.textContent = 'netto ' + eur(t.net, settings.currency) + ' · USt. ' + eur(t.tax, settings.currency); amt.appendChild(sm);
    el.onclick = () => {
      if (k === '—') return;
      if (mode === 'all') { period.year = k; mode = 'year'; } else if (mode === 'year') { period.month = k; mode = 'month'; } else { period.day = k; mode = 'day'; }
      loadList();
    };
    box.appendChild(el);
  });
}

async function loadList() {
  const all = await api.listInvoices('', '');
  // Auswahlfelder
  const years = [...new Set(all.map((i) => String(i.date || '').slice(0, 4)).filter(Boolean).concat(todayStr().slice(0, 4), period.year))].sort().reverse();
  $('#pYear').innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  $('#pYear').value = period.year; $('#pMonth').value = period.month; $('#pDay').value = period.day;
  document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $('#pDay').hidden = mode !== 'day'; $('#pMonth').hidden = mode !== 'month'; $('#pYear').hidden = mode !== 'year';
  $('#pickers').hidden = mode === 'all';
  $('#periodTitle').textContent = periodLabel();

  const p = prefix();
  const inPeriod = p ? all.filter((i) => String(i.date || '').startsWith(p)) : all;
  renderKpis(sum(inPeriod));
  renderBreakdown(inPeriod);

  const list = await api.listInvoices($('#search').value, p);
  const tb = $('#list tbody'); tb.innerHTML = '';
  $('#empty').hidden = list.length > 0;
  for (const inv of list) {
    const tr = document.createElement('tr');
    [inv.number + (inv.type === 'storno' ? ' (Storno)' : '') + (inv.lockedAt ? ' 🔒' : ''), deDate(inv.date), inv.customer, eur(InvoiceHtml.totals(inv).total, inv.currency)].forEach((c, i) => {
      const td = document.createElement('td'); td.textContent = c; if (i === 0) td.className = 'num'; if (i === 3) td.className = 'r'; tr.appendChild(td);
    });
    const td = document.createElement('td'); td.className = 'act';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.onclick = fn; td.appendChild(b); };
    const locked = !!inv.lockedAt;
    if (!locked) mk('Öffnen', 'ghost', () => { show('new'); fillForm(inv); });
    mk('Vorschau', 'ghost', () => api.previewInvoice(inv));
    mk('PDF', 'secondary', async () => { const r = await api.exportPdf(inv); if (r.ok) { toast('PDF gespeichert: ' + r.filePath); loadList(); } });
    if (locked && inv.type !== 'storno') {
      mk('Stornieren', 'danger', () => {
        if (!confirm('Zu Rechnung ' + inv.number + ' eine Stornorechnung (Gutschrift über den vollen Betrag) anlegen?\n\nSie bekommt eine neue Nummer und verweist auf die Originalrechnung.')) return;
        const t = todayStr();
        show('new');
        fillForm({ type: 'storno', stornoOf: inv.id, stornoOfNumber: inv.number, stornoOfDate: inv.date, date: t, serviceDate: inv.serviceDate || inv.date,
          customer: inv.customer, customerAddress: inv.customerAddress, customerUid: inv.customerUid, taxRate: inv.taxRate, taxNote: inv.taxNote,
          discount: -(Number(inv.discount) || 0), items: (inv.items || []).map((i) => ({ ...i, qty: -(Number(i.qty) || 0) })),
          notes: 'Storno zu Rechnung ' + inv.number + ' vom ' + deDate(inv.date) + '.' });
      });
    }
    if (!locked) mk('Löschen', 'danger', async () => {
      if (!confirm('Rechnung ' + inv.number + ' wirklich löschen?')) return;
      const r = await api.deleteInvoice(inv.id);
      if (r && r.ok === false) { toast(r.error, true); return; }
      toast('Rechnung ' + inv.number + ' gelöscht.'); loadList();
    });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

// ---- Kostenvoranschlag ----
let kvInit = false, kvId = null, kvSuggested = '', kvStatus = 'offen', kvSnap = {}, kvShown = new Set();
const kf = () => $('#kvForm').elements;
function kvAddItem(it = { description: '', qty: 1, price: 0 }) {
  const d = document.createElement('div');
  d.className = 'item';
  d.innerHTML = '<input class="desc" list="catalogList" placeholder="Bezeichnung" aria-label="Bezeichnung"><input class="qty" type="number" min="0" step="any" aria-label="Menge"><input class="price" type="number" min="0" step="any" aria-label="Preis netto"><span class="amt">0,00</span><button type="button" class="danger icon" title="Position entfernen" aria-label="Position entfernen"><svg><use href="#i-x"/></svg></button>';
  d.querySelector('.desc').value = it.description;
  d.querySelector('.qty').value = it.qty;
  d.querySelector('.price').value = it.price;
  d.querySelector('.desc').addEventListener('change', (e) => {
    const c = (settings.catalog || []).find((x) => x.description === e.target.value);
    if (c) { d.querySelector('.price').value = c.price; refreshKv(); }
  });
  d.querySelector('button').onclick = () => { d.remove(); refreshKv(); };
  $('#kvItems').appendChild(d);
}
// Textbausteine als Haken-Liste; passend zur Art (unverbindlich / verbindlich)
function renderClauses(selected) {
  const kind = kf().kind.value;
  const prevChecked = new Set([...document.querySelectorAll('#kvClauses input:checked')].map((i) => i.dataset.id));
  const list = (settings.kvClauses || []).filter((c) => c.for === 'beide' || c.for === kind).map((c) => ({ id: c.id, title: c.title, text: kvSnap[c.id] || c.text, on: c.on }));
  Object.keys(kvSnap).forEach((id) => { if (!list.some((c) => c.id === id) && !(settings.kvClauses || []).some((c) => c.id === id)) list.push({ id, title: 'Gespeicherter Text', text: kvSnap[id], on: true }); });
  const box = $('#kvClauses'); box.innerHTML = '';
  const nowShown = new Set();
  list.forEach((c) => {
    nowShown.add(c.id);
    const on = selected ? selected.has(c.id) : kvShown.has(c.id) ? prevChecked.has(c.id) : c.on;
    const l = document.createElement('label'); l.className = 'clause';
    const i = document.createElement('input'); i.type = 'checkbox'; i.dataset.id = c.id; i.dataset.text = c.text; i.checked = on;
    const d = document.createElement('span'); const b = document.createElement('b'); b.textContent = c.title || 'Textbaustein';
    const sm = document.createElement('small'); sm.textContent = c.text; d.append(b, sm); l.append(i, d); box.appendChild(l);
  });
  kvShown = nowShown;
}
function readEstimate() {
  const f = kf();
  return {
    docType: 'estimate', id: kvId || undefined, number: f.number.value.trim(), date: f.date.value, validUntil: f.validUntil.value, inspectionDate: f.inspectionDate.value,
    subject: f.subject.value.trim(), kind: f.kind.value, status: kvStatus,
    customer: f.customer.value.trim(), customerAddress: f.customerAddress.value.trim(), customerUid: f.customerUid.value.trim(),
    discount: +f.discount.value || 0, taxRate: +f.taxRate.value || 0, taxNote: f.taxNote.value.trim(), notes: f.notes.value.trim(), currency: settings.currency,
    fee: +f.fee.value || 0, creditFee: f.creditFee.checked,
    clauses: [...document.querySelectorAll('#kvClauses input:checked')].map((i) => ({ id: i.dataset.id, text: i.dataset.text })),
    items: [...document.querySelectorAll('#kvItems .item')].map((d) => ({
      description: d.querySelector('.desc').value.trim(), qty: +d.querySelector('.qty').value || 0, price: +d.querySelector('.price').value || 0,
    })).filter((i) => i.description || i.price),
  };
}
async function updateKvSuggested() {
  const f = kf();
  kvSuggested = await api.nextEstimateNumber(f.date.value);
  f.number.placeholder = kvSuggested + ' (automatisch)';
  if (!kvId) refreshKv();
}
function fillKv(e) {
  const f = kf();
  kvId = e.id || null; kvStatus = e.status || 'offen';
  $('#kvTitle').textContent = e.id ? 'Kostenvoranschlag ' + e.number : 'Neuer Kostenvoranschlag';
  const rate = e.taxRate != null ? e.taxRate : (settings.taxRate || 0);
  fillTaxSelect(f.taxRate, rate);
  f.kind.value = e.kind || 'unverbindlich';
  f.number.value = e.number || ''; f.date.value = e.date || today();
  f.validUntil.value = e.validUntil || (e.id ? '' : EstimateHtml.addDays(f.date.value, settings.kvValidDays || 30));
  f.inspectionDate.value = e.inspectionDate || ''; f.subject.value = e.subject || '';
  f.customer.value = e.customer || ''; f.customerAddress.value = e.customerAddress || ''; f.customerUid.value = e.customerUid || '';
  f.discount.value = e.discount || 0; f.notes.value = e.notes || '';
  f.taxNote.value = e.id ? (e.taxNote || '') : (rate === 0 ? settings.taxNote || '' : '');
  f.fee.value = e.fee || 0; f.creditFee.checked = e.creditFee !== false;
  kvSnap = {}; (e.clauses || []).forEach((c) => { kvSnap[c.id] = c.text; });
  kvShown = new Set();
  renderClauses(e.id ? new Set((e.clauses || []).map((c) => c.id)) : null);
  $('#kvItems').innerHTML = '';
  (e.items && e.items.length ? e.items : [undefined]).forEach((i) => kvAddItem(i));
  refreshKv();
  updateKvSuggested();
}
function refreshKv() {
  const e = readEstimate();
  if (!e.number && !e.id) e.number = kvSuggested;
  document.querySelectorAll('#kvItems .item').forEach((d) => { d.querySelector('.amt').textContent = eur((+d.querySelector('.qty').value || 0) * (+d.querySelector('.price').value || 0), ''); });
  $('#kvTotal').textContent = eur(InvoiceHtml.totals(e).total, settings.currency);
  $('#kvPreview').srcdoc = EstimateHtml.build(e, settings);
}
$('#kvForm').addEventListener('input', refreshKv);
$('#kvForm').addEventListener('change', (e) => {
  if (e.target.name === 'kind') { renderClauses(null); refreshKv(); }
  if (e.target.name === 'date') { if (!kvId) kf().validUntil.value = EstimateHtml.addDays(e.target.value, settings.kvValidDays || 30); updateKvSuggested(); refreshKv(); }
  if (e.target.name === 'taxRate') {
    const note = kf().taxNote;
    if (+e.target.value === 0) { if (!note.value.trim()) note.value = settings.taxNote || ''; }
    else if (note.value.trim() === (settings.taxNote || '').trim()) note.value = '';
    refreshKv();
  }
});
$('#kvAddItem').onclick = () => kvAddItem();
$('#kvReset').onclick = () => { if (confirm('Wirklich neu beginnen?\n\nAlle Eingaben dieses Kostenvoranschlags gehen verloren.')) fillKv({}); };
async function saveKv() {
  const e = readEstimate();
  if (!e.customer || !e.items.length) { toast('Bitte Kunde und mindestens eine Position eingeben.', true); return null; }
  const saved = await api.saveEstimate(e);
  kvId = saved.id; kf().number.value = saved.number;
  $('#kvTitle').textContent = 'Kostenvoranschlag ' + saved.number; toast('Gespeichert: Kostenvoranschlag ' + saved.number);
  return saved;
}
$('#kvForm').addEventListener('submit', (e) => { e.preventDefault(); saveKv(); });
$('#kvSavePdf').onclick = async () => {
  const saved = await saveKv(); if (!saved) return;
  const r = await api.exportPdf(saved);
  if (r.ok) toast('PDF gespeichert: ' + r.filePath);
};
$('#kvPreviewBtn').onclick = () => api.previewInvoice(readEstimate());
$('#kvPrintBtn').onclick = async () => {
  const saved = await saveKv(); if (!saved) return;
  const r = await api.printInvoice(saved);
  if (r && r.ok === false && r.reason && r.reason !== 'cancelled') toast('Drucken nicht möglich: ' + r.reason, true);
};

// ---- KV-Archiv ----
let kvFilter = '', kvTimer;
document.querySelectorAll('[data-kvstatus]').forEach((b) => b.addEventListener('click', () => { kvFilter = b.dataset.kvstatus; loadKvList(); }));
$('#kvSearch').addEventListener('input', () => { clearTimeout(kvTimer); kvTimer = setTimeout(loadKvList, 200); });
// Angenommenen Kostenvoranschlag als neue Rechnung öffnen (Entgelt wird, falls vereinbart, als Rabatt angerechnet)
async function estimateToInvoice(est) {
  const credit = Number(est.fee) > 0 && est.creditFee !== false ? Number(est.fee) : 0;
  show('new');
  fillForm({
    customer: est.customer, customerAddress: est.customerAddress, customerUid: est.customerUid, items: est.items, taxRate: est.taxRate, taxNote: est.taxNote,
    discount: (Number(est.discount) || 0) + credit,
    notes: 'Gemäß Kostenvoranschlag ' + est.number + ' vom ' + deDate(est.date) + '.' + (credit ? ' Das Entgelt für den Kostenvoranschlag wurde angerechnet.' : ''),
  });
  if (est.status !== 'angenommen') await api.saveEstimate({ ...est, status: 'angenommen' });
  toast('Rechnung aus Kostenvoranschlag ' + est.number + ' vorbereitet. Bitte prüfen und speichern.');
}
async function loadKvList() {
  document.querySelectorAll('[data-kvstatus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kvstatus === kvFilter)));
  const list = await api.listEstimates($('#kvSearch').value, kvFilter);
  const tb = $('#kvList tbody'); tb.innerHTML = '';
  $('#kvEmpty').hidden = list.length > 0;
  for (const est of list) {
    const tr = document.createElement('tr');
    [est.number, deDate(est.date), est.customer, est.kind === 'verbindlich' ? 'Verbindlich' : 'Unverbindlich', eur(InvoiceHtml.totals(est).total, est.currency)].forEach((c, i) => {
      const td = document.createElement('td'); td.textContent = c; if (i === 0) td.className = 'num'; if (i === 4) td.className = 'r'; tr.appendChild(td);
    });
    const st = document.createElement('td');
    const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Status');
    EstimateHtml.STATUSES.forEach((v) => { const o = document.createElement('option'); o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1); sel.appendChild(o); });
    sel.value = est.status;
    sel.onchange = async () => { await api.saveEstimate({ ...est, status: sel.value }); loadKvList(); };
    st.appendChild(sel);
    if (est.status === 'offen' && est.validUntil && est.validUntil < todayStr()) { const b = document.createElement('span'); b.className = 'badge abgelaufen'; b.textContent = 'abgelaufen'; st.appendChild(b); }
    tr.appendChild(st);
    const td = document.createElement('td'); td.className = 'act';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.onclick = fn; td.appendChild(b); };
    mk('Öffnen', 'ghost', () => { show('kv'); fillKv(est); });
    mk('Vorschau', 'ghost', () => api.previewInvoice(est));
    mk('PDF', 'secondary', async () => { const r = await api.exportPdf(est); if (r.ok) toast('PDF gespeichert: ' + r.filePath); });
    mk('In Rechnung', 'secondary', () => estimateToInvoice(est));
    mk('Löschen', 'danger', async () => { if (confirm('Kostenvoranschlag ' + est.number + ' wirklich löschen?')) { await api.deleteEstimate(est.id); toast('Kostenvoranschlag ' + est.number + ' gelöscht.'); loadKvList(); } });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

// ---- Ausgaben (Belege für den Steuerberater) ----
const EXPENSE_CATEGORIES = ['Material / Waren', 'Werkzeug / Geräte', 'Büro / Software', 'Fahrzeug / Treibstoff', 'Telefon / Internet', 'Miete / Betriebskosten',
  'Versicherung', 'Reise / Bewirtung', 'Werbung / Marketing', 'Fremdleistungen', 'Sonstiges'];
const xs = { mode: 'month', month: todayStr().slice(0, 7), year: todayStr().slice(0, 4), editing: null, hasReceipt: false, newReceipt: false, removeReceipt: false };
const xf = () => $('#xform').elements;
const xPrefix = () => (xs.mode === 'all' ? '' : xs[xs.mode]);
const xLabel = () => (xs.mode === 'all' ? 'Alle' : xs.mode === 'year' ? 'Jahr ' + xs.year : monthName(+xs.month.slice(5)) + ' ' + xs.month.slice(0, 4));
// Vorsteuer aus dem Bruttobetrag (gleiche Rechnung wie im Hauptprozess, src/expenses.js)
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
function vatOf(gross, rate) { const g = r2(gross), v = r2(g - g / (1 + rate / 100)); return { net: r2(g - v), vat: v }; }
function updateXCalc() {
  const f = xf(); const g = +f.gross.value;
  $('#xCalc').textContent = g > 0 ? (() => { const a = vatOf(g, +f.taxRate.value); return 'Netto ' + eur(a.net, '€') + ' · Vorsteuer ' + eur(a.vat, '€'); })() : '';
}
function fillExpenseForm(x) {
  const f = xf();
  if (!f.category.options.length) {
    EXPENSE_CATEGORIES.forEach((c) => { const o = document.createElement('option'); o.value = c; o.textContent = c; f.category.appendChild(o); });
    InvoiceHtml.TAX_RATES.forEach((r) => { const o = document.createElement('option'); o.value = r; o.textContent = r + ' %'; f.taxRate.appendChild(o); });
  }
  api.discardPendingReceipt();
  xs.editing = x ? x.id : null; xs.newReceipt = false; xs.removeReceipt = false; xs.hasReceipt = !!(x && x.receipt);
  f.date.value = x ? x.date : todayStr(); f.supplier.value = x ? x.supplier : ''; f.number.value = x ? x.number : '';
  f.description.value = x ? x.description : ''; f.category.value = x ? x.category : 'Sonstiges';
  f.gross.value = x ? x.gross : ''; f.taxRate.value = x ? x.taxRate : 20;
  $('#xFormTitle').textContent = x ? 'Ausgabe bearbeiten' : 'Neue Ausgabe';
  $('#xCancel').hidden = !x; $('#xSave').textContent = x ? 'Änderungen speichern' : 'Ausgabe speichern';
  showReceiptState(x && x.receipt ? x.receipt.name : '');
  updateXCalc();
}
function showReceiptState(name) {
  $('#xReceiptName').textContent = name ? 'Beleg: ' + name : 'Noch kein Beleg angehängt.';
  $('#xRemove').hidden = !name;
  $('#xPick').lastChild.textContent = name ? 'Anderen Beleg wählen' : 'Beleg hinzufügen (PDF oder Foto)';
}
['gross', 'taxRate'].forEach((n) => xf()[n].addEventListener('input', updateXCalc));
$('#xPick').onclick = async () => {
  const r = await api.pickReceipt();
  if (r.error) { toast(r.error, true); return; }
  if (r.ok) { xs.newReceipt = true; xs.removeReceipt = false; showReceiptState(r.name); }
};
$('#xRemove').onclick = () => { api.discardPendingReceipt(); xs.newReceipt = false; xs.removeReceipt = xs.hasReceipt; showReceiptState(''); };
$('#xCancel').onclick = () => fillExpenseForm(null);
$('#xform').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = xf();
  const saved = await api.saveExpense({
    id: xs.editing, date: f.date.value, supplier: f.supplier.value.trim(), number: f.number.value.trim(), description: f.description.value.trim(),
    category: f.category.value, gross: +f.gross.value, taxRate: +f.taxRate.value, useNewReceipt: xs.newReceipt, removeReceipt: xs.removeReceipt,
  });
  toast('Ausgabe gespeichert: ' + saved.supplier + ', ' + eur(saved.gross, '€') + ' (Vorsteuer ' + eur(saved.vat, '€') + ').');
  const d = saved.date.slice(0, 7); // Zeitraum auf den gespeicherten Beleg stellen, damit er sichtbar ist
  if (xs.mode === 'month') xs.month = d; else if (xs.mode === 'year') xs.year = d.slice(0, 4);
  fillExpenseForm(null); loadExpenses();
});
document.querySelectorAll('[data-xmode]').forEach((b) => b.addEventListener('click', () => { xs.mode = b.dataset.xmode; loadExpenses(); }));
function shiftX(dir) {
  if (xs.mode === 'month') { const [y, m] = xs.month.split('-').map(Number); const d = new Date(y, m - 1 + dir, 1); xs.month = d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  else if (xs.mode === 'year') xs.year = String(+xs.year + dir);
  loadExpenses();
}
$('#xPrev').onclick = () => shiftX(-1); $('#xNext').onclick = () => shiftX(1);
$('#xMonth').addEventListener('change', (e) => { if (e.target.value) { xs.month = e.target.value; loadExpenses(); } });
$('#xYear').addEventListener('change', (e) => { xs.year = e.target.value; loadExpenses(); });
let xTimer;
$('#xSearch').addEventListener('input', () => { clearTimeout(xTimer); xTimer = setTimeout(loadExpenses, 200); });
$('#xExport').onclick = async () => {
  toast('Export wird erstellt …');
  const r = await api.exportExpenses(xPrefix(), xLabel());
  if (r.error) { toast(r.error, true); return; }
  if (r.ok) toast('Export für den Steuerberater gespeichert (' + r.count + ' Belege, ' + r.receipts + ' Belegdateien): ' + r.dir);
};
async function loadExpenses() {
  const r = await api.listExpenses($('#xSearch').value, xPrefix());
  const years = [...new Set(r.years.concat(todayStr().slice(0, 4), xs.year))].sort().reverse();
  $('#xYear').innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  $('#xYear').value = xs.year; $('#xMonth').value = xs.month;
  document.querySelectorAll('[data-xmode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.xmode === xs.mode)));
  $('#xMonth').hidden = xs.mode !== 'month'; $('#xYear').hidden = xs.mode !== 'year'; $('#xPickers').hidden = xs.mode === 'all';
  $('#xPeriodTitle').textContent = xLabel();
  const sm = r.summary;
  const box = $('#xKpis'); box.innerHTML = '';
  [['Belege', String(sm.n), false], ['Netto', eur(sm.net, '€'), false], ['Vorsteuer (USt)', eur(sm.vat, '€'), true], ['Brutto', eur(sm.gross, '€'), false]].forEach(([l, v, main]) => {
    const d = document.createElement('div'); d.className = 'kpi' + (main ? ' main' : '');
    const a = document.createElement('span'); a.className = 'kl'; a.textContent = l;
    const b = document.createElement('span'); b.className = 'kv'; b.textContent = v;
    d.append(a, b); box.appendChild(d);
  });
  const rates = $('#xRates'); rates.innerHTML = '';
  sm.byRate.forEach((x) => { const sp = document.createElement('span'); sp.append(x.rate + ' %: Vorsteuer '); const b = document.createElement('b'); b.textContent = eur(x.vat, '€'); sp.append(b, ' (netto ' + eur(x.net, '€') + ')'); rates.appendChild(sp); });
  const tb = $('#xlist tbody'); tb.innerHTML = '';
  $('#xEmpty').hidden = r.items.length > 0;
  for (const x of r.items) {
    const tr = document.createElement('tr');
    const cells = [deDate(x.date), x.supplier, x.category, eur(x.net, '€'), eur(x.vat, '€'), eur(x.gross, '€')];
    cells.forEach((c, i) => {
      const td = document.createElement('td'); td.textContent = c; if (i >= 3) td.className = 'r';
      if (i === 1) { td.className = 'sup'; if (x.description) { const sm2 = document.createElement('small'); sm2.textContent = x.description; td.appendChild(sm2); } }
      tr.appendChild(td);
    });
    const td = document.createElement('td'); td.className = 'act';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.onclick = fn; td.appendChild(b); };
    if (x.receipt) mk('Beleg ansehen', 'secondary', async () => { const o = await api.openReceipt(x.id); if (!o.ok) toast(o.error, true); });
    mk('Bearbeiten', 'ghost', () => { fillExpenseForm(x); window.scrollTo(0, 0); $('#view-expenses').scrollIntoView(); });
    mk('Löschen', 'danger', async () => { if (confirm('Ausgabe von ' + x.supplier + ' (' + eur(x.gross, '€') + ') wirklich löschen? Die Belegdatei wird ebenfalls gelöscht.')) { await api.deleteExpense(x.id); toast('Ausgabe gelöscht.'); loadExpenses(); } });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

// ---- Datensicherung ----
const deDateTime = (iso) => new Date(iso).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' });
async function loadBackup() {
  const info = await api.backupInfo();
  $('#bkDir').textContent = info.dir;
  const st = $('#bkStatus');
  const days = info.lastBackup ? Math.floor((Date.now() - new Date(info.lastBackup)) / 86400000) : null;
  const n = info.count + (info.count === 1 ? ' Rechnung' : ' Rechnungen') + ' und ' + info.expenses + (info.expenses === 1 ? ' Ausgabe' : ' Ausgaben');
  if (days === null) { st.className = 'bkstatus warn'; st.textContent = 'Noch keine Sicherung erstellt. Aktuell gespeichert: ' + n + '.'; }
  else if (days > 30) { st.className = 'bkstatus warn'; st.textContent = 'Die letzte Sicherung ist ' + days + ' Tage alt (' + deDateTime(info.lastBackup) + '). Aktuell gespeichert: ' + n + '.'; }
  else { st.className = 'bkstatus'; st.textContent = 'Letzte Sicherung: ' + deDateTime(info.lastBackup) + '. Aktuell gespeichert: ' + n + '.'; }
}
$('#bkOpen').onclick = () => api.backupFolder();
$('#bkCreate').onclick = async () => {
  const r = await api.backupCreate();
  if (r.ok) { toast('Sicherung gespeichert (' + r.count + ' Rechnungen, ' + r.expenses + ' Ausgaben): ' + r.filePath); loadBackup(); }
};
$('#bkRestore').onclick = async () => {
  const r = await api.backupRestore();
  if (r.error) { toast(r.error, true); return; }
  if (!r.ok) return;
  settings = await api.getSettings(); applyBrand(settings.color); renderRail(); fillForm({});
  toast(r.mode === 'merge' ? 'Zusammengeführt: ' + r.added + ' neue, ' + r.updated + ' aktualisierte Rechnungen; ' + r.expAdded + ' neue, ' + r.expUpdated + ' aktualisierte Ausgaben.' : 'Wiederhergestellt: ' + r.count + ' Rechnungen, ' + r.expenses + ' Ausgaben und Einstellungen.');
  loadBackup();
};
$('#bkPdfs').onclick = async () => {
  toast('PDF-Dateien werden erstellt …');
  const r = await api.backupPdfs();
  if (r.ok) toast(r.count + ' PDF-Dateien gespeichert in: ' + r.dir);
};

// ---- Einstellungen ----
const validHex = (c) => /^#[0-9a-fA-F]{6}$/.test(c);
// Eingebauter Farbwähler (kein Popup, verdeckt also nichts)
let hsv = { h: 210, s: 0.8, v: 0.9 };
function hsvToRgb({ h, s, v }) {
  const f = (n) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b); let h = 0;
  if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}
const toHex = (rgb) => '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('');
function renderColor(skipHex) {
  const rgb = hsvToRgb(hsv), hex = toHex(rgb);
  $('#sv').style.setProperty('--hue', 'hsl(' + hsv.h + ',100%,50%)');
  $('#svThumb').style.left = hsv.s * 100 + '%'; $('#svThumb').style.top = (1 - hsv.v) * 100 + '%';
  $('#hue').value = hsv.h;
  [$('#rIn'), $('#gIn'), $('#bIn')].forEach((el, i) => (el.value = rgb[i]));
  if (!skipHex) $('#colorHex').value = hex;
  applyBrand(hex);
}
function setColor(c) {
  if (!validHex(c)) return;
  const n = parseInt(c.slice(1), 16);
  const nh = rgbToHsv(n >> 16, (n >> 8) & 255, n & 255);
  if (nh.s === 0 || nh.v === 0) nh.h = hsv.h; // Farbton bei Grau/Schwarz beibehalten
  hsv = nh; renderColor();
}
function svPick(e) {
  const r = $('#sv').getBoundingClientRect();
  hsv.s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  hsv.v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  renderColor();
}
$('#sv').addEventListener('pointerdown', (e) => { $('#sv').setPointerCapture(e.pointerId); svPick(e); });
$('#sv').addEventListener('pointermove', (e) => { if (e.buttons) svPick(e); });
$('#hue').addEventListener('input', (e) => { hsv.h = +e.target.value; renderColor(); });
['#rIn', '#gIn', '#bIn'].forEach((id) => $(id).addEventListener('input', () => {
  const v = ['#rIn', '#gIn', '#bIn'].map((i) => Math.min(255, Math.max(0, +$(i).value || 0)));
  const nh = rgbToHsv(...v); if (nh.s === 0 || nh.v === 0) nh.h = hsv.h; hsv = nh;
  $('#colorHex').value = toHex(v);
  $('#sv').style.setProperty('--hue', 'hsl(' + hsv.h + ',100%,50%)'); $('#svThumb').style.left = hsv.s * 100 + '%'; $('#svThumb').style.top = (1 - hsv.v) * 100 + '%'; $('#hue').value = hsv.h;
  applyBrand(toHex(v));
}));
$('#colorHex').addEventListener('input', (e) => {
  let v = e.target.value.trim(); if (v && v[0] !== '#') v = '#' + v;
  if (validHex(v)) { setColor(v); $('#colorHex').value = e.target.value; }
});
if (window.EyeDropper) $('#eye').onclick = async () => { try { setColor((await new EyeDropper().open()).sRGBHex); } catch {} };
else $('#eye').hidden = true;
function buildSwatches() {
  const box = $('#swatches'); box.innerHTML = '';
  SWATCHES.forEach((c) => {
    const s = document.createElement('span'); s.className = 'sw'; s.style.background = c; s.title = c;
    s.onclick = () => setColor(c); box.appendChild(s);
  });
}
function addCatalogRow(c = { description: '', price: '' }) {
  const d = document.createElement('div'); d.className = 'cat';
  d.innerHTML = '<input class="cd" placeholder="Bezeichnung" aria-label="Bezeichnung"><input class="cp" type="number" min="0" step="0.01" placeholder="Preis netto" aria-label="Preis netto"><button type="button" class="danger icon" title="Entfernen" aria-label="Vorlage entfernen"><svg><use href="#i-x"/></svg></button>';
  d.querySelector('.cd').value = c.description; d.querySelector('.cp').value = c.price;
  d.querySelector('button').onclick = () => d.remove();
  $('#catalogRows').appendChild(d);
}
$('#addCatalog').onclick = () => addCatalogRow();
// Textbausteine für Kostenvoranschläge (Einstellungen)
function addClauseRow(c = { id: '', title: '', text: '', for: 'beide', on: false }) {
  const d = document.createElement('div'); d.className = 'clauserow'; d.dataset.id = c.id || 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  d.innerHTML = '<div class="cmeta"><input class="ct" placeholder="Titel" aria-label="Titel" maxlength="120"><select class="cf" aria-label="Gilt für"><option value="beide">für beide Arten</option><option value="unverbindlich">nur unverbindlich</option><option value="verbindlich">nur verbindlich</option></select><label class="check"><input type="checkbox" class="co"> Standard</label></div><button type="button" class="danger icon" title="Entfernen" aria-label="Textbaustein entfernen"><svg><use href="#i-x"/></svg></button><textarea class="cx" rows="3" placeholder="Text auf dem Kostenvoranschlag" aria-label="Text" maxlength="1500"></textarea>';
  d.querySelector('.ct').value = c.title; d.querySelector('.cx').value = c.text; d.querySelector('.cf').value = c.for; d.querySelector('.co').checked = !!c.on;
  d.querySelector('button').onclick = () => d.remove();
  $('#clauseRows').appendChild(d);
}
$('#addClause').onclick = () => addClauseRow();
$('#resetClauses').onclick = () => { if (confirm('Alle Textbausteine auf die Standardtexte zurücksetzen?\n\nEigene Änderungen gehen verloren.')) { $('#clauseRows').innerHTML = ''; EstimateHtml.DEFAULT_CLAUSES.forEach(addClauseRow); } };
function showLogo(src) {
  const on = /^data:image\//.test(src || '');
  $('#logoPreview').src = on ? src : ''; $('#logoPreview').hidden = !on; $('#logoEmpty').hidden = on; $('#removeLogo').hidden = !on;
  renderLetterhead();
}
// Briefkopf-Vorschau in den Einstellungen (live)
function renderLetterhead() {
  const f = $('#settingsForm').elements, logo = $('#logoPreview').hidden ? '' : $('#logoPreview').src;
  $('#lhName').textContent = f.companyName.value || 'Firmenname';
  $('#lhAddr').textContent = f.address.value;
  $('#lhLogo').hidden = !logo; $('#lhLogo').src = logo;
  $('#lhMeta').textContent = [f.phone.value && 'Tel.: ' + f.phone.value, f.email.value && 'E-Mail: ' + f.email.value, f.bank.value && 'Bank: ' + f.bank.value, f.iban.value && 'IBAN: ' + f.iban.value, f.bic.value && 'BIC: ' + f.bic.value, f.uid.value && 'UID-Nr.: ' + f.uid.value].filter(Boolean).join('\n');
}
$('#settingsForm').addEventListener('input', renderLetterhead);
function fillSettings() {
  const f = $('#settingsForm').elements;
  ['companyName', 'address', 'uid', 'footerExtra', 'phone', 'email', 'bank', 'iban', 'bic', 'currency', 'taxNote'].forEach((k) => (f[k].value = settings[k] || ''));
  f.epcQr.checked = settings.epcQr !== false;
  fillTaxSelect(f.taxRate, settings.taxRate || 0);
  buildSwatches(); setColor(settings.color);
  showLogo(settings.logo);
  $('#catalogRows').innerHTML = '';
  (settings.catalog || []).forEach(addCatalogRow);
  f.kvValidDays.value = settings.kvValidDays || 30;
  $('#clauseRows').innerHTML = '';
  (settings.kvClauses || []).forEach(addClauseRow);
  renderLetterhead();
}
$('#logoFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Das Logo ist zu groß (max. 2 MB).', true); return; }
  const r = new FileReader();
  r.onload = () => { settings.logo = r.result; showLogo(r.result); };
  r.readAsDataURL(file);
});
$('#removeLogo').onclick = () => { settings.logo = ''; $('#logoFile').value = ''; showLogo(''); };
$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  let color = f.color.value.trim(); if (color && color[0] !== '#') color = '#' + color;
  if (!validHex(color)) { toast('Ungültige Farbe. Beispiel: #0b7a4b', true); return; }
  const catalog = [...document.querySelectorAll('.cat')].map((d) => ({ description: d.querySelector('.cd').value.trim(), price: +d.querySelector('.cp').value || 0 })).filter((c) => c.description);
  settings = await api.saveSettings({
    companyName: f.companyName.value.trim(), address: f.address.value, uid: f.uid.value.trim(), footerExtra: f.footerExtra.value.trim(),
    phone: f.phone.value.trim(), email: f.email.value.trim(), bank: f.bank.value.trim(), iban: f.iban.value.trim(), bic: f.bic.value.trim(),
    color, epcQr: f.epcQr.checked, currency: f.currency.value.trim() || '€', taxRate: +f.taxRate.value || 0,
    taxNote: f.taxNote.value.trim(), logo: settings.logo, catalog,
    kvValidDays: +f.kvValidDays.value || 30,
    kvClauses: [...document.querySelectorAll('.clauserow')].map((d) => ({ id: d.dataset.id, title: d.querySelector('.ct').value.trim(), text: d.querySelector('.cx').value.trim(), for: d.querySelector('.cf').value, on: d.querySelector('.co').checked })).filter((c) => c.text),
  });
  applyBrand(settings.color); renderRail(); toast('Einstellungen gespeichert.');
});

(async () => { settings = await api.getSettings(); applyBrand(settings.color); renderRail(); fillForm({}); fitPreview(); })();
