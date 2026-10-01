// قالب الفاتورة: يُستخدم للمعاينة داخل البرنامج ولتوليد ملف PDF بنفس الشكل.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InvoiceHtml = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const safeColor = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : '#1f6feb');
  const safeLogo = (l) => (/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(l || '') ? l : '');
  const money = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function totals(inv) {
    const subtotal = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const discount = Number(inv.discount) || 0;
    const taxable = Math.max(subtotal - discount, 0);
    const tax = taxable * ((Number(inv.taxRate) || 0) / 100);
    return { subtotal, discount, tax, total: taxable + tax };
  }

  function build(inv, settings) {
    const color = safeColor(settings.color);
    const logo = safeLogo(settings.logo);
    const cur = esc(inv.currency || settings.currency || '');
    const t = totals(inv);
    const rows = (inv.items || []).map((it, i) => `
      <tr><td>${i + 1}</td><td class="desc">${esc(it.description)}</td>
      <td>${esc(it.qty)}</td><td>${money(it.price)}</td>
      <td>${money((Number(it.qty) || 0) * (Number(it.price) || 0))}</td></tr>`).join('');
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة ${esc(inv.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", "Noto Sans Arabic", "DejaVu Sans", Arial, sans-serif; color: #222; margin: 0; font-size: 13px; direction: rtl; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid ${color}; padding-bottom: 12px; }
  header img { max-height: 70px; max-width: 160px; }
  .company h1 { margin: 0 0 4px; color: ${color}; font-size: 22px; }
  .company div { white-space: pre-line; color: #555; }
  .title { text-align: left; }
  .title h2 { margin: 0; color: ${color}; font-size: 26px; }
  .meta { display: flex; justify-content: space-between; margin: 18px 0; gap: 20px; }
  .meta .box { flex: 1; background: #f6f8fa; border-radius: 6px; padding: 10px 12px; }
  .meta b { color: ${color}; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: ${color}; color: #fff; padding: 8px; text-align: center; }
  td { padding: 8px; border-bottom: 1px solid #e1e4e8; text-align: center; }
  td.desc { text-align: right; }
  .sum { width: 55%; margin: 16px auto 0 0; }
  .sum div { display: flex; justify-content: space-between; padding: 5px 10px; }
  .sum .total { background: ${color}; color: #fff; font-weight: bold; font-size: 15px; border-radius: 4px; }
  .notes { margin-top: 24px; color: #444; white-space: pre-line; }
  .notes b { color: ${color}; }
</style></head><body>
<header>
  <div class="company">${logo ? `<img src="${logo}" alt="">` : ''}<h1>${esc(settings.companyName)}</h1><div>${esc(settings.address)}</div></div>
  <div class="title"><h2>فاتورة</h2></div>
</header>
<div class="meta">
  <div class="box"><b>رقم الفاتورة:</b> <bdi dir="ltr">${esc(inv.number)}</bdi><br><b>التاريخ:</b> <bdi dir="ltr">${esc(inv.date)}</bdi></div>
  <div class="box"><b>العميل:</b> ${esc(inv.customer)}<br>${esc(inv.customerAddress)}</div>
</div>
<table><thead><tr><th>#</th><th>الوصف</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum">
  <div><span>المجموع الفرعي</span><span>${money(t.subtotal)} ${cur}</span></div>
  ${t.discount ? `<div><span>الخصم</span><span>- ${money(t.discount)} ${cur}</span></div>` : ''}
  ${inv.taxRate ? `<div><span>الضريبة (${esc(inv.taxRate)}%)</span><span>${money(t.tax)} ${cur}</span></div>` : ''}
  <div class="total"><span>الإجمالي</span><span>${money(t.total)} ${cur}</span></div>
</div>
${inv.notes ? `<div class="notes"><b>ملاحظات:</b><br>${esc(inv.notes)}</div>` : ''}
</body></html>`;
  }

  return { build, totals, esc };
});
