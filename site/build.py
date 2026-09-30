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
import urllib.parse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import services
import services_ar
import services_en
import icons

ROOT = Path(__file__).parent
SRC = ROOT / "src" / "pages"
OUT = ROOT / "public"

# ---- Configuration: fill these in before going live -------------------------
DOMAIN = "https://horaniq.at"
EMAIL = "rami@horaniq.at"
PHONE = (os.environ.get("PHONE") or "+43 676 780 7247")            # e.g. "+43 660 1234567". Empty hides every call button.
WHATSAPP = (os.environ.get("WHATSAPP") or "436767807247")         # digits only with country code, e.g. "436601234567". Empty hides it.
ENABLE_EN = os.environ.get("ENABLE_EN") == "1"   # English version (/en/) is kept in the repo but switched off; set ENABLE_EN=1 to build it.
PLAUSIBLE_DOMAIN = os.environ.get("PLAUSIBLE_DOMAIN", "")   # e.g. "horaniq.at". Cookieless analytics, off when empty and in preview builds.
FORM_ENDPOINT = (os.environ.get("FORM_ENDPOINT") or "https://formspree.io/f/mjyklzyw")    # e.g. a Formspree or own endpoint. Empty falls back to a prefilled e-mail.
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
        "sub_sr": "Untermenü Leistungen",
        "sub_all": "Alle Leistungen ansehen",
        "l_phone": "Telefon", "h_phone": "Direkt anrufen", "l_wa": "WhatsApp", "h_wa": "Nachricht schreiben", "l_mail": "E-Mail", "h_mail": "Anfrage per E-Mail",
        "wa_text": "Guten Tag, ich habe eine Anfrage zur IT-Betreuung.",
        "call": "Anrufen",
        "whatsapp": "WhatsApp",
        "mbar_cta": "Erstgespräch anfragen",
        "crumb_home": "Start",
        "foot_tag": "IT, Netzwerk und Sicherheit für Betriebe in Wien und Umgebung. Persönlich, verständlich und aus einer Hand.",
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
        "nav": [("الخدمات", "/leistungen/"), ("للعيادات", "/arztpraxis/"), ("للمكاتب", "/unternehmen/"), ("فحص IT", "/#it-check"), ("تواصل", "/#kontakt")],
        "cta": "استشارة مجانية",
        "sub_sr": "قائمة الخدمات الفرعية",
        "sub_all": "كل الخدمات",
        "l_phone": "هاتف", "h_phone": "اتصل مباشرة", "l_wa": "واتساب", "h_wa": "أرسل رسالة", "l_mail": "البريد الإلكتروني", "h_mail": "راسلنا بالبريد",
        "wa_text": "مرحباً، لدي استفسار عن خدمات IT.",
        "call": "اتصل بنا",
        "whatsapp": "واتساب",
        "mbar_cta": "احجز استشارة",
        "crumb_home": "الرئيسية",
        "foot_tag": "خدمات IT والشبكات والأمان للشركات والعيادات في فيينا ومحيطها. شخص واحد مسؤول، بشرح واضح.",
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
        "f_praxis": "عيادتك",
        "types_praxis": ["عيادة طبية", "عيادة أسنان", "عيادة علاج", "عيادة جماعية", "منشأة طبية أخرى"],
        "interests_praxis": [
            ("erstgespraech", "استشارة أولى مجانية", "احجز استشارة أولى", ""),
            ("it-check", "فحص IT بـ 99 € دون ضريبة", "اطلب فحص IT", ""),
            ("betreuung", "دعم IT مستمر", "اطلب الدعم المستمر", ""),
            ("praxiswebsite", "موقع العيادة", "اطلب موقع العيادة", "لا تحتاج إلى فحص IT لموقع العيادة."),
        ],
        "f_msg_notice": "يرجى عدم إرسال بيانات مرضى أو كلمات مرور عبر هذا النموذج.",
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
    "en": {
        "dir": "ltr",
        "skip": "Skip to content",
        "menu": "Menu",
        "nav": [("Services", "/leistungen/"), ("For practices", "/arztpraxis/"), ("For offices", "/unternehmen/"), ("IT check", "/#it-check"), ("Contact", "/#kontakt")],
        "cta": "Request a free first call",
        "call": "Call",
        "whatsapp": "WhatsApp",
        "mbar_cta": "Request a free first call",
        "crumb_home": "Home",
        "sub_sr": "Services submenu",
        "sub_all": "See all services",
        "l_phone": "Phone", "h_phone": "Call directly", "l_wa": "WhatsApp", "h_wa": "Send a message", "l_mail": "Email", "h_mail": "Write to us",
        "wa_text": "Hello, I have a question about IT support.",
        "foot_tag": "IT, network and security for businesses in Vienna and the surrounding area. Personal, understandable and from one source.",
        "legal": "All prices net of VAT. Information without guarantee.",
        "f_name": "Name", "f_contact": "Phone or email", "f_contact_hint": "How can we best reach you?",
        "f_type": "Your business", "f_msg": "What is it about? (optional)",
        "types": ["Medical practice", "Dental practice", "Therapy practice", "Lawyer", "Tax advisor or accountant", "Office", "Shop", "Workshop or warehouse", "Other"],
        "f_consent": 'I have read the <a href="/datenschutz/">privacy policy</a> (in German) and agree that HORANiQ may contact me about my request.',
        "f_submit": "Request a first call",
        "f_ok": "Thank you for your request. We will get back to you using the contact details you provided.",
        "f_err": "Your request could not be sent. Your entries are still there. Please try again or write to %s.",
        "f_mailto": "Your email program has been opened. Please send the prepared message from there. If nothing opened, write to %s.",
        "f_sending": "Sending…", "f_invalid": "Please check the highlighted fields.",
        "f_subject": "Request first call",
        "f_choose": "Please choose",
        "f_interest": "What are you interested in?",
        "f_praxis": "Your practice",
        "types_praxis": ["Medical practice", "Dental practice", "Therapy practice", "Group practice", "Other medical facility"],
        "interests_general": [
            ("erstgespraech", "Free first call", "Request a first call", ""),
            ("it-check", "IT check for €99 excl. VAT", "Request the IT check", ""),
            ("betreuung", "Ongoing IT care", "Request care", ""),
            ("website", "Website", "Request a website project", "You do not need an IT check for website and shop projects."),
            ("onlineshop", "Online shop", "Request an online shop", "You do not need an IT check for website and shop projects."),
            ("beratung", "IT consulting / other request", "Send request", ""),
        ],
        "interests_praxis": [
            ("erstgespraech", "Free first call", "Request a first call", ""),
            ("it-check", "IT check for €99 excl. VAT", "Request the IT check", ""),
            ("betreuung", "Ongoing IT care", "Request care", ""),
            ("praxiswebsite", "Practice website", "Request a practice website", "You do not need an IT check for a practice website."),
        ],
        "f_msg_notice": "Please do not send patient data or passwords through this form.",
        "e_name": "Please enter your name.",
        "e_contact": "Please enter a phone number or email address.",
        "e_contact_invalid": "Please check your phone number or email address.",
        "e_type": "Please choose an option.",
        "e_consent": "Please confirm the privacy policy.",
    },
}

