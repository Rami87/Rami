const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const src=process.argv[2];const out=path.join(path.dirname(src),path.basename(src,'.html'));fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:480,height:700},deviceScaleFactor:1080/420});
await p.goto('file://'+path.resolve(src));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
const s=await p.$$('.slide');let i=1;for(const el of s){await el.screenshot({path:path.join(out,`slide-${String(i).padStart(2,'0')}.png`)});i++}
console.log('exported',s.length);await b.close()})();
