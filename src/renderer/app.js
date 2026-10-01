const $ = (s) => document.querySelector(s);
let settings = {};
let currentId = null;

// ---- التنقل ----
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
function show(v) {
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  ['new', 'archive', 'settings'].forEach((n) => ($('#view-' + n).hidden = n !== v));
  if (v === 'archive') loadList();
  if (v === 'settings') fillSettings();
  if (v === 'new') refreshPreview();
}

// ---- نموذج الفاتورة ----
const today = () => new Date().toISOString().slice(0, 10);
function addItem(it = { description: '', qty: 1, price: 0 }) {
  const d = document.createElement('div');
  d.className = 'item';
  d.innerHTML = '<input class="desc" placeholder="الوصف"><input class="qty" type="number" min="0" step="any" placeholder="الكمية"><input class="price" type="number" min="0" step="any" placeholder="السعر"><button type="button" class="danger" title="حذف">×</button>';
  d.querySelector('.desc').value = it.description;
  d.querySelector('.qty').value = it.qty;
  d.querySelector('.price').value = it.price;
  d.querySelector('button').onclick = () => { d.remove(); refreshPreview(); };
  $('#items').appendChild(d);
}
function readInvoice() {
  const f = $('#form').elements;
  return {
    id: currentId || undefined, number: f.number.value.trim(), date: f.date.value, customer: f.customer.value.trim(),
    customerAddress: f.customerAddress.value.trim(), discount: +f.discount.value || 0, taxRate: +f.taxRate.value || 0,
    notes: f.notes.value.trim(), currency: settings.currency,
    items: [...document.querySelectorAll('.item')].map((d) => ({
      description: d.querySelector('.desc').value.trim(), qty: +d.querySelector('.qty').value || 0, price: +d.querySelector('.price').value || 0,
    })).filter((i) => i.description || i.price),
  };
}
function fillForm(inv) {
  const f = $('#form').elements;
  currentId = inv.id || null;
  f.number.value = inv.number || ''; f.date.value = inv.date || today(); f.customer.value = inv.customer || '';
  f.customerAddress.value = inv.customerAddress || ''; f.discount.value = inv.discount || 0; f.taxRate.value = inv.taxRate || 0; f.notes.value = inv.notes || '';
  $('#items').innerHTML = '';
  (inv.items && inv.items.length ? inv.items : [undefined]).forEach((i) => addItem(i));
  refreshPreview();
}
function refreshPreview() {
  const inv = readInvoice();
  $('#total').textContent = InvoiceHtml.totals(inv).total.toFixed(2) + ' ' + (settings.currency || '');
  $('#preview').srcdoc = InvoiceHtml.build(inv, settings);
}
$('#form').addEventListener('input', refreshPreview);
$('#addItem').onclick = () => { addItem(); };
$('#reset').onclick = () => { fillForm({}); $('#msg').textContent = ''; };
async function save() {
  const inv = readInvoice();
  if (!inv.customer || !inv.items.length) { $('#msg').textContent = 'أدخل اسم العميل وبنداً واحداً على الأقل.'; return null; }
  const saved = await api.saveInvoice(inv);
  currentId = saved.id; $('#form').elements.number.value = saved.number;
  settings = await api.getSettings();
  $('#msg').textContent = 'تم الحفظ في الأرشيف (رقم ' + saved.number + ').';
  return saved;
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
$('#savePdf').onclick = async () => {
  const s = await save(); if (!s) return;
  const r = await api.exportPdf(s.id);
  if (r.ok) $('#msg').textContent = 'تم حفظ الملف: ' + r.filePath;
};

// ---- الأرشيف ----
let timer;
$('#search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(loadList, 200); });
async function loadList() {
  const list = await api.listInvoices($('#search').value);
  const tb = $('#list tbody'); tb.innerHTML = '';
  $('#empty').hidden = list.length > 0;
  for (const inv of list) {
    const tr = document.createElement('tr');
    const cells = [inv.number, inv.date, inv.customer, InvoiceHtml.totals(inv).total.toFixed(2) + ' ' + (inv.currency || '')];
    cells.forEach((c) => { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
    const td = document.createElement('td');
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; b.className = cls; b.style.marginInlineEnd = '6px'; b.onclick = fn; td.appendChild(b); };
    mk('فتح/تعديل', 'secondary', () => { fillForm(inv); show('new'); fillForm(inv); });
    mk('PDF', '', async () => { const r = await api.exportPdf(inv.id); if (r.ok) alert('تم حفظ الملف:\n' + r.filePath); });
    mk('حذف', 'danger', async () => { if (confirm('حذف الفاتورة ' + inv.number + '؟')) { await api.deleteInvoice(inv.id); loadList(); } });
    tr.appendChild(td); tb.appendChild(tr);
  }
}

// ---- الإعدادات ----
function fillSettings() {
  const f = $('#settingsForm').elements;
  ['companyName', 'address', 'color', 'currency', 'nextNumber'].forEach((k) => (f[k].value = settings[k]));
  $('#logoPreview').src = settings.logo || ''; $('#logoPreview').hidden = !settings.logo; $('#removeLogo').hidden = !settings.logo;
}
$('#logoFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { $('#smsg').textContent = 'حجم الشعار كبير (الحد 2 ميغابايت).'; return; }
  const r = new FileReader();
  r.onload = () => { settings.logo = r.result; fillSettings(); };
  r.readAsDataURL(file);
});
$('#removeLogo').onclick = () => { settings.logo = ''; $('#logoFile').value = ''; fillSettings(); };
$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  settings = await api.saveSettings({ companyName: f.companyName.value.trim(), address: f.address.value, color: f.color.value,
    currency: f.currency.value.trim(), nextNumber: +f.nextNumber.value || 1, logo: settings.logo });
  $('#smsg').textContent = 'تم حفظ الإعدادات.';
});

(async () => { settings = await api.getSettings(); fillForm({}); })();