HOME = {"de": "/", "en": "/en/", "ar": "/ar/"}
PREFIX = {"de": "", "en": "/en", "ar": "/ar"}
LANG_SHORT = {"de": ("DE", "Deutsch"), "en": ("EN", "English"), "ar": ("AR", "العربية")}
OG_LOCALE = {"de": "de_AT", "en": "en_GB", "ar": "ar_AR"}
SCHEMA_LANG = {"de": "de-AT", "en": "en", "ar": "ar"}


def code_of(t):
    return next(k for k, v in I18N.items() if v is t)


def svc_data(code):
    """(groups, {slug: (name, blurb)}) for a language."""
    if code == "ar":
        return services_ar.GROUPS_AR, services_ar.INDEX_AR
    if code == "en":
        return services_en.GROUPS_EN, services_en.INDEX_EN
    return services.GROUPS, services.SVC


FOOT = {
    "de": dict(svc="Leistungen", more="Weitere Leistungen", all="Alle Leistungen", sectors="Branchen", praxis="Arztpraxen", biz="Büros und Betriebe", company="Unternehmen", about="Über uns", prices="Preise", guides="Ratgeber", area="Einsatzgebiet Wien", imp="Impressum", ds="Datenschutz", langs=[("English", "/en/"), ("العربية", "/ar/")]),
    "en": dict(svc="Services", more="More services", all="All services", sectors="Sectors", praxis="Medical practices", biz="Offices and businesses", company="Company", about="About us", prices="Prices", guides="Guides", area="Service area Vienna", imp="Legal notice (German)", ds="Privacy policy (German)", langs=[("Deutsch", "/"), ("العربية", "/ar/")]),
    "ar": dict(svc="الخدمات", more="المزيد", all="كل الخدمات", sectors="القطاعات", praxis="العيادات", biz="المكاتب والشركات", company="الشركة", about="من نحن", prices="الأسعار", guides="أدلة", area="منطقة العمل", imp="بيانات الشركة (Impressum)", ds="الخصوصية (Datenschutz)", langs=[("Deutsch", "/"), ("English", "/en/")]),
}


