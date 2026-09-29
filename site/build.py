#!/usr/bin/env python3
"""Static site builder for horaniq.at. Standard library only.

    python3 site/build.py          # writes site/public/
    python3 -m http.server -d site/public 8000

Pages live in site/src/pages/*.html as a small header block ("key: value" lines
between --- markers) followed by the page body. Header, footer, mobile bar,
contact form, JSON-LD and sitemap are generated here so they stay identical
on every page.
"""
import html
import json
import os
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import services

ROOT = Path(__file__).parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "public"

# ---- Configuration: fill these in before going live -------------------------
DOMAIN = "https://horaniq.at"
EMAIL = "rami@horaniq.at"
PHONE = ""            # e.g. "+43 660 1234567". Empty hides every call button.
WHATSAPP = ""         # digits only with country code, e.g. "436601234567". Empty hides it.
FORM_ENDPOINT = ""    # e.g. a Formspree or own endpoint. Empty falls back to a prefilled e-mail.
SAME_AS = []          # public profile URLs (Google Business, LinkedIn) for JSON-LD

# Preview builds (GitHub Pages under /repo-name/): PREVIEW=1 BASE_PATH=/Rami python3 site/build.py
PREVIEW = os.environ.get("PREVIEW") == "1"
BASE_PATH = os.environ.get("BASE_PATH", "").rstrip("/")
# -----------------------------------------------------------------------------

I18N = {
    "de": {
        "dir": "ltr",
        "skip": "Zum Inhalt springen",
        "menu": "Menü",
        "nav": [("Leistungen", "/leistungen/"), ("Für Praxen", "/arztpraxis/"), ("Für Kanzleien", "/kanzlei/"), ("IT-Check", "/#it-check"), ("Kontakt", "/#kontakt")],
        "cta": "Erstgespräch",
        "lang_label": ("العربية", "/ar/", "ar"),
        "call": "Anrufen",
        "whatsapp": "WhatsApp",
        "mbar_cta": "Erstgespräch anfragen",
        "crumb_home": "Start",
        "foot_tag": "IT, Netzwerk und Sicherheit für Betriebe in Wien und Umgebung. Persönlich, verständlich und aus einer Hand.",
        "foot_cols": [
            ("Leistungen", [("IT-Betreuung", "/it-betreuung/"), ("Netzwerk und WLAN", "/netzwerk/"), ("Sicherheit", "/sicherheit/"), ("Alle Leistungen", "/leistungen/")]),
            ("Branchen", [("Arztpraxen", "/arztpraxis/"), ("Kanzleien", "/kanzlei/"), ("Büros und Betriebe", "/unternehmen/"), ("Deutsch und Arabisch", "/ar/")]),
            ("Rechtliches", [("Impressum", "/impressum/"), ("Datenschutz", "/datenschutz/")]),
        ],
        "legal": "Alle Preise netto zuzüglich USt. Angaben ohne Gewähr.",
        "f_name": "Name", "f_contact": "Telefon oder E-Mail", "f_contact_hint": "Wie erreichen wir Sie am besten?",
        "f_type": "Ihr Betrieb", "f_msg": "Worum geht es? (optional)",
        "types": ["Arztpraxis", "Zahnarztpraxis", "Therapiepraxis", "Kanzlei", "Steuerberatung oder Buchhaltung", "Büro", "Geschäft", "Werkstatt oder Lager", "Anderes"],
        "f_consent": 'Ich habe die <a href="/datenschutz/">Datenschutzerklärung</a> gelesen und bin einverstanden, dass HORANiQ mich zu meiner Anfrage kontaktiert.',
        "f_submit": "Erstgespräch anfragen",
        "f_ok": "Danke. Wir melden uns am selben Werktag.", "f_err": "Das hat nicht geklappt. Bitte schreiben Sie uns direkt an %s.",
        "f_sending": "Wird gesendet…", "f_invalid": "Bitte füllen Sie die markierten Felder aus.",
        "f_subject": "Anfrage Erstgespräch",
    },
    "ar": {
        "dir": "rtl",
        "skip": "انتقل إلى المحتوى",
        "menu": "القائمة",
        "nav": [("الخدمات", "#leistungen"), ("فحص IT", "#it-check"), ("كيف نعمل", "#ablauf"), ("أسئلة شائعة", "#faq"), ("تواصل", "#kontakt")],
        "cta": "استشارة مجانية",
        "lang_label": ("Deutsch", "/", "de"),
        "call": "اتصل بنا",
        "whatsapp": "واتساب",
        "mbar_cta": "احجز استشارة مجانية",
        "crumb_home": "الرئيسية",
        "foot_tag": "خدمات IT والشبكات والأمان للشركات والعيادات في فيينا ومحيطها. شخص واحد مسؤول، بشرح واضح.",
        "foot_cols": [
            ("الخدمات", [("دعم IT", "#leistungen"), ("الشبكات والواي فاي", "#leistungen"), ("الأمان", "#leistungen"), ("فحص IT", "#it-check")]),
            ("القطاعات", [("العيادات (بالألمانية)", "/arztpraxis/"), ("مكاتب المحاماة (بالألمانية)", "/kanzlei/")]),
            ("قانوني", [("بيانات الشركة (Impressum)", "/impressum/"), ("الخصوصية (Datenschutz)", "/datenschutz/")]),
        ],
        "legal": "جميع الأسعار صافية دون ضريبة القيمة المضافة. المعلومات غير ملزمة.",
        "f_name": "الاسم", "f_contact": "الهاتف أو البريد الإلكتروني", "f_contact_hint": "كيف نتواصل معك بأفضل شكل؟",
        "f_type": "نوع عملك", "f_msg": "ما الموضوع؟ (اختياري)",
        "types": ["عيادة طبية", "عيادة أسنان", "عيادة علاج", "مكتب محاماة", "محاسبة أو استشارات ضريبية", "مكتب", "محل تجاري", "ورشة أو مستودع", "أخرى"],
        "f_consent": 'قرأت <a href="/datenschutz/">سياسة الخصوصية</a> (بالألمانية) وأوافق على أن تتواصل HORANiQ معي بخصوص طلبي.',
        "f_submit": "احجز استشارة مجانية",
        "f_ok": "شكراً لك. سنتواصل معك في يوم العمل نفسه.", "f_err": "لم يتم الإرسال. يرجى مراسلتنا مباشرة على %s.",
        "f_sending": "جارٍ الإرسال…", "f_invalid": "يرجى تعبئة الحقول المطلوبة.",
        "f_subject": "طلب استشارة أولى",
    },
}


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, m.group(2)


