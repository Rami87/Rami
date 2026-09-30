"""HORANiQ campaign pieces in the Instagram-carousel look (dark navy, orbs, profile header, progress bar, white CTA page).
Business card 91x61 mm (front/back) and A3 poster 303x426 mm (page 1 / page 2), each with 3 mm bleed. No prices.
Run: python3 print/build_campaign.py && node print/render_campaign.js"""
from common import *

PHOTO = (HERE.parent / "site/assets/photos/rami.webp").resolve().as_uri()
LINK = f"https://{WEB}/?utm_source=poster&utm_medium=print&utm_campaign=erstgespraech-wien"
VCARD = f"BEGIN:VCARD\nVERSION:3.0\nN:Horani;Rami;;;\nFN:Rami Horani\nORG:HORANiQ\nTITLE:Gründer\nTEL;TYPE=CELL:{PHONE}\nEMAIL:{EMAIL}\nURL:https://{WEB}\nADR;TYPE=WORK:;;;Wien;;;AT\nEND:VCARD"

BG = "background:#0F2E40;"
ORBS = '''.orb{position:absolute;border-radius:50%;filter:blur(0)}
.o1{background:radial-gradient(circle,rgba(51,161,194,.55),rgba(51,161,194,0) 68%)}
.o2{background:radial-gradient(circle,rgba(72,183,140,.38),rgba(72,183,140,0) 68%)}
.dark{background:linear-gradient(160deg,#133a52 0%,#0F2E40 55%,#0a2131 100%);color:#fff;overflow:hidden;position:relative}
.ph{border-radius:50%;background-size:cover;background-position:50% 18%;border:solid var(--blue)}
.grad{background:linear-gradient(90deg,var(--blue),var(--green))}
.acc{color:#33A1C2}.acg{color:#48B78C}
'''
check = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.500 4.500L19 7.500"/></svg>'
globe = lambda c: f'<svg class="ic" viewBox="0 0 64 64"><g fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="32" r="22" fill="rgba(51,161,194,0.18)" stroke="none"/><circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="9" ry="22" stroke="{BLUE}"/><path d="M10 32h44"/></g></svg>'

# ----------------------------------------------------------------------------------------------- CARD
CARD_CSS = CSS + ORBS + f'''
@page {{ size: 91mm 61mm; margin: 0; }}
.card {{ width: 91mm; height: 61mm; position: relative; overflow: hidden; page-break-after: always; }}
.card:last-child {{ page-break-after: auto; }}
.f .o1 {{ width: 70mm; height: 70mm; right: -22mm; top: -26mm; }}
.f .o2 {{ width: 56mm; height: 56mm; left: -20mm; bottom: -28mm; }}
.f .logo {{ position: absolute; left: 9mm; top: 10mm; font-size: 6.4mm; }}
.f h2 {{ position: absolute; left: 9mm; top: 24mm; width: 66mm; font-size: 6.3mm; line-height: 1.08; letter-spacing: -.02em; font-weight: 700; }}
.f .bar {{ position: absolute; left: 9mm; bottom: 8.5mm; width: 28mm; height: .9mm; border-radius: 1mm; }}
.f .langs {{ position: absolute; right: 9mm; bottom: 6.5mm; font-size: 2.5mm; font-weight: 600; color: #cfe3ec; }}
.b {{ background: #fff; color: var(--navy); }}
.b .ph {{ position: absolute; left: 8mm; top: 8mm; width: 17mm; height: 17mm; border-width: .7mm; background-image: url("{PHOTO}"); }}
.b .name {{ position: absolute; left: 28.5mm; top: 9.5mm; font-size: 5mm; font-weight: 700; letter-spacing: -.01em; line-height: 1.1; }}
.b .role {{ position: absolute; left: 28.5mm; top: 16.4mm; font-size: 2.5mm; line-height: 1.35; color: var(--soft); font-weight: 500; }}
.b .rows {{ position: absolute; left: 8mm; top: 30.5mm; display: grid; gap: 1.8mm; font-size: 2.9mm; font-weight: 600; }}
.b .row {{ display: flex; align-items: center; gap: 2mm; }}
.b .row .ic {{ width: 4.4mm; height: 4.4mm; }}
.b .two {{ display: flex; gap: .3mm; }}
.b .qrb {{ position: absolute; right: 8mm; bottom: 8mm; width: 19mm; height: 19mm; border: .3mm solid #d3dde6; border-radius: 1.6mm; padding: .6mm; }}
.b .scan {{ position: absolute; right: 8mm; top: 26mm; width: 19mm; text-align: center; font-size: 1.9mm; color: var(--soft); }}
.b .accent {{ position: absolute; left: 0; top: 0; bottom: 0; width: 2.2mm; background: linear-gradient(var(--blue), var(--green)); }}
'''
dk = lambda s: icon(s, s=NAVY, tint="rgba(51,161,194,0.18)")
card = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>HORANiQ Visitenkarte</title><style>{CARD_CSS}</style></head><body>
<section class="card f dark"><div class="orb o1"></div><div class="orb o2"></div>
  {logo("cf", word="#fff", ring=BLUE, shield="#fff")}
  <h2>Technik, die zu Ihrem <span class="acc">Betrieb</span> passt.</h2>
  <div class="bar grad"></div><div class="langs">Deutsch · <span class="ar">العربية</span></div></section>
