const $ = (s) => document.querySelector(s);
function toast(text, isErr) {
  const t = $('#toast'); t.textContent = text; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
  setTimeout(() => (t.hidden = true), 4000);
}
(async () => {
  const s = await api.getSettings();
  if (/^#[0-9a-fA-F]{6}$/.test(s.color || '')) document.documentElement.style.setProperty('--brand', s.color);
  const p = await api.getPreview();
  if (p) { $('#pvFrame').srcdoc = p.html; $('#pvTitle').textContent = (p.title || 'Rechnung') + ' ' + p.number; }
})();
$('#pvPrint').onclick = async () => { const r = await api.printPreview(); if (r && r.ok === false && r.reason && r.reason !== 'cancelled') toast('Drucken nicht möglich: ' + r.reason, true); };
$('#pvPdf').onclick = async () => { const r = await api.pdfPreview(); if (r.ok) toast('PDF gespeichert: ' + r.filePath); };
$('#pvClose').onclick = () => window.close();
