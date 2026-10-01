const logo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" rx="8" fill="#0b7a4b"/><text x="60" y="38" font-size="26" fill="#fff" text-anchor="middle" font-family="Arial">LOGO</text></svg>').toString('base64');
exports.settings = { companyName: 'شركة النور للتجارة', address: 'شارع الملك فهد، الرياض\nهاتف: 0500000000', color: '#0b7a4b', logo, currency: 'ر.س' };
exports.invoice = {
  number: '1001', date: '2026-10-01', customer: 'مؤسسة الأمل', customerAddress: 'جدة، حي الروضة',
  discount: 50, taxRate: 15, notes: 'شكراً لتعاملكم معنا.\nالدفع خلال 14 يوماً.',
  items: [
    { description: 'خدمة تصميم موقع إلكتروني', qty: 1, price: 2500 },
    { description: 'استضافة سنوية (Hosting)', qty: 2, price: 300.5 },
    { description: 'دعم فني', qty: 5, price: 80 },
  ],
};
