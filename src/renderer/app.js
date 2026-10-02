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
  const w = $('#sheetwrap').clientWidth;
  if (w) $('#preview').style.transform = 'scale(' + w / 794 + ')';
}
new ResizeObserver(fitPreview).observe($('#sheetwrap'));

// ---- Navigation ----
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
function show(v) {
  applyBrand(settings.color); // ungespeicherte Farbänderung verwerfen
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  ['new', 'archive', 'settings'].forEach((n) => ($('#view-' + n).hidden = n !== v));
  if (v === 'archive') loadList();
  if (v === 'settings') fillSettings();
  if (v === 'new') { fillCatalogList(); refreshPreview(); fitPreview(); }
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
  d.innerHTML = '<input class="desc" list="catalogList" placeholder="Bezeichnung" aria-label="Bezeichnung"><input class="qty" type="number" min="0" step="any" aria-label="Menge"><input class="price" type="number" min="0" step="any" aria-label="Preis netto"><span class="amt">0,00</span><button type="button" class="danger icon" title="Position entfernen" aria-label="Position entfernen"><svg><use href="#i-x"/></svg></button>';
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
function readInvoice() {
  const f = $('#form').elements;
  return {
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
  $('#formTitle').textContent = inv.id ? 'Rechnung ' + inv.number : 'Neue Rechnung';
  const isNew = !inv.id;
  const rate = inv.taxRate != null ? inv.taxRate : (settings.taxRate || 0);
  fillTaxSelect(f.taxRate, rate);
  f.number.value = inv.number || ''; f.date.value = inv.date || today(); f.serviceDate.value = inv.serviceDate || '';
  f.customer.value = inv.customer || ''; f.customerAddress.value = inv.customerAddress || ''; f.customerUid.value = inv.customerUid || '';
  f.discount.value = inv.discount || 0; f.notes.value = inv.notes || '';
  f.taxNote.value = isNew ? (rate === 0 ? settings.taxNote || '' : '') : (inv.taxNote || '');
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
$('#reset').onclick = () => { fillForm({}); };
async function save() {
  const inv = readInvoice();
  if (!inv.customer || !inv.items.length) { toast('Bitte Kunde und mindestens eine Position eingeben.', true); return null; }
  const saved = await api.saveInvoice(inv);
  currentId = saved.id; $('#form').elements.number.value = saved.number;
  settings = await api.getSettings();
  $('#formTitle').textContent = 'Rechnung ' + saved.number; toast('Gespeichert: Rechnung ' + saved.number);
  return saved;
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
$('#savePdf').onclick = async () => {
  const saved = await save(); if (!saved) return;
  const r = await api.exportPdf(saved);
  if (r.ok) toast('PDF gespeichert: ' + r.filePath);
};
$('#previewBtn').onclick = () => api.previewInvoice(readInvoice());
$('#printBtn').onclick = async () => {
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
    [inv.number, deDate(inv.date), inv.customer, eur(InvoiceHtml.totals(inv).total, inv.currency)].forEach((c, i) => {
      const td = document.createElement('td'); td.textContent = c; if (i === 0) td.className = 'num'; if (i === 3) td.className = 'r'; tr.appendChild(td);
    });
    const td = document.createElement('td'); td.className = 'act';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.onclick = fn; td.appendChild(b); };
    mk('Öffnen', 'ghost', () => { show('new'); fillForm(inv); });
    mk('Vorschau', 'ghost', () => api.previewInvoice(inv));
    mk('PDF', 'secondary', async () => { const r = await api.exportPdf(inv); if (r.ok) toast('PDF gespeichert: ' + r.filePath); });
    mk('Löschen', 'danger', async () => { if (confirm('Rechnung ' + inv.number + ' wirklich löschen?')) { await api.deleteInvoice(inv.id); toast('Rechnung ' + inv.number + ' gelöscht.'); loadList(); } });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

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
  ['companyName', 'address', 'uid', 'phone', 'email', 'bank', 'iban', 'bic', 'currency', 'taxNote'].forEach((k) => (f[k].value = settings[k] || ''));
  fillTaxSelect(f.taxRate, settings.taxRate || 0);
  buildSwatches(); setColor(settings.color);
  showLogo(settings.logo);
  $('#catalogRows').innerHTML = '';
  (settings.catalog || []).forEach(addCatalogRow);
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
    companyName: f.companyName.value.trim(), address: f.address.value, uid: f.uid.value.trim(),
    phone: f.phone.value.trim(), email: f.email.value.trim(), bank: f.bank.value.trim(), iban: f.iban.value.trim(), bic: f.bic.value.trim(),
    color, currency: f.currency.value.trim() || '€', taxRate: +f.taxRate.value || 0,
    taxNote: f.taxNote.value.trim(), logo: settings.logo, catalog,
  });
  applyBrand(settings.color); renderRail(); toast('Einstellungen gespeichert.');
});

(async () => { settings = await api.getSettings(); applyBrand(settings.color); renderRail(); fillForm({}); fitPreview(); })();
