"""HORANiQ print pieces: business card (2 sides) and A3 poster. Vector HTML -> PDF/PNG via Playwright (see render.js).
Run: python3 print/build_print.py && node print/render.js
Logo colours: navy #0F2E40, blue #33A1C2, green #48B78C (+ white). The logo mark is redrawn as vector because the source file is only 300 px wide."""
import sys, io, re
from pathlib import Path
import segno

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "site"))
import icons

NAVY, BLUE, GREEN, WHITE = "#0F2E40", "#33A1C2", "#48B78C", "#FFFFFF"
FONTS = (HERE.parent / "site/assets/fonts").resolve().as_uri()

PHONE, PHONE_DISPLAY = "+436767807247", "+43 676 780 7247"
EMAIL, WEB = "rami@horaniq.at", "horaniq.at"


def qr_svg(data, dark, light="#FFFFFF", border=1):
    buf = io.BytesIO()
    segno.make(data, error="m").save(buf, kind="svg", dark=dark, light=light, border=border, scale=1, xmldecl=False, svgns=True, nl=False)
    s = buf.getvalue().decode()
    m = re.search(r'width="(\d+)" height="(\d+)"', s)
    n = m.group(1)
    s = re.sub(r'\s(width|height)="\d+"', "", s, count=2)
    s = s.replace('class="segno"', "")
    return s.replace("<svg ", f'<svg class="qr" viewBox="0 0 {n} {n}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" ', 1)


def mark(uid, ring=BLUE, shield=NAVY):
    """Logo mark: ring with handle (the Q) around a shield with an H cut out."""
    return f'''<svg class="mark" viewBox="0 0 100 100" aria-hidden="true">
<defs><mask id="m{uid}"><rect width="100" height="100" fill="#fff"/><rect x="34" y="18" width="11" height="21" fill="#000"/><rect x="34" y="50" width="11" height="26" fill="#000"/></mask></defs>
<circle cx="45" cy="44" r="36" fill="none" stroke="{ring}" stroke-width="10"/>
<path d="M72 70L86 85" stroke="{ring}" stroke-width="10.5" fill="none"/>
<path mask="url(#m{uid})" fill="{shield}" d="M24 27L45 21.500L66 27V45C66 60 56 68 45 72C34 68 24 60 24 45Z"/></svg>'''


def logo(uid, word=NAVY, ring=BLUE, shield=NAVY, cls=""):
    return f'<span class="logo {cls}">{mark(uid, ring, shield)}<span class="wm" style="color:{word}">HORAN<span style="color:{GREEN}">i</span><span style="color:{BLUE}">Q</span></span></span>'


def icon(slug, s=WHITE, tint="rgba(255,255,255,0.14)"):
    tokens = dict(S=s, B=BLUE, BT=tint, G=GREEN, A="#E0A02C", R="#C8443B", W=NAVY if s == WHITE else WHITE)
    inner = icons._fill(icons.ICONS[slug], tokens)
    g = icons._fill(icons.GROUP, tokens)
    return f'<svg class="ic" viewBox="0 0 64 64" aria-hidden="true"><g {g}>{inner}</g></svg>'


