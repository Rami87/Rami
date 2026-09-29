"""Service page content for horaniq.at. One dict per page; build.py renders them with the shared template below.

Keep claims to what the brief supports: no invented reviews, numbers or certificates.
Report rows are illustrative examples and are labelled "Beispiel" on the page.
"""

PILL = {"ok": "OK", "warn": "Verbesserung empfohlen", "crit": "Kritisch"}

# Service catalogue. Names are HTML (with &amp;). Order inside GROUPS defines the hub page, home page, dropdown and footer.
SVC = {
    "it-betreuung": ("IT-Betreuung &amp; Support", "Support per Fernwartung oder vor Ort, Arbeitsplätze einrichten, Störungen beheben."),
    "wartung-reparatur": ("Computer, Geräte &amp; Wartung", "PCs, Laptops und Drucker warten, reparieren und aufrüsten."),
    "microsoft-365": ("Microsoft 365", "E-Mail, Benutzer und sichere Anmeldung einrichten und betreuen."),
    "crm-archivierung": ("CRM und digitale Ablage", "Kunden, Dokumente und Abläufe übersichtlich organisieren."),
    "netzwerk": ("Netzwerk &amp; WLAN", "Netzwerk und WLAN planen, installieren und verbessern."),
    "backup": ("Backup, NAS &amp; Daten", "Datensicherung und zentrale Ablage, mit Blick auf die Wiederherstellbarkeit im vereinbarten Umfang."),
    "it-sicherheit": ("IT-Sicherheit", "Firewall, Benutzerrechte, Zugriffsschutz und sichere Anmeldung mit MFA."),
    "sicherheit": ("Kameras, Alarm &amp; Zutritt", "Kameras, Alarmanlagen und Zutrittssysteme für Ihre Räume."),
    "smart-building": ("Smart Building", "Licht, Heizung und Beschattung praktisch steuern."),
    "website-shop": ("Websites &amp; Onlineshops", "Professionelle Websites für Unternehmen und Onlineshops mit WooCommerce oder Shopify."),
    "it-beratung": ("IT-Beratung &amp; Projektumsetzung", "Beraten, planen, umsetzen, dokumentieren und mit Anbietern abstimmen."),
    "it-check": ("HORANiQ IT-Check", "Ein Überblick über Ihre IT als verständlicher Bericht mit Prioritäten."),
    "care": ("HORANiQ Care", "Wartungspakete mit regelmäßigen Checks und Support."),
}

GROUPS = [
    ("IT &amp; Arbeitsplätze", "Support, Geräte, Microsoft 365 und digitale Abläufe.", ["it-betreuung", "wartung-reparatur", "microsoft-365", "crm-archivierung"]),
    ("Netzwerk, Daten &amp; Sicherheit", "Netzwerk, Datensicherung und der Schutz Ihrer Systeme.", ["netzwerk", "backup", "it-sicherheit"]),
    ("Gebäudetechnik", "Kameras, Alarm, Zutritt und Smart Building.", ["sicherheit", "smart-building"]),
    ("Websites &amp; Onlineshops", "Ihr Auftritt im Netz.", ["website-shop"]),
    ("Beratung &amp; laufende Betreuung", "Planen, prüfen und dauerhaft betreuen.", ["it-beratung", "it-check", "care"]),
]

# compatibility view used by render_fragment: (group, slug, name, summary)
INDEX = [(g, sl, SVC[sl][0], SVC[sl][1]) for g, _, sls in GROUPS for sl in sls]

GENERIC_FAQ = [
    ("Was kostet das?", "Das hängt von Umfang, Geräten und gewünschter Reaktionszeit ab. Nach dem Erstgespräch erhalten Sie ein klares Angebot, mit Festpreis wo möglich. Alle Preise verstehen sich netto."),
    ("Wo sind Sie tätig?", "In Wien und Umgebung, bis etwa eine Stunde Fahrzeit. Vieles lässt sich zusätzlich per Fernwartung lösen."),
    ("Sprechen Sie Arabisch?", 'Ja, wir betreuen Sie gern auf Deutsch und Arabisch. Verträge und Rechnungen erhalten Sie auf Deutsch. <a href="/ar/">Mehr auf Arabisch</a>.'),
]

CHECK_NOTE = "Bei Auftrag für ein Projekt oder einen Wartungsvertrag wird der Betrag vollständig angerechnet. Das Erstgespräch ist kostenlos."

SERVICES = {}

SERVICES["it-betreuung"] = dict(
    name="IT-Betreuung &amp; Support",
    title="IT-Betreuung und Support für Betriebe in Wien | HORANiQ",
    description="IT-Support per Fernwartung oder vor Ort, Einrichtung neuer Arbeitsplätze und laufende Wartung für Praxen und Büros in Wien und Umgebung.",
    h1="IT, die einfach läuft, und ein Ansprechpartner, der antwortet",
    lead="Wir betreuen Computer, Laptops, Drucker und Benutzer in Ihrem Betrieb. Bei Störungen per Fernwartung oder vor Ort, und im Alltag so, dass Probleme gar nicht erst entstehen.",
    assure=["Fernwartung oder Vor-Ort-Termin", "Schnelle Rückmeldung auf Ihre Anfrage", "Ein fester Ansprechpartner"],
    report=("IT-Betreuung im Überblick", [
        ("ok", "Arbeitsplätze", "Alle Geräte mit aktuellen Updates"),
        ("warn", "Drucker im Empfang", "Verbindung bricht gelegentlich ab"),
        ("crit", "Altes Notebook", "System nicht mehr unterstützt"),
    ], "Sie sehen, wo Ihre Geräte stehen."),
    pains=["Wenn etwas ausfällt, weiß niemand, wen man anrufen soll.",
           "Updates werden verschoben, bis etwas kaputtgeht.",
           "Neue Mitarbeiter warten Tage auf einen eingerichteten Arbeitsplatz.",
           "Ein Familienmitglied oder Kollege kümmert sich nebenbei um die IT.",
           "Niemand hat einen Überblick über Geräte, Lizenzen und Zugänge."],
    rows=[("Support bei Störungen", "Fernwartung oder Vor-Ort-Termin, damit Ihr Team schnell weiterarbeiten kann."),
          ("Neue Arbeitsplätze", "PCs und Laptops auswählen, einrichten, Daten übernehmen und dem Mitarbeiter übergeben."),
          ("Wartung und Updates", "Regelmäßige Pflege, damit Geräte sicher und schnell bleiben."),
          ("Benutzer und Zugänge", "Ein- und Austritte sauber abbilden, Rechte vergeben und Zugänge entziehen."),
          ("Drucker und Peripherie", "Drucker, Scanner und Zubehör dauerhaft zuverlässig anbinden."),
          ("Übersicht und Dokumentation", "Geräteliste, Zugänge und Einstellungen sind festgehalten und griffbereit.")],
    band=dict(title="Wissen, wo Ihre IT steht", lead="Der IT-Check zeigt, was in Ordnung ist und was zuerst dran ist.", price=True,
              checks=["PCs und Updates", "Drucker", "Benutzerzugriffe", "Microsoft 365 und MFA", "Backup", "Netzwerk und WLAN", "Firewall", "Sicherheitsgrundlagen"]),
    steps=[("Erstgespräch", "Wir klären Ihre Geräte, Ihr Team und was im Alltag stört."),
           ("Bestandsaufnahme", "Wir sehen uns Geräte, Zugänge und Abläufe an."),
           ("Angebot", "Einmalige Hilfe, Projekt oder laufende Betreuung. Sie entscheiden."),
           ("Betreuung", "Support, Wartung und Änderungen aus einer Hand, auf Wunsch mit HORANiQ Care.")],
    faq=[("Wie schnell bekomme ich Hilfe?", "Wir melden uns zeitnah auf jede Anfrage. Für Care-Kunden vereinbaren wir feste Reaktionszeiten."),
         ("Muss ich meine IT umstellen?", "Nein. Wir prüfen zuerst, was vorhanden ist, und verbessern nur, was nötig ist."),
         ("Kann ich auch einmalig Hilfe buchen?", "Ja. Sie können mit einem einzelnen Auftrag beginnen und später in eine laufende Betreuung wechseln.")],
    related=["microsoft-365", "netzwerk", "care"],
)

