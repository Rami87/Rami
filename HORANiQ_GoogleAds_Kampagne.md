# HORANiQ: Google-Ads-Kampagne (Search)

Stand: aktualisiert auf die aktuelle Website. Texte, Ziel-URLs und Angebote entsprechen den Seiten in `site/src/pages/`. Hero- und Seitentexte stehen dort und nicht mehr in diesem Dokument.

**Wichtig vor dem Start:** Alle Angaben zum IT-Check (€99 netto, bei Auftrag angerechnet) und zur Reaktionszeit müssen Sie tatsächlich einhalten können. Die Anzeigen versprechen keine feste Antwortzeit, keine Platzierungen und keine Umsätze.

## 1. Kampagnenaufbau

| Punkt | Empfehlung |
|---|---|
| Kampagnentyp | Search, nur Google-Suche (Suchpartner und Display **aus**) |
| Ziel | Leads: erfolgreich gesendetes Formular (siehe Abschnitt 5), auf Wunsch Anruf oder WhatsApp |
| Standort | Wien + Umkreis (Presence: „Personen in oder regelmäßig an diesen Orten“) oder Radius 60 km um Wien |
| Sprache | Deutsch. Arabisch als eigene Kampagne in Phase 2 |
| Budget | 15–20 €/Tag gesamt. In den ersten 2 Wochen nur AG1, AG2 und AG3 aktiv, damit das Budget nicht zersplittert. AG4 bis AG7 ab Woche 3–4 |
| Gebotsstrategie | Start: Klicks maximieren mit Max-CPC-Limit (ca. 4–6 €). Nach 15–20 Conversions: Conversions maximieren |
| Anzeigenplan | Mo–Fr 8–18 Uhr, Sa nur bei Erreichbarkeit. Anrufzusatz nur zu Zeiten, in denen Sie abheben |
| Keyword-Typen | Exact und Phrase. Broad erst nach genügend Conversion-Daten |
| Tracking | GA4 + Google Ads, Consent Mode. Nur mit Einwilligung laden |

## 2. Anzeigengruppen und Landingpages

| Anzeigengruppe | Landingpage | Start |
|---|---|---|
| AG1 Arztpraxis | `/arztpraxis/` | hoch |
| AG2 Büros, Anwälte, Steuerberater | `/unternehmen/` | hoch |
| AG3 Allgemein IT-Betreuung | `/` | mittel |
| AG4 Netzwerk & WLAN | `/netzwerk/` | mittel (Woche 3-4) |
| AG5 Microsoft 365 | `/microsoft-365/` | mittel (Woche 3-4) |
| AG6 Backup & Daten | `/backup/` | mittel (Woche 3-4) |
| AG7 Websites & Onlineshops | `/website-shop/` | mittel (Woche 3-4) |

Die Landingpage passt jeweils zur Anzeige: gleiche Angebote, gleiche Wörter. Der Button „Kostenloses Erstgespräch anfragen“ und das Formular stehen auf jeder dieser Seiten.

## 3. Negative Keywords

**Kampagnenebene (immer):**

`handy`, `smartphone`, `iphone`, `samsung`, `laptop reparatur privat`, `privat`, `gebraucht kaufen`, `gratis`, `kostenlos download`, `jobs`, `stellenangebote`, `ausbildung`, `lehre`, `praktikum`, `kurs`, `schulung`, `studium`, `gehalt`, `software download`, `ebay`, `willhaben`, `günstig`, `billig`, `gaming`, `playstation`, `drucker kaufen`, `tinte`, `toner`, `ersatzteile`, `reparatur handy`, `apple store`, `windows key`, `virus entfernen privat`

**Anzeigengruppen-Ebene:**

- AG1 Arztpraxis: `praxissoftware kaufen`, `praxissoftware`, `medizingeräte kaufen`, `jobs praxis`
- AG2 Büros, Anwälte, Steuerberater: `büromöbel`, `bürobedarf`, `bürojob`, `office kaufen`
- AG3 Allgemein IT-Betreuung: `it jobs wien`, `it ausbildung`
- AG4 Netzwerk & WLAN: `wlan passwort`, `wlan verstärker kaufen`, `fritzbox einrichten`, `wlan hacken`
- AG5 Microsoft 365: `office kaufen`, `office key`, `microsoft 365 download`, `microsoft 365 preis privat`
- AG6 Backup & Daten: `backup app`, `handy backup`, `iphone backup`, `backup software download`
- AG7 Websites & Onlineshops: `website baukasten`, `website selber machen`, `website kostenlos`, `theme`, `template`, `jobs webdesigner`

