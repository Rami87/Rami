// يولّد sample/*.pdf من نفس قالب الفاتورة باستخدام Chromium (بدون إنترنت).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const InvoiceHtml = require('../src/invoice-html');
const { settings, invoice, invoice20 } = require('./sample-data');

(async () => {
  const exe = process.env.CHROMIUM_PATH || [
    '/opt/pw-browsers/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  fs.mkdirSync(path.join(__dirname, '..', 'sample'), { recursive: true });
  let out;
  for (const [name, inv] of [['rechnung-muster.pdf', invoice], ['rechnung-muster-20.pdf', invoice20]]) {
    await page.setContent(InvoiceHtml.build(inv, settings));
    out = path.join(__dirname, '..', 'sample', name);
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('wrote', out, fs.statSync(out).size, 'bytes');
  }
  await browser.close();
})();