def call_buttons(t, cls="btn btn-ghost", track="call"):
    out = ""
    if PHONE:
        out += f'<a class="{cls}" href="tel:{re.sub(r"[^+0-9]", "", PHONE)}" data-track="{track}">{t["call"]} {html.escape(PHONE)}</a>'
    return out


def form_html(t, sector):
    opts = "".join(f"<option>{html.escape(o)}</option>" for o in t["types"])
    err = t["f_err"] % EMAIL
    return f'''<form class="form" id="contact-form" novalidate data-endpoint="{html.escape(FORM_ENDPOINT)}" data-email="{EMAIL}" data-subject="{html.escape(t["f_subject"])}" data-msg-ok="{html.escape(t["f_ok"])}" data-msg-err="{html.escape(err)}" data-msg-sending="{html.escape(t["f_sending"])}" data-msg-invalid="{html.escape(t["f_invalid"])}">
  <input type="hidden" name="sector" value="{sector}">
  <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <div class="field"><label for="f-name">{t["f_name"]}</label><input type="text" id="f-name" name="name" autocomplete="name" required></div>
  <div class="field"><label for="f-contact">{t["f_contact"]}</label><input type="text" id="f-contact" name="contact" autocomplete="email" required><p class="hint">{t["f_contact_hint"]}</p></div>
  <div class="field"><label for="f-type">{t["f_type"]}</label><select id="f-type" name="business" required>{opts}</select></div>
  <div class="field"><label for="f-msg">{t["f_msg"]}</label><textarea id="f-msg" name="message"></textarea></div>
  <label class="consent"><input type="checkbox" name="consent" required><span>{t["f_consent"]}</span></label>
  <button class="btn btn-primary" type="submit" data-track="form-{sector}">{t["f_submit"]}</button>
  <p class="form-note" role="status" aria-live="polite"></p>
</form>'''


def header_html(t, path, cta="#kontakt", switch=None):
    links = ""
    for label, href in t["nav"]:
        if t is I18N["ar"] and href.startswith("#") and path != "/ar/":
            href = "/ar/" + href
        cur = ' aria-current="page"' if href == path else ""
        links += f'<a href="{href}"{cur}>{label}</a>'
    ll, lh, lc = t["lang_label"]
    lh = switch or lh
    links += f'<a class="lang" href="{lh}" hreflang="{lc}" lang="{lc}">{ll}</a>'
    links += f'<a class="btn btn-primary btn-sm" href="{cta}" data-track="nav-cta">{t["cta"]}</a>'
    home = "/ar/" if t is I18N["ar"] else "/"
    return f'''<a class="skip" href="#main">{t["skip"]}</a>
<header class="site-header"><div class="wrap bar">
  <a class="logo" href="{home}" aria-label="HORANiQ">HORAN<i>i</i>Q</a>
  <button class="menu-btn" aria-expanded="false" aria-controls="nav">{t["menu"]}</button>
  <nav class="nav" id="nav" aria-label="Hauptnavigation">{links}</nav>
</div></header>'''