def foot_cols(code):
    f, pre = FOOT[code], PREFIX[code]
    langs = [x for x in f["langs"] if ENABLE_EN or x[1] != "/en/"]
    names = svc_data(code)[1]
    nm = lambda sl: names[sl][0]
    link = lambda sl: (nm(sl), f"{pre}/{sl}/")
    return [
        (f["svc"], [link(x) for x in ["it-betreuung", "wartung-reparatur", "microsoft-365", "netzwerk", "backup", "it-sicherheit"]]),
        (f["more"], [link(x) for x in ["sicherheit", "smart-building", "website-shop", "crm-archivierung", "it-beratung", "it-check", "care"]] + [(f["all"], f"{pre}/leistungen/")]),
        (f["sectors"], [(f["praxis"], f"{pre}/arztpraxis/"), (f["biz"], f"{pre}/unternehmen/")] + langs),
        (f["company"], [(f["about"], f"{pre}/ueber-uns/"), (f["guides"], f"{pre}/ratgeber/"), (f["area"], f"{pre}/wien/"), (f["imp"], "/impressum/"), (f["ds"], "/datenschutz/")]),
    ]



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
        out += f'<a class="{cls}" href="tel:{re.sub(r"[^+0-9]", "", PHONE)}" data-track="{track}">{t["call"]}{"" if track.startswith("mbar") else " " + html.escape(PHONE)}</a>'
    return out


UI_ICONS = {
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "whatsapp": '<path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.4L3 21z"/><path d="M9 10c0 3 2 5 5 5l1.2-1.2a.8.8 0 0 0 0-1.1l-1.3-.9a.8.8 0 0 0-1 .1l-.5.5a3.3 3.3 0 0 1-2-2l.5-.5a.8.8 0 0 0 .1-1L10 7.8a.8.8 0 0 0-1.1 0z"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
}