„Reparatur“ und „Wartung“ nur ausschließen, wenn Streuverluste entstehen, da B2B-Anfragen sie enthalten können. Prüfen Sie wöchentlich den Suchbegriffbericht und ergänzen Sie Ausschlüsse anhand echter Suchanfragen.

## 4. Erweiterungen (Assets)

**Sitelinks** (Titel ≤25, Beschreibungszeilen ≤35 Zeichen):

- IT-Check anfragen (17) | Verständlicher Überblick über (29) | Ihre IT, €99 netto (18) | `/it-check/`
- Für Arztpraxen (14) | IT-Betreuung für Ihre (21) | Ordination in Wien (18) | `/arztpraxis/`
- Für Büros (9) | IT für Büros, Anwälte und (25) | Steuerberater in Wien (21) | `/unternehmen/`
- Websites & Onlineshops (22) | Websites für Unternehmen, (25) | Shops mit WooCommerce (21) | `/website-shop/`
- Netzwerk & WLAN (15) | Stabiles Netzwerk und (21) | WLAN für Ihren Betrieb (22) | `/netzwerk/`
- Alle Leistungen (15) | Alle Leistungen von (19) | HORANiQ im Überblick (20) | `/leistungen/`

**Callouts** (≤25 Zeichen):

- Persönlich betreut (18)
- Deutsch & Arabisch (18)
- Erstgespräch kostenlos (22)
- Wien und Umgebung (17)
- Klare Angebote (14)
- Vor Ort oder Fernwartung (24)

**Strukturierte Snippets** (Header „Services“): IT-Betreuung, Netzwerk & WLAN, Backup, Microsoft 365, IT-Sicherheit, Websites, Onlineshops

**Anruf-Asset:** erst, wenn eine Nummer feststeht und Sie erreichbar sind. **Standort-Asset:** Google Business Profile verknüpfen.

## 5. Conversion-Tracking

Die Website schreibt Ereignisse nur in `window.dataLayer`. Es wird nichts an Google gesendet, bevor Sie einen Tag-Manager mit Einwilligung einbinden.

- **Haupt-Conversion:** `lead_submit` (Formular wurde tatsächlich gesendet und vom Empfangsdienst bestätigt). Das setzt voraus, dass `FORM_ENDPOINT` verbunden ist.
- **Nebenbeobachtung, keine Haupt-Conversion:** `lead_mailto_opened` (E-Mail-Programm wurde geöffnet, Versand unbestätigt) und `cta_click` (Klick auf Buttons).
- **Später:** Klick auf Telefonnummer und WhatsApp, sobald beides existiert.
- Das Ereignis trägt nur Seite, Bereich und Anfrageart, keine persönlichen Daten.

## 6. Responsive Search Ads

Je Anzeigengruppe 1 RSA mit 15 Überschriften (≤30 Zeichen) und 4 Beschreibungen (≤90 Zeichen), ohne Pinning. Nach 4 Wochen die schwächste Variante ersetzen.

### AG1 Arztpraxis

**Keywords:** [it betreuung arztpraxis wien], "it betreuung ordination wien", "it support arztpraxis wien", "edv betreuung arztpraxis", "it service ordination wien", "netzwerk arztpraxis wien", "it zahnarztpraxis wien"

