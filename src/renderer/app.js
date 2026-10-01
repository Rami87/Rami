const $ = (s) => document.querySelector(s);
const eur = (n, cur) => (Math.round(n * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (cur || '');
const SWATCHES = ['#1f6feb', '#0b7a4b', '#16a34a', '#d1242f', '#e36209', '#8250df', '#24292f', '#0e7490'];
let settings = {};
let currentId = null;


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
}
function refreshPreview() {
  const inv = readInvoice();
  document.querySelectorAll('.item:not(.head)').forEach((d) => { d.querySelector('.amt').textContent = eur((+d.querySelector('.qty').value || 0) * (+d.querySelector('.price').value || 0), ''); });
  $('#total').textContent = eur(InvoiceHtml.totals(inv).total, settings.currency);
  $('#preview').srcdoc = InvoiceHtml.build(inv, settings);
}
$('#form').addEventListener('input', refreshPreview);
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
  const s = await save(); if (!s) return;
  const r = await api.exportPdf(s.id);
  if (r.ok) toast('PDF gespeichert: ' + r.filePath);
};

// ---- Archiv ----
let timer;
const yearOf = (inv) => String(inv.date || '').slice(0, 4);
$('#search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadList, 200); });
$('#yearFilter').addEventListener('change', loadList);
$('#exportCsv').onclick = async () => {
  const r = await api.exportCsv($('#search').value, $('#yearFilter').value);
  if (r.ok) toast(r.count + ' Rechnungen als CSV exportiert: ' + r.filePath);
};
async function loadYears() {
  const all = await api.listInvoices('', '');
  const by = {};
  all.forEach((inv) => {
    const y = yearOf(inv) || '—', t = InvoiceHtml.totals(inv);
    const o = (by[y] = by[y] || { n: 0, net: 0, tax: 0, total: 0 });
    o.n++; o.net += t.net; o.tax += t.tax; o.total += t.total;
  });
  const years = Object.keys(by).sort().reverse();
  const sel = $('#yearFilter'), cur = sel.value;
  sel.innerHTML = '<option value="">Alle Jahre</option>' + years.filter((y) => y !== '—').map((y) => `<option value="${y}">${y}</option>`).join('');
  sel.value = years.includes(cur) ? cur : '';
  const box = $('#years'); box.innerHTML = '';
  const max = Math.max(1, ...Object.values(by).map((o) => o.total));
  const row = (label, o, y) => {
    const el = document.createElement(y === undefined ? 'div' : 'button');
    el.className = 'yrow' + (y === undefined ? ' total' : '');
    if (y !== undefined) { el.type = 'button'; el.setAttribute('aria-pressed', String(y === sel.value)); el.onclick = () => { sel.value = y === sel.value ? '' : y; loadList(); }; }
    const cnt = o.n + (o.n === 1 ? ' Rechnung' : ' Rechnungen');
    el.innerHTML = '<span class="y"></span><span class="bar" aria-hidden="true"><i></i></span><span class="n"></span><span class="amt"></span>';
    el.querySelector('.y').textContent = label;
    el.querySelector('i').style.width = Math.max(2, (o.total / max) * 100) + '%';
    el.querySelector('.n').textContent = cnt;
    el.querySelector('.amt').innerHTML = '';
    el.querySelector('.amt').append(eur(o.total, settings.currency));
    const sm = document.createElement('small'); sm.textContent = 'netto ' + eur(o.net, settings.currency) + ' · USt. ' + eur(o.tax, settings.currency);
    el.querySelector('.amt').appendChild(sm);
    box.appendChild(el);
  };
  years.forEach((y) => row(y, by[y], y));
  if (years.length > 1) { const t = Object.values(by).reduce((a, o) => ({ n: a.n + o.n, net: a.net + o.net, tax: a.tax + o.tax, total: a.total + o.total }), { n: 0, net: 0, tax: 0, total: 0 }); row('Gesamt', t); box.lastChild.querySelector('.bar').style.visibility = 'hidden'; }
}
async function loadList() {
  await loadYears();
  const list = await api.listInvoices($('#search').value, $('#yearFilter').value);
  const tb = $('#list tbody'); tb.innerHTML = '';
  $('#empty').hidden = list.length > 0;
  for (const inv of list) {
    const tr = document.createElement('tr');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(inv.date || '') ? inv.date.split('-').reverse().join('.') : inv.date;
    [inv.number, date, inv.customer, eur(InvoiceHtml.totals(inv).total, inv.currency)].forEach((c, i) => {
      const td = document.createElement('td'); td.textContent = c; if (i === 0) td.className = 'num'; if (i === 3) td.className = 'r'; tr.appendChild(td);
    });
    const td = document.createElement('td'); td.className = 'act';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.onclick = fn; td.appendChild(b); };
    mk('Öffnen', 'ghost', () => { show('new'); fillForm(inv); });
    mk('PDF', 'secondary', async () => { const r = await api.exportPdf(inv.id); if (r.ok) toast('PDF gespeichert: ' + r.filePath); });
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
  $('#lhMeta').textContent = [f.uid.value && 'UID-Nr.: ' + f.uid.value, f.iban.value && 'IBAN: ' + f.iban.value, f.bic.value && 'BIC: ' + f.bic.value].filter(Boolean).join('  |  ');
}
$('#settingsForm').addEventListener('input', renderLetterhead);
function fillSettings() {
  const f = $('#settingsForm').elements;
  ['companyName', 'address', 'uid', 'iban', 'bic', 'currency', 'nextNumber', 'taxNote'].forEach((k) => (f[k].value = settings[k] || ''));
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
    companyName: f.companyName.value.trim(), address: f.address.value, uid: f.uid.value.trim(), iban: f.iban.value.trim(), bic: f.bic.value.trim(),
    color, currency: f.currency.value.trim() || '€', nextNumber: +f.nextNumber.value || 1, taxRate: +f.taxRate.value || 0,
    taxNote: f.taxNote.value.trim(), logo: settings.logo, catalog,
  });
  applyBrand(settings.color); renderRail(); toast('Einstellungen gespeichert.');
});

(async () => { settings = await api.getSettings(); applyBrand(settings.color); renderRail(); fillForm({}); fitPreview(); })();
