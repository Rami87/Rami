const $ = (s) => document.querySelector(s);
const eur = (n, cur) => (Math.round(n * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (cur || '');
const SWATCHES = ['#1f6feb', '#0b7a4b', '#16a34a', '#d1242f', '#e36209', '#8250df', '#24292f', '#0e7490'];
let settings = {};
let currentId = null;

// ---- Navigation ----
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
function show(v) {
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  ['new', 'archive', 'settings'].forEach((n) => ($('#view-' + n).hidden = n !== v));
  if (v === 'archive') loadList();
  if (v === 'settings') fillSettings();
  if (v === 'new') { fillCatalogList(); refreshPreview(); }
}

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
  d.innerHTML = '<input class="desc" list="catalogList" placeholder="Bezeichnung"><input class="qty" type="number" min="0" step="any"><input class="price" type="number" min="0" step="any"><button type="button" class="danger" title="Entfernen">×</button>';
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
$('#reset').onclick = () => { fillForm({}); $('#msg').textContent = ''; };
async function save() {
  const inv = readInvoice();
  if (!inv.customer || !inv.items.length) { $('#msg').textContent = 'Bitte Kunde und mindestens eine Position eingeben.'; return null; }
  const saved = await api.saveInvoice(inv);
  currentId = saved.id; $('#form').elements.number.value = saved.number;
  settings = await api.getSettings();
  $('#msg').textContent = 'Im Archiv gespeichert (Nr. ' + saved.number + ').';
  return saved;
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
$('#savePdf').onclick = async () => {
  const s = await save(); if (!s) return;
  const r = await api.exportPdf(s.id);
  if (r.ok) $('#msg').textContent = 'PDF gespeichert: ' + r.filePath;
};

// ---- Archiv ----
let timer;
$('#search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadList, 200); });
async function loadList() {
  const list = await api.listInvoices($('#search').value);
  const tb = $('#list tbody'); tb.innerHTML = '';
  $('#empty').hidden = list.length > 0;
  for (const inv of list) {
    const tr = document.createElement('tr');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(inv.date || '') ? inv.date.split('-').reverse().join('.') : inv.date;
    [inv.number, date, inv.customer, eur(InvoiceHtml.totals(inv).total, inv.currency)].forEach((c) => {
      const td = document.createElement('td'); td.textContent = c; tr.appendChild(td);
    });
    const td = document.createElement('td');
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.style.marginInlineEnd = '6px'; b.onclick = fn; td.appendChild(b); };
    mk('Öffnen', 'secondary', () => { show('new'); fillForm(inv); });
    mk('PDF', '', async () => { const r = await api.exportPdf(inv.id); if (r.ok) alert('PDF gespeichert:\n' + r.filePath); });
    mk('Löschen', 'danger', async () => { if (confirm('Rechnung ' + inv.number + ' löschen?')) { await api.deleteInvoice(inv.id); loadList(); } });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

// ---- Einstellungen ----
const validHex = (c) => /^#[0-9a-fA-F]{6}$/.test(c);
function setColor(c) {
  $('#colorHex').value = c;
  $('#colorPreview').style.background = validHex(c) ? c : 'transparent';
}
function buildSwatches() {
  const box = $('#swatches'); box.innerHTML = '';
  SWATCHES.forEach((c) => {
    const s = document.createElement('span'); s.className = 'sw'; s.style.background = c; s.title = c;
    s.onclick = () => setColor(c); box.appendChild(s);
  });
}
$('#colorHex').addEventListener('input', (e) => {
  let v = e.target.value.trim(); if (v && v[0] !== '#') v = '#' + v;
  $('#colorPreview').style.background = validHex(v) ? v : 'transparent';
});
function addCatalogRow(c = { description: '', price: '' }) {
  const d = document.createElement('div'); d.className = 'cat';
  d.innerHTML = '<input class="cd" placeholder="Bezeichnung"><input class="cp" type="number" min="0" step="0.01" placeholder="Preis (netto)"><button type="button" class="danger" title="Entfernen">×</button>';
  d.querySelector('.cd').value = c.description; d.querySelector('.cp').value = c.price;
  d.querySelector('button').onclick = () => d.remove();
  $('#catalogRows').appendChild(d);
}
$('#addCatalog').onclick = () => addCatalogRow();
function fillSettings() {
  const f = $('#settingsForm').elements;
  ['companyName', 'address', 'uid', 'iban', 'bic', 'currency', 'nextNumber', 'taxNote'].forEach((k) => (f[k].value = settings[k] || ''));
  fillTaxSelect(f.taxRate, settings.taxRate || 0);
  buildSwatches(); setColor(settings.color);
  $('#logoPreview').src = settings.logo || ''; $('#logoPreview').hidden = !settings.logo; $('#removeLogo').hidden = !settings.logo;
  $('#catalogRows').innerHTML = '';
  (settings.catalog || []).forEach(addCatalogRow);
}
$('#logoFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { $('#smsg').textContent = 'Das Logo ist zu groß (max. 2 MB).'; return; }
  const r = new FileReader();
  r.onload = () => { settings.logo = r.result; $('#logoPreview').src = r.result; $('#logoPreview').hidden = false; $('#removeLogo').hidden = false; };
  r.readAsDataURL(file);
});
$('#removeLogo').onclick = () => { settings.logo = ''; $('#logoFile').value = ''; $('#logoPreview').hidden = true; $('#removeLogo').hidden = true; };
$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  let color = f.color.value.trim(); if (color && color[0] !== '#') color = '#' + color;
  if (!validHex(color)) { $('#smsg').textContent = 'Ungültige Farbe. Beispiel: #1f6feb'; return; }
  const catalog = [...document.querySelectorAll('.cat')].map((d) => ({ description: d.querySelector('.cd').value.trim(), price: +d.querySelector('.cp').value || 0 })).filter((c) => c.description);
  settings = await api.saveSettings({
    companyName: f.companyName.value.trim(), address: f.address.value, uid: f.uid.value.trim(), iban: f.iban.value.trim(), bic: f.bic.value.trim(),
    color, currency: f.currency.value.trim() || '€', nextNumber: +f.nextNumber.value || 1, taxRate: +f.taxRate.value || 0,
    taxNote: f.taxNote.value.trim(), logo: settings.logo, catalog,
  });
  $('#smsg').textContent = 'Einstellungen gespeichert.';
});

(async () => { settings = await api.getSettings(); fillForm({}); })();
