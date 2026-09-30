const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const D=__dirname;
async function go(file,w,h,pdf,sel,prefix,scale){
 const p=await b.newPage({viewport:{width:Math.round(w*3.7795),height:Math.round(h*3.7795)},deviceScaleFactor:scale});
 await p.goto('file://'+path.join(D,file));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 await p.pdf({path:path.join(D,pdf),width:w+'mm',height:h+'mm',printBackground:true,preferCSSPageSize:true});
 const els=await p.$$(sel);for(let i=0;i<els.length;i++)await els[i].screenshot({path:path.join(D,prefix+(i?'-seite2':'-seite1')+'.png')});
 await p.close();}
await go('visitenkarte-kampagne.html',91,61,'HORANiQ_Visitenkarte_Kampagne_91x61mm_mit_3mm_Beschnitt.pdf','.card','vorschau-karte-kampagne',5);
await go('plakat-kampagne.html',303,426,'HORANiQ_Plakat_A3_Kampagne_2Seiten_mit_3mm_Beschnitt.pdf','.pg','vorschau-plakat-kampagne',1.4);
await b.close();})();