**Final URL:** `https://horaniq.at/arztpraxis/?utm_source=google&utm_medium=cpc&utm_campaign=praxis-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / arztpraxis / wien  
**Pinning:** keines

**Überschriften**

1. IT-Betreuung für Ordinationen (29)
2. Damit Ihre Praxis läuft (23)
3. Persönlicher Ansprechpartner (28)
4. Kostenloses Erstgespräch (24)
5. Praxis-IT-Check €99 netto (25)
6. Netzwerk, PC & Datensicherung (29)
7. Vor Ort oder per Fernwartung (28)
8. Wien und Umgebung (17)
9. Auf Deutsch und Arabisch (24)
10. Klares Angebot, klarer Ablauf (29)
11. IT-Betreuung Arztpraxis Wien (28)
12. Alles aus einer Hand (20)
13. Wartung für Praxis-IT (21)
14. HORANiQ IT-Service Wien (23)
15. Erstgespräch anfragen (21)

**Beschreibungen**

1. Netzwerk, Computer und Datensicherung für Ihre Ordination. Persönlich und aus einer Hand. (89)
2. Kostenloses Erstgespräch. Praxis-IT-Check €99 netto, bei Auftrag voll angerechnet. (82)
3. Damit Ihre Praxis läuft, auch wenn es voll wird. Vor Ort in Wien oder per Fernwartung. (86)
4. Betreuung auf Deutsch und Arabisch. Verständlich erklärt, mit klarem Angebot. (77)

### AG2 Büros, Anwälte, Steuerberater

**Keywords:** [it betreuung büro wien], "it support büro wien", "edv betreuung büro wien", "it betreuung anwalt wien", "it support rechtsanwalt wien", "it steuerberater wien", "it betreuung buchhaltung wien"

**Final URL:** `https://horaniq.at/unternehmen/?utm_source=google&utm_medium=cpc&utm_campaign=bueros-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / buero / wien  
**Pinning:** keines

**Überschriften**

1. IT-Betreuung für Büros (22)
2. IT für Anwälte & Steuerberater (30)
3. Für Büros und Betriebe (22)
4. Microsoft 365 mit MFA (21)
5. Klare Zugriffsrechte (20)
6. Datensicherung im Blick (23)
7. IT-Check €99 netto (18)
8. Kostenloses Erstgespräch (24)
9. Wien und Umgebung (17)
10. Persönlich & verständlich (25)
11. Vor Ort oder per Fernwartung (28)
12. Auf Deutsch und Arabisch (24)
13. Ein Ansprechpartner (19)
14. Erstgespräch anfragen (21)
15. HORANiQ IT-Service Wien (23)

**Beschreibungen**

1. IT, Netzwerk und Sicherheit für Ihr Büro. Persönlich, vor Ort oder per Fernwartung. (83)
2. Vertrauliche Daten brauchen zuverlässige Technik. Microsoft 365, Backup, Zugriffsrechte. (88)
3. Kostenloses Erstgespräch. IT-Check €99 netto, bei Auftrag voll angerechnet. (75)
4. Ihr Büro läuft. Die Technik dahinter auch. In Wien und Umgebung, auf Deutsch und Arabisch. (90)

### AG3 Allgemein IT-Betreuung

**Keywords:** "it betreuung wien", "it support unternehmen wien", "edv betreuung wien", "it service kleine unternehmen wien"

**Final URL:** `https://horaniq.at/?utm_source=google&utm_medium=cpc&utm_campaign=allgemein-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / it-betreuung / wien  
**Pinning:** keines

**Überschriften**

1. IT-Betreuung Wien (17)
2. IT für kleine Unternehmen (25)
3. Ein Ansprechpartner (19)
4. Technik, die passt (18)
5. Kostenloses Erstgespräch (24)
6. Auf Deutsch und Arabisch (24)
7. Netzwerk, Sicherheit, IT (24)
8. Persönlich & verständlich (25)
9. Wien und Umgebung (17)
10. Vor Ort oder per Fernwartung (28)
11. IT-Check €99 netto (18)
12. Alles aus einer Hand (20)
13. Klare Angebote (14)
14. Erstgespräch anfragen (21)
15. HORANiQ IT-Service Wien (23)

**Beschreibungen**

1. IT, Netzwerk und Sicherheit für Betriebe in Wien und Umgebung. Persönlich, aus einer Hand. (90)
2. Klare Sprache, klares Angebot. Jetzt unverbindlich Erstgespräch vereinbaren. (76)
3. Technik, die zu Ihrem Betrieb passt. Betreuung auf Deutsch und Arabisch. (72)
4. IT-Check €99 netto: verständlicher Überblick, bei Auftrag voll angerechnet. (75)

### AG4 Netzwerk & WLAN

**Keywords:** "netzwerk firma wien", "wlan unternehmen wien", "wlan büro wien", "netzwerkinstallation wien", "firewall einrichten unternehmen wien"

**Final URL:** `https://horaniq.at/netzwerk/?utm_source=google&utm_medium=cpc&utm_campaign=netzwerk-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / netzwerk / wlan  
**Pinning:** keines

