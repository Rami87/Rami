// Rechnungsvorlage (Deutsch, Österreich): wird für die Vorschau und für das PDF verwendet.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InvoiceHtml = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const safeColor = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : '#1f6feb');
  const safeLogo = (l) => (/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(l || '') ? l : '');
  const money = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n) => (Number(n) || 0).toLocaleString('de-DE', { maximumFractionDigits: 3 });
  const date = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d.split('-').reverse().join('.') : esc(d));

  // Österreichische Umsatzsteuersätze
  const TAX_RATES = [0, 10, 13, 20];
  const DEFAULT_TAX_NOTE = 'Umsatzsteuerfrei gemäß § 6 Abs. 1 Z 27 UStG.';

  function totals(inv) {
    const subtotal = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const discount = Number(inv.discount) || 0;
    const net = Math.max(subtotal - discount, 0);
    const tax = net * ((Number(inv.taxRate) || 0) / 100);
    return { subtotal, discount, net, tax, total: net + tax };
  }

  function build(inv, settings) {
    const color = safeColor(settings.color);
    const logo = safeLogo(settings.logo);
    const cur = esc(inv.currency || settings.currency || '€');
    const t = totals(inv);
    const rate = Number(inv.taxRate) || 0;
    const rows = (inv.items || []).map((it, i) => `
      <tr><td>${i + 1}</td><td class="desc">${esc(it.description)}</td>
      <td>${num(it.qty)}</td><td>${money(it.price)}</td>
      <td>${money((Number(it.qty) || 0) * (Number(it.price) || 0))}</td></tr>`).join('');
    const footer = [settings.uid && `UID-Nr.: ${esc(settings.uid)}`, settings.iban && `IBAN: ${esc(settings.iban)}`, settings.bic && `BIC: ${esc(settings.bic)}`]
      .filter(Boolean).join(' &nbsp;|&nbsp; ');
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Rechnung ${esc(inv.number)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  @media screen { body { padding: 14mm; } }
  body { font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif; color: #222; margin: 0; font-size: 13px; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid ${color}; padding-bottom: 12px; }
  header img { max-height: 70px; max-width: 160px; display: block; margin-bottom: 6px; }
  .company h1 { margin: 0 0 4px; color: ${color}; font-size: 22px; }
  .company div { white-space: pre-line; color: #555; }
  .title h2 { margin: 0; color: ${color}; font-size: 26px; }
  .meta { display: flex; justify-content: space-between; margin: 18px 0; gap: 20px; }
  .meta .box { flex: 1; background: #f6f8fa; border-radius: 6px; padding: 10px 12px; line-height: 1.6; }
  .meta b { color: ${color}; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: ${color}; color: #fff; padding: 8px; text-align: center; }
  th.desc { text-align: left; }
  td { padding: 8px; border-bottom: 1px solid #e1e4e8; text-align: right; }
  td:first-child { text-align: center; }
  td.desc { text-align: left; }
  .sum { width: 55%; margin: 16px 0 0 auto; }
  .sum div { display: flex; justify-content: space-between; padding: 5px 10px; }
  .sum .total { background: ${color}; color: #fff; font-weight: bold; font-size: 15px; border-radius: 4px; }
  .notes { margin-top: 22px; color: #444; white-space: pre-line; }
  .notes b { color: ${color}; }
  footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 8px; color: #666; font-size: 11px; text-align: center; }
</style></head><body>
<header>
  <div class="company">${logo ? `<img src="${logo}" alt="">` : ''}<h1>${esc(settings.companyName)}</h1><div>${esc(settings.address)}</div></div>
  <div class="title"><h2>Rechnung</h2></div>
</header>
<div class="meta">
  <div class="box"><b>Rechnungsnummer:</b> ${esc(inv.number)}<br><b>Rechnungsdatum:</b> ${date(inv.date)}${inv.serviceDate ? `<br><b>Leistungsdatum:</b> ${date(inv.serviceDate)}` : ''}</div>
  <div class="box"><b>Kunde:</b> ${esc(inv.customer)}<br><span style="white-space:pre-line">${esc(inv.customerAddress)}</span>${inv.customerUid ? `<br><b>UID-Nr.:</b> ${esc(inv.customerUid)}` : ''}</div>
</div>
<table><thead><tr><th>Pos.</th><th class="desc">Bezeichnung</th><th>Menge</th><th>Einzelpreis</th><th>Betrag</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum">
  ${t.discount ? `<div><span>Zwischensumme</span><span>${money(t.subtotal)} ${cur}</span></div><div><span>Rabatt</span><span>- ${money(t.discount)} ${cur}</span></div>` : ''}
  <div><span>Nettobetrag</span><span>${money(t.net)} ${cur}</span></div>
  ${rate ? `<div><span>zzgl. ${num(rate)} % USt.</span><span>${money(t.tax)} ${cur}</span></div>` : ''}
  <div class="total"><span>Gesamtbetrag</span><span>${money(t.total)} ${cur}</span></div>
</div>
${inv.taxNote ? `<div class="notes"><b>Steuerhinweis:</b> ${esc(inv.taxNote)}</div>` : ''}
${inv.notes ? `<div class="notes"><b>Anmerkungen:</b><br>${esc(inv.notes)}</div>` : ''}
${footer ? `<footer>${footer}</footer>` : ''}
</body></html>`;
  }

  return { build, totals, esc, TAX_RATES, DEFAULT_TAX_NOTE };
});