SERVICES["microsoft-365"] = dict(
    name="Microsoft 365",
    title="Microsoft 365 einrichten und betreuen in Wien | HORANiQ",
    description="Microsoft 365 Einrichtung, E-Mail-Umzug, Teams, OneDrive, MFA und laufende Betreuung für kleine Betriebe, Praxen und Büros in Wien.",
    h1="Microsoft 365, sauber eingerichtet und sicher angemeldet",
    lead="E-Mail, Kalender, Teams und Dateien, aufgesetzt für Ihren Betrieb. Mit Anmeldung über einen zweiten Faktor, klaren Berechtigungen und jemandem, der bei Fragen erreichbar ist.",
    assure=["Umzug bestehender Postfächer", "Anmeldung mit MFA", "Betreuung nach der Einrichtung"],
    report=("Microsoft 365 im Überblick", [
        ("ok", "Postfächer und Domain", "Eigene Adresse, sauber verbunden"),
        ("warn", "Freigaben in OneDrive", "Zugriffe teilweise zu weit gefasst"),
        ("crit", "Anmeldung", "Ohne zweiten Faktor (MFA)"),
    ], "Sicher und übersichtlich, statt gewachsen."),
    pains=["Die Mailadresse ist bei einem anderen Anbieter, und der Umzug wird vor sich hergeschoben.",
           "Alle haben Zugriff auf alles, weil nie Rechte vergeben wurden.",
           "Das Postfach ist nur mit Passwort geschützt.",
           "Ausgeschiedene Mitarbeiter haben noch ein aktives Konto.",
           "Sie zahlen für Lizenzen, die niemand nutzt."],
    rows=[("Einrichtung", "Tenant aufsetzen, Domain verbinden, Benutzer und Lizenzen anlegen."),
          ("E-Mail und Umzug", "Postfächer, Kalender und Kontakte aus bestehenden Konten übernehmen."),
          ("Teams, OneDrive und SharePoint", "Zusammenarbeit und Dateiablage so strukturieren, dass Ihr Team sie versteht."),
          ("Sicherheit und MFA", "Anmeldung über einen zweiten Faktor und sinnvolle Grundeinstellungen."),
          ("Berechtigungen", "Wer darf was: Gruppen, Freigaben und Ein- und Austritte sauber geregelt."),
          ("Support und Dokumentation", "Fragen im Alltag, Änderungen bei Bedarf und ein festgehaltener Aufbau.")],
    band=dict(title="Microsoft 365 prüfen lassen", lead="Der IT-Check enthält eine Bewertung Ihrer Einrichtung, Anmeldung und Zugriffe.", price=True,
              checks=["Microsoft 365 und MFA", "E-Mail-Einrichtung", "Benutzer und Lizenzen", "Freigaben", "Geräte und Updates", "Backup", "Benutzerzugriffe", "Sicherheitsgrundlagen"]),
    steps=[("Erstgespräch", "Wir klären, wer im Team wie arbeitet und was heute genutzt wird."),
           ("Konzept", "Wir legen Benutzer, Postfächer, Freigaben und Sicherheit fest."),
           ("Einrichtung und Umzug", "Wir richten alles ein und übernehmen Ihre bestehende Post."),
           ("Übergabe und Betreuung", "Wir erklären Ihrem Team die Nutzung und stehen danach für Fragen bereit.")],
    faq=[("Können Sie meine bestehende E-Mail übernehmen?", "Ja. Wir übernehmen Postfächer, Kalender und Kontakte aus vorhandenen Konten und stimmen den Zeitpunkt mit Ihnen ab."),
         ("Was ist MFA?", "Bei der Anmeldung braucht es zusätzlich zum Passwort einen zweiten Faktor, zum Beispiel eine Bestätigung am Handy. Das schützt Konten deutlich besser."),
         ("Kaufe ich die Lizenzen selbst?", "Wir empfehlen die passenden Pakete und richten sie ein. Ob Sie selbst oder über uns lizenzieren, klären wir im Angebot.")],
    related=["it-betreuung", "backup", "care"],
)