def footer_html(t):
    cols = ""
    for title, items in t["foot_cols"]:
        fix = lambda h: "/ar/" + h if (t is I18N["ar"] and h.startswith("#")) else h
        cols += f"<div><h3>{title}</h3><ul>" + "".join(f'<li><a href="{fix(h)}">{l}</a></li>' for l, h in items) + "</ul></div>"
    return f'''<footer class="site-footer"><div class="wrap">
  <div class="foot">
    <div><a class="logo" href="{"/ar/" if t is I18N["ar"] else "/"}" aria-label="HORANiQ">HORAN<i>i</i>Q</a><p>{t["foot_tag"]}</p><p><a href="mailto:{EMAIL}">{EMAIL}</a></p></div>
    {cols}
  </div>
  <p class="legal">© 2026 HORANiQ, Rami Horani, Wien. {t["legal"]}</p>
</div></footer>'''


def mbar_html(t, cta="#kontakt"):
    btns = call_buttons(t, "btn btn-ghost", "mbar-call")
    if WHATSAPP and not PHONE:
        btns += f'<a class="btn btn-ghost" href="https://wa.me/{WHATSAPP}" data-track="mbar-whatsapp">{t["whatsapp"]}</a>'
    btns += f'<a class="btn btn-primary" href="{cta}" data-track="mbar-cta">{t["mbar_cta"]}</a>'
    return f'<div class="mbar">{btns}</div>'


def faq_schema(body):
    items = []
    for q, a in re.findall(r"<details>\s*<summary>(.*?)</summary>\s*<p>(.*?)</p>\s*</details>", body, re.S):
        strip = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
        items.append({"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}})
    return {"@type": "FAQPage", "mainEntity": items} if items else None


def schema_graph(meta, body, url, t):
    org = {
        "@type": ["ProfessionalService", "LocalBusiness"],
        "@id": f"{DOMAIN}/#business",
        "name": "HORANiQ",
        "url": f"{DOMAIN}/",
        "email": EMAIL,
        "description": "IT-Betreuung, Netzwerk, Sicherheit und Microsoft 365 für kleine und mittlere Unternehmen in Wien und Umgebung.",
        "founder": {"@type": "Person", "name": "Rami Horani"},
        "address": {"@type": "PostalAddress", "addressLocality": "Wien", "addressCountry": "AT"},
        "areaServed": [{"@type": "City", "name": "Wien"}, {"@type": "AdministrativeArea", "name": "Wien und Umgebung"}],
        "knowsLanguage": ["de", "ar", "en"],
        "makesOffer": {"@type": "Offer", "price": "99", "priceCurrency": "EUR", "description": "IT-Check, Preis zuzüglich USt., bei Auftrag vollständig angerechnet", "itemOffered": {"@type": "Service", "name": "IT-Check"}},
    }
    if PHONE:
        org["telephone"] = PHONE
    if SAME_AS:
        org["sameAs"] = SAME_AS
    graph = [org]
    if meta["path"] == "/":
        graph.append({"@type": "WebSite", "@id": f"{DOMAIN}/#website", "url": f"{DOMAIN}/", "name": "HORANiQ", "inLanguage": "de-AT", "publisher": {"@id": f"{DOMAIN}/#business"}})
    if meta.get("robots", "index") == "index":
        graph.append({"@type": "WebPage", "@id": url + "#page", "url": url, "name": meta["title"], "description": meta["description"], "inLanguage": meta["lang"] if meta["lang"] == "ar" else "de-AT", "isPartOf": {"@id": f"{DOMAIN}/#website"} if meta["path"] == "/" else {"@id": f"{DOMAIN}/#business"}, "about": {"@id": f"{DOMAIN}/#business"}})
    if meta.get("breadcrumb"):
        crumbs = [(t["crumb_home"], "/" if meta["lang"] == "de" else "/ar/")]
        crumbs.append((meta["breadcrumb"], meta["path"]))
        graph.append({"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": DOMAIN + p} for i, (n, p) in enumerate(crumbs)]})
    faq = faq_schema(body)
    if faq:
        graph.append(faq)
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)


def render(meta, body):
    return finalize(_render(meta, body))


