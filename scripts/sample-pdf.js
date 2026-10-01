// يولّد sample/invoice-sample.pdf من نفس قالب الفاتورة باستخدام Chromium (بدون إنترنت).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const InvoiceHtml = require('../src/invoice-html');
const { settings, invoice } = require('./sample-data');

(async () => {
  const exe = process.env.CHROMIUM_PATH || [
    '/opt/pw-browsers/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  await page.setContent(InvoiceHtml.build(invoice, settings));
  const out = path.join(__dirname, '..', 'sample', 'invoice-sample.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('wrote', out, fs.statSync(out).size, 'bytes');
})();