SERVICES["backup"] = dict(
    name="Backup, NAS &amp; Daten",
    title="Backup und NAS für Betriebe in Wien | HORANiQ",
    description="Datensicherung, NAS und getestete Wiederherstellung für Praxen und Büros in Wien und Umgebung. Damit Ihre Daten im Ernstfall zurückkommen.",
    h1="Ein Backup ist erst gut, wenn die Wiederherstellung funktioniert",
    lead="Wir richten Datensicherung und zentrale Ablage ein und prüfen regelmäßig, dass sich Ihre Daten im Ernstfall zurückholen lassen.",
    assure=["Sicherung und Wiederherstellung getestet", "NAS und Cloud möglich", "Verständliche Berichte"],
    report=("Backup im Überblick", [
        ("ok", "Tägliche Sicherung", "Läuft und meldet Fehler"),
        ("warn", "Wiederherstellung", "Nie getestet"),
        ("crit", "Sicherung außer Haus", "Keine Kopie an einem zweiten Ort"),
    ], "Sie wissen, worauf Sie sich verlassen können."),
    pains=["Es gibt ein Backup, aber niemand hat je eine Datei zurückgeholt.",
           "Die Sicherung liegt am selben Ort wie die Originaldaten.",
           "Dateien liegen verstreut auf einzelnen Rechnern und USB-Sticks.",
           "Ein Fehler in der Sicherung fällt erst nach Wochen auf.",
           "Niemand weiß, wie lange ein Ausfall dauern würde."],
    rows=[("Sicherungskonzept", "Was wird wie oft gesichert, wohin und wie lange aufbewahrt."),
          ("NAS und zentrale Ablage", "Ein gemeinsamer Speicherort mit Zugriffsrechten statt verstreuter Dateien."),
          ("Kopie an zweitem Ort", "Zusätzliche Sicherung außer Haus oder in der Cloud."),
          ("Wiederherstellungstest", "Wir holen regelmäßig Stichproben zurück, damit Sie sicher sein können."),
          ("Überwachung", "Fehlgeschlagene Sicherungen fallen sofort auf und werden behoben."),
          ("Dokumentation", "Sie wissen, was gesichert ist und wie die Wiederherstellung abläuft.")],
    band=dict(title="Backup prüfen lassen", lead="Der IT-Check zeigt, ob gesichert wird, was gesichert wird und ob sich Daten zurückholen lassen.", price=True,
              checks=["Backup und NAS", "Wiederherstellung", "Sicherung außer Haus", "PCs und Updates", "Firewall", "Benutzerzugriffe", "Microsoft 365", "Netzwerk"]),
    steps=[("Erstgespräch", "Wir klären, welche Daten wichtig sind und was ein Ausfall kosten würde."),
           ("Konzept", "Wir legen Sicherung, Speicherorte und Aufbewahrung fest."),
           ("Einrichtung und Test", "Wir installieren, sichern und testen die Wiederherstellung."),
           ("Kontrolle", "Regelmäßige Prüfung, auf Wunsch als Teil von HORANiQ Care.")],
    faq=[("Reicht eine externe Festplatte?", "Für sehr kleine Fälle kann sie ein Teil der Lösung sein. Sicherer ist eine automatische Sicherung mit einer zweiten Kopie an einem anderen Ort."),
         ("Was ist ein NAS?", "Ein Netzwerkspeicher, auf den Ihr Team zugreift. Er dient als gemeinsame Ablage und als Basis für Sicherungen."),
         ("Sichern Sie auch Microsoft 365?", "Ja, auf Wunsch sichern wir Postfächer und Dateien aus Microsoft 365 zusätzlich.")],
    related=["netzwerk", "microsoft-365", "care"],
)

SERVICES["sicherheit"] = dict(
    name="Kameras, Alarm &amp; Zutritt",
    title="Kameras, Alarmanlagen und Zutrittssysteme in Wien | HORANiQ",
    description="Kamerasysteme, Alarm und Zutrittskontrolle für Praxen, Büros, Geschäfte, Werkstätten und Lager in Wien und Umgebung. Installation, Wartung und Support.",
    h1="Mehr Überblick, mehr Kontrolle, mehr Sicherheit",
    lead="Kameras, Alarmanlagen, Zutrittssysteme und mehr, passend zu Ihren Räumen und Ihrem Arbeitsalltag. Sachlich, ohne Angstmache.",
    assure=["Planung, Installation und Wartung", "Passend zu Räumen und Abläufen", "Ein Ansprechpartner"],
    report=("Sicherheitstechnik im Überblick", [
        ("ok", "Eingangskamera", "Bild klar, Aufzeichnung läuft"),
        ("warn", "Hintereingang", "Blickwinkel deckt die Tür nur teilweise ab"),
        ("crit", "Zutrittssystem", "Software seit Jahren nicht aktualisiert"),
    ], "So sehen Sie, wo Nachbesserung sinnvoll ist."),
    pains=["Sie sehen nicht, wer Ihre Räume betritt oder verlässt.",
           "Die vorhandene Kamera liefert ein Bild, das man nicht auswerten kann.",
           "Schlüssel gehen verloren, und Schlösser müssen getauscht werden.",
           "Die Anlage ist installiert, aber niemand wartet sie.",
           "Mehrere Anbieter für Kamera, Alarm und Netzwerk schieben sich die Verantwortung zu."],
    rows=[("Kamerasysteme", "IP-Kameras für innen und außen, mit Aufzeichnung und Zugriff, den Sie sicher bedienen können."),
          ("Alarmanlagen", "Einbruchmeldung passend zu Ihren Räumen, mit klaren Abläufen im Alarmfall."),
          ("Zutrittskontrolle", "Türen mit Karte, Code oder Chip statt Schlüsselbund, mit nachvollziehbaren Rechten."),
          ("Anbindung ans Netzwerk", "Alles läuft stabil im richtigen Netz, getrennt von Ihren Arbeitsplätzen."),
          ("Wartung und Fehlersuche", "Bestehende Anlagen prüfen, warten, erweitern oder reparieren."),
          ("Beratung", "Wir empfehlen nur, was für Ihren Betrieb sinnvoll ist.")],
    band=dict(title="Wir sehen uns Ihre Räume an", lead="Vor jedem Angebot gibt es eine Begehung, damit Technik und Räume zusammenpassen.", price=False,
              checks=["Eingänge und Zugänge", "Kamerastandorte", "Netzwerk und Strom", "Aufzeichnung und Speicherdauer", "Rechte für Zutritt", "Kennzeichnung", "Bestehende Anlage", "Wartung"]),
    steps=[("Erstgespräch und Begehung", "Wir sehen uns Räume, Eingänge und Ihre Anforderungen an."),
           ("Konzept und Angebot", "Ein verständlicher Plan mit klarem Preis, ohne unnötige Kameras."),
           ("Installation", "Sauber montiert, im Netzwerk eingebunden und getestet."),
           ("Übergabe und Wartung", "Einweisung, Dokumentation und auf Wunsch regelmäßige Wartung.")],
    faq=[("Dürfen Kameras einfach überall hängen?", "Nein. Für Videoüberwachung gelten in Österreich Datenschutzregeln, etwa zu Kennzeichnung, Zweck und Speicherdauer. Wir beraten Sie dazu bei der Planung. Eine rechtliche Prüfung im Einzelfall ersetzt das nicht."),
         ("Übernehmen Sie auch Elektroarbeiten?", "Für Arbeiten, die eine Elektrofachkraft erfordern, arbeiten wir mit einem qualifizierten Elektriker zusammen und koordinieren alles für Sie."),
         ("Können Sie eine bestehende Anlage warten?", "Ja. Wir prüfen vorhandene Kameras, Alarm und Zutritt, beheben Fehler und erweitern, wo es sinnvoll ist."),
         ("Kann ich die Kameras am Handy sehen?", "Ja, wenn Sie das möchten. Wir richten den Zugriff so ein, dass er sicher und nachvollziehbar bleibt.")],
    related=["netzwerk", "wartung-reparatur", "care"],
)

