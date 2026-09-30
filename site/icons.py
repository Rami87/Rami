"""HORANiQ service icon set. One source of truth: build.py writes the sprite (assets/img/icons.svg) and standalone files (assets/icons/*.svg).

Style rules (keep when adding icons):
- 64 x 64 grid, 3 px round strokes, navy line work (currentColor in the sprite).
- One technology-blue accent shape per icon (tinted fill or solid detail). Green and amber/red only for status meaning (OK, warning, critical).
- Literal metaphors, no shields or padlocks reused from the logo idea, no gradients, no text.
"""

# tokens: S stroke, B blue accent, BT blue tint (fill), G green, A amber, R red, W white
ICONS = {
    # IT-Betreuung & Support: headset with microphone
    "it-betreuung": '''
<path d="M14 34V31a18 18 0 0 1 36 0v3" fill="none"/>
<rect x="9" y="33" width="9" height="16" rx="4" fill="{BT}"/>
<rect x="46" y="33" width="9" height="16" rx="4" fill="{BT}"/>
<path d="M50 49v2c0 4-3 6-8 6h-6" fill="none"/>
<circle cx="33" cy="57" r="3.2" fill="{B}" stroke="none"/>''',

    # Computer, Geraete & Wartung: laptop with wrench
    "wartung-reparatur": '''
<rect x="12" y="11" width="40" height="29" rx="3.5" fill="none"/>
<path d="M6 46h52l-3 5H9z" fill="none"/>
<circle cx="32" cy="25.5" r="9.5" fill="{BT}" stroke="none"/>
<path d="M38.5 19a5 5 0 0 0-6.5 6.4l-6 6a2 2 0 0 0 2.8 2.8l6-6A5 5 0 0 0 41 21.5l-3 3-2.2-.6-.6-2.2z" fill="{B}" stroke="{S}" stroke-width="2.2"/>''',

    # Microsoft 365: cloud with mail
    "microsoft-365": '''
<path d="M19 47a10 10 0 0 1-.6-20 13 13 0 0 1 25.3-2.4A9.5 9.5 0 0 1 46 47z" fill="none"/>
<rect x="23" y="29" width="22" height="15" rx="2.5" fill="{BT}"/>
<path d="M23.5 31l10.5 8 10.5-8" fill="none"/>''',

    # CRM & digitale Ablage: customer folder
    "crm-archivierung": '''
<path d="M8 20a3 3 0 0 1 3-3h13l5 6h24a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="none"/>
<circle cx="32" cy="33" r="5.2" fill="{B}" stroke="{S}"/>
<path d="M22 47a10 8 0 0 1 20 0" fill="none"/>''',

    # Netzwerk & WLAN: router with wifi arcs
    "netzwerk": '''
<path d="M15 25a24 24 0 0 1 34 0" fill="none"/>
<path d="M21 31a15 15 0 0 1 22 0" fill="none"/>
<path d="M26.500 36.500a7.500 7.500 0 0 1 11 0" fill="none"/>
<rect x="9" y="44" width="46" height="12" rx="4" fill="{BT}"/>
<circle cx="18" cy="50" r="1.900" fill="{S}" stroke="none"/>
<circle cx="25" cy="50" r="1.900" fill="{S}" stroke="none"/>
<circle cx="32" cy="41" r="2.400" fill="{B}" stroke="none"/>
<path d="M45 50h5" fill="none"/>''',

    # VoIP-Telefonie: desk phone with handset, display and keypad
    "voip": '''
<path d="M9 23v-4c0-3 2.500-5 6-5h34c3.500 0 6 2 6 5v4" fill="{BT}"/>
<rect x="8" y="25" width="48" height="29" rx="5" fill="none"/>
<rect x="14" y="31" width="16" height="9" rx="2" fill="{B}" stroke="none"/>
<circle cx="38" cy="33" r="1.800" fill="{S}" stroke="none"/><circle cx="44" cy="33" r="1.800" fill="{S}" stroke="none"/><circle cx="50" cy="33" r="1.800" fill="{S}" stroke="none"/>
<circle cx="38" cy="39" r="1.800" fill="{S}" stroke="none"/><circle cx="44" cy="39" r="1.800" fill="{S}" stroke="none"/><circle cx="50" cy="39" r="1.800" fill="{S}" stroke="none"/>
<path d="M14 47h36" fill="none"/>''',

    # Backup, NAS & Daten: database with restore arrow
    "backup": '''
<ellipse cx="22" cy="14" rx="14" ry="5.500" fill="{BT}"/>
<path d="M8 14v24c0 3 6.300 5.500 14 5.500S36 41 36 38V14" fill="none"/>
<path d="M8 26c0 3 6.300 5.500 14 5.500S36 29 36 26" fill="none"/>
<path d="M56 46a10 10 0 1 1-3-7.200" fill="none" stroke="{B}"/>
<path d="M54 32.500v6.500h-6.500" fill="none" stroke="{B}"/>''',

    # IT-Sicherheit: padlock with password dots
    "it-sicherheit": '''
<path d="M22 28v-6a10 10 0 0 1 20 0v6" fill="none"/>
<rect x="14" y="28" width="36" height="26" rx="5" fill="{BT}"/>
<circle cx="24" cy="41" r="2.400" fill="{S}" stroke="none"/>
<circle cx="32" cy="41" r="2.400" fill="{S}" stroke="none"/>
<circle cx="40" cy="41" r="2.400" fill="{S}" stroke="none"/>''',

    # Kameras, Alarm & Zutritt: CCTV camera on wall bracket
    "sicherheit": '''
<path d="M8 8v30" fill="none"/>
<path d="M8 16h9" fill="none"/>
<rect x="17" y="18" width="30" height="16" rx="3.500" fill="{BT}"/>
<rect x="47" y="21" width="9" height="10" rx="2" fill="{B}"/>
<path d="M8 40h6" fill="none"/>
<circle cx="24" cy="26" r="2.200" fill="{B}" stroke="none"/>''',

    # Smart Building: building with thermostat dial
    "smart-building": '''
<rect x="9" y="9" width="27" height="46" rx="2.500" fill="none"/>
<path d="M16 17h4M25 17h4M16 26h4M25 26h4M16 35h4M25 35h4" fill="none"/>
<path d="M18 55v-8h9v8" fill="none"/>
<circle cx="48" cy="43" r="9" fill="{BT}"/>
<path d="M48 43l3.500-3.500" fill="none"/>
<circle cx="48" cy="43" r="1.500" fill="{S}" stroke="none"/>
<path d="M43.500 31a6.500 6.500 0 0 1 9 0" fill="none" stroke="{B}"/>''',

    # Websites & Onlineshops: browser window with shopping cart
    "website-shop": '''
<rect x="6" y="10" width="52" height="42" rx="4.500" fill="none"/>
<path d="M6 21h52" fill="none"/>
<circle cx="12" cy="15.500" r="1.500" fill="{S}" stroke="none"/>
<circle cx="17.500" cy="15.500" r="1.500" fill="{S}" stroke="none"/>
<path d="M12 28h11M12 34h9M12 40h7" fill="none"/>
<path d="M29 27h4l3 12h13l3-9H34" fill="{BT}"/>
<circle cx="38" cy="44" r="2.300" fill="{B}" stroke="none"/>
<circle cx="47" cy="44" r="2.300" fill="{B}" stroke="none"/>''',

    # IT-Beratung & Projektumsetzung: conversation with plan
    "it-beratung": '''
<path d="M10 10h28a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H23l-8 7v-7h-5a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="none"/>
<path d="M14 18h20M14 24h12" fill="none"/>
<path d="M28 34h22a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-3v6l-8-6H28a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" fill="{BT}"/>
<path d="M32 43l4 4 8-8" fill="none" stroke="{B}"/>''',

    # HORANiQ IT-Check: report with traffic-light rows and magnifier
    "it-check": '''
<rect x="8" y="6" width="34" height="46" rx="4" fill="none"/>
<circle cx="17" cy="17" r="3.200" fill="{G}" stroke="none"/>
<circle cx="17" cy="28" r="3.200" fill="{A}" stroke="none"/>
<circle cx="17" cy="39" r="3.200" fill="{R}" stroke="none"/>
<path d="M25 17h10M25 28h10M25 39h6" fill="none"/>
<circle cx="43" cy="41" r="10" fill="{W}"/>
<path d="M50.500 48.500L58 56" fill="none" stroke-width="4"/>
<path d="M38.500 41l3 3 5-6" fill="none" stroke="{B}"/>''',

    # HORANiQ Care: calendar with completed check
    "care": '''
<rect x="8" y="13" width="48" height="43" rx="5" fill="none"/>
<path d="M8 26h48" fill="none"/>
<path d="M20 8v10M44 8v10" fill="none"/>
<circle cx="32" cy="41" r="10" fill="{BT}" stroke="none"/>
<path d="M26 41l4.500 4.500L39 36.500" fill="none" stroke="{G}" stroke-width="3.600"/>''',
    # Kontakt: telephone handset with signal arcs
    "kontakt-telefon": '''
<path d="M15 9h9l5 12-7 4.500c3.500 7 8 11.500 15 15l4.500-7 12 5v9c0 3-2.500 5.500-5.500 5.500C29 53 11 35 11 14.500 11 11.500 13 9 15 9z" fill="{BT}"/>
<path d="M39 14a11 11 0 0 1 11 11" fill="none" stroke="{B}"/>
<path d="M39 5a20 20 0 0 1 20 20" fill="none" stroke="{B}"/>''',

    # Kontakt: chat bubble with handset (WhatsApp)
    "kontakt-whatsapp": '''
<path d="M32 6.500a25.500 25.500 0 1 1-12.900 47.400L7.500 57.500l3.700-11.300A25.500 25.500 0 0 1 32 6.500z" fill="{BT}"/>
<path transform="translate(19.200 19.200) scale(1.070)" d="M6.620 10.790c1.440 2.830 3.760 5.140 6.590 6.590l2.200-2.200c.27-.27.67-.36 1.020-.24 1.120.37 2.330.57 3.570.57.550 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.390 0-17-7.610-17-17 0-.55.45-1 1-1h3.500c.55 0 1 .45 1 1 0 1.250.2 2.450.57 3.570.11.35.03.74-.25 1.020l-2.200 2.200z" fill="{B}" stroke="none"/>''',

    # Kontakt: envelope with new-mail dot
    "kontakt-mail": '''
<rect x="7" y="15" width="50" height="36" rx="5" fill="{BT}"/>
<path d="M9 19l23 18 23-18" fill="none"/>
<circle cx="53" cy="15" r="6" fill="{B}" stroke="{W}" stroke-width="2.500"/>''',
}

