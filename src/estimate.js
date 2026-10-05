// Kostenvoranschlag (Österreich): Daten bereinigen, Textbausteine, Vorlage für Vorschau und PDF.
// Rechtlicher Rahmen: § 5 KSchG (gegenüber Verbrauchern verbindlich, außer ausdrücklich «unverbindlich»; Entgelt nur bei
// vorherigem Hinweis) und § 1170a ABGB (Gewähr / wesentliche Überschreitung).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./invoice-html'));
  else root.EstimateHtml = factory(root.InvoiceHtml);
})(typeof self !== 'undefined' ? self : this, function (H) {
  const KINDS = ['unverbindlich', 'verbindlich'];
  const STATUSES = ['offen', 'angenommen', 'abgelehnt'];
  const DEFAULT_VALID_DAYS = 30;

  // Textbausteine. for: 'beide' | 'unverbindlich' | 'verbindlich'; on: standardmäßig angehakt.
  const DEFAULT_CLAUSES = [
    { id: 'zusatz', title: 'Zusätzliche Arbeiten nur nach Rücksprache', for: 'beide', on: true,
      text: 'Zusätzliche Arbeiten oder Materialien, die bei der Besichtigung nicht erkennbar waren, werden nur nach vorheriger Rücksprache und Zustimmung des Kunden durchgeführt.' },
    { id: 'verdeckt', title: 'Verdeckte Mängel / Zustand bei Besichtigung', for: 'beide', on: true,
      text: 'Grundlage dieses Kostenvoranschlags ist der bei der Besichtigung erkennbare Zustand. Verdeckte Mängel oder Schäden (z. B. unter Bezügen, hinter Wänden, im Untergrund) sind nicht berücksichtigt und werden nach Rücksprache gesondert angeboten.' },
    { id: 'regie', title: 'Schätzwerte, Abrechnung nach tatsächlichem Aufwand', for: 'unverbindlich', on: true,
      text: 'Mengen, Zeiten und Preise sind Schätzwerte. Abgerechnet wird nach tatsächlichem Aufwand und tatsächlich verbrauchtem Material.' },
    { id: 'umfang', title: 'Nur angeführte Leistungen enthalten', for: 'beide', on: true,
      text: 'Enthalten sind nur die ausdrücklich angeführten Leistungen. Nicht angeführte Leistungen (z. B. Entsorgung, Abholung und Lieferung, Behördenwege) werden gesondert verrechnet.' },
    { id: 'termine', title: 'Termine unverbindlich', for: 'beide', on: true,
      text: 'Angegebene Fertigstellungs- und Liefertermine sind unverbindlich, sofern sie nicht ausdrücklich schriftlich als fix vereinbart wurden. Bei Lieferengpässen oder höherer Gewalt verschieben sich Termine entsprechend.' },
    { id: 'zahlung', title: 'Zahlungsziel 14 Tage', for: 'beide', on: true,
      text: 'Zahlbar innerhalb von 14 Tagen nach Rechnungserhalt ohne Abzug.' },
    { id: 'anzahlung', title: 'Anzahlung bei Auftrag', for: 'beide', on: false,
      text: 'Bei Auftragserteilung ist eine Anzahlung von 30 % der voraussichtlichen Auftragssumme fällig.' },
    { id: 'material', title: 'Materialpreise zum Stichtag', for: 'beide', on: false,
      text: 'Die angeführten Materialpreise gelten zum Datum dieses Kostenvoranschlags und für die angegebene Gültigkeitsdauer.' },
    { id: 'mitwirkung', title: 'Mitwirkung des Kunden', for: 'beide', on: false,
      text: 'Der Kunde ermöglicht rechtzeitig den freien Zugang zur Arbeitsstelle und stellt Strom und Wasser kostenlos zur Verfügung.' },
    { id: 'eigentum', title: 'Eigentumsvorbehalt', for: 'beide', on: false,
      text: 'Gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.' },
    { id: 'storno', title: 'Stornierung nach Auftrag', for: 'beide', on: false,
      text: 'Wird der Auftrag nach Erteilung vom Kunden storniert, sind bereits erbrachte Leistungen und bereits bestelltes Material zu bezahlen.' },
    { id: 'gewaehr', title: 'Gesetzliche Gewährleistung', for: 'beide', on: false,
      text: 'Es gilt die gesetzliche Gewährleistung.' },
    { id: 'fagg', title: 'Rücktrittsrecht (Verbraucher, außerhalb der Geschäftsräume)', for: 'beide', on: false,
      text: 'Hinweis für Verbraucher: Bei außerhalb unserer Geschäftsräume geschlossenen Verträgen besteht ein Rücktrittsrecht von 14 Tagen ab Vertragsabschluss (FAGG). Die Rücktrittsbelehrung samt Muster-Widerrufsformular erhalten Sie gesondert.' },
    { id: 'recht', title: 'Österreichisches Recht', for: 'beide', on: false,
      text: 'Es gilt österreichisches Recht.' },
  ];

  const str = (v, max) => String(v == null ? '' : v).slice(0, max);
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const safeId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id);

  function cleanClauses(list, max = 100) {
    return (Array.isArray(list) ? list.slice(0, max) : [])
      .map((c) => ({
        id: safeId(c && c.id) ? c.id : '', title: str(c && c.title, 120).replace(/[\r\n]+/g, ' ').trim(), text: str(c && c.text, 1500).trim(),
        for: ['beide', 'unverbindlich', 'verbindlich'].includes(c && c.for) ? c.for : 'beide', on: !!(c && c.on),
      })).filter((c) => c.id && c.text);
  }

  // Aus Oberfläche, Datei oder Sicherung: nie etwas ungeprüft übernehmen.
  function cleanEstimate(e) {
    if (!e || typeof e !== 'object' || !safeId(e.id)) return null;
    return {
      id: e.id, docType: 'estimate', number: str(e.number, 50), date: isDate(e.date) ? e.date : '', validUntil: isDate(e.validUntil) ? e.validUntil : '',
      inspectionDate: isDate(e.inspectionDate) ? e.inspectionDate : '', subject: str(e.subject, 300).replace(/[\r\n]+/g, ' ').trim(),
      kind: KINDS.includes(e.kind) ? e.kind : 'unverbindlich', status: STATUSES.includes(e.status) ? e.status : 'offen',
      customer: str(e.customer, 300), customerAddress: str(e.customerAddress, 1000), customerUid: str(e.customerUid, 50),
      items: (Array.isArray(e.items) ? e.items.slice(0, 1000) : []).map((it) => ({ description: str(it && it.description, 500), qty: num(it && it.qty), price: num(it && it.price) })),
      discount: num(e.discount), taxRate: num(e.taxRate), taxNote: str(e.taxNote, 1000), currency: str(e.currency, 10),
      fee: Math.max(0, num(e.fee)), creditFee: e.creditFee !== false,
      clauses: cleanClauses(e.clauses).map(({ id, text }) => ({ id, text })), notes: str(e.notes, 3000),
      createdAt: str(e.createdAt, 40), updatedAt: str(e.updatedAt, 40),
    };
  }

  // Gültig bis = Datum + Tage (reines Kalenderrechnen, unabhängig von Zeitzone)
  function addDays(iso, days) {
    if (!isDate(iso)) return '';
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + (Number(days) || 0));
    return d.toISOString().slice(0, 10);
  }

  const kindTitle = (kind) => (kind === 'verbindlich' ? 'Verbindlicher Kostenvoranschlag' : 'Unverbindlicher Kostenvoranschlag');

  // Pflichttext je Art (gesetzlich begründet, nicht abwählbar)
  function kindText(kind) {
    return kind === 'verbindlich'
      ? 'Für die Richtigkeit dieses Kostenvoranschlags wird Gewähr geleistet (§ 1170a Abs. 1 ABGB). Der angeführte Preis gilt für die ausdrücklich angeführten Leistungen.'
      : 'Dieser Kostenvoranschlag ist unverbindlich. Die angeführten Preise sind geschätzt. Zeichnet sich eine wesentliche Überschreitung ab, informieren wir den Kunden unverzüglich (§ 1170a Abs. 2 ABGB).';
  }

  function build(est, settings) {
    const e = est || {}, esc = H.esc;
    const kind = KINDS.includes(e.kind) ? e.kind : 'unverbindlich';
    const bullets = [kindText(kind)];
    if (e.validUntil) bullets.push(`Dieser Kostenvoranschlag ist gültig bis ${H.date(e.validUntil)}.`);
    if (Number(e.fee) > 0) bullets.push(`Für die Erstellung dieses Kostenvoranschlags wird ein Entgelt von ${H.money(e.fee)} ${e.currency || settings.currency || '€'} (netto) verrechnet.${e.creditFee !== false ? ' Bei Auftragserteilung wird es auf den Rechnungsbetrag angerechnet.' : ''}`);
    (e.clauses || []).forEach((c) => c && c.text && bullets.push(c.text));
    const list = `<div class="terms"><b>Bedingungen und Hinweise</b><ol>${bullets.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
    const sign = `<div class="accept"><b>Auftragserteilung</b><p>Wir nehmen diesen Kostenvoranschlag an und erteilen den Auftrag.</p>
      <div class="sig"><div><span></span>Ort, Datum</div><div><span></span>Unterschrift Kunde</div></div></div>`;
    const css = `.terms { margin-top: 16px; color: #333; font-size: 11px; line-height: 1.4; break-inside: avoid; }
  .terms b, .accept b { color: ${/^#[0-9a-fA-F]{6}$/.test(settings.color || '') ? settings.color : '#1f6feb'}; font-size: 13px; }
  .terms ol { margin: 6px 0 0; padding-left: 18px; } .terms li { margin-bottom: 3px; }
  .accept { margin-top: 14px; break-inside: avoid; font-size: 12px; } .accept p { margin: 3px 0 22px; }
  .sig { display: flex; gap: 40px; } .sig div { flex: 1; font-size: 11px; color: #555; } .sig span { display: block; border-top: 1px solid #333; margin-bottom: 4px; }`;
    return H.layout(e, settings, {
      docTitle: kindTitle(kind), titleSize: 20, pageTitle: kindTitle(kind) + ' ' + (e.number || ''), qr: false, customerLabel: 'Kunde', extraCss: css,
      rows: H.itemRows(e), sum: H.sumBlock(e, settings, kind === 'verbindlich' ? 'Gesamtbetrag (Fixpreis)' : 'Voraussichtlicher Gesamtbetrag'),
      meta: `<b>Nummer:</b> ${esc(e.number)}<br><b>Datum:</b> ${H.date(e.date)}${e.validUntil ? `<br><b>Gültig bis:</b> ${H.date(e.validUntil)}` : ''}${e.inspectionDate ? `<br><b>Besichtigung am:</b> ${H.date(e.inspectionDate)}` : ''}${e.subject ? `<br><b>Betreff:</b> ${esc(e.subject)}` : ''}`,
      after: `${list}${e.notes ? `<div class="notes"><b>Weitere Hinweise:</b><br>${esc(e.notes)}</div>` : ''}${sign}`,
    });
  }

  return { KINDS, STATUSES, DEFAULT_CLAUSES, DEFAULT_VALID_DAYS, cleanEstimate, cleanClauses, addDays, kindTitle, kindText, build };
});