SERVICES["wartung-reparatur"] = dict(
    name="Computer, Geräte &amp; Wartung",
    title="PC und Laptop Wartung, Reparatur und Aufrüstung in Wien | HORANiQ",
    description="Wartung, Reparatur, SSD- und RAM-Upgrades sowie generalüberholte PCs und Laptops für Betriebe in Wien. Geräte länger nutzen, weniger Elektroschrott.",
    h1="Mehr Leben für Ihre Technik",
    lead="Ihre Geräte sollen zuverlässig funktionieren und möglichst lange halten. Wir prüfen, was sich reparieren oder aufrüsten lässt, damit Ihre Technik länger im Einsatz bleibt und weniger Elektroschrott entsteht.",
    assure=["Zuerst prüfen, dann entscheiden", "Aufrüsten statt ersetzen, wo es sich lohnt", "Neue und generalüberholte Geräte"],
    report=("Gerätecheck", [
        ("ok", "Empfangs-PC", "Läuft schnell und zuverlässig"),
        ("warn", "Büro-Laptop", "Langsam, eine SSD bringt spürbar mehr Tempo"),
        ("crit", "Altes Notebook", "Reparatur lohnt nicht, Ersatz empfohlen"),
    ], "Ehrliche Empfehlung: reparieren, aufrüsten oder ersetzen."),
    pains=["Der Rechner ist langsam, aber der Ersatz erscheint teuer.",
           "Sie wissen nicht, ob sich eine Reparatur lohnt.",
           "Geräte werden ersetzt, obwohl eine Aufrüstung gereicht hätte.",
           "Nach einem Wechsel fehlen Daten oder Einstellungen.",
           "Kameras, Alarm und Zutritt werden nie gewartet."],
    rows=[("PCs und Laptops warten", "Reinigung, Updates und Prüfung, damit Geräte zuverlässig laufen."),
          ("Fehler finden und reparieren", "Wir suchen die Ursache und beheben sie, wo es wirtschaftlich sinnvoll ist."),
          ("Aufrüsten mit SSD und RAM", "Mehr Tempo für vorhandene Geräte, oft mit geringem Aufwand."),
          ("Neue und generalüberholte Geräte", "Passende PCs und Laptops, eingerichtet und einsatzbereit."),
          ("Einrichtung und Datenübernahme", "Ihre Daten und Einstellungen ziehen auf das neue Gerät um."),
          ("Sicherheitstechnik warten", "Kameras, Alarmanlagen und Zutrittssysteme prüfen und in Stand halten.")],
    band=dict(title="Erst prüfen, dann entscheiden", lead="Sie erhalten eine ehrliche Empfehlung, ob sich Reparatur oder Aufrüstung lohnt.", price=False,
              checks=["Zustand des Geräts", "Leistung und Speicher", "Updates und Sicherheit", "Kosten einer Reparatur", "Kosten einer Aufrüstung", "Kosten eines Ersatzes", "Datenübernahme", "Entsorgung"]),
    steps=[("Anfrage", "Sie beschreiben das Problem oder die Geräte, die Sie gern prüfen lassen möchten."),
           ("Diagnose", "Wir finden die Ursache und nennen Optionen mit Kosten."),
           ("Umsetzung", "Reparatur, Aufrüstung oder Ersatz samt Einrichtung und Datenübernahme."),
           ("Übergabe", "Das Gerät ist einsatzbereit, Ihre Daten sind da.")],
    faq=[("Lohnt sich eine Reparatur?", "Das prüfen wir vorab. Sie erhalten eine Empfehlung mit Kosten für Reparatur, Aufrüstung und Ersatz."),
         ("Was bringt eine SSD?", "Ältere Rechner mit Festplatte starten und arbeiten mit einer SSD oft deutlich schneller."),
         ("Verkaufen Sie auch Geräte?", "Ja, neue und generalüberholte PCs und Laptops. Wir suchen passende Modelle aus, richten sie ein und übernehmen Ihre Daten."),
         ("Reparieren Sie Handys?", "Nein. Wir konzentrieren uns auf die Technik Ihres Betriebs: PCs, Laptops, Netzwerk und Sicherheitstechnik.")],
    related=["it-betreuung", "sicherheit", "care"],
)

SERVICES["smart-building"] = dict(
    name="Smart Building",
    title="Smart Building für Büros und Betriebe in Wien | HORANiQ",
    description="Licht, Heizung, Beschattung und Sensoren praktisch steuern. Smart-Building-Lösungen für Büros, Praxen, Geschäfte und Betriebe in Wien und Umgebung.",
    h1="Räume, die sich Ihrem Arbeitsalltag anpassen",
    lead="Licht, Heizung, Jalousien und Vorhänge lassen sich so steuern, dass sie den Alltag erleichtern und Energie sparen. Praktisch geplant, ohne Spielerei.",
    assure=["Nur, was Ihren Alltag erleichtert", "Zuverlässig im Netzwerk eingebunden", "Elektroarbeiten mit qualifiziertem Partner"],
    report=("Raumcheck", [
        ("ok", "Heizung im Büro", "Zeiten und Temperatur sinnvoll geregelt"),
        ("warn", "Beschattung Südseite", "Manuell, Räume heizen sich im Sommer auf"),
        ("crit", "Licht im Lager", "Brennt durchgehend, keine Steuerung"),
    ], "Sie sehen, wo sich Automatisierung lohnt."),
    pains=["Die Heizung läuft, obwohl niemand im Raum ist.",
           "Jalousien werden von Hand bedient und stehen falsch, wenn die Sonne kommt.",
           "Licht bleibt an, weil keiner daran denkt.",
           "Jeder Raum hat eine andere Fernbedienung oder App.",
           "Die Anlage wurde eingebaut, aber niemand kann sie bedienen."],
    rows=[("Beleuchtung", "Zeitpläne, Bewegungsmelder und Szenen für Büro, Verkaufsraum oder Lager."),
          ("Heizung und Thermostate", "Temperaturen nach Zeit und Raum steuern, mit Überblick über den Verbrauch."),
          ("Jalousien, Rollos und Vorhänge", "Beschattung automatisch oder per Taster, passend zum Sonnenstand."),
          ("Fenster und Sensoren", "Kontakte, Bewegung und Raumklima als Grundlage für sinnvolle Automatik."),
          ("Bedienung", "Wenige, klare Bedienwege, die Ihr Team wirklich nutzt."),
          ("Einbindung ins Netzwerk", "Stabile Verbindung und getrennter Bereich, damit nichts Ihre Arbeitsplätze stört.")],
    band=dict(title="Wir beginnen mit Ihrem Alltag", lead="Erst klären wir, was Sie stört. Danach entscheiden wir, welche Technik sinnvoll ist.", price=False,
              checks=["Räume und Nutzung", "Heizung", "Licht", "Beschattung", "Vorhandene Technik", "Netzwerk und Strom", "Bedienung", "Budget"]),
    steps=[("Erstgespräch", "Wir klären, was in Ihren Räumen im Alltag stört oder Energie kostet."),
           ("Konzept und Angebot", "Ein Plan mit den Maßnahmen, die sich für Sie lohnen."),
           ("Umsetzung", "Installation und Einrichtung, bei Bedarf mit Elektriker-Partner."),
           ("Einweisung", "Ihr Team weiß, wie alles bedient wird.")],
    faq=[("Ist Smart Building nur etwas für große Gebäude?", "Nein. Auch in kleinen Büros und Geschäften lohnt sich eine einfache Steuerung von Heizung, Licht und Beschattung."),
         ("Muss ich dafür umbauen?", "Oft nicht. Vieles lässt sich mit Funklösungen nachrüsten. Wir prüfen, was in Ihren Räumen möglich ist."),
         ("Übernehmen Sie Elektroarbeiten?", "Für Arbeiten, die eine Elektrofachkraft erfordern, arbeiten wir mit einem qualifizierten Elektriker zusammen und koordinieren alles für Sie."),
         ("Spart das wirklich Energie?", "Eine passende Steuerung hilft, unnötigen Verbrauch zu vermeiden. Konkrete Einsparungen hängen von Gebäude und Nutzung ab, deshalb versprechen wir keine Zahlen.")],
    related=["sicherheit", "netzwerk", "care"],
)