<section class="card b"><div class="accent"></div><div class="ph"></div>
  <div class="name">Rami Horani</div><div class="role">Gründer<br>IT, Netzwerk und Sicherheit<br>für Praxen und Büros in Wien</div>
  <div class="rows">
    <div class="row"><span class="two">{dk("kontakt-telefon")}{dk("kontakt-whatsapp")}</span><span>{PHONE_DISPLAY}</span></div>
    <div class="row">{dk("kontakt-mail")}<span>{EMAIL}</span></div>
    <div class="row">{globe(NAVY)}<span>{WEB}</span></div></div>
  <div class="scan">Kontakt speichern</div><div class="qrb">{qr_svg(VCARD, NAVY)}</div></section></body></html>'''
(HERE / "visitenkarte-kampagne.html").write_text(card, encoding="utf-8")

# ----------------------------------------------------------------------------------------------- POSTER (2 pages)
P_CSS = CSS + ORBS + f'''
@page {{ size: 303mm 426mm; margin: 0; }}
.pg {{ width: 303mm; height: 426mm; position: relative; overflow: hidden; page-break-after: always; }}
.pg:last-child {{ page-break-after: auto; }}
.pg .o1 {{ width: 250mm; height: 250mm; right: -80mm; top: -60mm; }}
.pg .o2 {{ width: 210mm; height: 210mm; left: -90mm; bottom: -40mm; }}
.head {{ position: absolute; left: 21mm; right: 21mm; top: 20mm; display: flex; align-items: center; justify-content: space-between; }}
.who {{ display: flex; align-items: center; gap: 6mm; }}
.who .ph {{ width: 22mm; height: 22mm; border-width: 1.1mm; background-image: url("{PHOTO}"); }}
.who b {{ display: block; font-size: 7.4mm; font-weight: 700; }}
.who span {{ font-size: 4.6mm; color: #a9d4e4; font-weight: 500; }}
.head .logo {{ font-size: 10mm; }}
.prog {{ position: absolute; left: 21mm; right: 21mm; top: 56mm; height: 1.6mm; background: rgba(255,255,255,.16); border-radius: 1mm; }}
.prog i {{ display: block; height: 100%; border-radius: 1mm; }}
h1 {{ position: absolute; left: 21mm; top: 78mm; width: 262mm; font-size: 40mm; line-height: .98; letter-spacing: -.035em; font-weight: 700; }}
.lead {{ position: absolute; left: 21mm; top: 222mm; width: 220mm; font-size: 8mm; line-height: 1.4; color: #cfe3ec; }}
.pts {{ position: absolute; left: 21mm; top: 262mm; list-style: none; display: grid; gap: 5mm; }}
.pts li {{ display: flex; align-items: center; gap: 5mm; font-size: 8mm; font-weight: 600; }}
.pts li i {{ width: 10mm; height: 10mm; border-radius: 50%; background: var(--green); display: grid; place-items: center; flex: none; }}
.pts li i svg {{ width: 5.6mm; height: 5.6mm; }}
.cta1 {{ position: absolute; left: 21mm; right: 21mm; bottom: 20mm; display: flex; justify-content: space-between; align-items: flex-end; }}
.btn {{ background: #fff; color: var(--navy); border-radius: 5mm; padding: 6mm 9mm; font-size: 8.4mm; font-weight: 700; }}
.hand {{ font-size: 5.6mm; color: #a9d4e4; font-weight: 500; }}
.arrow {{ width: 20mm; height: 20mm; border-radius: 50%; background: linear-gradient(135deg, var(--blue), var(--green)); display: grid; place-items: center; }}
.arrow svg {{ width: 10mm; height: 10mm; }}
/* page 2 */
.w {{ background: #fff; color: var(--navy); }}
.w .o1 {{ opacity: .14; }} .w .o2 {{ opacity: .14; }}
.w .head .who span {{ color: var(--soft); }}
.w .prog {{ background: #e3ebf1; }}
.w h2 {{ position: absolute; left: 21mm; top: 74mm; width: 262mm; font-size: 24mm; line-height: 1.02; letter-spacing: -.03em; font-weight: 700; }}
.steps {{ position: absolute; left: 21mm; top: 140mm; width: 150mm; list-style: none; display: grid; gap: 7mm; counter-reset: s; }}
.steps li {{ display: grid; grid-template-columns: 15mm 1fr; column-gap: 6mm; counter-increment: s; }}
.steps li::before {{ content: counter(s); width: 15mm; height: 15mm; border-radius: 50%; background: var(--navy); color: #fff; font-weight: 700; font-size: 7mm; display: grid; place-items: center; grid-row: span 2; }}
.steps b {{ font-size: 7.2mm; font-weight: 700; align-self: end; }}
.steps span {{ font-size: 5mm; color: var(--soft); line-height: 1.35; }}
.rep {{ position: absolute; right: 21mm; top: 144mm; width: 96mm; border-radius: 6mm; background: var(--navy); color: #fff; padding: 7mm; box-shadow: 0 6mm 14mm -6mm rgba(15,46,64,.5); }}
.rep .h {{ font-size: 4.8mm; font-weight: 700; padding-bottom: 4mm; border-bottom: .3mm solid rgba(255,255,255,.2); margin-bottom: 1mm; }}
.rep .r {{ display: grid; grid-template-columns: 6mm 1fr; column-gap: 3.5mm; align-items: center; padding: 3.4mm 0; }}
.rep .l {{ width: 5.4mm; height: 5.4mm; border-radius: 50%; }}
.rep b {{ display: block; font-size: 4.2mm; }} .rep small {{ font-size: 3.3mm; color: #a9d4e4; }}
.rep .n {{ margin-top: 2mm; font-size: 3.5mm; color: #cfe3ec; }}
.band {{ position: absolute; left: 0; right: 0; bottom: 0; height: 128mm; background: var(--navy); color: #fff; border-top-left-radius: 11mm; border-top-right-radius: 11mm; overflow: hidden; }}
.band .bar {{ position: absolute; left: 21mm; top: 0; width: 60mm; height: 1.6mm; }}
.band h3 {{ position: absolute; left: 21mm; top: 15mm; font-size: 14mm; letter-spacing: -.025em; line-height: 1.05; font-weight: 700; }}
.contacts {{ position: absolute; left: 21mm; top: 52mm; display: grid; gap: 4.4mm; }}
.crt {{ display: flex; align-items: center; gap: 4mm; font-size: 8mm; font-weight: 700; }}
.crt .ic {{ width: 11.5mm; height: 11.5mm; }} .crt .pair {{ display: flex; gap: 1.5mm; }}
.qrc {{ position: absolute; right: 21mm; top: 15mm; width: 72mm; text-align: center; }}
.qrc .q {{ width: 72mm; height: 72mm; background: #fff; border-radius: 5mm; padding: 3.4mm; }}
.qrc p {{ margin-top: 4mm; font-size: 4.8mm; color: #cfe3ec; line-height: 1.35; }}
.arl {{ position: absolute; left: 21mm; bottom: 12mm; font-size: 5.6mm; color: #a9d4e4; }}
.arl span {{ display: block; }}
'''
hdr = lambda w=False: f'<div class="head"><div class="who"><div class="ph"></div><div><b>Rami Horani</b><span>Gründer · HORANiQ Wien</span></div></div>{logo("h"+("w" if w else "d"), word=NAVY if w else "#fff", ring=BLUE, shield=NAVY if w else "#fff", cls="")}</div>'
arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
poster = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>HORANiQ Plakat A3 Kampagne</title><style>{P_CSS}</style></head><body>
<section class="pg dark"><div class="orb o1"></div><div class="orb o2"></div>{hdr()}
  <div class="prog"><i class="grad" style="width:50%"></i></div>
  <h1>Technik, die zu Ihrem <span class="acc">Betrieb</span> passt.</h1>
  <p class="lead">IT, Netzwerk und Sicherheit für Arztpraxen, Büros und Geschäfte in Wien. Persönlich, verständlich, aus einer Hand.</p>
  <ul class="pts"><li><i>{check}</i>Ein fester Ansprechpartner</li><li><i>{check}</i>Beratung auf Deutsch und Arabisch</li><li><i>{check}</i>Erst prüfen, dann Angebot</li></ul>
  <div class="cta1"><div class="hand">Umblättern: so arbeiten wir</div><div class="arrow">{arrow}</div></div></section>
<section class="pg w"><div class="orb o1"></div><div class="orb o2"></div>{hdr(True)}
  <div class="prog"><i class="grad" style="width:100%"></i></div>
  <h2>Kein Vertrag im Blindflug.</h2>
  <ol class="steps"><li><b>Erstgespräch</b><span>Kostenlos, etwa 20 Minuten.</span></li><li><b>IT-Check</b><span>Verständlicher Bericht mit Ampel.</span></li><li><b>Klares Angebot</b><span>Mit Festpreis wo möglich.</span></li><li><b>Umsetzung</b><span>Sauber installiert und dokumentiert.</span></li><li><b>Laufende Betreuung</b><span>Auf Wunsch mit Wartungspaket.</span></li></ol>
  <div class="rep"><div class="h">IT-Check: Bericht auf einen Blick</div>
    <div class="r"><i class="l" style="background:{GREEN}"></i><div><b>Netzwerk und WLAN</b><small>Alle Räume stabil erreichbar</small></div></div>
    <div class="r"><i class="l" style="background:{BLUE}"></i><div><b>Datensicherung</b><small>Wiederherstellung nie getestet</small></div></div>
    <div class="r"><i class="l" style="background:#fff"></i><div><b>Microsoft 365</b><small>Ohne zweiten Faktor (MFA)</small></div></div>
    <div class="n">Beispiel. Sie sehen sofort, was zuerst zu tun ist.</div></div>
  <div class="band"><div class="bar grad"></div><h3>Sprechen wir über<br>Ihren Betrieb.</h3>
    <div class="contacts"><div class="crt"><span class="pair">{icon("kontakt-telefon")}{icon("kontakt-whatsapp")}</span>{PHONE_DISPLAY}</div><div class="crt">{icon("kontakt-mail")}{EMAIL}</div><div class="crt">{globe("#fff")}{WEB}</div></div>
    <div class="qrc"><div class="q">{qr_svg(LINK, NAVY)}</div><p>Kostenloses Erstgespräch anfragen</p></div>
    <div class="arl"><span class="ar">دعم IT شخصي للعيادات والشركات في فيينا، بالعربية والألمانية</span></div></div></section></body></html>'''
(HERE / "plakat-kampagne.html").write_text(poster, encoding="utf-8")
print("written")
