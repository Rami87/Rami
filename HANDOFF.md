# HORANiQ: Übergabe für eine neue Claude-Sitzung

Zuerst lesen: `site/README.md`, `.agents/product-marketing.md`, dann diese Datei.
Repo: Rami87/Rami. Einziger Arbeitsbranch: `claude/quirky-franklin-nsyeoq` (31 Commits vor `master`, noch nicht gemerged, kein PR). Der Inhaber will wenige Branches: keine neuen anlegen.
Stand: 2026-10-06 (Ende der Sitzung). Aktuellen Commit mit `git log -1` prüfen; der letzte Vorschau-Build auf `gh-pages` heißt "Preview build from <sha>".

Startnachricht für die neue Sitzung (kann so eingefügt werden):
> Lies HANDOFF.md im Repo-Wurzelverzeichnis und mach dort weiter. Wir sprechen Arabisch, Website-Texte sind Deutsch und Arabisch.

## Projekt
Marketing-Website für HORANiQ (IT-Betreuung für Praxen und Büros in Wien, Gründer Rami Horani).
Deutsch ist die Hauptsprache, Arabisch (`/ar/`, RTL) mit gleicher Struktur. Englisch ist gebaut, aber abgeschaltet (`ENABLE_EN=1` zum Aktivieren). Die englischen Seiten werden von Massenänderungen mit erfasst, aber nicht geprüft.
Gesprächssprache mit dem Inhaber: Arabisch. Er prüft die Texte selbst online.

## Bauen und Vorschau
- `python3 site/build.py` erzeugt `site/public/`. Das Verzeichnis ist im Repo eingecheckt: vor jedem Commit neu bauen und mit committen.
- Vorschau auf GitHub Pages: https://rami87.github.io/Rami/ und https://rami87.github.io/Rami/ar/ (noindex, `robots.txt` Disallow). Ablauf nach jeder Änderung:
  1. `PREVIEW=1 BASE_PATH=/Rami python3 build.py` in einer Kopie von `site/` (nicht im Repo) ausführen.
  2. `git worktree add <ordner> origin/gh-pages`, dort alles außer `.git` löschen, den Build kopieren, `touch .nojekyll`, committen ("Preview build from <sha>"), `git push origin gh-pages`.
  3. Worktree wieder entfernen (`git worktree remove --force`, `git worktree prune`).
  Der Workflow "Preview site" im Repo reagiert nur auf den alten Branch `claude/zealous-planck-r5uz4n`. Er kann die Vorschau überschreiben, falls dort jemand pusht.
- `python3 site/make_offline.py` erzeugt `horaniq-website-offline.zip`.
- Umgebungsvariablen: `FORM_ENDPOINT` (Standard Formspree), `PHONE`, `WHATSAPP`, `PLAUSIBLE_DOMAIN`, `PREVIEW`/`BASE_PATH`, `ENABLE_EN`.
- `__pycache__/` und `*.pyc` stehen in `.gitignore` (nicht mehr getrackt). Ein Stop-Hook meldet nicht committete oder nicht gepushte Änderungen: Repo am Ende sauber halten.

## Wo was liegt
- `site/build.py`: Generator, Übersetzungen (I18N de/ar/en), Kopf (inkl. Menü-Beschriftungen `menu`/`menu_close`), Fuß, Formular, Schema, `llms.txt`.
- `site/src/pages/*.html`: Seiten als Fragmente mit Front-Matter (`index.html`, `arztpraxis.html`, `unternehmen.html`, `netzwerk.html`, ...; `ar*.html`, `en*.html`).
- `site/services.py`, `services_ar.py`, `services_en.py`: 14 Leistungsseiten, Gruppen, Texte.
- `site/icons.py`: Icon-Set. `ICONS` enthält die Zeichnungen auf 64er-Raster, Teile mit `class="a-…"` bewegen sich. `inline()` liefert SVG für Seiten, `sprite()`/`standalone()` bleiben für Dateien (`assets/img/icons.svg` wird noch erzeugt, ist aber ungenutzt).
- `site/assets/css/site.css`: alle Styles. `site/assets/js/site.js`: Menü, Untermenü, Report-Lampen, Formular, Tracking-Hooks.
- Schriften lokal: Manrope (DE und alle lateinischen Zeichen), Readex Pro nur arabische Zeichen (`site/assets/fonts/`).
- `print/` (Visitenkarte, A3-Plakat), `carousels/` (Instagram), Doku: `HORANiQ_Website_Report.md`, `HORANiQ_Brand_Marketing_Strategy.md`, `HORANiQ_GoogleAds_Kampagne.md`, `site/SERVICE-INVENTORY.md`.

