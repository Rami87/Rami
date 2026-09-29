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
import services_ar
import icons

ROOT = Path(__file__).parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "public"

# ---- Configuration: fill these in before going live -------------------------
DOMAIN = "https://horaniq.at"
EMAIL = "rami@horaniq.at"
PHONE = os.environ.get("PHONE", "")            # e.g. "+43 660 1234567". Empty hides every call button.
WHATSAPP = os.environ.get("WHATSAPP", "")         # digits only with country code, e.g. "436601234567". Empty hides it.
FORM_ENDPOINT = os.environ.get("FORM_ENDPOINT", "")    # e.g. a Formspree or own endpoint. Empty falls back to a prefilled e-mail.
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
        "nav": [("Leistungen", "/leistungen/"), ("Für Praxen", "/arztpraxis/"), ("Für Büros", "/unternehmen/"), ("IT-Check", "/#it-check"), ("Kontakt", "/#kontakt")],
        "cta": "Kostenloses Erstgespräch anfragen",
        "lang_label": ("العربية", "/ar/", "ar"),
        "call": "Anrufen",
        "whatsapp": "WhatsApp",
        "mbar_cta": "Kostenloses Erstgespräch anfragen",
        "crumb_home": "Start",
        "foot_tag": "IT, Netzwerk und Sicherheit für Betriebe in Wien und Umgebung. Persönlich, verständlich und aus einer Hand.",
        "foot_cols": [
            ("Leistungen", [("IT-Betreuung", "/it-betreuung/"), ("Netzwerk und WLAN", "/netzwerk/"), ("Sicherheit", "/sicherheit/"), ("Alle Leistungen", "/leistungen/")]),
            ("Branchen", [("Arztpraxen", "/arztpraxis/"), ("Büros und Betriebe", "/unternehmen/"), ("Deutsch und Arabisch", "/ar/")]),
            ("Rechtliches", [("Impressum", "/impressum/"), ("Datenschutz", "/datenschutz/")]),
        ],
        "legal": "Alle Preise netto zuzüglich USt. Angaben ohne Gewähr.",
        "f_name": "Name", "f_contact": "Telefon oder E-Mail", "f_contact_hint": "Wie erreichen wir Sie am besten?",
        "f_type": "Ihr Betrieb", "f_msg": "Worum geht es? (optional)",
        "types": ["Arztpraxis", "Zahnarztpraxis", "Therapiepraxis", "Rechtsanwalt", "Steuerberatung oder Buchhaltung", "Büro", "Geschäft", "Werkstatt oder Lager", "Anderes"],
        "f_consent": 'Ich habe die <a href="/datenschutz/">Datenschutzerklärung</a> gelesen und bin einverstanden, dass HORANiQ mich zu meiner Anfrage kontaktiert.',
        "f_submit": "Erstgespräch anfragen",
        "f_ok": "Vielen Dank für Ihre Anfrage. Wir melden uns über die von Ihnen angegebene Kontaktmöglichkeit.",
        "f_err": "Ihre Anfrage konnte nicht gesendet werden. Ihre Angaben sind noch vorhanden. Bitte versuchen Sie es erneut oder schreiben Sie an %s.",
        "f_mailto": "Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die vorbereitete Nachricht dort ab. Falls sich nichts geöffnet hat, schreiben Sie an %s.",
        "f_sending": "Wird gesendet…", "f_invalid": "Bitte prüfen Sie die markierten Felder.",
        "f_subject": "Anfrage Erstgespräch",
        "f_choose": "Bitte wählen",
        "e_name": "Bitte geben Sie Ihren Namen an.",
        "e_contact": "Bitte geben Sie eine Telefonnummer oder E-Mail-Adresse an.",
        "e_contact_invalid": "Bitte prüfen Sie Ihre Telefonnummer oder E-Mail-Adresse.",
        "e_type": "Bitte wählen Sie eine Option.",
        "e_consent": "Bitte bestätigen Sie die Datenschutzerklärung.",
        "f_praxis": "Ihre Praxis",
        "types_praxis": ["Arztpraxis", "Zahnarztpraxis", "Therapiepraxis", "Gruppenpraxis", "Andere medizinische Einrichtung"],
        "f_interest": "Wofür interessieren Sie sich?",
        "interests_general": [
            ("erstgespraech", "Kostenloses Erstgespräch", "Erstgespräch anfragen", ""),
            ("it-check", "IT-Check für €99 zzgl. USt.", "IT-Check anfragen", ""),
            ("betreuung", "Laufende IT-Betreuung", "Betreuung anfragen", ""),
            ("website", "Website", "Website-Projekt anfragen", "Für Website- und Shop-Projekte brauchen Sie keinen IT-Check."),
            ("onlineshop", "Onlineshop", "Onlineshop anfragen", "Für Website- und Shop-Projekte brauchen Sie keinen IT-Check."),
            ("beratung", "IT-Beratung / anderes Anliegen", "Anfrage senden", ""),
        ],
        "interests_praxis": [
            ("erstgespraech", "Kostenloses Erstgespräch", "Erstgespräch anfragen", ""),
            ("it-check", "IT-Check für €99 zzgl. USt.", "IT-Check anfragen", ""),
            ("betreuung", "Laufende IT-Betreuung", "Betreuung anfragen", ""),
            ("praxiswebsite", "Praxiswebsite", "Praxiswebsite anfragen", "Für eine Praxiswebsite brauchen Sie keinen IT-Check."),
        ],
        "f_msg_notice": "Bitte keine Patientendaten oder Passwörter über dieses Formular senden.",
    },
    "ar": {
        "dir": "rtl",
        "skip": "انتقل إلى المحتوى",
        "menu": "القائمة",
        "nav": [("الخدمات", "/ar/leistungen/"), ("فحص IT", "#it-check"), ("كيف نعمل", "#ablauf"), ("أسئلة شائعة", "#faq"), ("تواصل", "#kontakt")],
        "cta": "استشارة مجانية",
        "lang_label": ("Deutsch", "/", "de"),
        "call": "اتصل بنا",
        "whatsapp": "واتساب",
        "mbar_cta": "احجز استشارة مجانية",
        "crumb_home": "الرئيسية",
        "foot_tag": "خدمات IT والشبكات والأمان للشركات والعيادات في فيينا ومحيطها. شخص واحد مسؤول، بشرح واضح.",
        "foot_cols": [
            ("الخدمات", [(services_ar.INDEX_AR[s][0], f"/ar/{s}/") for s in ["it-betreuung", "wartung-reparatur", "microsoft-365", "netzwerk", "backup", "it-sicherheit"]]),
            ("المزيد", [(services_ar.INDEX_AR[s][0], f"/ar/{s}/") for s in ["sicherheit", "smart-building", "website-shop", "crm-archivierung", "it-beratung", "it-check", "care"]] + [("كل الخدمات", "/ar/leistungen/")]),
            ("القطاعات", [("العيادات (بالألمانية)", "/arztpraxis/"), ("المكاتب ومكاتب المحاماة والشركات (بالألمانية)", "/unternehmen/")]),
            ("قانوني", [("بيانات الشركة (Impressum)", "/impressum/"), ("الخصوصية (Datenschutz)", "/datenschutz/")]),
        ],
        "legal": "جميع الأسعار صافية دون ضريبة القيمة المضافة. المعلومات غير ملزمة.",
        "f_name": "الاسم", "f_contact": "الهاتف أو البريد الإلكتروني", "f_contact_hint": "كيف نتواصل معك بأفضل شكل؟",
        "f_type": "نوع عملك", "f_msg": "ما الموضوع؟ (اختياري)",
        "types": ["عيادة طبية", "عيادة أسنان", "عيادة علاج", "مكتب محاماة", "محاسبة أو استشارات ضريبية", "مكتب", "محل تجاري", "ورشة أو مستودع", "أخرى"],
        "f_consent": 'قرأت <a href="/datenschutz/">سياسة الخصوصية</a> (بالألمانية) وأوافق على أن تتواصل HORANiQ معي بخصوص طلبي.',
        "f_submit": "احجز استشارة مجانية",
        "f_ok": "شكراً لك على طلبك. سنتواصل معك عبر وسيلة الاتصال التي أدخلتها.",
        "f_err": "تعذّر إرسال طلبك. بياناتك ما زالت محفوظة. حاول مرة أخرى أو راسلنا على %s.",
        "f_mailto": "فُتح برنامج البريد لديك. يرجى إرسال الرسالة الجاهزة من هناك. وإن لم يُفتح شيء فراسلنا على %s.",
        "f_sending": "جارٍ الإرسال…", "f_invalid": "يرجى مراجعة الحقول المحددة.",
        "f_subject": "طلب استشارة أولى",
        "f_choose": "اختر",
        "f_interest": "بماذا أنت مهتم؟",
        "interests_general": [
            ("erstgespraech", "استشارة أولى مجانية", "احجز استشارة أولى", ""),
            ("it-check", "فحص IT بـ 99 € دون ضريبة", "اطلب فحص IT", ""),
            ("betreuung", "دعم IT مستمر", "اطلب الدعم المستمر", ""),
            ("website", "موقع إلكتروني", "اطلب مشروع موقع", "لا تحتاج إلى فحص IT لمشاريع المواقع والمتاجر."),
            ("onlineshop", "متجر إلكتروني", "اطلب متجراً إلكترونياً", "لا تحتاج إلى فحص IT لمشاريع المواقع والمتاجر."),
            ("beratung", "استشارة IT / موضوع آخر", "أرسل طلبك", ""),
        ],
        "e_name": "يرجى إدخال اسمك.",
        "e_contact": "يرجى إدخال رقم هاتف أو بريد إلكتروني.",
        "e_contact_invalid": "يرجى التحقق من رقم الهاتف أو البريد الإلكتروني.",
        "e_type": "يرجى اختيار أحد الخيارات.",
        "e_consent": "يرجى تأكيد قراءة سياسة الخصوصية.",
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


def form_html(t, sector, default_interest="erstgespraech"):
    """Shared contact form. The Arztpraxis page adds a request-type field and practice-specific options."""
    praxis = sector == "arztpraxis"
    types = t["types_praxis"] if praxis else t["types"]
    label_type = t["f_praxis"] if praxis else t["f_type"]
    esc = html.escape
    opts = f'<option value="">{t["f_choose"]}</option>' + "".join(f"<option>{esc(o)}</option>" for o in types)
    err = t["f_err"] % EMAIL
    mailto = t["f_mailto"] % EMAIL
    interest = ""
    submit_label = t["f_submit"]
    ilist = t.get("interests_praxis") if praxis else t.get("interests_general")
    if ilist:
        if praxis:
            io = f'<option value="">{t["f_choose"]}</option>'
        else:
            io = ""
        chosen_hint = ""
        for v, l, s, h in ilist:
            sel = ""
            if not praxis and v == default_interest:
                sel = " selected"
                submit_label = s
                chosen_hint = h
            io += f'<option value="{v}" data-submit="{esc(s)}" data-hint="{esc(h)}"{sel}>{esc(l)}</option>'
        hint_html = f'<p class="hint" id="interest-hint"{"" if chosen_hint else " hidden"}>{esc(chosen_hint)}</p>'
        interest = f'''<div class="field" data-error="{esc(t["e_type"])}"><label for="f-interest">{t["f_interest"]}</label><select id="f-interest" name="interest" required aria-describedby="interest-hint err-interest">{io}</select>{hint_html}<p class="err" id="err-interest"></p></div>'''
    notice = f'<p class="hint" id="msg-hint">{t["f_msg_notice"]}</p>' if praxis else ""
    return f'''<form class="form" id="contact-form" novalidate data-endpoint="{esc(FORM_ENDPOINT)}" data-email="{EMAIL}" data-subject="{esc(t["f_subject"])}" data-msg-ok="{esc(t["f_ok"])}" data-msg-err="{esc(err)}" data-msg-mailto="{esc(mailto)}" data-msg-sending="{esc(t["f_sending"])}" data-msg-invalid="{esc(t["f_invalid"])}" data-e-contact-invalid="{esc(t["e_contact_invalid"])}" data-default-label="{esc(submit_label)}">
  <input type="hidden" name="sector" value="{sector}">
  <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <div class="field" data-error="{esc(t["e_name"])}"><label for="f-name">{t["f_name"]}</label><input type="text" id="f-name" name="name" autocomplete="name" required aria-describedby="err-name"><p class="err" id="err-name"></p></div>
  <div class="field" data-error="{esc(t["e_contact"])}"><label for="f-contact">{t["f_contact"]}</label><input type="text" id="f-contact" name="contact" autocomplete="email" required aria-describedby="hint-contact err-contact"><p class="hint" id="hint-contact">{t["f_contact_hint"]}</p><p class="err" id="err-contact"></p></div>
  <div class="field" data-error="{esc(t["e_type"])}"><label for="f-type">{label_type}</label><select id="f-type" name="business" required aria-describedby="err-type">{opts}</select><p class="err" id="err-type"></p></div>
  {interest}
  <div class="field"><label for="f-msg">{t["f_msg"]}</label><textarea id="f-msg" name="message"{' aria-describedby="msg-hint"' if praxis else ''}></textarea>{notice}</div>
  <div class="field consent-wrap" data-error="{esc(t["e_consent"])}"><label class="consent"><input type="checkbox" name="consent" required aria-describedby="err-consent"><span>{t["f_consent"]}</span></label><p class="err" id="err-consent"></p></div>
  <button class="btn btn-primary" type="submit" data-track="form-{sector}">{submit_label}</button>
  <p class="form-note" role="status" aria-live="polite"></p>
  <noscript><p class="form-note info">{t["f_mailto"] % EMAIL}</p></noscript>
</form>'''


def icon_svg(slug, size=""):
    cls = "ico" + (f" ico-{size}" if size else "")
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="/assets/img/icons.svg#i-{slug}"/></svg>'


ICON_RE = re.compile(r"\{\{ICON:([a-z0-9-]+)(?::(sm|lg|xl))?\}\}")


def services_menu_html(label, href, cur):
    """Leistungen with a submenu that lists every service, grouped. The parent stays a normal link to /leistungen/."""
    cols = ""
    for name, _, slugs in services.GROUPS:
        items = "".join(f'<li><a href="/{sl}/">{icon_svg(sl, "sm")}<span>{services.SVC[sl][0]}</span></a></li>' for sl in slugs)
        cols += f'<div class="sub-col"><p class="sub-h">{name}</p><ul>{items}</ul></div>'
    return (f'<div class="nav-item has-sub"><a href="{href}"{cur}>{label}</a>'
            f'<button type="button" class="sub-toggle" aria-expanded="false" aria-controls="sub-leistungen"><span class="sr-only">Untermenü Leistungen</span></button>'
            f'<div class="sub" id="sub-leistungen">{cols}<p class="sub-all"><a href="{href}">Alle Leistungen ansehen</a></p></div></div>')


def logo_html(t, cls="logo"):
    home = "/ar/" if t is I18N["ar"] else "/"
    return f'<a class="{cls}" href="{home}" aria-label="HORANiQ"><img src="/assets/img/horaniq-logo.webp" alt="HORANiQ" width="145" height="44"></a>'


def header_html(t, path, cta="#kontakt", switch=None, ids=()):
    links = ""
    for label, href in t["nav"]:
        if t is I18N["ar"] and href.startswith("#") and href[1:] not in ids:
            href = "/ar/" + href
        if href.startswith("/#") and href[2:] in ids:
            href = href[1:]  # target exists on this page: stay on the page
        cur = ' aria-current="page"' if href == path else ""
        if t is I18N["de"] and href == "/leistungen/":
            links += services_menu_html(label, href, cur)
        else:
            links += f'<a href="{href}"{cur}>{label}</a>'
    ll, lh, lc = t["lang_label"]
    lh = switch or lh
    links += f'<a class="lang" href="{lh}" hreflang="{lc}" lang="{lc}">{ll}</a>'
    links += f'<a class="btn btn-primary btn-sm" href="{cta}" data-track="nav-cta" data-interest="erstgespraech">{t["cta"]}</a>'
    return f'''<a class="skip" href="#main">{t["skip"]}</a>
<header class="site-header"><div class="wrap bar">
  {logo_html(t)}
  <button class="menu-btn" aria-expanded="false" aria-controls="nav">{t["menu"]}</button>
  <nav class="nav" id="nav" aria-label="Hauptnavigation">{links}</nav>
</div></header>'''


def de_foot_cols():
    def links(slugs):
        return [(services.SVC[s][0], f"/{s}/") for s in slugs]
    return [
        ("Leistungen", links(["it-betreuung", "wartung-reparatur", "microsoft-365", "netzwerk", "backup", "it-sicherheit"])),
        ("Weitere Leistungen", links(["sicherheit", "smart-building", "website-shop", "crm-archivierung", "it-beratung", "it-check", "care"]) + [("Alle Leistungen", "/leistungen/")]),
        ("Branchen", [("Arztpraxen", "/arztpraxis/"), ("Büros und Betriebe", "/unternehmen/"), ("Deutsch und Arabisch", "/ar/")]),
        ("Rechtliches", [("Impressum", "/impressum/"), ("Datenschutz", "/datenschutz/")]),
    ]


def footer_html(t):
    cols = ""
    for title, items in (de_foot_cols() if t is I18N["de"] else t["foot_cols"]):
        fix = lambda h: "/ar/" + h if (t is I18N["ar"] and h.startswith("#")) else h
        cols += f"<div><h3>{title}</h3><ul>" + "".join(f'<li><a href="{fix(h)}">{l}</a></li>' for l, h in items) + "</ul></div>"
    return f'''<footer class="site-footer"><div class="wrap">
  <div class="foot">
    <div>{logo_html(t)}<p>{t["foot_tag"]}</p><p><a href="mailto:{EMAIL}">{EMAIL}</a></p></div>
    {cols}
  </div>
  <p class="legal">© 2026 HORANiQ, Rami Horani, Wien. {t["legal"]}</p>
</div></footer>'''


def mbar_html(t, cta="#kontakt"):
    btns = call_buttons(t, "btn btn-ghost", "mbar-call")
    if WHATSAPP and not PHONE:
        btns += f'<a class="btn btn-ghost" href="https://wa.me/{WHATSAPP}" data-track="mbar-whatsapp">{t["whatsapp"]}</a>'
    btns += f'<a class="btn btn-primary" href="{cta}" data-track="mbar-cta" data-interest="erstgespraech">{t["mbar_cta"]}</a>'
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
        "logo": f"{DOMAIN}/assets/img/horaniq-logo.webp",
        "email": EMAIL,
        "description": "IT-Betreuung, Netzwerk, Sicherheit und Microsoft 365 für kleine und mittlere Unternehmen in Wien und Umgebung.",
        "founder": {"@type": "Person", "name": "Rami Horani"},
        "address": {"@type": "PostalAddress", "addressLocality": "Wien", "addressCountry": "AT"},
        "areaServed": [{"@type": "City", "name": "Wien"}, {"@type": "AdministrativeArea", "name": "Wien und Umgebung"}],
        "knowsLanguage": ["de", "ar", "en"],
        "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Leistungen", "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": re.sub(r"&amp;", "&", services.SVC[sl][0]), "url": f"{DOMAIN}/{sl}/"}} for _, _, sls in services.GROUPS for sl in sls]},
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
    body = body.replace("{{SERVICE_GROUPS}}", services.groups_html("h3"))
    body = body.replace("{{SERVICE_GROUPS_AR}}", services_ar.groups_ar("h3"))
    body = ICON_RE.sub(lambda m: icon_svg(m.group(1), m.group(2) or ""), body)
    body = body.replace("{{FORM}}", form_html(t, sector, meta.get("interest", "erstgespraech")))
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
    return f'''<!doctype html>
<html lang="{meta["lang"]}" dir="{t["dir"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}{'' if robots != 'index' else ', max-image-preview:large'}">
<link rel="canonical" href="{url}">
{alt}<meta name="theme-color" content="#0f2e40">
<meta property="og:type" content="website"><meta property="og:site_name" content="HORANiQ"><meta property="og:locale" content="{og_locale}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}"><meta property="og:image" content="{DOMAIN}/assets/img/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="HORANiQ: IT, Netzwerk und Sicherheit für Betriebe in Wien">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/assets/img/favicon-48.png" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/{"ibm-plex-sans-arabic-arabic-400" if meta["lang"] == "ar" else "instrument-sans-latin-400"}-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
<script type="application/ld+json">
{schema_graph(meta, body, url, t)}
</script>
</head>
<body>
{header_html(t, meta["path"], cta, switch, set(re.findall(r'id="([^"]+)"', body)))}
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
    (OUT / "assets" / "img" / "icons.svg").write_text(icons.sprite(), encoding="utf-8")
    (OUT / "assets" / "icons").mkdir(exist_ok=True)
    for slug in icons.ICONS:
        (OUT / "assets" / "icons" / f"{slug}.svg").write_text(icons.standalone(slug), encoding="utf-8")
    shutil.copy(ROOT / "assets" / "favicon.ico", OUT / "favicon.ico")
    sitemap = []
    pages = [parse(f) for f in sorted(SRC.glob("*.html"))]
    import services_ar
    for slug, s in services.SERVICES.items():
        alt = f"de=/{slug}/" + (f",ar=/ar/{slug}/" if slug in services_ar.SERVICES_AR else "")
        pages.append(({"lang": "de", "path": f"/{slug}/", "title": s["title"], "description": s["description"], "sector": slug, "breadcrumb": html.unescape(s["name"]), "alt": alt, "interest": s.get("interest", "erstgespraech")}, services.render_fragment(slug)))
    for slug, s in services_ar.SERVICES_AR.items():
        pages.append(({"lang": "ar", "path": f"/ar/{slug}/", "title": s["title"], "description": s["description"], "sector": f"ar-{slug}", "breadcrumb": s["name"], "alt": f"de=/{slug}/,ar=/ar/{slug}/", "interest": s.get("interest", "erstgespraech")}, services.render_fragment(slug, "ar")))
    pages.append(({"lang": "ar", "path": "/ar/leistungen/", "title": "كل خدمات HORANiQ: IT وشبكات وأمان ومواقع في فيينا", "description": "كل الخدمات من جهة واحدة: دعم IT وMicrosoft 365 وشبكات ونسخ احتياطي وأمان وكاميرات ومواقع ومتاجر إلكترونية للشركات في فيينا ومحيطها.", "sector": "ar-leistungen", "breadcrumb": "كل الخدمات", "alt": "de=/leistungen/,ar=/ar/leistungen/"}, services_ar.render_hub_ar()))
    pages.append(({"lang": "de", "path": "/leistungen/", "title": "Leistungen: IT, Netzwerk, Sicherheit und mehr in Wien | HORANiQ", "description": "Alle Leistungen von HORANiQ: IT-Betreuung, Microsoft 365, Netzwerk, Backup, Sicherheit, Smart Building, Websites und Wartung für Betriebe in Wien und Umgebung.", "sector": "leistungen", "breadcrumb": "Leistungen", "alt": "de=/leistungen/,ar=/ar/leistungen/"}, services.render_hub()))
    for meta, body in pages:
        out = OUT / meta["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(meta, body), encoding="utf-8")
        if meta.get("robots", "index") == "index":
            sitemap.append(meta["path"])
        print("built", meta["path"])
    nf = ({"lang": "de", "path": "/404/", "title": "Seite nicht gefunden | HORANiQ", "description": "Diese Seite gibt es nicht.", "sector": "legal", "robots": "noindex, follow"}, '<section class="s"><div class="wrap prose"><h1>Seite nicht gefunden</h1><p>Diese Adresse gibt es nicht (mehr). Hier geht es weiter:</p><div class="btn-row"><a class="btn btn-primary" href="/">Zur Startseite</a><a class="btn btn-ghost" href="/leistungen/">Alle Leistungen</a><a class="btn btn-ghost" href="/#kontakt">Kontakt</a></div></div></section>')
    (OUT / "404.html").write_text(render(*nf), encoding="utf-8")
    urls = "".join(f"  <url><loc>{DOMAIN}{p}</loc></url>\n" for p in sitemap)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
    (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n" if PREVIEW else f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    main()