SERVICES["crm-archivierung"] = dict(
    name="CRM und digitale Ablage",
    title="CRM und digitale Archivierung für kleine Betriebe in Wien | HORANiQ",
    description="Kundenverwaltung, Dokumentenablage und einfache Abläufe für kleine und mittlere Betriebe in Wien. Weniger Suchen, mehr Überblick.",
    h1="Kunden und Dokumente, die man auch wiederfindet",
    lead="Wir helfen kleinen Betrieben, Kundendaten, Dokumente und wiederkehrende Abläufe übersichtlich zu organisieren. Neu in unserem Angebot, und deshalb gemeinsam mit Ihnen Schritt für Schritt aufgebaut.",
    assure=["Passend zur Betriebsgröße", "Schrittweise statt Großprojekt", "Mit Microsoft 365 verzahnt"],
    report=("Ablauf-Check", [
        ("ok", "Kundenliste", "Zentral gepflegt und aktuell"),
        ("warn", "Dokumentenablage", "Unterschiedliche Ordner, schwer zu finden"),
        ("crit", "Angebote und Nachfassen", "Nur in Köpfen und E-Mails, geht verloren"),
    ], "Sie sehen, wo Zeit verloren geht."),
    pains=["Kundendaten liegen in E-Mails, Excel-Listen und Notizzetteln.",
           "Dokumente werden gesucht statt gefunden.",
           "Angebote und Anfragen werden nicht nachverfolgt.",
           "Nur eine Person weiß, wo was liegt.",
           "Papier stapelt sich, weil es keinen digitalen Ablauf gibt."],
    rows=[("Kundenverwaltung", "Kontakte, Anfragen und Angebote an einem Ort, passend zur Größe Ihres Betriebs."),
          ("Dokumentenablage", "Klare Struktur und Regeln, damit jeder Dokumente wiederfindet."),
          ("Digitale Archivierung", "Papier digitalisieren und geordnet ablegen."),
          ("Abläufe vereinfachen", "Wiederkehrende Aufgaben wie Anfragen oder Freigaben in klare Schritte gießen."),
          ("Einbindung in Microsoft 365", "Vorhandene Werkzeuge nutzen, statt neue Komplexität aufzubauen."),
          ("Einführung im Team", "Kurze Einweisung, damit das Ganze auch verwendet wird.")],
    band=dict(title="Wir beginnen klein", lead="Ein Bereich, der Ihnen am meisten Zeit kostet, wird zuerst geordnet.", price=False,
              checks=["Kundendaten", "Dokumente", "Angebote", "Abläufe", "Berechtigungen", "Vorhandene Werkzeuge", "Team", "Budget"]),
    steps=[("Erstgespräch", "Wir klären, wo bei Ihnen am meisten Zeit verloren geht."),
           ("Konzept", "Wir wählen ein passendes Werkzeug und legen Struktur und Regeln fest."),
           ("Einrichtung", "Wir richten alles ein und übernehmen vorhandene Daten."),
           ("Einführung", "Ihr Team lernt es kennen, und wir bleiben ansprechbar.")],
    faq=[("Brauche ich dafür eine teure Software?", "Nicht unbedingt. Oft reichen vorhandene Werkzeuge, zum Beispiel aus Microsoft 365. Wir empfehlen, was zu Ihrer Größe passt."),
         ("Können Sie Papierakten digitalisieren?", "Wir organisieren die digitale Ablage und begleiten die Umstellung. Ob wir selbst scannen oder einen Partner einbinden, klären wir im Angebot."),
         ("Ist das schon lange Teil Ihres Angebots?", "Nein, es ist ein neuer Bereich. Wir bauen ihn gemeinsam mit unseren ersten Kunden auf und beginnen bewusst klein.")],
    related=["microsoft-365", "website-shop", "care"],
)

SERVICES["it-sicherheit"] = dict(
    name="IT-Sicherheit",
    title="IT-Sicherheit für Betriebe in Wien: Firewall, Zugriffsrechte, MFA | HORANiQ",
    description="Firewall, Benutzerrechte, Zugriffsschutz und sichere Anmeldung mit MFA für kleine und mittlere Betriebe in Wien und Umgebung. Sachlich und verständlich.",
    h1="Klare Zugriffsrechte und sichere Anmeldung für Ihren Betrieb",
    lead="Wir sorgen dafür, dass nur die richtigen Personen auf Ihre Systeme und Daten zugreifen. Mit Firewall, sauberen Benutzerrechten, Zugriffsschutz und sicherer Anmeldung. Sachlich, ohne Angstmache.",
    assure=["Firewall und Zugriffsschutz", "Benutzerrechte und MFA", "Verständlich erklärt"],
    report=("IT-Sicherheit im Überblick", [
        ("ok", "Firewall", "Aktuell und mit klaren Regeln"),
        ("warn", "Benutzerrechte", "Einige Konten haben mehr Zugriff als nötig"),
        ("crit", "Anmeldung", "Wichtige Konten ohne zweiten Faktor (MFA)"),
    ], "Sie sehen, was zuerst geregelt werden sollte."),
    pains=["Alle Mitarbeiter haben Zugriff auf alles, weil Rechte nie geregelt wurden.",
           "Ausgeschiedene Mitarbeiter haben noch aktive Zugänge.",
           "Wichtige Konten sind nur mit einem Passwort geschützt.",
           "Die Firewall ist alt oder wurde nie richtig eingerichtet.",
           "Niemand weiß genau, wer worauf zugreifen darf."],
    rows=[("Firewall", "Sichere Verbindung ins Internet mit Regeln, die zu Ihrem Betrieb passen."),
          ("Benutzerrechte", "Wer darf was: Zugriffe nach Aufgabe vergeben und bei Austritten sauber entziehen."),
          ("Zugriffsschutz", "Geräte, Ordner und Konten so absichern, dass nur berechtigte Personen herankommen."),
          ("Sichere Anmeldung mit MFA", "Anmeldung über einen zweiten Faktor für wichtige Konten wie E-Mail und Microsoft 365."),
          ("Bestandsaufnahme", "Wir sehen uns an, wie Ihre Systeme heute abgesichert sind, und zeigen die wichtigsten Lücken."),
          ("Dokumentation", "Sie erhalten festgehalten, was eingerichtet wurde und wer welche Rechte hat.")],
    band=dict(title="Wo steht Ihre IT-Sicherheit?", lead="Der IT-Check gibt einen ersten Überblick über Zugriffe, Anmeldung und Firewall. Er ersetzt kein umfassendes Sicherheitsaudit.", price=True,
              checks=["Firewall", "Benutzerzugriffe", "Microsoft 365 und MFA", "PCs und Updates", "Backup und NAS", "Netzwerk und WLAN", "Router und Switches", "Sicherheitsgrundlagen"]),
    steps=[("Erstgespräch", "Wir klären, welche Systeme und Daten für Ihren Betrieb wichtig sind."),
           ("Bestandsaufnahme", "Wir prüfen Zugriffe, Anmeldung und Firewall."),
           ("Angebot", "Sie erhalten klare Maßnahmen in sinnvoller Reihenfolge."),
           ("Umsetzung und Dokumentation", "Wir richten ein, dokumentieren und erklären es Ihrem Team.")],
    faq=[("Sind wir danach vollständig geschützt?", "Absolute Sicherheit gibt es nicht. Wir reduzieren Risiken durch klare Rechte, sichere Anmeldung und aktuelle Systeme und sagen Ihnen offen, was wir prüfen können und was nicht."),
         ("Was ist MFA?", "Bei der Anmeldung braucht es zusätzlich zum Passwort einen zweiten Faktor, zum Beispiel eine Bestätigung am Handy. Das schützt Konten deutlich besser."),
         ("Ist das nur etwas für große Unternehmen?", "Nein. Auch kleine Betriebe profitieren von klaren Zugriffsrechten und sicherer Anmeldung. Wir passen Umfang und Aufwand an Ihre Größe an."),
         ("Gehören Kameras und Alarmanlagen auch dazu?", 'Das ist ein eigener Bereich: <a href="/sicherheit/">Kameras, Alarm und Zutritt</a>.')],
    related=["microsoft-365", "netzwerk", "backup"],
)