def finalize(page):
    if PREVIEW:
        page = re.sub(r'<meta name="robots" content="[^"]*">', '<meta name="robots" content="noindex, nofollow">', page)
    if BASE_PATH:
        page = re.sub(r'(href|src)="/(?!/)', lambda m: f'{m.group(1)}="{BASE_PATH}/', page)
    return page


def _render(meta, body):
    t = I18N[meta["lang"]]
    url = DOMAIN + meta["path"]
    sector = meta.get("sector", "home")
    body = body.replace("{{FORM}}", form_html(t, sector))
    body = body.replace("{{CALL}}", call_buttons(t))
    body = body.replace("{{EMAIL}}", EMAIL)
    if PHONE:
        body = body.replace("{{PHONE_LINE}}", f'<a href="tel:{re.sub(r"[^+0-9]", "", PHONE)}" data-track="contact-call">{html.escape(PHONE)}</a>')
    else:
        body = body.replace("{{PHONE_LINE}}", "")
    if WHATSAPP:
        body = body.replace("{{WA_LINE}}", f'<a href="https://wa.me/{WHATSAPP}" data-track="contact-whatsapp">{t["whatsapp"]}</a>')
    else:
        body = body.replace("{{WA_LINE}}", "")

    robots = meta.get("robots", "index")
    cta = "#kontakt" if 'id="kontakt"' in body else ("/#kontakt" if meta["lang"] == "de" else "/ar/#kontakt")
    alt = ""
    switch = None
    if meta.get("alt"):
        pairs = dict(p.split("=", 1) for p in meta["alt"].split(","))
        switch = pairs.get("de" if meta["lang"] == "ar" else "ar")
        for code, p in pairs.items():
            alt += f'<link rel="alternate" hreflang="{code}" href="{DOMAIN}{p}">\n'
        alt += f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}{pairs.get("de", "/")}">\n'
    crumbs = ""
    if meta.get("breadcrumb"):
        home = "/" if meta["lang"] == "de" else "/ar/"
        crumbs = f'<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="{home}">{t["crumb_home"]}</a></li><li aria-current="page">{html.escape(meta["breadcrumb"])}</li></ol></nav>'
    og_locale = "ar_AR" if meta["lang"] == "ar" else "de_AT"
    title = html.escape(meta["title"])
    desc = html.escape(meta["description"])
    fonts = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
    return f'''<!doctype html>
<html lang="{meta["lang"]}" dir="{t["dir"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}{'' if robots != 'index' else ', max-image-preview:large'}">
<link rel="canonical" href="{url}">
{alt}<meta name="theme-color" content="#12263f">
<meta property="og:type" content="website"><meta property="og:site_name" content="HORANiQ"><meta property="og:locale" content="{og_locale}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">
{schema_graph(meta, body, url, t)}
</script>
</head>
<body>
{header_html(t, meta["path"], cta, switch)}
<main id="main">
{crumbs}
{body}
</main>
{footer_html(t)}
{mbar_html(t, cta)}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
'''


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "assets", OUT / "assets")
    sitemap = []
    pages = [parse(f) for f in sorted(SRC.glob("*.html"))]
    import services_ar
    for slug, s in services.SERVICES.items():
        alt = f"de=/{slug}/" + (f",ar=/ar/{slug}/" if slug in services_ar.SERVICES_AR else "")
        pages.append(({"lang": "de", "path": f"/{slug}/", "title": s["title"], "description": s["description"], "sector": slug, "breadcrumb": s["name"], "alt": alt}, services.render_fragment(slug)))
    for slug, s in services_ar.SERVICES_AR.items():
        pages.append(({"lang": "ar", "path": f"/ar/{slug}/", "title": s["title"], "description": s["description"], "sector": f"ar-{slug}", "breadcrumb": s["name"], "alt": f"de=/{slug}/,ar=/ar/{slug}/"}, services.render_fragment(slug, "ar")))
    pages.append(({"lang": "de", "path": "/leistungen/", "title": "Leistungen: IT, Netzwerk, Sicherheit und mehr in Wien | HORANiQ", "description": "Alle Leistungen von HORANiQ: IT-Betreuung, Microsoft 365, Netzwerk, Backup, Sicherheit, Smart Building, Websites und Wartung für Betriebe in Wien und Umgebung.", "sector": "leistungen", "breadcrumb": "Leistungen", "alt": "de=/leistungen/"}, services.render_hub()))
    for meta, body in pages:
        out = OUT / meta["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(meta, body), encoding="utf-8")
        if meta.get("robots", "index") == "index":
            sitemap.append(meta["path"])
        print("built", meta["path"])
    urls = "".join(f"  <url><loc>{DOMAIN}{p}</loc></url>\n" for p in sitemap)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
    (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n" if PREVIEW else f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    main()