NAMES = {
    "it-betreuung": "IT-Betreuung & Support", "wartung-reparatur": "Computer, Geräte & Wartung", "microsoft-365": "Microsoft 365",
    "crm-archivierung": "CRM und digitale Ablage", "netzwerk": "Netzwerk & WLAN", "backup": "Backup, NAS & Daten", "voip": "VoIP-Telefonie",
    "it-sicherheit": "IT-Sicherheit", "sicherheit": "Kameras, Alarm & Zutritt", "smart-building": "Smart Building",
    "website-shop": "Websites & Onlineshops", "it-beratung": "IT-Beratung & Projektumsetzung", "it-check": "HORANiQ IT-Check", "care": "HORANiQ Care",
    "kontakt-telefon": "Telefon", "kontakt-whatsapp": "WhatsApp", "kontakt-mail": "E-Mail",
}

FILES = dict(S="#0F2E40", B="#33A1C2", BT="rgba(51,161,194,0.18)", G="#2FA672", A="#E0A02C", R="#C8443B", W="#FFFFFF")
SPRITE = dict(S="currentColor", B="var(--ico-blue,#33A1C2)", BT="var(--ico-tint,rgba(51,161,194,0.18))", G="#2FA672", A="#E0A02C", R="#C8443B", W="#FFFFFF")
GROUP = 'fill="none" stroke="{S}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'


def _fill(markup, tokens):
    out = markup
    for k, v in tokens.items():
        out = out.replace("{" + k + "}", v)
    return out


def standalone(slug, size=64):
    inner = _fill(ICONS[slug], FILES)
    g = _fill(GROUP, FILES)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}" role="img" aria-label="{NAMES[slug].replace("&", "&amp;")}"><g {g}>{inner}</g></svg>\n'


def sprite():
    g = _fill(GROUP, SPRITE)
    symbols = "".join(f'<symbol id="i-{s}" viewBox="0 0 64 64"><g {g}>{_fill(m, SPRITE)}</g></symbol>' for s, m in ICONS.items())
    return f'<svg xmlns="http://www.w3.org/2000/svg" style="display:none">{symbols}</svg>\n'