**Überschriften**

1. WLAN & Netzwerk für Betriebe (28)
2. Ein Netzwerk, das trägt (23)
3. Stabiles WLAN im Betrieb (24)
4. Router, Switch, Firewall (24)
5. Installation in Wien (20)
6. Persönlich betreut (18)
7. Kostenloses Erstgespräch (24)
8. Wien und Umgebung (17)
9. Sauber verkabelt (16)
10. Netzwerk dokumentiert (21)
11. IT-Check €99 netto (18)
12. Ein Ansprechpartner (19)
13. Netzwerk für Praxis & Laden (27)
14. Von Planung bis Betreuung (25)
15. HORANiQ Netzwerk Wien (21)

**Beschreibungen**

1. Stabiles Netzwerk und WLAN für Praxis, Büro, Geschäft. Sauber installiert, dokumentiert. (88)
2. Ein Ansprechpartner für Netzwerk, Geräte und Sicherheit. Jetzt Erstgespräch anfragen. (85)
3. Planung, Installation und Betreuung in Wien und Umgebung. Verständlich erklärt. (79)
4. IT-Check €99 netto, bei Auftrag voll angerechnet. Das Erstgespräch ist kostenlos. (81)

### AG5 Microsoft 365

**Keywords:** "microsoft 365 einrichten wien", "microsoft 365 support wien", "microsoft 365 migration wien", "microsoft 365 betreuung unternehmen"

**Final URL:** `https://horaniq.at/microsoft-365/?utm_source=google&utm_medium=cpc&utm_campaign=m365-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / microsoft-365 / wien  
**Pinning:** keines

**Überschriften**

1. Microsoft 365 in Wien (21)
2. Einrichtung & Betreuung (23)
3. E-Mail-Umzug ohne Stress (24)
4. Anmeldung mit MFA (17)
5. Teams und OneDrive (18)
6. Persönlich betreut (18)
7. Kostenloses Erstgespräch (24)
8. Wien und Umgebung (17)
9. Benutzer und Rechte (19)
10. Ein Ansprechpartner (19)
11. IT-Check €99 netto (18)
12. Auf Deutsch und Arabisch (24)
13. Sauber eingerichtet (19)
14. Erstgespräch anfragen (21)
15. HORANiQ IT-Service Wien (23)

**Beschreibungen**

1. Microsoft 365 einrichten und betreuen: E-Mail, Benutzer und sichere Anmeldung mit MFA. (86)
2. Postfächer übernehmen, Rechte regeln, Team einweisen. Persönlich, in Wien und Umgebung. (87)
3. Kostenloses Erstgespräch. IT-Check €99 netto, bei Auftrag voll angerechnet. (75)
4. Betreuung auf Deutsch und Arabisch. Verständlich erklärt, mit klarem Angebot. (77)

### AG6 Backup & Daten

**Keywords:** "backup lösung unternehmen wien", "nas einrichten wien", "datensicherung firma wien", "backup büro wien"

**Final URL:** `https://horaniq.at/backup/?utm_source=google&utm_medium=cpc&utm_campaign=backup-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / backup / nas  
**Pinning:** keines

**Überschriften**

1. Backup & NAS für Betriebe (25)
2. Datensicherung einrichten (25)
3. Wiederherstellung im Blick (26)
4. Zentrale Ablage im Büro (23)
5. Persönlich betreut (18)
6. Kostenloses Erstgespräch (24)
7. Wien und Umgebung (17)
8. Ein Ansprechpartner (19)
9. IT-Check €99 netto (18)
10. Sicherung prüfen lassen (23)
11. Auf Deutsch und Arabisch (24)
12. Verständlich erklärt (20)
13. Erstgespräch anfragen (21)
14. Vor Ort oder per Fernwartung (28)
15. HORANiQ IT-Service Wien (23)

**Beschreibungen**

1. Datensicherung und NAS für Büro und Praxis. Wiederherstellung im Umfang geprüft. (80)
2. Kostenloses Erstgespräch. IT-Check €99 netto, bei Auftrag voll angerechnet. (75)
3. Ihre Daten gesichert und gut abgelegt. Persönlich, in Wien und Umgebung. (72)
4. Betreuung auf Deutsch und Arabisch. Verständlich erklärt, mit klarem Angebot. (77)