CSS = f'''
@font-face {{ font-family: "Instrument Sans"; font-weight: 400; src: url("{FONTS}/instrument-sans-latin-400-normal.woff2"); }}
@font-face {{ font-family: "Instrument Sans"; font-weight: 500; src: url("{FONTS}/instrument-sans-latin-500-normal.woff2"); }}
@font-face {{ font-family: "Instrument Sans"; font-weight: 600; src: url("{FONTS}/instrument-sans-latin-600-normal.woff2"); }}
@font-face {{ font-family: "Instrument Sans"; font-weight: 700; src: url("{FONTS}/instrument-sans-latin-700-normal.woff2"); }}
@font-face {{ font-family: "IBM Plex Sans Arabic"; font-weight: 400; src: url("{FONTS}/ibm-plex-sans-arabic-arabic-400-normal.woff2"); }}
@font-face {{ font-family: "IBM Plex Sans Arabic"; font-weight: 600; src: url("{FONTS}/ibm-plex-sans-arabic-arabic-600-normal.woff2"); }}
:root {{ --navy: {NAVY}; --blue: {BLUE}; --green: {GREEN}; --soft: #3b4f66; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ font-family: "Instrument Sans", "IBM Plex Sans Arabic", sans-serif; color: var(--navy); }}
.logo {{ display: inline-flex; align-items: center; gap: .18em; line-height: 1; }}
.logo .mark {{ height: 1.55em; width: 1.55em; flex: none; }}
.wm {{ font-weight: 700; letter-spacing: -0.01em; }}
.ic {{ width: 1em; height: 1em; display: block; flex: none; }}
.ar {{ font-family: "IBM Plex Sans Arabic", sans-serif; direction: rtl; }}
.qr {{ display: block; width: 100%; height: 100%; }}
'''

# --------------------------------------------------------------------------------------- business card
VCARD = f"BEGIN:VCARD\nVERSION:3.0\nN:Horani;Rami;;;\nFN:Rami Horani\nORG:HORANiQ\nTITLE:Gründer\nTEL;TYPE=CELL:{PHONE}\nEMAIL:{EMAIL}\nURL:https://{WEB}\nADR;TYPE=WORK:;;;Wien;;;AT\nEND:VCARD"

CARD_CSS = CSS + '''
@page { size: 91mm 61mm; margin: 0; }
.card { width: 91mm; height: 61mm; position: relative; overflow: hidden; page-break-after: always; }
.card:last-child { page-break-after: auto; }
/* front: white */
.front { background: #fff; }
.front .ring { position: absolute; width: 70mm; height: 70mm; right: -32mm; bottom: -34mm; }
.front .logo { position: absolute; left: 9mm; top: 14mm; font-size: 6.9mm; }
.front .tag { position: absolute; left: 9mm; top: 31mm; width: 46mm; font-size: 2.9mm; line-height: 1.35; color: var(--soft); font-weight: 500; }
.front .langs { position: absolute; left: 9mm; bottom: 8mm; font-size: 2.6mm; color: var(--navy); font-weight: 600; display: flex; gap: 2mm; align-items: baseline; }
.front .langs i { width: 1.4mm; height: 1.4mm; border-radius: 50%; background: var(--green); display: inline-block; }
/* back: navy */
.back { background: var(--navy); color: #fff; }
.back .ring { position: absolute; width: 60mm; height: 60mm; right: -24mm; top: -27mm; opacity: .5; }
.back .who { position: absolute; left: 9mm; top: 9mm; }
.back .name { font-size: 5.4mm; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1; }
.back .role { margin-top: 1.4mm; font-size: 2.55mm; line-height: 1.35; color: #a9d4e4; font-weight: 500; width: 46mm; }
.back .rows { position: absolute; left: 9mm; top: 26.5mm; display: grid; gap: 1.7mm; font-size: 3mm; font-weight: 600; }
.back .row { display: flex; align-items: center; gap: 2.1mm; }
.back .row .ic { width: 4.6mm; height: 4.6mm; }
.back .row .two { display: flex; gap: .4mm; }
.back .row .two .ic { width: 4.6mm; height: 4.6mm; }
.back .qrbox { position: absolute; right: 8mm; bottom: 8mm; width: 19mm; height: 19mm; background: #fff; border-radius: 1.6mm; padding: .6mm; }
.back .scan { position: absolute; right: 8mm; bottom: 4.2mm; width: 19mm; text-align: center; font-size: 2mm; color: #a9d4e4; }
.back .accent { position: absolute; left: 0; top: 0; bottom: 0; width: 2.2mm; background: linear-gradient(var(--blue), var(--green)); }
'''