SERVICES["it-beratung"] = dict(
    name="IT-Beratung &amp; Projektumsetzung",
    title="IT-Beratung und Projektumsetzung für Betriebe in Wien | HORANiQ",
    description="IT-Beratung, Planung, Umsetzung und Dokumentation aus einer Hand. Wir stimmen uns mit Ihren Anbietern ab. Für kleine und mittlere Betriebe in Wien und Umgebung.",
    h1="Von der Idee bis zur laufenden Lösung, aus einer Hand",
    lead="Sie wissen, was in Ihrem Betrieb besser laufen soll, aber nicht, wie? Wir beraten, planen, setzen um, dokumentieren und stimmen uns mit Ihren Anbietern ab.",
    assure=["Beratung, Planung und Umsetzung", "Abstimmung mit Ihren Anbietern", "Dokumentation zum Schluss"],
    report=("Projektüberblick", [
        ("ok", "Ziel und Umfang", "Gemeinsam festgelegt"),
        ("warn", "Zuständigkeiten", "Noch nicht mit dem Softwareanbieter geklärt"),
        ("crit", "Dokumentation", "Bisher nirgends festgehalten"),
    ], "Sie sehen, was vor dem Start zu klären ist."),
    pains=["Mehrere Anbieter sind beteiligt, und niemand hat den Gesamtüberblick.",
           "Sie wissen nicht, welche Lösung zu Ihrem Betrieb passt.",
           "Angebote sind schwer zu vergleichen.",
           "Ein Umbau oder Umzug steht an, und die IT wird dabei vergessen.",
           "Was eingerichtet wurde, ist nirgends festgehalten."],
    rows=[("Beratung", "Wir klären Bedarf und Ist-Zustand und sagen ehrlich, was nötig ist und was nicht."),
          ("Planung", "Ein verständlicher Plan mit Umfang, Reihenfolge und Kosten."),
          ("Umsetzung", "Wir setzen die Maßnahmen um oder steuern die Umsetzung mit den beteiligten Anbietern."),
          ("Abstimmung mit Anbietern", "Wir sprechen mit Softwareherstellern, Providern und Lieferanten, damit nichts zwischen den Stühlen landet."),
          ("Auswahl passender Geräte", "Wir empfehlen Geräte, die zu Ihren Anforderungen und Ihrem Bestand passen."),
          ("Dokumentation", "Am Ende ist festgehalten, was eingerichtet wurde und wie es zusammenhängt.")],
    band=dict(title="Wir beginnen mit Ihrem Vorhaben", lead="Erst klären wir, was Sie erreichen wollen. Danach entscheiden wir, was dafür nötig ist.", price=False,
              checks=["Ziel des Vorhabens", "Vorhandene Technik", "Beteiligte Anbieter", "Zeitplan", "Budget", "Zuständigkeiten", "Risiken", "Dokumentation"]),
    steps=[("Erstgespräch", "Wir klären Ihr Vorhaben und Ihre Rahmenbedingungen."),
           ("Konzept und Angebot", "Sie erhalten einen klaren Plan mit Umfang und Kosten."),
           ("Umsetzung", "Wir setzen um und koordinieren die Beteiligten."),
           ("Dokumentation und Übergabe", "Sie erhalten festgehalten, was eingerichtet wurde.")],
    faq=[("Brauche ich vorher einen IT-Check?", "Nein. Ein IT-Check ist eine Möglichkeit, den Ausgangszustand zu sehen, aber keine Voraussetzung für Beratung oder ein Projekt."),
         ("Arbeiten Sie mit meinen bestehenden Anbietern zusammen?", "Ja. Wir stimmen uns mit den zuständigen Anbietern ab und klären Zuständigkeiten vor Beginn."),
         ("Lassen sich auch einzelne Teile eines Projekts beauftragen?", "Ja. Sie können mit einem Teil beginnen und später erweitern.")],
    related=["it-check", "netzwerk", "care"],
    interest="beratung",
)