## Entscheidungen des Inhabers (gelten weiter)
- Keine Preise auf der Website und in Werbemitteln. Formulierung: kostenloses Erstgespräch, dann klares Angebot, Preise netto. Keine Preise-Seite, kein Google Business Profile, keine Arbeitsfotos vorerst.
- Keine erfundenen Zahlen, Bewertungen oder Zertifikate. Arbeitgeber des Gründers wird nicht genannt.
- Telefon/WhatsApp +43 676 780 7247, Formular über Formspree.
- Markenfarben: Navy #0F2E40, Blau #33A1C2, Grün #48B78C, Petrol #0B7A77. Wenig Animation, keine Cyber-Klischees (Schild, Schloss, Neon), mobil bewusst gestaltet.
- Microsoft 365 gehört zu Büros und Unternehmen, nicht zu den Arztpraxen (dort entfernt, inkl. IT-Check-Liste). Im Kopf- und Fußmenü, in JSON-LD und auf `/microsoft-365/` bleibt die Leistung bestehen.
- Der Inhaber will große Gestaltungsänderungen erst als Bild (Desktop und Mobil, DE und AR) sehen und gibt dann "طبق" frei. Danach: committen, pushen, Vorschau aktualisieren, kurze Zusammenfassung mit Hinweis, was nicht geprüft wurde.

## Was in dieser Sitzung geändert wurde (alles auf dem Arbeitsbranch)
- Texte: Glossar auf allen arabischen Seiten (Auszug: "جيد/خطر" statt "سليم/حرج", "أنظمتك" statt "تقنيتك", "أجهزة تبديل الشبكة" statt "سويتش", "صلاحيات الدخول للموظفين", "تحقق بخطوتين (MFA)", "متابعة" statt "مراقبة", "صيانة دورية" statt "دعم مستمر"). Startseite DE: H1 "IT-Lösungen, die zu Ihrem Betrieb passen". Meta-Beschreibung ohne "klare Preise".
- Arztpraxis-Seite (DE/AR): Kameras und Sicherheitstechnik ersetzen Microsoft 365, neue Karte VoIP-Telefonie, NAS in "Datensicherung und NAS" integriert, Satz "Auf Wunsch auch möglich…" entfernt, nur "Alle Leistungen ansehen" bleibt.
- Startseite: Satz "Auch für Geschäfte, Werkstätten und Lager" (ohne Büros, DE/AR/EN).
- Kopfbereich: altes Dropdown-Design mit Leistungs-Icons, auf Mobil/Tablet (<1241 px) fährt das Menü als Vollbild-Panel von unten auf (`clip-path`), Einträge folgen nacheinander, Beschriftung wechselt Menü/Schließen, Seite dahinter ist gesperrt, Panel scrollt.
- Care-Pakete auf der Startseite: vier moderne Karten (Care Praxis als gefüllte Karte), Button "Care-Paket besprechen".
- Arabische Seiten: lateinische Zeichen kommen aus Manrope. Grund: Readex Pro Latin zeigte auf iPhone/Chrome den Buchstaben "A" nicht ("NAS"). Der Inhaber bestätigte die Lösung.
- Design-Audit umgesetzt (Skills `redesign-existing-projects`, `design-taste-frontend`): Formularrand `#7a8fa3` (3,3:1), `:active`-Feedback, nur existierende Schriftgewichte (400/500/600/700/800), `text-wrap: pretty` für Absätze, `tabular-nums`, Radius-Tokens (`--radius` 16 px), keine Inline-Styles mehr (Klassen `mt-8…mt-28`, `a-green/a-blue/a-petrol`), ein CTA-Label pro Absicht (DE "Erstgespräch anfragen", AR "احجز استشارة مجانية"), kürzerer Hero ohne Vertrauensliste, Abschnitte "So arbeiten wir" und FAQ mit gestapelter Überschrift, asymmetrische Branchenkarten, Gedankenstriche im deutschen Text ersetzt.
- Icons neu programmiert: 17 Icons als Inline-SVG, bewegliche Teile bei Hover, Fokus und Druck (`.is-hover` erzwingt den Zustand für Vorschauen), `prefers-reduced-motion` schaltet alles ab. Neu gezeichnet: IT-Sicherheit (Firewall aus Mauerwerk mit Häkchen, kein Schloss) und Kameras (Wandhalterung, Sichtfeld, Aufnahmepunkt).

