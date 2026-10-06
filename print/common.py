"""HORANiQ print pieces: business card (2 sides) and A3 poster. Vector HTML -> PDF/PNG via Playwright (see render.js).
Shared helpers for the print pieces.
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
@font-face {{ font-family: "Manrope"; font-weight: 400; src: url("{FONTS}/manrope-latin-400-normal.woff2"); }}
@font-face {{ font-family: "Manrope"; font-weight: 500; src: url("{FONTS}/manrope-latin-500-normal.woff2"); }}
@font-face {{ font-family: "Manrope"; font-weight: 600; src: url("{FONTS}/manrope-latin-600-normal.woff2"); }}
@font-face {{ font-family: "Manrope"; font-weight: 700; src: url("{FONTS}/manrope-latin-700-normal.woff2"); }}
@font-face {{ font-family: "Manrope"; font-weight: 800; src: url("{FONTS}/manrope-latin-800-normal.woff2"); }}
@font-face {{ font-family: "Readex Pro"; font-weight: 400; src: url("{FONTS}/readex-pro-arabic-400-normal.woff2"); }}
@font-face {{ font-family: "Readex Pro"; font-weight: 500; src: url("{FONTS}/readex-pro-arabic-500-normal.woff2"); }}
@font-face {{ font-family: "Readex Pro"; font-weight: 600; src: url("{FONTS}/readex-pro-arabic-600-normal.woff2"); }}
@font-face {{ font-family: "Readex Pro"; font-weight: 700; src: url("{FONTS}/readex-pro-arabic-700-normal.woff2"); }}
:root {{ --navy: {NAVY}; --blue: {BLUE}; --green: {GREEN}; --soft: #3b4f66; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ font-family: "Manrope", "Readex Pro", sans-serif; color: var(--navy); }}
.logo {{ display: inline-flex; align-items: center; gap: .18em; line-height: 1; }}
.logo .mark {{ height: 1.55em; width: 1.55em; flex: none; }}
.wm {{ font-weight: 700; letter-spacing: -0.01em; }}
.ic {{ width: 1em; height: 1em; display: block; flex: none; }}
.ar {{ font-family: "Readex Pro", "Manrope", sans-serif; direction: rtl; }}
.qr {{ display: block; width: 100%; height: 100%; }}
'''