SERVICES["care"] = dict(
    name="HORANiQ Care",
    title="HORANiQ Care: IT-Wartungsverträge in Wien | HORANiQ",
    description="Wartungspakete für kleine und mittlere Betriebe in Wien: regelmäßige Checks, Backup-Kontrolle, Fernwartung und bevorzugter Support.",
    h1="Betreuung, die planbar ist, statt Hilfe erst im Notfall",
    lead="Mit HORANiQ Care prüfen wir Ihre Technik regelmäßig, halten sie aktuell und sind erreichbar, wenn etwas nicht läuft. Der Umfang richtet sich nach Ihrem Betrieb.",
    assure=["Regelmäßige Checks", "Bevorzugter Support", "Klare Leistungen, klarer Preis"],
    report=("Care-Bericht", [
        ("ok", "Updates und Geräte", "Alle Arbeitsplätze aktuell"),
        ("warn", "Backup-Wiederherstellung", "Stichprobe steht diesen Monat an"),
        ("crit", "Ablaufendes Zertifikat", "Erneuerung in 10 Tagen nötig"),
    ], "Sie wissen jeden Monat, wie es Ihrer Technik geht."),
    pains=["Sie rufen erst an, wenn schon etwas kaputt ist.",
           "Niemand kontrolliert Updates, Backup und Zugänge regelmäßig.",
           "Bei Störungen gibt es keine vereinbarte Reaktionszeit.",
           "Kosten schwanken stark von Monat zu Monat.",
           "Was gewartet wurde, ist nirgends festgehalten."],
    rows=[("Regelmäßige Systemchecks", "Geräte, Netzwerk, Sicherheit und Zugänge werden planmäßig geprüft."),
          ("Backup-Kontrolle", "Wir prüfen, dass gesichert wird und sich Daten zurückholen lassen."),
          ("Updates", "Geräte und Systeme bleiben auf aktuellem Stand."),
          ("Fernwartung", "Schnelle Hilfe, oft ohne Anfahrt."),
          ("Bevorzugter Support", "Ihre Anfragen kommen zuerst, mit vereinbarter Reaktionszeit je nach Paket."),
          ("Dokumentation und Bericht", "Sie sehen, was geprüft und getan wurde.")],
    extra='''<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>Vier Pakete für unterschiedliche Betriebe</h2><p>Namen und Umfang können sich noch ändern. Preise nennen wir nach dem Erstgespräch.</p></div>
    <ul class="tiers">
      <li><b>Care Start</b><span>Für sehr kleine Betriebe: regelmäßige Checks und Fernwartung.</span></li>
      <li><b>Care Business</b><span>Für wachsende Betriebe: dazu Backup-Kontrolle, Updates und Microsoft-365-Betreuung.</span></li>
      <li><b>Care Pro</b><span>Für mehr Geräte und Nutzer: bevorzugter Support und regelmäßige Berichte.</span></li>
      <li><b>Care Praxis</b><span>Für Praxen und andere Betriebe, in denen ein Ausfall sofort stört: kurze Reaktionszeiten, engere Backup-Kontrolle und ausführliche Dokumentation.</span></li>
    </ul>
  </div>
</section>''',
    band=dict(title="Der beste Einstieg ist der IT-Check", lead="Er zeigt, was ein passendes Paket enthalten sollte.", price=True,
              checks=["Geräte und Updates", "Netzwerk und WLAN", "Backup und NAS", "Firewall", "Microsoft 365 und MFA", "Drucker", "Benutzerzugriffe", "Sicherheitsgrundlagen"]),
    steps=[("Erstgespräch", "Wir klären Größe, Geräte und was bei einem Ausfall passieren darf."),
           ("IT-Check", "Wir prüfen den Ausgangszustand."),
           ("Paket und Angebot", "Sie erhalten ein Paket, das zu Ihnen passt, mit klaren Leistungen."),
           ("Start der Betreuung", "Regelmäßige Checks, Support und Berichte laufen an.")],
    faq=[("Bin ich lange gebunden?", "Laufzeit und Kündigung legen wir im Angebot transparent fest. Sprechen Sie uns im Erstgespräch darauf an."),
         ("Warum kostet ein Paket für Praxen mehr?", "Nicht, weil Sie Ärztin oder Arzt sind, sondern weil kürzere Reaktionszeiten, engere Backup-Kontrolle und mehr Dokumentation mehr Aufwand bedeuten."),
         ("Was ist bei einem Notfall enthalten?", "Das hängt vom Paket ab. Reaktionszeiten und Leistungsumfang stehen im Vertrag, damit es keine Überraschungen gibt.")],
    related=["it-betreuung", "backup", "microsoft-365"],
    interest="betreuung",
)


LABELS_DE = {
    "example": "Beispiel",
    "primary": "Kostenloses Erstgespräch anfragen",
    "secondary_check": "IT-Check ansehen",
    "secondary_plain": "So gehen wir vor",
    "pains": "Kennen Sie das?",
    "rows": "Was wir für Sie übernehmen",
    "rows_sub": "Nur so viel Technik, wie Ihr Betrieb braucht.",
    "check_h3": "Darauf achten wir",
    "steps": "So arbeiten wir",
    "faq": "Häufige Fragen",
    "related": "Weitere Leistungen",
    "all": "Alle Leistungen ansehen",
    "contact_h2": "Sprechen wir über {name}",
    "contact_lead": "Kostenloses Erstgespräch, unverbindlich und ohne Fachchinesisch.",
    "price_offer": f'<p class="price">€99 <small>zzgl. USt.</small></p><p class="muted">{CHECK_NOTE}</p><div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="check-cta" data-interest="it-check">IT-Check anfragen</a></div>',
    "plain_offer": '<p class="muted">Das Erstgespräch ist kostenlos. Danach erhalten Sie ein klares Angebot, mit Festpreis wo möglich.</p><div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="check-cta" data-interest="erstgespraech">Erstgespräch anfragen</a></div>',
    "legend_check": "Ergebnis mit Ampel: <strong>OK</strong>, <strong>Verbesserung empfohlen</strong> oder <strong>Kritisch</strong>.",
    "legend_plain": "Das besprechen wir gemeinsam, bevor wir ein Angebot machen.",
}