## Probiert und vom Inhaber abgelehnt oder zurückgenommen (nicht wiederholen)
- Kreis-Karussell für alle Leistungen (Délice-Stil): Leistungen wieder als gruppierte Liste. Für Care ebenfalls zurückgenommen, jetzt Karten.
- Neugestalteter Hero (erst dunkles Halftone, dann helles Netzwerk mit Switches, auch Binär-Zahlen geprüft): "gefällt überhaupt nicht", alles zurückgesetzt. Der ursprüngliche Hero bleibt. Vor jeder neuen Hero-Idee zuerst fragen.
- Menü als untere Leiste im Stil von littlewebsite.co: nicht umgesetzt.

## Erledigt in der zweiten Hälfte der Sitzung (2026-10-06)
- Logo: SVG (`site/assets/img/horaniq-logo.svg`) in Kopf und Fuß; JSON-LD nutzt weiter `horaniq-logo.webp`.
- SEO: Titel gekürzt (alle höchstens 62 Zeichen, nur `/ar/` hat 63), `knowsLanguage` ohne "en" solange Englisch aus ist, hreflang (`xhtml:link`) in `sitemap.xml`, Überschriftenfolge in den Ratgeber-Übersichten (Karten sind H2).
- Formular: nur Name, Telefon/E-Mail und Einwilligung sind Pflicht; Betriebsart und Anliegen sind optional ("(optional)", `f_opt` in I18N).
- Kopf: Telefonnummer ab 1241 px; arabische Startseite mit WhatsApp als erster Hero-Aktion (`{{WA_BTN}}`).
- Ratgeber: 3 neue Artikel in DE und AR (siehe oben), Karten auf den Übersichtsseiten, `llms.txt` ergänzt.
- Layout: `--section` von 84 auf 64 px, Abstand zwischen aufeinanderfolgenden Sektionen ohne Band etwa 0,4 Sektionen, `.split` 0,7fr/1,3fr, "So arbeiten wir" und FAQ auf der Startseite neben der Überschrift (Klasse `stack` entfernt), kleinere Leistungszeilen auf Mobil.
- e-card (Arztpraxis-Seiten, Fakten vom Inhaber): Den Dienst beantragt die Ärztin oder der Arzt selbst beim Provider (z. B. A1), nur auf den Namen der Person mit der o-card; HORANiQ kann den Antrag nicht stellen. Danach installiert der Provider ein Gerät am Router; wir verbinden es mit dem von uns installierten Switch und führen die e-card-Anschlüsse ausschließlich per Kabel (nie WLAN) in die Praxis; Verbindung wird mit dem Anbieter der Praxissoftware geprüft. Umgesetzt als Leistungskarte, FAQ-Antwort und Ratgeber `/ratgeber/e-card-anbindung/` (DE, AR). Keine weiteren technischen Details ergänzen, die der Inhaber nicht genannt hat.
- Layout-Feinschliff: Hero-Abstand unten 0,6 Sektionen; `.wrap.prose` linksbündig zur Überschrift (vorher mittig); einzelne letzte Ratgeber-Karte über die volle Breite.
- Druck: `print/common.py` nutzt Manrope und Readex Pro; Visitenkarte und Plakat (HTML, PDF, Vorschau-PNGs) neu erzeugt. `HORANiQ-Fonts.zip` enthält jetzt Manrope und Readex Pro (Variable Fonts, OFL). Alte Datei `print/visitenkarte.html` und ihr PDF (nicht die Kampagnenversion) sind unverändert und nutzen noch die alten Schriften; ihr Generator liegt nicht mehr im Repo.

