const logo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" rx="8" fill="#0b7a4b"/><text x="60" y="38" font-size="26" fill="#fff" text-anchor="middle" font-family="Arial">LOGO</text></svg>').toString('base64');
exports.settings = { companyName: 'Muster GmbH', address: 'Margaretengürtel 52-56\n1050 Wien', uid: 'ATU12345678', bank: 'BAWAG', iban: 'AT61 1904 3002 3457 3201', bic: 'BAWAATWW', phone: '+43 681 1234567', email: 'office@muster.at', color: '#0b7a4b', logo, currency: '€' };
exports.invoice = {
  number: '01102601', date: '2026-10-01', serviceDate: '2026-09-28', customer: 'Beispiel KG', customerAddress: 'Mariahilfer Straße 10\n1070 Wien', customerUid: 'ATU87654321',
  discount: 50, taxRate: 0, taxNote: 'Umsatzsteuerfrei gemäß § 6 Abs. 1 Z 27 UStG.', notes: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
  items: [
    { description: 'Webdesign', qty: 1, price: 2500 },
    { description: 'Hosting (jährlich)', qty: 2, price: 300.5 },
    { description: 'Support (Stunden)', qty: 5, price: 80 },
  ],
};
// Zweites Beispiel mit 20 % USt.
exports.invoice20 = { ...exports.invoice, number: '01102602', taxRate: 20, taxNote: '' };
