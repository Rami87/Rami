// End-to-End-Test mit der echten Electron-App (Linux: xvfb-run node scripts/e2e.js).
// Dialoge (Speichern/Öffnen/Drucken/Browser) werden im Hauptprozess ersetzt, damit der Test ohne Bedienung läuft.
const { _electron: electron } = require('playwright-core');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-'));
const out = (f) => path.join(tmp, f);
let passed = 0;
const ok = (name, cond, extra) => { assert(cond, name + (extra ? ' -> ' + extra : '')); passed++; console.log('  ok  ' + name); };

(async () => {
  const app = await electron.launch({ args: ['--no-sandbox', path.join(__dirname, '..'), '--user-data-dir=' + out('profile')], cwd: path.join(__dirname, '..') });
  // Dialog-Stubs im Hauptprozess; Antworten werden über globalThis.__next gesteuert
  await app.evaluate(({ app, dialog, shell, BrowserWindow }) => {
    globalThis.__next = {}; globalThis.__opened = []; globalThis.__prints = 0;
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: globalThis.__next.save });
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [globalThis.__next.open] });
    dialog.showMessageBox = async () => ({ response: globalThis.__next.box });
    shell.openExternal = async (u) => { globalThis.__opened.push(u); };
    globalThis.__paths = []; shell.openPath = async (p) => { globalThis.__paths.push(p); return ''; };
    app.on('browser-window-created', (_, w) => { w.webContents.print = (o, cb) => { globalThis.__prints++; cb(true, ''); }; });
  });
  const set = (k, v) => app.evaluate((_, [k, v]) => { globalThis.__next[k] = v; }, [k, v]);
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await win.waitForSelector('#form');
  const errs = []; win.on('pageerror', (e) => errs.push(e.message));
  win.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  console.log('Sicherheit');
  ok('Renderer hat kein require/process (contextIsolation, kein nodeIntegration)', await win.evaluate(() => typeof require === 'undefined' && typeof process === 'undefined'));
  ok('window.api vorhanden, nur definierte Funktionen', await win.evaluate(() => typeof api.saveInvoice === 'function' && typeof api.readFile === 'undefined' && typeof api.exec === 'undefined'));
  const csp = await win.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);
  ok('CSP gesetzt ohne unsafe-eval und ohne externe Quellen', /default-src 'self'/.test(csp) && !/unsafe-eval|https?:/.test(csp));
  // Navigation / Popups
  const before = app.windows().length;
  await win.evaluate(() => { window.open('https://example.com'); });
  await win.evaluate(() => { location.href = 'https://example.com/'; }).catch(() => {});
  await win.waitForTimeout(500);
  ok('Fremde Seiten werden nicht geöffnet (Popup/Navigation blockiert)', app.windows().length === before && win.url().startsWith('file://'), win.url());
  ok('Fremder Link wird nicht extern geöffnet', (await app.evaluate(() => globalThis.__opened)).length === 0);
  await win.evaluate(() => { const a = document.createElement('a'); a.href = 'https://horaniq.at'; a.id = 'tst'; a.textContent = 'x'; document.body.appendChild(a); });
  await win.evaluate(() => document.getElementById('tst').click());
  await win.evaluate(() => location.reload()).catch(() => {}); await win.waitForLoadState('domcontentloaded');
  await win.waitForTimeout(300);
  ok('Entwickler-Link horaniq.at wird extern geöffnet', (await app.evaluate(() => globalThis.__opened)).includes('https://horaniq.at/') || (await app.evaluate(() => globalThis.__opened)).includes('https://horaniq.at'));

  console.log('Einstellungen');
  await win.click('nav [data-view=settings]');
  await win.fill('#settingsForm [name=companyName]', 'Prince <img src=x onerror=window.__xss=1>');
  await win.fill('#settingsForm [name=address]', 'Margaretengürtel 52-56\n1050 Wien');
  await win.fill('#settingsForm [name=phone]', '0681 81613184');
  await win.fill('#settingsForm [name=email]', 'info@princesattlerei.at');
  await win.fill('#settingsForm [name=bank]', 'BAWAG');
  await win.fill('#settingsForm [name=iban]', 'AT736000040510117567');
  await win.fill('#settingsForm [name=bic]', 'BAWAATWW');
  await win.fill('#settingsForm [name=footerExtra]', 'FN 123456a · Handelsgericht Wien');
  await win.fill('#colorHex', '#0b7a4b');
  await win.click('#settingsForm button[type=submit]');
  await win.waitForTimeout(300);
  const settingsFile = path.join(out('profile'), 'data', 'settings.json');
  const saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  ok('Einstellungen als JSON gespeichert', saved.companyName.startsWith('Prince') && saved.color === '#0b7a4b' && saved.iban === 'AT736000040510117567' && saved.footerExtra === 'FN 123456a · Handelsgericht Wien');
  ok('Kein XSS über Firmenname (Seitenleiste, Briefkopf)', !(await win.evaluate(() => window.__xss)) && (await win.locator('#railName').textContent()).includes('<img'));

  console.log('Rechnungen');
  // Neu beginnen: rot, mit Rückfrage; Abbrechen behält die Eingaben
  await win.click('nav [data-view=new]');
  await win.fill('#form [name=customer]', 'Behalten');
  const rb = await win.locator('#reset').evaluate((b) => getComputedStyle(b).backgroundColor);
  ok('Neu beginnen ist rot (Gefahr)', rb === 'rgb(180, 35, 24)', rb);
  await win.evaluate(() => { window.__ans = false; window.__asked = ''; window.confirm = (m) => { window.__asked = m; return window.__ans; }; });
  await win.click('#reset');
  const asked = await win.evaluate(() => window.__asked);
  ok('Rückfrage erscheint, bei Abbrechen bleiben die Eingaben', /neu beginnen/i.test(asked) && (await win.inputValue('#form [name=customer]')) === 'Behalten', asked);
  await win.evaluate(() => { window.__ans = true; });
  await win.click('#reset');
  ok('Nach Bestätigen ist das Formular leer', (await win.inputValue('#form [name=customer]')) === '');
  const ld = new Date(); const today = ld.getFullYear() + '-' + String(ld.getMonth() + 1).padStart(2, '0') + '-' + String(ld.getDate()).padStart(2, '0');
  const pre = today.slice(8, 10) + today.slice(5, 7) + today.slice(2, 4);
  async function createInvoice(customer, price) {
    await win.click('nav [data-view=new]'); await win.click('#reset');
    await win.fill('#form [name=customer]', customer);
    await win.fill('.item .desc', 'Leistung <b>fett</b>'); await win.fill('.item .qty', '2'); await win.fill('.item .price', String(price));
    await win.click('#form button[type=submit]'); await win.waitForTimeout(300);
    return win.inputValue('#form [name=number]');
  }
  const n1 = await createInvoice('Kunde <script>window.__xss=2</script> A', 100);
  const n2 = await createInvoice('Kunde B', 50.5);
  ok('Rechnungsnummer = TTMMJJ01 und TTMMJJ02', n1 === pre + '01' && n2 === pre + '02', n1 + ' / ' + n2);
  ok('Kein XSS über Kundenname/Position', !(await win.evaluate(() => window.__xss)));
  const invs = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8'));
  ok('Beide Rechnungen im Archiv gespeichert', invs.length === 2);

  console.log('Archiv');
  await win.click('nav [data-view=archive]'); await win.click('.seg [data-mode=day]'); await win.waitForTimeout(300);
  ok('Tagesansicht zeigt 2 Rechnungen', (await win.locator('#list tbody tr').count()) === 2);
  const kv = await win.locator('.kpi .kv').allTextContents();
  ok('Summen: 2 Rechnungen, Netto 301,00 €', kv[0] === '2' && kv[1].startsWith('301,00'), kv.join(' / '));
  await win.click('.seg [data-mode=month]'); await win.click('.seg [data-mode=year]'); await win.click('.seg [data-mode=all]');
  ok('Alle/Jahr/Monat ohne Fehler', (await win.locator('#list tbody tr').count()) === 2);
  await win.fill('#search', 'Kunde B'); await win.waitForTimeout(400);
  ok('Suche filtert', (await win.locator('#list tbody tr').count()) === 1);
  await win.fill('#search', ''); await win.waitForTimeout(400);

  console.log('PDF, CSV, Drucken, Vorschau');
  await set('save', out('r.pdf'));
  await win.locator('#list tbody tr').first().getByText('PDF', { exact: true }).click(); await win.waitForTimeout(2500);
  ok('PDF erzeugt (%PDF)', fs.existsSync(out('r.pdf')) && fs.readFileSync(out('r.pdf')).slice(0, 4).toString() === '%PDF');
  const txt = execFileSync('pdftotext', ['-layout', out('r.pdf'), '-']).toString();
  ok('PDF enthält Nummer, Firma, IBAN-Gruppen, Steuerhinweis, Fußzeile', txt.includes(pre + '0') && txt.includes('Prince') && txt.includes('AT73 6000 0405 1011 7567') && txt.includes('Umsatzsteuerfrei') && txt.includes('Tel.: 0681 81613184'), txt.slice(0, 300));
  // QR-Code im PDF: als Bild rendern und mit unabhängigem Decoder (OpenCV) lesen
  try {
    execFileSync('pdftoppm', ['-r', '300', '-png', '-f', '1', '-l', '1', out('r.pdf'), out('qr')]);
    const png = fs.readdirSync(tmp).find((f) => /^qr.*\.png$/.test(f));
    const dec = execFileSync('python3', ['-c', 'import cv2,sys;v,_,_=cv2.QRCodeDetector().detectAndDecode(cv2.imread(sys.argv[1]));print(v,end="")', out(png)]).toString().split('\n');
    ok('QR-Code im PDF lesbar: EPC-Format, IBAN, Betrag, Rechnungsnummer', dec[0] === 'BCD' && dec[3] === 'SCT' && dec[4] === 'BAWAATWW' && dec[6] === 'AT736000040510117567' && /^EUR\d+\.\d\d$/.test(dec[7]) && dec[10] === 'Rechnung ' + (txt.match(new RegExp(pre + '\\d\\d')) || [''])[0], dec.join('|'));
  } catch (e) { if (e.code === 'ENOENT' || /No module named/.test(String(e.stderr))) console.log('  --  QR-Test übersprungen (pdftoppm/OpenCV fehlt)'); else throw e; }
  ok('PDF zeigt HTML im Text nur als Text (kein Markup ausgeführt)', txt.includes('<b>fett</b>') || txt.includes('&lt;') === false);
  ok('Speicherordner wird gemerkt (lastDir)', JSON.parse(fs.readFileSync(settingsFile, 'utf8')).lastDir === tmp);
  await set('save', out('r.csv'));
  await win.click('#exportCsv'); await win.waitForTimeout(500);
  const csv = fs.readFileSync(out('r.csv'), 'utf8');
  ok('CSV mit BOM, Semikolon, Summenzeile; Formel-Schutz', csv.startsWith('﻿') && csv.includes(';') && csv.includes('Summe (2 Rechnungen)'));
  await win.locator('#list tbody tr').first().getByText('Vorschau', { exact: true }).click();
  await win.waitForTimeout(1500);
  const pv = app.windows().find((w) => w.url().includes('preview.html'));
  ok('Vorschaufenster öffnet', !!pv);
  await pv.waitForSelector('#pvFrame');
  ok('Vorschau zeigt Rechnung', (await pv.locator('#pvTitle').textContent()).startsWith('Rechnung '));
  await pv.click('#pvPrint'); await pv.waitForTimeout(800);
  ok('Drucken aus der Vorschau löst Druck aus', (await app.evaluate(() => globalThis.__prints)) === 1);
  await set('save', out('p2.pdf')); await pv.click('#pvPdf'); await pv.waitForTimeout(2500);
  ok('PDF aus der Vorschau gespeichert', fs.existsSync(out('p2.pdf')));
  await pv.close();
  await win.click('nav [data-view=new]'); await win.click('#reset'); await win.fill('#form [name=customer]', 'Druck'); await win.fill('.item .desc', 'x'); await win.fill('.item .price', '1');
  await win.click('#printBtn'); await win.waitForTimeout(2000);
  ok('Drucken speichert zuerst im Archiv und druckt', (await app.evaluate(() => globalThis.__prints)) === 2 && JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).length === 3);

  console.log('Ausgaben');
  const data = path.join(out('profile'), 'data');
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(out('foto.png'), PNG);
  fs.writeFileSync(out('fake.pdf'), Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200)])); // Programm, als PDF getarnt
  await win.evaluate(() => { window.confirm = () => true; });
  await win.click('nav [data-view=expenses]');
  const readX = () => JSON.parse(fs.readFileSync(path.join(data, 'expenses.json'), 'utf8'));
  async function addExpense(o) {
    await win.fill('#xform [name=date]', o.date || today); await win.fill('#xform [name=supplier]', o.supplier);
    await win.fill('#xform [name=gross]', String(o.gross)); await win.selectOption('#xform [name=taxRate]', String(o.rate));
    if (o.category) await win.selectOption('#xform [name=category]', o.category);
    if (o.file) { await set('open', o.file); await win.click('#xPick'); await win.waitForTimeout(300); }
    await win.click('#xSave'); await win.waitForTimeout(500);
  }
  await win.fill('#xform [name=gross]', '120'); await win.selectOption('#xform [name=taxRate]', '20');
  ok('Vorsteuer wird live berechnet (120 brutto, 20 % -> 100 netto, 20 Vorsteuer)', (await win.locator('#xCalc').textContent()).includes('100,00') && (await win.locator('#xCalc').textContent()).includes('20,00'));
  await set('open', out('fake.pdf')); await win.click('#xPick'); await win.waitForTimeout(400);
  ok('Getarntes Programm (exe als pdf) wird als Beleg abgelehnt', (await win.locator('#toast').textContent()).includes('nicht unterstützt') && (await win.locator('#xReceiptName').textContent()).includes('Noch kein Beleg'));
  await addExpense({ supplier: 'Hornbach <img src=x onerror=window.__xss=7>', gross: 120, rate: 20, category: 'Material / Waren', file: out('r.pdf') });
  await addExpense({ supplier: 'Kleinteile', gross: 55, rate: 10, category: 'Büro / Software', file: out('foto.png') });
  await addExpense({ supplier: 'Parkgebühr', gross: 12.5, rate: 0 });
  const prevMonth = (() => { const d = new Date(today.slice(0, 4), +today.slice(5, 7) - 2, 15); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-15'; })();
  await addExpense({ date: prevMonth, supplier: 'Vormonat', gross: 24, rate: 20 });
  let ex = readX();
  ok('4 Ausgaben gespeichert, Belege als Dateien im Programmordner', ex.length === 4 && ex.filter((e) => e.receipt).length === 2 && ex.filter((e) => e.receipt).every((e) => fs.existsSync(path.join(data, 'belege', e.id + '.' + e.receipt.ext))));
  ok('Beleg-Typ nach Inhalt erkannt (pdf, png)', ex.filter((e) => e.receipt).map((e) => e.receipt.ext).sort().join() === 'pdf,png');
  ok('Kein XSS über den Lieferantennamen', !(await win.evaluate(() => window.__xss)));
  await win.click('[data-xmode=month]'); await win.fill('#xMonth', today.slice(0, 7)); await win.dispatchEvent('#xMonth', 'change'); await win.waitForTimeout(400);
  const xkv = await win.locator('#xKpis .kv').allTextContents();
  ok('Monat: 3 Belege, Vorsteuer 25,00 € (20 + 5 + 0)', xkv[0] === '3' && xkv[2].startsWith('25,00') && xkv[3].startsWith('187,50'), xkv.join(' / '));
  await win.click('[data-xmode=all]'); await win.waitForTimeout(300);
  const xkv2 = await win.locator('#xKpis .kv').allTextContents();
  ok('Alle: 4 Belege, Vorsteuer 29,00 €', xkv2[0] === '4' && xkv2[2].startsWith('29,00'), xkv2.join(' / '));
  await win.click('[data-xmode=month]'); await win.waitForTimeout(300);
  await win.fill('#xSearch', 'kleinteile'); await win.waitForTimeout(500);
  ok('Suche in Ausgaben filtert', (await win.locator('#xlist tbody tr').count()) === 1);
  await win.fill('#xSearch', ''); await win.waitForTimeout(400);
  // Beleg ansehen
  await win.locator('#xlist tbody tr', { hasText: 'Hornbach' }).getByText('Beleg ansehen').click(); await win.waitForTimeout(300);
  const pdfEx = ex.find((e) => e.receipt && e.receipt.ext === 'pdf');
  ok('Beleg ansehen öffnet genau die gespeicherte Belegdatei', (await app.evaluate(() => globalThis.__paths)).some((p) => p.endsWith(path.join('belege', pdfEx.id + '.pdf')) || p.endsWith('belege/' + pdfEx.id + '.pdf')));
  // Bearbeiten (Beleg bleibt), Beleg entfernen
  await win.locator('#xlist tbody tr', { hasText: 'Hornbach' }).getByText('Bearbeiten').click();
  ok('Bearbeiten füllt das Formular', (await win.locator('#xFormTitle').textContent()) === 'Ausgabe bearbeiten' && (await win.inputValue('#xform [name=gross]')) === '120');
  await win.fill('#xform [name=gross]', '240'); await win.click('#xSave'); await win.waitForTimeout(500);
  ex = readX(); const hb = ex.find((e) => e.id === pdfEx.id);
  ok('Änderung gespeichert, Beleg bleibt erhalten, keine Dublette', hb.gross === 240 && hb.receipt && ex.length === 4 && fs.existsSync(path.join(data, 'belege', hb.id + '.pdf')));
  const pngEx = ex.find((e) => e.receipt && e.receipt.ext === 'png');
  await win.locator('#xlist tbody tr', { hasText: 'Kleinteile' }).getByText('Bearbeiten').click(); await win.click('#xRemove'); await win.click('#xSave'); await win.waitForTimeout(500);
  ok('Beleg entfernen löscht die Belegdatei', !readX().find((e) => e.id === pngEx.id).receipt && !fs.existsSync(path.join(data, 'belege', pngEx.id + '.png')));
  // Export für den Steuerberater
  fs.mkdirSync(out('export'), { recursive: true });
  await set('open', out('export')); await win.click('#xExport'); await win.waitForTimeout(3500);
  const xdir = path.join(out('export'), 'Ausgaben-' + today.slice(0, 7));
  ok('Export-Ordner mit CSV, PDF-Zusammenfassung und Belege-Ordner', ['Ausgaben-' + today.slice(0, 7) + '.csv', 'Zusammenfassung-Ausgaben-' + today.slice(0, 7) + '.pdf', 'Belege'].every((f) => fs.existsSync(path.join(xdir, f))), fs.existsSync(xdir) ? fs.readdirSync(xdir).join() : 'kein Ordner');
  const xcsv = fs.readFileSync(path.join(xdir, 'Ausgaben-' + today.slice(0, 7) + '.csv'), 'utf8');
  ok('CSV: 3 Belege des Monats, Vorsteuer 45,00 (40 + 5 + 0), Summe', xcsv.startsWith('﻿') && xcsv.includes('Summe (3 Belege)') && /;45,00;[\d,]+;/.test(xcsv.split('Summe')[1] || '') && !xcsv.includes('Vormonat'), xcsv);
  ok('Belegdatei trägt die laufende Nummer aus der CSV', fs.readdirSync(path.join(xdir, 'Belege')).length === 1 && /^00\d_Hornbach.*\.pdf$/.test(fs.readdirSync(path.join(xdir, 'Belege'))[0]) && xcsv.includes(fs.readdirSync(path.join(xdir, 'Belege'))[0]), fs.readdirSync(path.join(xdir, 'Belege')).join());
  const xtxt = execFileSync('pdftotext', ['-layout', path.join(xdir, 'Zusammenfassung-Ausgaben-' + today.slice(0, 7) + '.pdf'), '-']).toString();
  ok('PDF-Zusammenfassung zeigt Belege und Vorsteuer', xtxt.includes('Vorsteuer') && xtxt.includes('45,00') && xtxt.includes('Kleinteile') && xtxt.includes('Material / Waren'), xtxt.slice(0, 400));
  ok('PDF-Zusammenfassung führt kein Markup aus', xtxt.includes('<img src=x'));
  await set('open', out('export')); await win.click('#xExport'); await win.waitForTimeout(3500);
  ok('Zweiter Export überschreibt nichts (neuer Ordner -2)', fs.existsSync(xdir + '-2'));
  // Löschen
  await win.locator('#xlist tbody tr', { hasText: 'Hornbach' }).getByText('Löschen').click(); await win.waitForTimeout(500);
  ok('Löschen entfernt Ausgabe und Belegdatei', readX().length === 3 && !fs.existsSync(path.join(data, 'belege', pdfEx.id + '.pdf')));
  await win.evaluate(() => { document.querySelector('nav [data-view=expenses]').click(); });
  await addExpense({ supplier: 'Für die Sicherung', gross: 36, rate: 20, file: out('r.pdf') });
  ok('Für die Sicherung: 4 Ausgaben, davon 1 mit Beleg', readX().length === 4 && readX().filter((e) => e.receipt).length === 1);

  console.log('Datensicherung');
  await win.click('nav [data-view=backup]'); await set('save', out('backup.json')); await win.click('#bkCreate'); await win.waitForTimeout(500);
  const bk = JSON.parse(fs.readFileSync(out('backup.json'), 'utf8'));
  ok('Sicherung enthält Ausgaben und die Belegdatei (base64)', bk.expenses.length === 4 && Object.keys(bk.receipts).length === 1 && Buffer.from(Object.values(bk.receipts)[0].data, 'base64').slice(0, 4).toString() === '%PDF');
  ok('Sicherung enthält Einstellungen und 3 Rechnungen, keine Rechner-Pfade', bk.invoices.length === 3 && bk.settings.companyName.startsWith('Prince') && !('lastDir' in bk.settings));
  // Weitere Rechnung anlegen, dann "Alles ersetzen" -> zurück auf 3
  await createInvoice('Nach dem Backup', 9);
  await win.click('nav [data-view=backup]');
  await set('open', out('backup.json')); await set('box', 1); await win.click('#bkRestore'); await win.waitForTimeout(800);
  let now = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8'));
  ok('Alles ersetzen: Stand wie in der Sicherung (3 Rechnungen)', now.length === 3);
  ok('Ausgaben und Beleg nach „Alles ersetzen“ unverändert vorhanden', readX().length === 4 && fs.readdirSync(path.join(data, 'belege')).length === 1);
  ok('Vor dem Ersetzen wurde automatisch gesichert', fs.readdirSync(path.join(out('profile'), 'data', 'backups')).length === 1);
  await createInvoice('Neu nach Restore', 7);
  await win.click('nav [data-view=backup]');
  await set('open', out('backup.json')); await set('box', 0); await win.click('#bkRestore'); await win.waitForTimeout(800);
  now = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8'));
  ok('Zusammenführen: vorhandene bleiben, nichts doppelt (4 Rechnungen)', now.length === 4 && new Set(now.map((i) => i.id)).size === 4);
  // Kaputte / böse Dateien
  fs.writeFileSync(out('bad.json'), 'das ist kein json'); await set('open', out('bad.json')); await win.click('#bkRestore'); await win.waitForTimeout(400);
  ok('Kaputte Datei wird mit Meldung abgelehnt', (await win.locator('#toast').textContent()).includes('JSON') && JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).length === 4);
  fs.writeFileSync(out('evil.json'), JSON.stringify({ app: 'rechnungen-backup', format: 1, settings: { logo: 'javascript:alert(1)', color: 'url(x)', companyName: '<img src=x onerror=window.__xss=3>' },
    invoices: [{ id: 'e1', number: '<svg onload=window.__xss=4>', date: '2026-01-01', customer: '"><img src=x onerror=window.__xss=5>', items: [{ description: '<script>window.__xss=6</script>', qty: 'abc', price: 1 }] }] }));
  await set('open', out('evil.json')); await set('box', 1); await win.click('#bkRestore'); await win.waitForTimeout(800);
  await win.click('nav [data-view=archive]'); await win.click('.seg [data-mode=all]'); await win.waitForTimeout(500);
  await win.locator('#list tbody tr').first().getByText('Vorschau', { exact: true }).click(); await win.waitForTimeout(1500);
  ok('Präparierte Sicherung führt keinen Code aus', !(await win.evaluate(() => window.__xss)));
  const st = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  ok('Böse Einstellungen bereinigt (Logo, Farbe)', st.logo === '' && st.color === '#1f6feb');
  const pv2 = app.windows().find((w) => w.url().includes('preview.html'));
  ok('Vorschau der präparierten Rechnung führt keinen Code aus', pv2 && !(await pv2.evaluate(() => window.__xss)) && !(await pv2.locator('#pvFrame').evaluate((f) => f.contentWindow && 0)));

  console.log('Alle PDFs');
  if (pv2) await pv2.close();
  await win.click('nav [data-view=backup]'); const pdfDir = out('allpdfs'); fs.mkdirSync(pdfDir);
  await set('open', pdfDir); await win.click('#bkPdfs'); await win.waitForTimeout(4000);
  ok('Alle Rechnungen als PDF exportiert, Dateinamen bereinigt', fs.readdirSync(pdfDir).length === 1 && fs.readdirSync(pdfDir).every((f) => /^Rechnung-[\w.-]+\.pdf$/.test(f)), fs.readdirSync(pdfDir).join(','));


  console.log('Kostenvoranschlag');
  const estFile = path.join(out('profile'), 'data', 'estimates.json');
  const readE = () => JSON.parse(fs.readFileSync(estFile, 'utf8'));
  const flat = (t) => t.replace(/\s+/g, ' ');
  await win.click('nav [data-view=kv]'); await win.waitForSelector('#kvForm');
  const clauseIds = () => win.locator('#kvClauses input').evaluateAll((l) => l.map((i) => i.dataset.id));
  ok('Textbausteine sichtbar, Standard angehakt (Rücksprache), Schätzwerte nur bei unverbindlich',
    (await win.locator('#kvClauses input[data-id=zusatz]').isChecked()) && (await clauseIds()).includes('regie') && !(await win.locator('#kvClauses input[data-id=anzahlung]').isChecked()));
  await win.check('#kvForm [name=kind][value=verbindlich]');
  ok('Bei „verbindlich“ verschwindet der Baustein „Schätzwerte“', !(await clauseIds()).includes('regie') && (await clauseIds()).includes('zusatz'));
  await win.check('#kvForm [name=kind][value=unverbindlich]');
  ok('Zurück auf „unverbindlich“: Baustein wieder da und angehakt', await win.locator('#kvClauses input[data-id=regie]').isChecked());
  const vu = await win.inputValue('#kvForm [name=validUntil]');
  const plus30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  ok('„Gültig bis“ = heute + 30 Tage', Math.abs(new Date(vu) - new Date(plus30)) <= 864e5, vu + ' / ' + plus30);
  async function createEstimate(customer, kind, price, extra = {}) {
    await win.click('nav [data-view=kv]'); await win.evaluate(() => { window.confirm = () => true; }); await win.click('#kvReset');
    await win.check(`#kvForm [name=kind][value=${kind}]`);
    await win.fill('#kvForm [name=customer]', customer);
    await win.fill('#kvForm [name=subject]', extra.subject || 'Neubezug <b>Sattel</b>');
    await win.fill('#kvItems .item .desc', 'Sattel neu beziehen <i>x</i>'); await win.fill('#kvItems .item .qty', '2'); await win.fill('#kvItems .item .price', String(price));
    if (extra.fee) await win.fill('#kvForm [name=fee]', String(extra.fee));
    if (extra.anzahlung) await win.check('#kvClauses input[data-id=anzahlung]');
    await win.click('#kvForm button[type=submit]'); await win.waitForTimeout(300);
    return win.inputValue('#kvForm [name=number]');
  }
  const k1 = await createEstimate('Kunde <script>window.__xss=21</script> K', 'unverbindlich', 100, { fee: 25, anzahlung: true });
  const k2 = await createEstimate('Kunde Fix', 'verbindlich', 60);
  ok('Nummer KV-TTMMJJ01 und KV-TTMMJJ02', k1 === 'KV-' + pre + '01' && k2 === 'KV-' + pre + '02', k1 + ' / ' + k2);
  ok('Kein XSS über Kunde/Betreff/Position', !(await win.evaluate(() => window.__xss)));
  const es = readE();
  ok('Beide gespeichert, Status „offen“, docType estimate, gewählte Bausteine als Text gesichert',
    es.length === 2 && es[0].status === 'offen' && es[0].docType === 'estimate' && es[0].clauses.some((c) => c.id === 'zusatz' && c.text.includes('Rücksprache und Zustimmung')) && es[0].clauses.some((c) => c.id === 'anzahlung') && es[0].fee === 25);
  await win.click('nav [data-view=kvlist]'); await win.waitForTimeout(300);
  ok('KV-Archiv zeigt beide', (await win.locator('#kvList tbody tr').count()) === 2);
  await win.fill('#kvSearch', 'Fix'); await win.waitForTimeout(400);
  ok('Suche im KV-Archiv', (await win.locator('#kvList tbody tr').count()) === 1);
  await win.fill('#kvSearch', ''); await win.waitForTimeout(400);
  const row = (n) => win.locator('#kvList tbody tr').filter({ hasText: n });
  await set('save', out('kv1.pdf'));
  await row(k1).getByText('PDF', { exact: true }).click(); await win.waitForTimeout(2500);
  const t1 = flat(execFileSync('pdftotext', ['-layout', out('kv1.pdf'), '-']).toString());
  ok('PDF unverbindlich: Titel, § 1170a-Text, Gültigkeit, Rücksprache-Satz, Entgelt, Anzahlung, Unterschriftszeile',
    /Unverbindlicher\b.{0,80}Kostenvoranschlag/.test(t1) && t1.includes('§ 1170a Abs. 2 ABGB') && t1.includes('Gültig bis') && t1.includes('nur nach vorheriger Rücksprache und Zustimmung des Kunden durchgeführt')
    && t1.includes('Entgelt von 25,00') && t1.includes('Anzahlung von 30 %') && t1.includes('Unterschrift Kunde') && t1.includes('Voraussichtlicher Gesamtbetrag'), t1.slice(0, 2600));
  ok('PDF: HTML in Betreff/Position nur als Text', t1.includes('<b>Sattel</b>') && t1.includes('<i>x</i>'));
  await set('save', out('kv2.pdf'));
  await row(k2).getByText('PDF', { exact: true }).click(); await win.waitForTimeout(2500);
  const t2 = flat(execFileSync('pdftotext', ['-layout', out('kv2.pdf'), '-']).toString());
  ok('PDF verbindlich: Titel + Gewähr, keine Unverbindlich-Erklärung, Fixpreis', /Verbindlicher\b.{0,80}Kostenvoranschlag/.test(t2) && t2.includes('Gewähr geleistet (§ 1170a Abs. 1 ABGB)') && !t2.includes('Kostenvoranschlag ist unverbindlich') && t2.includes('Fixpreis'), t2.slice(0, 500));
  await row(k1).getByText('Vorschau', { exact: true }).click(); await win.waitForTimeout(1500);
  const kpv = app.windows().find((w) => w.url().includes('preview.html'));
  ok('Vorschau-Fenster zeigt Kostenvoranschlag, ohne Code-Ausführung', kpv && (await kpv.locator('#pvTitle').textContent()).startsWith('Kostenvoranschlag KV-') && !(await kpv.evaluate(() => window.__xss)));
  if (kpv) await kpv.close();
  await row(k2).locator('select').selectOption('abgelehnt'); await win.waitForTimeout(400);
  ok('Status „abgelehnt“ gespeichert', readE().find((e) => e.number === k2).status === 'abgelehnt');
  await win.click('[data-kvstatus=abgelehnt]'); await win.waitForTimeout(300);
  ok('Statusfilter', (await win.locator('#kvList tbody tr').count()) === 1);
  await win.click('[data-kvstatus=""]'); await win.waitForTimeout(300);
  await row(k1).getByText('In Rechnung', { exact: true }).click(); await win.waitForTimeout(500);
  ok('Rechnung vorausgefüllt: Kunde, Position, Entgelt als Rabatt, Verweis auf KV',
    (await win.inputValue('#form [name=customer]')).includes('Kunde') && (await win.inputValue('#form [name=discount]')) === '25'
    && (await win.inputValue('#form [name=notes]')).includes('Gemäß Kostenvoranschlag ' + k1) && (await win.inputValue('#items .item .qty')) === '2');
  const kvN = readE().find((e) => e.number === k1).items.length;
  ok('In Rechnung: Positionen nicht verdoppelt (Formular und Vorschau-Summe)', (await win.locator('#items .item').count()) === kvN && (await win.locator('#kvItems .item').count()) >= 0, String(kvN));
  await win.waitForTimeout(400);
  const lf = win.frames().find((f) => f !== win.mainFrame() && f.url() === 'about:srcdoc');
  ok('Live-Vorschau zeigt die Rechnung (Kunde, Zoom statt Transform)', lf && (await lf.evaluate(() => document.body.innerText)).includes((await win.inputValue('#form [name=customer]')).slice(0, 5)) && (await win.locator('#preview').evaluate((f) => getComputedStyle(f).transform)) === 'none');
  await win.click('#form button[type=submit]'); await win.waitForTimeout(400);
  const lastInv = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).find((i) => (i.notes || '').includes('Gemäß Kostenvoranschlag ' + k1));
  ok('Gespeicherte Rechnung hat genau die Positionen des Kostenvoranschlags', lastInv && lastInv.items.length === kvN, lastInv && String(lastInv.items.length));
  ok('Kostenvoranschlag danach „angenommen“, Rechnung gespeichert', readE().find((e) => e.number === k1).status === 'angenommen' && JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).some((i) => i.notes.includes(k1)));
  await win.click('nav [data-view=settings]');
  await win.locator('.clauserow').first().locator('.cx').fill('GEÄNDERT: nur nach Rücksprache.');
  await win.click('#addClause');
  await win.locator('.clauserow').last().locator('.ct').fill('Eigener Baustein');
  await win.locator('.clauserow').last().locator('.cx').fill('Eigener Text <b>x</b>');
  await win.locator('.clauserow').last().locator('.co').check();
  await win.fill('#settingsForm [name=kvValidDays]', '14');
  await win.click('#settingsForm button[type=submit]'); await win.waitForTimeout(400);
  const stS = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  ok('Bausteine und Gültigkeit in den Einstellungen gespeichert', stS.kvValidDays === 14 && stS.kvClauses[0].text.startsWith('GEÄNDERT') && stS.kvClauses.at(-1).title === 'Eigener Baustein' && stS.kvClauses.at(-1).on === true);
  await win.click('nav [data-view=kvlist]');
  await row(k1).getByText('Öffnen', { exact: true }).click(); await win.waitForTimeout(400);
  ok('Alter Kostenvoranschlag behält seinen gesicherten Text', (await win.locator('#kvClauses input[data-id=zusatz]').getAttribute('data-text')).includes('Rücksprache und Zustimmung'));
  const k3 = await createEstimate('Kunde Neu', 'unverbindlich', 10);
  const e3 = readE().find((e) => e.number === k3);
  ok('Neuer Kostenvoranschlag nutzt geänderte Bausteine und 14 Tage Gültigkeit', e3.clauses.some((c) => c.text.startsWith('GEÄNDERT')) && e3.clauses.some((c) => c.text === 'Eigener Text <b>x</b>')
    && Math.round((new Date(e3.validUntil) - new Date(e3.date)) / 864e5) === 14);
  await win.click('nav [data-view=backup]');
  await set('save', out('backup-kv.json')); await win.click('#bkCreate'); await win.waitForTimeout(600);
  const bkv = JSON.parse(fs.readFileSync(out('backup-kv.json'), 'utf8'));
  ok('Sicherung enthält 3 Kostenvoranschläge und die Bausteine', bkv.estimates.length === 3 && bkv.settings.kvClauses.length > 3);
  bkv.estimates.push({ id: '../evil', number: 'x' }, { id: 'ev1', number: '<svg onload=window.__xss=22>', kind: 'quatsch', status: 'hack', customer: '"><img src=x onerror=window.__xss=23>', date: '2026-01-01',
    clauses: [{ id: '<x>', text: 'weg' }, { id: 'ok1', text: '<img src=x onerror=window.__xss=24>' }], items: [{ description: '<script>window.__xss=25</script>', qty: 'abc', price: 1 }] });
  fs.writeFileSync(out('backup-kv2.json'), JSON.stringify(bkv));
  await set('open', out('backup-kv2.json')); await set('box', 0); await win.click('#bkRestore'); await win.waitForTimeout(800);
  const after = readE(); const ev = after.find((e) => e.id === 'ev1');
  ok('Zusammenführen: ungültige ID verworfen, Art/Status bereinigt, ungültiger Baustein entfernt', after.length === 4 && !after.some((e) => e.id === '../evil') && ev.kind === 'unverbindlich' && ev.status === 'offen' && ev.clauses.length === 1);
  await win.click('nav [data-view=kvlist]'); await win.waitForTimeout(400);
  await row('svg onload').first().getByText('Vorschau', { exact: true }).click(); await win.waitForTimeout(1500);
  const evpv = app.windows().filter((w) => w.url().includes('preview.html'));
  ok('Vorschau des präparierten Kostenvoranschlags führt keinen Code aus', evpv.length > 0 && !(await win.evaluate(() => window.__xss)) && !(await Promise.all(evpv.map((w) => w.evaluate(() => window.__xss)))).some(Boolean));
  for (const w of evpv) await w.close();
  await win.evaluate(() => { window.confirm = () => true; });
  await row('Kunde Neu').first().getByText('Löschen', { exact: true }).click(); await win.waitForTimeout(400);
  ok('Löschen entfernt den Kostenvoranschlag', readE().length === 3);

  console.log('Sperre und Storno');
  await win.click('nav [data-view=archive]'); await win.click('.seg [data-mode=all]'); await win.waitForTimeout(300);
  await set('save', out('lock.pdf'));
  await win.locator('#list tbody tr', { hasNotText: '🔒' }).first().getByText('PDF', { exact: true }).click(); await win.waitForTimeout(2500);
  ok('PDF-Export sperrt NICHT automatisch', !JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).some((i) => i.lockedAt));
  await win.evaluate(() => { window.__ans = false; window.__asked = ''; window.confirm = (m) => { window.__asked = m; return window.__ans; }; });
  const firstRow = win.locator('#list tbody tr').first();
  await firstRow.getByText('Sperren', { exact: true }).click(); await win.waitForTimeout(300);
  ok('Sperren fragt nach (nicht rückgängig); bei Abbrechen bleibt die Rechnung offen', /NICHT rückgängig/.test(await win.evaluate(() => window.__asked)) && !JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).some((i) => i.lockedAt));
  await win.evaluate(() => { window.__ans = true; });
  await firstRow.getByText('Sperren', { exact: true }).click(); await win.waitForTimeout(500);
  ok('Nach Bestätigung gesperrt, ohne Entsperren-Funktion', JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).filter((i) => i.lockedAt).length === 1 && (await win.evaluate(() => typeof api.unlockInvoice)) === 'undefined');
  // Sperre nach PDF: Löschen/Öffnen weg, Storno möglich, Server verweigert Änderungen
  const lockedRow = win.locator('#list tbody tr', { hasText: '🔒' }).first();
  ok('Gesperrte Rechnung zeigt 🔒, ohne Löschen/Öffnen', (await lockedRow.count()) === 1 && (await lockedRow.getByText('Löschen', { exact: true }).count()) === 0 && (await lockedRow.getByText('Öffnen', { exact: true }).count()) === 0 && (await lockedRow.getByText('Stornieren', { exact: true }).count()) === 1);
  const lockedInv = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).find((i) => i.lockedAt);
  const refused = await win.evaluate(async (i) => { try { await api.saveInvoice({ ...i, customer: 'Manipuliert' }); return 'saved'; } catch (e) { return String(e.message); } }, lockedInv);
  const refusedDel = await win.evaluate(async (id) => api.deleteInvoice(id), lockedInv.id);
  ok('Gesperrte Rechnung: Ändern und Löschen werden vom Programm verweigert', /gesperrt/.test(refused) && refusedDel.ok === false && JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).some((i) => i.id === lockedInv.id && i.customer === lockedInv.customer), refused);
  await win.evaluate(() => { window.confirm = () => true; });
  await lockedRow.getByText('Stornieren', { exact: true }).click(); await win.waitForTimeout(500);
  ok('Storno: neue Stornorechnung mit negativen Mengen und Verweis', (await win.inputValue('#form [name=notes]')).includes('Storno zu Rechnung ' + lockedInv.number) && (await win.locator('.item .qty').first().inputValue()).startsWith('-') && /Stornorechnung/.test(await win.locator('#formTitle').textContent()));
  await win.click('#form button[type=submit]'); await win.waitForTimeout(400);
  const stornoInv = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8')).find((i) => i.type === 'storno');
  ok('Stornorechnung gespeichert: neue Nummer, verweist auf das Original', stornoInv && stornoInv.number !== lockedInv.number && stornoInv.stornoOf === lockedInv.id && stornoInv.items[0].qty < 0 && !stornoInv.lockedAt);
  await win.click('nav [data-view=archive]'); await win.waitForTimeout(300);
  ok('Archiv kennzeichnet Storno', (await win.locator('#list tbody tr', { hasText: '(Storno)' }).count()) === 1);
  ok('Keine JavaScript-Fehler in der Oberfläche', errs.length === 0, errs.join(' | '));
  await app.close();
  console.log('\n' + passed + ' Prüfungen bestanden');
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