### AG7 Websites & Onlineshops

**Keywords:** "website erstellen lassen wien", "webseite für unternehmen wien", "onlineshop erstellen lassen wien", "woocommerce shop erstellen", "shopify shop erstellen lassen"

**Final URL:** `https://horaniq.at/website-shop/?utm_source=google&utm_medium=cpc&utm_campaign=website-wien&utm_term={keyword}`  
**Pfad:** horaniq.at / websites / shops  
**Pinning:** keines

**Überschriften**

1. Websites für Unternehmen (24)
2. Onlineshops mit WooCommerce (27)
3. Onlineshop mit Shopify (22)
4. Website-Projekt besprechen (26)
5. Kostenloses Erstgespräch (24)
6. Klar gestaltet, mobil nutzbar (29)
7. Ihr Auftritt im Netz (20)
8. Wien und Umgebung (17)
9. Persönlicher Ansprechpartner (28)
10. Website und IT aus einer Hand (29)
11. Onlineshop anfragen (19)
12. Angebot mit klarem Umfang (25)
13. Kein IT-Check nötig (19)
14. Erstgespräch anfragen (21)
15. HORANiQ Websites Wien (21)

**Beschreibungen**

1. Websites für Unternehmen, Shops mit WooCommerce oder Shopify. Klar und mobil nutzbar. (85)
2. Kostenloses Erstgespräch. Sie erhalten ein Angebot, in dem Umfang und Leistungen stehen. (88)
3. Website oder Shop aus einer Hand, mit persönlichem Ansprechpartner in Wien und Umgebung. (88)
4. Betreuung auf Deutsch und Arabisch. Für Websites und Shops ist kein IT-Check nötig. (83)

Hinweis zu Suchbegriffen: Manche Interessenten suchen mit anderen Wörtern für Ihr Angebot. Ergänzen Sie solche Begriffe nur, wenn sie im Suchbegriffbericht auftauchen und zur Landingpage passen.

## 7. Messung nach 30 Tagen

| Kennzahl | Orientierung |
|---|---|
| CTR | ≥ 4–6 % bei AG1 |
| Conversion Rate (Landingpage) | ≥ 5–8 % |
| Kosten pro Lead | Ziel < 40–60 € |
| Lead → Erstgespräch | ≥ 50 % |
| Erstgespräch → IT-Check | ≥ 30 % |
| Suchanteil | Trend beobachten |

Das sind Orientierungswerte, keine Garantien. Entscheiden Sie erst nach ca. 60 Tagen und mindestens 30 Klicks je Anzeigengruppe, ob eine Gruppe pausiert wird. Bei einem Kostenanstieg zuerst Stichprobe, Verzögerung der Conversions und Lernphase prüfen.

## 8. Start-Checkliste (vor dem ersten Euro)

1. Impressum und Datenschutz vollständig ausfüllen (aktuell Entwurf) und Einwilligungsbanner mit Consent Mode einrichten.
2. `FORM_ENDPOINT` verbinden und ein Testformular senden. Erst dann `lead_submit` als Conversion anlegen.
3. Google Business Profile vollständig einrichten und verknüpfen.
4. Die Landingpages `/arztpraxis/`, `/unternehmen/`, `/netzwerk/`, `/microsoft-365/`, `/backup/`, `/website-shop/` live und mobil prüfen. Ladezeit unter 3 Sekunden.
5. Rückmeldung an Anfragen so organisieren, dass Sie nur zusagen, was Sie einhalten (Rückruf, Termin).
6. Zwei Anzeigenvarianten je Gruppe zulassen und nach 4 Wochen die schwächere ersetzen.
7. Keine Preise oder Zusagen in Anzeigen, die nicht auf der Website stehen.

## 9. Phase 2: arabische Kampagne

Eigene Kampagne mit 5–8 €/Tag und Suchanfragen wie „شركة IT فيينا“, „دعم تقني عيادة فيينا“, „صيانة شبكات فيينا“. Landingpages: `/ar/`, `/ar/it-betreuung/`, `/ar/netzwerk/`, `/ar/website-shop/`. Anzeigentexte auf Arabisch, zum Beispiel „دعم IT بالعربية والألمانية في فيينا“. Verträge und Rechnungen sind deutsch; das steht auf den Seiten.

