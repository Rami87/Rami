const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const D=__dirname;
async function go(file,wmm,hmm,pdf,png,scale){
 const p=await b.newPage({viewport:{width:Math.round(wmm*3.7795),height:Math.round(hmm*3.7795)},deviceScaleFactor:scale});
 await p.goto('file://'+path.join(D,file));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 await p.pdf({path:path.join(D,pdf),width:wmm+'mm',height:hmm+'mm',printBackground:true,preferCSSPageSize:true});
 await p.close();}
await go('visitenkarte.html',91,61,'HORANiQ_Visitenkarte_91x61mm_mit_3mm_Beschnitt.pdf');
await go('plakat-a3.html',303,426,'HORANiQ_Plakat_A3_mit_3mm_Beschnitt.pdf');
// PNG previews (screen)
const p=await b.newPage({viewport:{width:Math.round(303*3.7795),height:Math.round(426*3.7795)},deviceScaleFactor:1.4});
await p.goto('file://'+path.join(D,'plakat-a3.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
await p.screenshot({path:path.join(D,'vorschau-plakat.png')});
const c=await b.newPage({viewport:{width:Math.round(91*3.7795),height:Math.round(122*3.7795)},deviceScaleFactor:5});
await c.goto('file://'+path.join(D,'visitenkarte.html'));await c.evaluate(()=>document.fonts.ready);await c.waitForTimeout(400);
const cards=await c.$$('.card');await cards[0].screenshot({path:path.join(D,'vorschau-karte-vorne.png')});await cards[1].screenshot({path:path.join(D,'vorschau-karte-hinten.png')});
await b.close();})();