def render_fragment(slug, lang="de"):
    import services_ar as ar
    if lang == "ar":
        s, L, pills, generic = ar.SERVICES_AR[slug], ar.LABELS_AR, ar.PILL_AR, ar.GENERIC_FAQ_AR
        names = {k: v[0] for k, v in ar.INDEX_AR.items()}
        blurbs = {k: v[1] for k, v in ar.INDEX_AR.items()}
        prefix, all_href = "/ar", "/ar/leistungen/"
    else:
        s, L, pills, generic = SERVICES[slug], LABELS_DE, PILL, GENERIC_FAQ
        names = {sl: n for _, sl, n, _ in INDEX}
        blurbs = {sl: d for _, sl, _, d in INDEX}
        prefix, all_href = "", "/leistungen/"
    rtitle, _, rfoot = s["report"]
    rows_html = "".join(
        f'<li data-s="{st}"><span class="lamp"></span><div class="item"><b>{t}</b><span>{sub}</span></div><span class="pill {st}">{pills[st]}</span></li>'
        for st, t, sub in s["report"][1])
    assure = "".join(f"<li>{a}</li>" for a in s["assure"])
    pains = "".join(f"<li>{p}</li>" for p in s["pains"])
    rows = "".join(f'<div class="row"><h3>{t}</h3><p>{d}</p></div>' for t, d in s["rows"])
    steps = "".join(f"<li><div><h3>{t}</h3><p>{d}</p></div></li>" for t, d in s["steps"])
    faqs = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in s["faq"] + generic)
    b = s["band"]
    checks = "".join(f"<li>{c}</li>" for c in b["checks"])
    offer = L["price_offer"] if b["price"] else L["plain_offer"]
    legend = L["legend_check"] if b["price"] else L["legend_plain"]
    secondary = L["secondary_check"] if b["price"] else L["secondary_plain"]
    related = "".join(f'<div class="row quiet row-ico">{{{{ICON:{sl}}}}}<div><h3><a href="{prefix}/{sl}/">{names[sl]}</a></h3><p>{blurbs[sl]}</p></div></div>' for sl in s["related"])
    return f'''<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <div class="hero-ico">{{{{ICON:{slug}:lg}}}}</div>
      <h1>{s["h1"]}</h1>
      <p class="lead">{s["lead"]}</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="#kontakt" data-track="hero-primary" data-interest="erstgespraech">{L["primary"]}</a>
        <a class="btn btn-ghost" href="#it-check" data-track="hero-secondary">{secondary}</a>
      </div>
      <ul class="assure">{assure}</ul>
    </div>
    <div class="report" aria-label="{L["example"]}: {rtitle}">
      <div class="report-head"><strong>{rtitle}</strong><span>{L["example"]}</span></div>
      <ul>{rows_html}</ul>
      <div class="report-foot">{rfoot}</div>
    </div>
  </div>
</section>

<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>{L["pains"]}</h2></div>
    <ul class="pains">{pains}</ul>
  </div>
</section>

<section class="s" id="leistungen">
  <div class="wrap split">
    <div class="split-head"><h2>{L["rows"]}</h2><p>{L["rows_sub"]}</p></div>
    <div class="rows">{rows}</div>
  </div>
</section>
{s.get("extra", "")}
<section class="s band" id="it-check">
  <div class="wrap split">
    <div class="split-head">
      <h2>{b["title"]}</h2>
      <p class="lead">{b["lead"]}</p>
      {offer}
    </div>
    <div>
      <h3>{L["check_h3"]}</h3>
      <ul class="checks">{checks}</ul>
      <p style="margin-top:26px">{legend}</p>
    </div>
  </div>
</section>

<section class="s" id="ablauf">
  <div class="wrap split">
    <div class="split-head"><h2>{L["steps"]}</h2></div>
    <ol class="steps">{steps}</ol>
  </div>
</section>

<section class="s" id="faq">
  <div class="wrap split">
    <div class="split-head"><h2>{L["faq"]}</h2></div>
    <div class="faq">{faqs}</div>
  </div>
</section>

<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>{L["related"]}</h2><p><a href="{all_href}">{L["all"]}</a></p></div>
    <div class="rows">{related}</div>
  </div>
</section>

<section class="s" id="kontakt">
  <div class="wrap contact">
    <div>
      <h2>{L["contact_h2"].format(name=s["name"])}</h2>
      <p class="lead">{L["contact_lead"]}</p>
      <div class="contact-direct">
        {{{{PHONE_LINE}}}}
        {{{{WA_LINE}}}}
        <a href="mailto:{{{{EMAIL}}}}" data-track="contact-mail"{' dir="ltr"' if lang == "ar" else ""}>{{{{EMAIL}}}}</a>
      </div>
    </div>
    {{{{FORM}}}}
  </div>
</section>
'''


WEBSITE_TEXT = "Professionelle Websites für Unternehmen und Onlineshops mit WooCommerce oder Shopify. Klar gestaltet, mobil nutzbar und auf Ihre Angebote und Kontaktanfragen ausgerichtet."


def feature_html(level="h3"):
    """Prominent service card for Websites & Onlineshops (home page and services page)."""
    return f'''<div class="feature">
  {{{{ICON:website-shop:xl}}}}
  <div class="feature-body">
    <{level} class="feature-title">Websites &amp; Onlineshops</{level}>
    <p>{WEBSITE_TEXT}</p>
    <ul class="feature-points"><li>Unternehmenswebsites</li><li>Onlineshops mit WooCommerce oder Shopify</li><li>Betreuung nach dem Start nach Vereinbarung</li></ul>
  </div>
  <a class="btn btn-primary" href="/website-shop/" data-track="feature-websites">Websites &amp; Onlineshops ansehen</a>
</div>'''


def groups_html(level="h3"):
    """The five service groups. Groups only organise; every service keeps its own visible name and link."""
    out = ""
    for name, blurb, slugs in GROUPS:
        if slugs == ["website-shop"]:
            out += f'<div class="svc-group" id="grp-websites">{feature_html(level)}</div>\n'
            continue
        rows = "".join(f'<div class="row row-ico">{{{{ICON:{sl}}}}}<div><p class="row-h"><a href="/{sl}/">{SVC[sl][0]}</a></p><p>{SVC[sl][1]}</p></div></div>' for sl in slugs)
        out += f'<div class="svc-group split"><div class="split-head"><{level}>{name}</{level}><p>{blurb}</p></div><div class="rows">{rows}</div></div>\n'
    return out


def render_hub():
    return f'''<section class="hero">
  <div class="wrap">
    <h1>Alle Leistungen aus einer Hand</h1>
    <p class="lead">IT, Netzwerk, Sicherheit, Gebäudetechnik und digitale Lösungen wie Websites und Onlineshops für Unternehmen in Wien und Umgebung. Ein Ansprechpartner, der das Ganze kennt.</p>
    <div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="hero-primary" data-interest="erstgespraech">Kostenloses Erstgespräch anfragen</a></div>
  </div>
</section>

<section class="s" id="leistungen">
  <div class="wrap svc-groups">
{groups_html("h2")}
  </div>
</section>

<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>Für Ihre Branche</h2><p>Die Leistungen, die für Ihren Betrieb am häufigsten wichtig sind, zuerst.</p></div>
    <div class="rows">
      <div class="row quiet"><p class="row-h"><a href="/arztpraxis/">Arztpraxen</a></p><p>IT-Betreuung für Ordinationen, dazu Praxiswebsite auf Wunsch.</p></div>
      <div class="row quiet"><p class="row-h"><a href="/unternehmen/">Büros und Betriebe</a></p><p>Microsoft 365, Datensicherung, Netzwerk und Zugriffsrechte für Ihr Team.</p></div>
      <div class="row quiet"><p class="row-h"><a href="/ar/">بالعربية</a></p><p>دعم IT للشركات والعيادات في فيينا، بالعربية والألمانية.</p></div>
    </div>
  </div>
</section>

<section class="s" id="kontakt">
  <div class="wrap contact">
    <div>
      <h2>Was brauchen Sie zuerst?</h2>
      <p class="lead">Sagen Sie uns kurz, worum es geht. Wir melden uns bei Ihnen.</p>
      <div class="contact-direct">
        {{{{PHONE_LINE}}}}
        {{{{WA_LINE}}}}
        <a href="mailto:{{{{EMAIL}}}}" data-track="contact-mail">{{{{EMAIL}}}}</a>
      </div>
    </div>
    {{{{FORM}}}}
  </div>
</section>
'''