ring_svg = lambda c: f'<svg viewBox="0 0 100 100"><circle cx="45" cy="44" r="36" fill="none" stroke="{c}" stroke-width="10"/><path d="M72 70L86 85" stroke="{c}" stroke-width="10.5"/></svg>'

card_html = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>HORANiQ Visitenkarte</title><style>{CARD_CSS}</style></head><body>
<section class="card front">
  <div class="ring">{ring_svg(BLUE)}</div>
  {logo("cf")}
  <p class="tag">IT, Netzwerk und Sicherheit<br>für Praxen, Büros und<br>Betriebe in Wien.</p>
  <p class="langs"><span>Deutsch</span><i></i><span class="ar">العربية</span></p>
</section>
<section class="card back">
  <div class="accent"></div>
  <div class="ring">{ring_svg(BLUE)}</div>
  <div class="who"><div class="name">Rami Horani</div><div class="role">Gründer<br>IT-Betreuung · Netzwerk · Sicherheit</div></div>
  <div class="rows">
    <div class="row"><span class="two">{icon("kontakt-telefon")}{icon("kontakt-whatsapp")}</span><span>{PHONE_DISPLAY}</span></div>
    <div class="row">{icon("kontakt-mail")}<span>{EMAIL}</span></div>
    <div class="row"><svg class="ic" viewBox="0 0 64 64"><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="32" r="22" fill="rgba(255,255,255,0.14)" stroke="none"/><circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="9" ry="22" stroke="{BLUE}"/><path d="M10 32h44"/></g></svg><span>{WEB}</span></div>
  </div>
  <div class="qrbox">{qr_svg(VCARD, NAVY)}</div>
  <div class="scan">Kontakt speichern</div>
