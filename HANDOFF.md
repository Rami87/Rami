# HORANiQ: Übergabe für eine neue Claude-Sitzung

Zuerst lesen: `site/README.md`, dann diese Datei. Repo: Rami87/Rami, Branch `claude/zealous-planck-r5uz4n`.

## Projekt
Marketing-Website für HORANiQ (IT-Betreuung für Praxen und Büros in Wien, Gründer Rami Horani).
Deutsch ist die Hauptsprache, Arabisch (`/ar/`, RTL) mit gleicher Struktur. Englisch ist gebaut, aber abgeschaltet (`ENABLE_EN=1` zum Aktivieren).
Gesprächssprache mit dem Inhaber: Arabisch. Website-Texte: Deutsch (+ Arabisch).

## Bauen
- `python3 site/build.py` erzeugt `site/public/` (reines Python, keine Abhängigkeiten).
- `python3 site/make_offline.py` erzeugt `horaniq-website-offline.zip`.
- Umgebungsvariablen: `FORM_ENDPOINT` (Standard Formspree), `PHONE`, `WHATSAPP`, `PLAUSIBLE_DOMAIN`, `PREVIEW`/`BASE_PATH` (gh-pages), `ENABLE_EN`.

## Wo was liegt
- `site/build.py`: Generator, Übersetzungen (I18N de/ar/en), Kopf/Fuß, Formular, Schema, `llms.txt`.
- `site/src/pages/*.html`: Seiten als Fragmente mit Front-Matter (de: `index.html`, `netzwerk.html`, ...; `ar*.html`, `en*.html`).
- `site/services.py`, `services_ar.py`, `services_en.py`: Leistungsseiten (14 Leistungen inkl. `voip`), Gruppen, Texte.
- `site/icons.py`: Icon-Set (Sprite wird beim Build erzeugt).
- `site/assets/css/site.css`: Styles. Schriften: Manrope (DE), Readex Pro (AR), lokal in `site/assets/fonts/`.
- `print/`: Visitenkarte und A3-Plakat (2 Seiten) via `python3 print/build_campaign.py` und `node print/render_campaign.js` (Playwright/Chromium).
- `carousels/`: Instagram-Karussell (Skill `instagram-carousel`).
- Doku: `HORANiQ_Website_Report.md`, `HORANiQ_Brand_Marketing_Strategy.md`, `HORANiQ_GoogleAds_Kampagne.md`, `site/SERVICE-INVENTORY.md`, `.agents/product-marketing.md`.

## Entscheidungen
- Keine Preise auf der Website und in Werbemitteln (auch kein IT-Check-Preis). Formulierung: kostenloses Erstgespräch, dann klares Angebot, Preise netto.
- Keine Preise-Seite, kein Google Business Profile und keine Arbeitsfotos vorerst.
- Telefon/WhatsApp +43 676 780 7247, Formular über Formspree (funktioniert, Mails können im Spam landen).
- Markenfarben: Navy #0F2E40, Blau #33A1C2, Grün #48B78C, Petrol #0B7A77.
- Keine erfundenen Zahlen, Bewertungen oder Zertifikate. Arbeitgeber des Gründers wird nicht namentlich genannt.

## Offen
- Firmendaten für Impressum und Datenschutz (Seiten sind noch Entwürfe mit noindex). Nicht werben oder live gehen, bevor sie vollständig sind.
- Echte Logo-Datei (SVG/AI/PDF) für den Druck, Social-Handles (Platzhalter `horaniq.at`).
- Druckmaterial und Schriftenpaket (`HORANiQ-Fonts.zip`) nutzen noch Instrument Sans / IBM Plex Sans Arabic und müssten auf Manrope / Readex Pro umgestellt werden.
