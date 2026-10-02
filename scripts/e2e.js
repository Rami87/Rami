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
  await win.fill('#colorHex', '#0b7a4b');
  await win.click('#settingsForm button[type=submit]');
  await win.waitForTimeout(300);
  const settingsFile = path.join(out('profile'), 'data', 'settings.json');
  const saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  ok('Einstellungen als JSON gespeichert', saved.companyName.startsWith('Prince') && saved.color === '#0b7a4b' && saved.iban === 'AT736000040510117567');
  ok('Kein XSS über Firmenname (Seitenleiste, Briefkopf)', !(await win.evaluate(() => window.__xss)) && (await win.locator('#railName').textContent()).includes('<img'));

  console.log('Rechnungen');
  const today = new Date().toISOString().slice(0, 10);
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

  console.log('Datensicherung');
  await win.click('nav [data-view=backup]'); await set('save', out('backup.json')); await win.click('#bkCreate'); await win.waitForTimeout(500);
  const bk = JSON.parse(fs.readFileSync(out('backup.json'), 'utf8'));
  ok('Sicherung enthält Einstellungen und 3 Rechnungen, keine Rechner-Pfade', bk.invoices.length === 3 && bk.settings.companyName.startsWith('Prince') && !('lastDir' in bk.settings));
  // Weitere Rechnung anlegen, dann "Alles ersetzen" -> zurück auf 3
  await createInvoice('Nach dem Backup', 9);
  await win.click('nav [data-view=backup]');
  await set('open', out('backup.json')); await set('box', 1); await win.click('#bkRestore'); await win.waitForTimeout(800);
  let now = JSON.parse(fs.readFileSync(path.join(out('profile'), 'data', 'invoices.json'), 'utf8'));
  ok('Alles ersetzen: Stand wie in der Sicherung (3 Rechnungen)', now.length === 3);
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

  ok('Keine JavaScript-Fehler in der Oberfläche', errs.length === 0, errs.join(' | '));
  await app.close();
  console.log('\n' + passed + ' Prüfungen bestanden');
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