def ui_icon(name, cls="ui-ico"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{UI_ICONS[name]}</svg>'


def tel_url():
    return "tel:" + re.sub(r"[^+0-9]", "", PHONE)


def wa_url(t):
    return f"https://wa.me/{WHATSAPP}?text={urllib.parse.quote(t['wa_text'])}"


def contact_card(kind, t, track):
    """One tappable contact row: icon, label, value. Numbers and addresses stay left-to-right in RTL pages."""
    if kind == "phone":
        href, extra, value, label, hint = tel_url(), "", html.escape(PHONE), t["l_phone"], t["h_phone"]
    elif kind == "whatsapp":
        href, extra, value, label, hint = wa_url(t), ' target="_blank" rel="noopener"', html.escape(PHONE), t["l_wa"], t["h_wa"]
    else:
        href, extra, value, label, hint = f"mailto:{EMAIL}", "", EMAIL, t["l_mail"], t["h_mail"]
    return (f'<a class="cc cc-{kind}" href="{href}"{extra} data-track="{track}">'
            f'<span class="cc-ico">{ui_icon(kind)}</span>'
            f'<span class="cc-txt"><span class="cc-label">{label}</span><span class="cc-value" dir="ltr">{value}</span></span>'
            f'<span class="cc-hint">{hint}</span></a>')


def form_html(t, sector, default_interest="erstgespraech"):
    """Shared contact form. The Arztpraxis page adds a request-type field and practice-specific options."""
    praxis = sector in ("arztpraxis", "ar-arztpraxis", "en-arztpraxis")
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


def services_menu_html(t, label, href, cur):
    """Services with a submenu that lists every service, grouped. The parent stays a normal link to the hub."""
    code = code_of(t)
    groups, names = svc_data(code)
    pre = PREFIX[code]
    cols = ""
    for name, _, slugs in groups:
        items = "".join(f'<li><a href="{pre}/{sl}/">{icon_svg(sl, "sm")}<span>{names[sl][0]}</span></a></li>' for sl in slugs)
        cols += f'<div class="sub-col"><p class="sub-h">{name}</p><ul>{items}</ul></div>'
    return (f'<div class="nav-item has-sub"><a href="{href}"{cur}>{label}</a>'
            f'<button type="button" class="sub-toggle" aria-expanded="false" aria-controls="sub-leistungen"><span class="sr-only">{t["sub_sr"]}</span></button>'
            f'<div class="sub" id="sub-leistungen">{cols}<p class="sub-all"><a href="{href}">{t["sub_all"]}</a></p></div></div>')


def logo_html(t, cls="logo"):
    home = HOME[code_of(t)]
    return f'<a class="{cls}" href="{home}" aria-label="HORANiQ"><img src="/assets/img/horaniq-logo.webp" alt="HORANiQ" width="145" height="44"></a>'


PHOTO_RE = re.compile(r"\{\{PHOTO:([a-z0-9-]+)\|([^|}]*)\|(\d+)x(\d+)\}\}")


def photo_html(m):
    """Renders assets/photos/<name>.webp if the file exists, else nothing (no empty placeholders on the live site)."""
    name, alt, w, h = m.groups()
    if not (ROOT / "assets" / "photos" / f"{name}.webp").exists():
        return ""
    return f'<img class="photo" src="/assets/photos/{name}.webp" alt="{html.escape(alt)}" width="{w}" height="{h}" loading="lazy" decoding="async">'


def header_html(t, path, cta="#kontakt", pairs=None, ids=()):
    code = code_of(t)
    pre = PREFIX[code]
    links = ""
    for label, h in t["nav"]:
        if h.startswith("/#") and h[2:] in ids:
            href = h[1:]  # target exists on this page: stay on the page
        else:
            href = pre + h
        cur = ' aria-current="page"' if href == path else ""
        if h == "/leistungen/":
            links += services_menu_html(t, label, href, cur)
        else:
            links += f'<a href="{href}"{cur}>{label}</a>'
    if PHONE:
        links += f'<a class="nav-ico" href="{tel_url()}" data-track="nav-call" aria-label="{t["call"]} {html.escape(PHONE)}" title="{html.escape(PHONE)}">{ui_icon("phone")}<span class="nav-ico-t">{t["call"]}</span></a>'
    if WHATSAPP:
        links += f'<a class="nav-ico nav-ico-wa" href="{wa_url(t)}" target="_blank" rel="noopener" data-track="nav-whatsapp" aria-label="{t["whatsapp"]}">{ui_icon("whatsapp")}<span class="nav-ico-t">{t["whatsapp"]}</span></a>'
    for oc in ("de", "en", "ar"):
        if oc == code or (oc == "en" and not ENABLE_EN):
            continue
        short, full = LANG_SHORT[oc]
        target = (pairs or {}).get(oc) or HOME[oc]
        extra = "" if ENABLE_EN else (' dir="rtl"' if oc == "ar" else "")
        text = short if ENABLE_EN else full
        links += f'<a class="lang" href="{target}" hreflang="{oc}" lang="{oc}" aria-label="{full}"{extra}>{text}</a>'
    links += f'<a class="btn btn-primary btn-sm" href="{cta}" data-track="nav-cta" data-interest="erstgespraech">{t["cta"]}</a>'
    return f'''<a class="skip" href="#main">{t["skip"]}</a>
<header class="site-header"><div class="wrap bar">
  {logo_html(t)}
  <button class="menu-btn" aria-expanded="false" aria-controls="nav">{t["menu"]}</button>
  <nav class="nav" id="nav" aria-label="Hauptnavigation">{links}</nav>
</div></header>'''


def lang_attr(h):
    """hreflang/lang attributes for links that switch language."""
    for code, home in HOME.items():
        if h == home and code != "de" or (h == "/" and code == "de"):
            return f' hreflang="{code}" lang="{code}"' + (' dir="rtl"' if code == "ar" else "")
    return ""


def foot_contact(t):
    parts = []
    if PHONE:
        parts.append(f'<a href="{tel_url()}" data-track="footer-call" dir="ltr">{html.escape(PHONE)}</a>')
    if WHATSAPP:
        parts.append(f'<a href="{wa_url(t)}" target="_blank" rel="noopener" data-track="footer-whatsapp">{t["whatsapp"]}</a>')
    parts.append(f'<a href="mailto:{EMAIL}" dir="ltr">{EMAIL}</a>')
    return "<br>".join(parts)


def footer_html(t):
    cols = ""
    for title, items in foot_cols(code_of(t)):
        cols += f"<div><h3>{title}</h3><ul>" + "".join(f'<li><a href="{h}"{lang_attr(h)}>{l}</a></li>' for l, h in items) + "</ul></div>"
    return f'''<footer class="site-footer"><div class="wrap">
  <div class="foot">
    <div>{logo_html(t)}<p>{t["foot_tag"]}</p><p class="foot-contact">{foot_contact(t)}</p></div>
    {cols}
  </div>
  <p class="legal">© 2026 HORANiQ, Rami Horani, Wien. {t["legal"]}</p>
</div></footer>'''


def mbar_html(t, cta="#kontakt"):
    btns = ""
    if PHONE:
        btns += f'<a class="btn btn-ghost btn-icon" href="{tel_url()}" data-track="mbar-call" aria-label="{t["call"]} {html.escape(PHONE)}">{ui_icon("phone")}</a>'
    if WHATSAPP:
        btns += f'<a class="btn btn-ghost btn-icon btn-wa" href="{wa_url(t)}" target="_blank" rel="noopener" data-track="mbar-whatsapp" aria-label="{t["whatsapp"]}">{ui_icon("whatsapp")}</a>'
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
        graph.append({"@type": "WebPage", "@id": url + "#page", "url": url, "name": meta["title"], "description": meta["description"], "inLanguage": SCHEMA_LANG[meta["lang"]], "isPartOf": {"@id": f"{DOMAIN}/#website"} if meta["path"] == "/" else {"@id": f"{DOMAIN}/#business"}, "about": {"@id": f"{DOMAIN}/#business"}})
    if meta.get("breadcrumb"):
        crumbs = [(t["crumb_home"], HOME[meta["lang"]])]
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
    body = body.replace("{{SERVICE_GROUPS_EN}}", services_en.groups_en("h3"))
    body = ICON_RE.sub(lambda m: icon_svg(m.group(1), m.group(2) or ""), body)
    body = PHOTO_RE.sub(photo_html, body)
    body = body.replace("{{FORM}}", form_html(t, sector, meta.get("interest", "erstgespraech")))
    body = body.replace("{{CALL}}", call_buttons(t))
    body = re.sub(r'<a href="mailto:\{\{EMAIL\}\}" data-track="contact-mail"[^>]*>\{\{EMAIL\}\}</a>', lambda m: contact_card("mail", t, "contact-mail"), body)
    body = body.replace("{{EMAIL}}", EMAIL)
    body = body.replace("{{PHONE_LINE}}", contact_card("phone", t, "contact-call") if PHONE else "")
    body = body.replace("{{WA_LINE}}", contact_card("whatsapp", t, "contact-whatsapp") if WHATSAPP else "")

    robots = meta.get("robots", "index")
    cta = "#kontakt" if 'id="kontakt"' in body else HOME[meta["lang"]] + "#kontakt"
    alt = ""
    pairs = {}
    if meta.get("alt"):
        pairs = dict(p.split("=", 1) for p in meta["alt"].split(","))
        pairs = {k: v for k, v in pairs.items() if ENABLE_EN or k != "en"}
        for code, p in pairs.items():
            alt += f'<link rel="alternate" hreflang="{code}" href="{DOMAIN}{p}">\n'
        alt += f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}{pairs.get("de", "/")}">\n'
    crumbs = ""
    if meta.get("breadcrumb"):
        home = HOME[meta["lang"]]
        crumbs = f'<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="{home}">{t["crumb_home"]}</a></li><li aria-current="page">{html.escape(meta["breadcrumb"])}</li></ol></nav>'
    og_locale = OG_LOCALE[meta["lang"]]
    title = html.escape(meta["title"])
    desc = html.escape(meta["description"])
    analytics = ""
    if PLAUSIBLE_DOMAIN and not PREVIEW:
        analytics = f'<script defer data-domain="{PLAUSIBLE_DOMAIN}" src="https://plausible.io/js/script.js"></script>\n'
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
{header_html(t, meta["path"], cta, pairs, set(re.findall(r'id="([^"]+)"', body)))}
<main id="main">
{crumbs}
{body}
</main>
{footer_html(t)}
{mbar_html(t, cta)}
{analytics}<script src="/assets/js/site.js" defer></script>
</body>
</html>
'''


def llms_txt(paths):
    names = {"/": "Startseite", "/leistungen/": "Alle Leistungen", "/arztpraxis/": "IT für Arztpraxen", "/unternehmen/": "IT für Büros und Betriebe", "/ueber-uns/": "Über uns", "/ratgeber/": "Ratgeber", "/wien/": "Einsatzgebiet Wien", "/ratgeber/it-sicherheit-arztpraxis/": "Checkliste IT-Sicherheit in der Arztpraxis", "/ratgeber/backup-testen/": "Backup testen in fünf Schritten", "/ratgeber/microsoft-365-mfa/": "Microsoft 365 absichern mit MFA"}
    lines = ["# HORANiQ", "", "> IT-Betreuung, Netzwerk und Sicherheit für Arztpraxen, Büros und Betriebe in Wien und Umgebung. Persönlicher Ansprechpartner, Beratung auf Deutsch und Arabisch. Gründer: Rami Horani.", "", "## Seiten (Deutsch)"]
    for p in paths:
        if p.startswith(("/ar/", "/en/")):
            continue
        slug = p.strip("/").split("/")[-1]
        label = names.get(p) or (services.SVC[slug][0] if slug in services.SVC else slug.replace("-", " ").title())
        lines.append(f"- [{html.unescape(re.sub(r'<[^>]+>', '', label))}]({DOMAIN}{p})")
    if ENABLE_EN:
        lines += ["", "## English"] + [f"- [{p}]({DOMAIN}{p})" for p in paths if p.startswith("/en/")]
    lines += ["", "## Arabisch"] + [f"- [{p}]({DOMAIN}{p})" for p in paths if p.startswith("/ar/")] + [""]
    lines += [ "## Fakten", "- Einsatzgebiet: Wien und Umgebung, bis etwa eine Stunde Fahrzeit, Fernwartung darüber hinaus", "- Erstgespräch kostenlos; IT-Check €99 zzgl. USt., bei Auftrag angerechnet", "- Alle Preise netto"]
    return "\n".join(lines) + "\n"


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
    pages = [pg for pg in pages if ENABLE_EN or pg[0].get("lang") != "en"]
    import services_ar
    for slug, s in services.SERVICES.items():
        alt = f"de=/{slug}/" + (f",en=/en/{slug}/" if slug in services_en.SERVICES_EN or slug == "netzwerk" else "") + (f",ar=/ar/{slug}/" if slug in services_ar.SERVICES_AR else "")
        pages.append(({"lang": "de", "path": f"/{slug}/", "title": s["title"], "description": s["description"], "sector": slug, "breadcrumb": html.unescape(s["name"]), "alt": alt, "interest": s.get("interest", "erstgespraech")}, services.render_fragment(slug)))
    handwritten = {m["path"] for m, _ in pages}
    for slug, s in services_ar.SERVICES_AR.items():
        if f"/ar/{slug}/" in handwritten:
            continue
        pages.append(({"lang": "ar", "path": f"/ar/{slug}/", "title": s["title"], "description": s["description"], "sector": f"ar-{slug}", "breadcrumb": s["name"], "alt": f"de=/{slug}/,en=/en/{slug}/,ar=/ar/{slug}/", "interest": s.get("interest", "erstgespraech")}, services.render_fragment(slug, "ar")))
    for slug, s_ in (services_en.SERVICES_EN.items() if ENABLE_EN else []):
        if f"/en/{slug}/" in handwritten:
            continue
        pages.append(({"lang": "en", "path": f"/en/{slug}/", "title": s_["title"], "description": s_["description"], "sector": f"en-{slug}", "breadcrumb": html.unescape(s_["name"]), "alt": f"de=/{slug}/,en=/en/{slug}/,ar=/ar/{slug}/", "interest": s_.get("interest", "erstgespraech")}, services.render_fragment(slug, "en")))
    if ENABLE_EN:
      pages.append(({"lang": "en", "path": "/en/leistungen/", "title": "Services: IT, network, security and more in Vienna | HORANiQ", "description": "All HORANiQ services: IT support, Microsoft 365, network, backup, security, smart building, websites and maintenance for businesses in Vienna.", "sector": "en-leistungen", "breadcrumb": "Services", "alt": "de=/leistungen/,en=/en/leistungen/,ar=/ar/leistungen/"}, services_en.render_hub_en()))
    pages.append(({"lang": "ar", "path": "/ar/leistungen/", "title": "كل خدمات HORANiQ: IT وشبكات وأمان ومواقع في فيينا", "description": "كل الخدمات من جهة واحدة: دعم IT وMicrosoft 365 وشبكات ونسخ احتياطي وأمان وكاميرات ومواقع ومتاجر إلكترونية للشركات في فيينا ومحيطها.", "sector": "ar-leistungen", "breadcrumb": "كل الخدمات", "alt": "de=/leistungen/,en=/en/leistungen/,ar=/ar/leistungen/"}, services_ar.render_hub_ar()))
    pages.append(({"lang": "de", "path": "/leistungen/", "title": "Leistungen: IT, Netzwerk, Sicherheit und mehr in Wien | HORANiQ", "description": "Alle Leistungen von HORANiQ: IT-Betreuung, Microsoft 365, Netzwerk, Backup, Sicherheit, Smart Building, Websites und Wartung für Betriebe in Wien und Umgebung.", "sector": "leistungen", "breadcrumb": "Leistungen", "alt": "de=/leistungen/,en=/en/leistungen/,ar=/ar/leistungen/"}, services.render_hub()))
    for meta, body in pages:
        out = OUT / meta["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(meta, body), encoding="utf-8")
        if meta.get("robots", "index") == "index":
            sitemap.append(meta["path"])
        print("built", meta["path"])
    nf = ({"lang": "de", "path": "/404/", "title": "Seite nicht gefunden | HORANiQ", "description": "Diese Seite gibt es nicht.", "sector": "legal", "robots": "noindex, follow"}, '<section class="s"><div class="wrap prose"><h1>Seite nicht gefunden</h1><p>Diese Adresse gibt es nicht (mehr). Hier geht es weiter:</p><div class="btn-row"><a class="btn btn-primary" href="/">Zur Startseite</a><a class="btn btn-ghost" href="/leistungen/">Alle Leistungen</a><a class="btn btn-ghost" href="/#kontakt">Kontakt</a></div></div></section>')
    (OUT / "404.html").write_text(render(*nf), encoding="utf-8")
    (OUT / "llms.txt").write_text(llms_txt(sitemap), encoding="utf-8")
    urls = "".join(f"  <url><loc>{DOMAIN}{p}</loc></url>\n" for p in sitemap)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
    (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n" if PREVIEW else f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    main()