</section></body></html>'''
(HERE / "visitenkarte.html").write_text(card_html, encoding="utf-8")

# --------------------------------------------------------------------------------------- poster A3
LINK = f"https://{WEB}/it-check/?utm_source=poster&utm_medium=print&utm_campaign=itcheck-wien"

POSTER_CSS = CSS + f'''
@page {{ size: 303mm 426mm; margin: 0; }}
.poster {{ width: 303mm; height: 426mm; position: relative; overflow: hidden; background: var(--navy); }}
.dots {{ position: absolute; inset: 0 0 auto 0; height: 296mm; background-image: radial-gradient(rgba(255,255,255,.10) .45mm, transparent .5mm); background-size: 9mm 9mm; background-position: 4mm 4mm; }}
.tab {{ position: absolute; left: 0; top: 0; width: 134mm; height: 52mm; background: #fff; border-bottom-right-radius: 11mm; }}
.tab .logo {{ position: absolute; left: 21mm; top: 13mm; font-size: 14mm; }}
.topr {{ position: absolute; right: 21mm; top: 17mm; text-align: right; color: #cfe3ec; font-size: 4.6mm; font-weight: 500; line-height: 1.5; }}
.topr b {{ color: #fff; font-weight: 600; }}
h1 {{ position: absolute; left: 21mm; top: 66mm; color: #fff; font-size: 27mm; line-height: 1.0; letter-spacing: -0.025em; font-weight: 700; }}
.sub {{ position: absolute; left: 21mm; top: 128mm; width: 165mm; color: #cfe3ec; font-size: 6.4mm; line-height: 1.4; font-weight: 400; }}
.lens {{ position: absolute; left: 128mm; top: 142mm; width: 172mm; height: 172mm; }}
.card {{ position: absolute; left: 160mm; top: 186mm; width: 122mm; background: #fff; border-radius: 6mm; padding: 6.5mm 7mm 6mm; box-shadow: 0 6mm 14mm -4mm rgba(0,0,0,.45); color: var(--navy); }}
.card .head {{ display: flex; justify-content: space-between; align-items: baseline; font-size: 4.7mm; font-weight: 700; padding-bottom: 3.6mm; border-bottom: .3mm solid #d3dde6; }}
.card .head span {{ font-size: 3.6mm; font-weight: 500; color: var(--soft); }}
.crow {{ display: grid; grid-template-columns: 6mm 1fr auto; column-gap: 3.4mm; align-items: center; padding: 3.4mm 0; border-bottom: .3mm solid #e6edf2; }}
.crow:last-of-type {{ border-bottom: 0; }}
.lamp {{ width: 5.2mm; height: 5.2mm; border-radius: 50%; }}
.crow b {{ display: block; font-size: 4.3mm; font-weight: 700; }}
.crow small {{ display: block; font-size: 3.4mm; color: var(--soft); margin-top: .5mm; }}
.pill {{ font-size: 3.3mm; font-weight: 700; padding: 1.1mm 3mm; border-radius: 9mm; color: #fff; white-space: nowrap; }}
.foot-note {{ margin-top: 2.4mm; padding-top: 3.4mm; border-top: .3mm solid #d3dde6; font-size: 3.4mm; color: var(--soft); }}
.points {{ position: absolute; left: 21mm; top: 178mm; color: #fff; }}
.points p {{ font-size: 5.6mm; color: #a9d4e4; font-weight: 500; margin-bottom: 4mm; }}
.points ul {{ list-style: none; display: grid; gap: 4.4mm; }}
.points li {{ display: flex; align-items: center; gap: 4mm; font-size: 6.6mm; font-weight: 600; }}
.points li i {{ width: 8.4mm; height: 8.4mm; border-radius: 50%; background: var(--green); display: grid; place-items: center; flex: none; }}
.points li i svg {{ width: 4.6mm; height: 4.6mm; }}
.base {{ position: absolute; left: 0; right: 0; top: 296mm; bottom: 0; background: #fff; border-top-left-radius: 11mm; border-top-right-radius: 11mm; }}
.offer {{ position: absolute; left: 21mm; top: 15mm; display: flex; align-items: flex-end; gap: 8mm; }}
.price {{ font-size: 34mm; font-weight: 700; letter-spacing: -0.03em; line-height: .9; color: var(--navy); }}
.price sup {{ font-size: 0; }}
.offer .txt {{ padding-bottom: 2mm; }}
.offer .txt b {{ display: block; font-size: 7.4mm; color: var(--navy); font-weight: 700; }}
.offer .txt span {{ display: block; margin-top: 1.6mm; font-size: 4.6mm; line-height: 1.35; color: var(--soft); width: 84mm; }}
.bar {{ position: absolute; left: 21mm; top: 54mm; width: 195mm; height: 1.2mm; background: linear-gradient(90deg, var(--blue), var(--green)); border-radius: 1mm; }}
.contacts {{ position: absolute; left: 21mm; top: 63mm; display: grid; gap: 3.6mm; }}
.crt {{ display: flex; align-items: center; gap: 3.6mm; font-size: 7mm; font-weight: 700; color: var(--navy); }}
.crt .ic {{ width: 10.5mm; height: 10.5mm; }}
.crt .pair {{ display: flex; gap: 1.5mm; }}
.crt small {{ font-size: 4.2mm; color: var(--soft); font-weight: 500; margin-inline-start: 1mm; }}
.qrcol {{ position: absolute; right: 21mm; top: 15mm; width: 60mm; text-align: center; }}
.qrbox {{ width: 60mm; height: 60mm; padding: 3mm; border: .5mm solid #d3dde6; border-radius: 4mm; background: #fff; }}
.qrcol .cta {{ margin-top: 3.4mm; background: var(--navy); color: #fff; border-radius: 3mm; padding: 3.2mm 2mm; font-size: 5mm; font-weight: 700; line-height: 1.2; }}
.qrcol .ar {{ margin-top: 3.6mm; font-size: 4.4mm; line-height: 1.5; color: var(--soft); font-weight: 400; }}
'''

check = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.500 4.500L19 7.500"/></svg>'
lens_svg = f'''<svg class="lens" viewBox="0 0 200 200"><circle cx="95" cy="98" r="63" fill="rgba(255,255,255,0.05)"/><circle cx="95" cy="98" r="70" fill="none" stroke="{BLUE}" stroke-width="15"/><path d="M147 150L194 197" stroke="{BLUE}" stroke-width="15.500"/></svg>'''
globe = f'<svg class="ic" viewBox="0 0 64 64"><g fill="none" stroke="{NAVY}" stroke-width="3" stroke-linecap="round"><circle cx="32" cy="32" r="22" fill="rgba(51,161,194,0.18)" stroke="none"/><circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="9" ry="22" stroke="{BLUE}"/><path d="M10 32h44"/></g></svg>'
ic_dark = lambda s: icon(s, s=NAVY, tint="rgba(51,161,194,0.18)")

poster_html = f'''<!doctype html><html lang="de"><head><meta charset="utf-8"><title>HORANiQ Plakat A3</title><style>{POSTER_CSS}</style></head><body>
<div class="poster">
  <div class="dots"></div>
  <div class="tab">{logo("pt")}</div>
  <div class="topr"><b>IT-Betreuung · Netzwerk · Sicherheit</b><br>für Praxen, Büros und Betriebe in Wien</div>
  <h1>Wissen, wo<br>Ihre IT steht.</h1>
  <p class="sub">Der IT-Check für Praxen und Büros: ein verständlicher Bericht mit Ampel, ohne Fachchinesisch.</p>
  <div class="points"><p>Das prüfen wir:</p><ul>
    <li><i>{check}</i>Netzwerk und WLAN</li><li><i>{check}</i>Backup und NAS</li><li><i>{check}</i>Microsoft 365 und MFA</li><li><i>{check}</i>Firewall und Zugriffe</li></ul></div>
  {lens_svg}
  <div class="card">
    <div class="head">IT-Check: Bericht auf einen Blick<span>Beispiel</span></div>
    <div class="crow"><i class="lamp" style="background:{GREEN}"></i><div><b>Netzwerk und WLAN</b><small>Alle Räume stabil erreichbar</small></div><span class="pill" style="background:{GREEN}">OK</span></div>
    <div class="crow"><i class="lamp" style="background:{BLUE}"></i><div><b>Datensicherung</b><small>Wiederherstellung nie getestet</small></div><span class="pill" style="background:{BLUE}">Verbesserung empfohlen</span></div>
    <div class="crow"><i class="lamp" style="background:{NAVY}"></i><div><b>Anmeldung Microsoft 365</b><small>Ohne zweiten Faktor (MFA)</small></div><span class="pill" style="background:{NAVY}">Kritisch</span></div>
    <div class="foot-note">So sehen Sie sofort, was zuerst zu tun ist.</div>
  </div>
  <div class="base">
    <div class="offer"><div class="price">€99</div><div class="txt"><b>zzgl. USt.</b><span>Bei Auftrag für ein Projekt oder einen Wartungsvertrag wird der Betrag vollständig angerechnet.</span></div></div>
    <div class="bar"></div>
    <div class="contacts">
      <div class="crt"><span class="pair">{ic_dark("kontakt-telefon")}{ic_dark("kontakt-whatsapp")}</span>{PHONE_DISPLAY}</div>
      <div class="crt">{ic_dark("kontakt-mail")}{EMAIL}</div>
      <div class="crt">{globe}{WEB}</div>
    </div>
    <div class="qrcol"><div class="qrbox">{qr_svg(LINK, NAVY)}</div><div class="cta">Kostenloses Erstgespräch anfragen</div><div class="ar">دعم IT شخصي للعيادات والشركات في فيينا، بالعربية والألمانية</div></div>
  </div>
</div></body></html>'''
(HERE / "plakat-a3.html").write_text(poster_html, encoding="utf-8")
print("written")