## Offen
Inhalt und Recht:
- Firmendaten für Impressum und Datenschutz (Entwürfe mit noindex, in Österreich Pflicht). Nicht werben oder live gehen, bevor sie vollständig sind.
- Logo als SVG liegt jetzt in `site/assets/img/horaniq-logo.svg` (saubere Vektor-Rekonstruktion des Rasterlogos, nicht die Originaldatei des Designers; die Website nutzt weiter `horaniq-logo.webp`). Original-Quelle (AI/PDF) und Social-Handles (Platzhalter `horaniq.at`) fehlen noch.
- Entscheidung des Inhabers: Das Wort "Kostenloses" steht nicht mehr in den deutschen Buttons (nur noch im Kontaktbereich). Bestätigen oder wieder aufnehmen.

Noch nicht umgesetzt, aus den Prüfungen (SEO und CRO):
- Startseite H1 enthält kein "Wien"/"IT-Betreuung": Zeile über der H1 wie auf der Arztpraxis-Seite erwägen (Hero nicht überladen, siehe Audit).
- Mehr Inhalt: weitere Ratgeber nur mit belastbaren Fakten aus der Praxis des Inhabers, nicht raten. Bereits vorhanden: e-card-Anbindung, IT-Sicherheit Arztpraxis, Backup testen, Microsoft 365 MFA, Datensicherung und DSGVO, Microsoft 365 im Büro, Phishing erkennen (je DE und AR; Englisch bleibt aus). Den DSGVO-Text (nennt Art. 32) vor dem Livegang selbst prüfen.
- JSON-LD `sameAs` bleibt leer, bis es echte Profile gibt.
- Test mit weniger Pflichtfeldern läuft ohne Messung: erst `PLAUSIBLE_DOMAIN` setzen, dann Wirkung beobachten.
- Kein Mess-Setup: `dataLayer` wird nur gefüllt. `PLAUSIBLE_DOMAIN` (cookielos) setzen, bevor geworben oder getestet wird.
- Echtes Porträt von Rami prüfen (`site/assets/photos/rami.webp`, erscheint auf Startseite und "Über uns").
- Noch nicht ausgeführte Skills: `ai-seo`, `schema`, `copy-editing`.

Nicht geprüft auf echtem iPhone (nur Chromium): mobiles Menü, Icon-Interaktion per Tipp, Care-Karten, Formular. Der Inhaber testet auf iPhone 17 Pro mit Chrome und meldet Fehler mit Screenshot.

## Hinweise zur Umgebung
- Playwright: Modul `/opt/node-tools/node_modules/playwright`, Chromium `executablePath: '/opt/pw-browsers/chromium'`. Chromium vertraut dem Proxy-Zertifikat nicht: externe Seiten nur mit `curl` lesen, nie die Zertifikatsprüfung abschalten. Der Proxy blockiert viele Hosts (z. B. `littlewebsite.co` und `delice.ca` für WebFetch).
- Testskripte lagen im Scratchpad der Sitzung und sind nicht im Repo. Nützliche Prüfungen zum Nachbauen: Farben Desktop gegen Mobil über alle Seiten, Kontrast im Hero, Hover-Animationen per `document.getAnimations()` einfrieren, Menü auf 390 px (Scroll, Escape, Beschriftung).
- Installierte Zusatz-Skills liegen nur im Container unter `~/.claude/skills` (Pakete `Leonxlnx/taste-skill` und `bergside/awesome-design-skills`). In einer neuen Sitzung ggf. neu installieren: `npx skills add <paket> -g -a claude-code -s '*' -y`.
- Commit-Nachrichten enden mit den Attributionszeilen aus der Sitzung. PRs nur auf ausdrückliche Bitte erstellen.
- Druck neu bauen: `pip install segno`, dann `python3 print/build_campaign.py` und `NODE_PATH=/opt/node-tools/node_modules node print/render_campaign.js`. Ohne `segno` bricht der Build ab; danach NICHT rendern, sonst entstehen PDFs mit Ersatzschrift (Liberation Sans).
- Auf dem Remote existiert noch der Branch `claude/handoff-md-update-f5wyfu` (Löschen per Git war nicht möglich). Sein Inhalt steckt vollständig in `claude/quirky-franklin-nsyeoq`; er kann auf GitHub gelöscht werden.
- Zusatz-Skills (Taste-Skill-Paket u. a.) wurden in dieser Sitzung neu installiert und genutzt. Ihre Regeln ("Abstände verdoppeln", Schrift und Farben tauschen) widersprechen teils den Entscheidungen des Inhabers; Marken- und Inhaltsentscheidungen oben haben Vorrang.
