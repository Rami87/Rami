"""English service pages. Same structure as services.SERVICES (German is the reference).

Contracts and invoices are in German, and the copy says so. No invented proof or numbers.
"""

PILL_EN = {"ok": "OK", "warn": "Improvement recommended", "crit": "Critical"}

CHECK_NOTE_EN = "If you commission a project or a maintenance contract, the amount is credited in full. The first conversation is free."

LABELS_EN = {
    "example": "Example",
    "primary": "Request a free first call",
    "secondary_check": "See the IT check",
    "secondary_plain": "How we work",
    "pains": "Sound familiar?",
    "rows": "What we take care of",
    "rows_sub": "Only as much technology as your business needs.",
    "check_h3": "What we look at",
    "steps": "How we work",
    "faq": "Frequently asked questions",
    "related": "More services",
    "all": "See all services",
    "contact_h2": "Let's talk about {name}",
    "contact_lead": "Free first call, no obligation and no jargon.",
    "price_offer": f'<p class="price">€99 <small>excl. VAT</small></p><p class="muted">{CHECK_NOTE_EN}</p><div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="check-cta" data-interest="it-check">Request the IT check</a></div>',
    "plain_offer": '<p class="muted">The first call is free. After that you receive a clear quote, with a fixed price where possible.</p><div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="check-cta" data-interest="erstgespraech">Request a first call</a></div>',
    "legend_check": "Result with traffic lights: <strong>OK</strong>, <strong>Improvement recommended</strong> or <strong>Critical</strong>.",
    "legend_plain": "We discuss this with you before we make a quote.",
}

GENERIC_FAQ_EN = [
    ("What does it cost?", "That depends on scope, devices and the response time you want. After the first call you receive a clear quote, with a fixed price where possible. All prices are net of VAT."),
    ("Where do you work?", "In Vienna and the surrounding area, up to about an hour's travel. Much can also be solved by remote support."),
    ("Do you work in English?", "Yes. We support you in English, German and Arabic. Contracts and invoices are in German, as is usual for official matters in Austria."),
]

INDEX_EN = {
    "it-betreuung": ("IT support &amp; care", "Support by remote access or on site, setting up workstations, fixing faults."),
    "wartung-reparatur": ("Computers, devices &amp; maintenance", "Maintain, repair and upgrade PCs, laptops and printers."),
    "microsoft-365": ("Microsoft 365", "Set up and look after email, users and secure sign-in."),
    "crm-archivierung": ("CRM and digital filing", "Organise customers, documents and workflows clearly."),
    "netzwerk": ("Network &amp; Wi-Fi", "Plan, install and improve your network and Wi-Fi."),
    "backup": ("Backup, NAS &amp; data", "Data backup and central storage, with a view to recoverability within the agreed scope."),
    "it-sicherheit": ("IT security", "Firewall, user rights, access protection and secure sign-in with MFA."),
    "sicherheit": ("Cameras, alarm &amp; access", "Cameras, alarm systems and access control for your premises."),
    "smart-building": ("Smart building", "Control lighting, heating and shading in a practical way."),
    "website-shop": ("Websites &amp; online shops", "Professional websites for businesses and online shops with WooCommerce or Shopify."),
    "it-beratung": ("IT consulting &amp; project delivery", "Advise, plan, implement, document and coordinate with providers."),
    "it-check": ("HORANiQ IT check", "An overview of your IT as an understandable report with priorities."),
    "care": ("HORANiQ Care", "Maintenance packages with regular checks and support."),
}

GROUPS_EN = [
    ("IT &amp; workstations", "Support, devices, Microsoft 365 and digital workflows.", ["it-betreuung", "wartung-reparatur", "microsoft-365", "crm-archivierung"]),
    ("Network, data &amp; security", "Network, data backup and protection of your systems.", ["netzwerk", "backup", "it-sicherheit"]),
    ("Building technology", "Cameras, alarm, access and smart building.", ["sicherheit", "smart-building"]),
    ("Websites &amp; online shops", "Your presence on the web.", ["website-shop"]),
    ("Consulting &amp; ongoing care", "Plan, check and look after, long term.", ["it-beratung", "it-check", "care"]),
]

WEBSITE_TEXT_EN = "Professional websites for businesses and online shops with WooCommerce or Shopify. Clearly designed, mobile-friendly and focused on your offers and enquiries."


def feature_en(level="h3"):
    return f'''<div class="feature">
  {{{{ICON:website-shop:xl}}}}
  <div class="feature-body">
    <{level} class="feature-title">Websites &amp; online shops</{level}>
    <p>{WEBSITE_TEXT_EN}</p>
    <ul class="feature-points"><li>Business websites</li><li>Online shops with WooCommerce or Shopify</li><li>Care after launch by agreement</li></ul>
  </div>
  <a class="btn btn-primary" href="/en/website-shop/" data-track="feature-websites">See websites &amp; online shops</a>
</div>'''


def groups_en(level="h3"):
    out = ""
    for name, blurb, slugs in GROUPS_EN:
        if slugs == ["website-shop"]:
            out += f'<div class="svc-group" id="grp-websites">{feature_en(level)}</div>\n'
            continue
        rows = "".join(f'<div class="row row-ico">{{{{ICON:{sl}}}}}<div><p class="row-h"><a href="/en/{sl}/">{INDEX_EN[sl][0]}</a></p><p>{INDEX_EN[sl][1]}</p></div></div>' for sl in slugs)
        out += f'<div class="svc-group split"><div class="split-head"><{level}>{name}</{level}><p>{blurb}</p></div><div class="rows">{rows}</div></div>\n'
    return out


def render_hub_en():
    return f'''<section class="hero">
  <div class="wrap">
    <h1>All services from one source</h1>
    <p class="lead">IT, network, security, building technology and digital solutions such as websites and online shops for businesses in Vienna and the surrounding area. One contact who knows the whole picture.</p>
    <div class="btn-row"><a class="btn btn-primary" href="#kontakt" data-track="hero-primary" data-interest="erstgespraech">Request a free first call</a></div>
  </div>
</section>

<section class="s" id="leistungen">
  <div class="wrap svc-groups">
{groups_en("h2")}
  </div>
</section>

<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>For your sector</h2><p>The services that matter most to your business come first.</p></div>
    <div class="rows">
      <div class="row quiet"><p class="row-h"><a href="/en/arztpraxis/">Medical practices</a></p><p>IT support for practices, plus a practice website on request.</p></div>
      <div class="row quiet"><p class="row-h"><a href="/en/unternehmen/">Offices and businesses</a></p><p>Microsoft 365, data backup, network and access rights for your team.</p></div>
      <div class="row quiet"><p class="row-h"><a href="/" hreflang="de" lang="de">Deutsch</a></p><p>IT-Betreuung für Praxen und Betriebe in Wien.</p></div>
      <div class="row quiet"><p class="row-h"><a href="/ar/" hreflang="ar" lang="ar" dir="rtl">بالعربية</a></p><p>دعم IT للشركات والعيادات في فيينا، بالعربية والألمانية.</p></div>
    </div>
  </div>
</section>

<section class="s" id="kontakt">
  <div class="wrap contact">
    <div>
      <h2>What do you need first?</h2>
      <p class="lead">Tell us briefly what it is about. We will get back to you.</p>
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


SERVICES_EN = {}

SERVICES_EN["it-betreuung"] = dict(
    name="IT support &amp; care",
    title="IT support and care for businesses in Vienna | HORANiQ",
    description="IT support by remote access or on site, setting up new workstations and ongoing maintenance for practices and offices in Vienna and the surrounding area.",
    h1="IT that simply works, and a contact who answers",
    lead="We look after the computers, laptops, printers and users in your business. When something breaks, by remote access or on site, and day to day so that problems do not arise in the first place.",
    assure=["Remote support or on-site appointment", "Quick response to your request", "One fixed contact person"],
    report=("IT support at a glance", [
        ("ok", "Workstations", "All devices with current updates"),
        ("warn", "Reception printer", "Connection drops occasionally"),
        ("crit", "Old notebook", "System no longer supported"),
    ], "You see where your devices stand."),
    pains=["When something fails, nobody knows whom to call.",
           "Updates are postponed until something breaks.",
           "New employees wait days for a workstation to be set up.",
           "A family member or colleague looks after the IT on the side.",
           "Nobody has an overview of devices, licences and access."],
    rows=[("Support for faults", "Remote access or on-site appointment, so your team can keep working quickly."),
          ("New workstations", "Choose and set up PCs and laptops, transfer data and hand over to the employee."),
          ("Maintenance and updates", "Regular care so devices stay secure and fast."),
          ("Users and access", "Map joiners and leavers cleanly, assign rights and remove access."),
          ("Printers and peripherals", "Connect printers, scanners and accessories reliably and for the long term."),
          ("Overview and documentation", "Device list, access and settings are recorded and at hand.")],
    band=dict(title="Know where your IT stands", lead="The IT check shows what is in order and what comes first.", price=True,
              checks=["PCs and updates", "Printers", "User access", "Microsoft 365 and MFA", "Backup", "Network and Wi-Fi", "Firewall", "Security basics"]),
    steps=[("First call", "We clarify your devices, your team and what bothers you day to day."),
           ("Inventory", "We look at devices, access and workflows."),
           ("Quote", "One-off help, a project or ongoing care. You decide."),
           ("Care", "Support, maintenance and changes from one source, with HORANiQ Care on request.")],
    faq=[("How quickly do I get help?", "We respond promptly to every request. For Care customers we agree fixed response times."),
         ("Do I have to change my IT?", "No. We first check what is there and improve only what is necessary."),
         ("Can I book help just once?", "Yes. You can start with a single job and later move to ongoing care.")],
    related=["microsoft-365", "netzwerk", "care"],
)

SERVICES_EN["microsoft-365"] = dict(
    name="Microsoft 365",
    title="Set up and manage Microsoft 365 in Vienna | HORANiQ",
    description="Microsoft 365 setup, email migration, Teams, OneDrive, MFA and ongoing care for small businesses, practices and offices in Vienna.",
    h1="Microsoft 365, cleanly set up and securely signed in",
    lead="Email, calendar, Teams and files, set up for your business. With sign-in through a second factor, clear permissions and someone you can reach with questions.",
    assure=["Migration of existing mailboxes", "Sign-in with MFA", "Care after setup"],
    report=("Microsoft 365 at a glance", [
        ("ok", "Mailboxes and domain", "Own address, cleanly connected"),
        ("warn", "OneDrive sharing", "Some access is too broad"),
        ("crit", "Sign-in", "Without a second factor (MFA)"),
    ], "Secure and clear, instead of grown by accident."),
    pains=["The email address is with another provider and the migration keeps being put off.",
           "Everyone can access everything because rights were never assigned.",
           "The mailbox is protected by a password only.",
           "Former employees still have an active account.",
           "You pay for licences nobody uses."],
    rows=[("Setup", "Set up the tenant, connect the domain, create users and licences."),
          ("Email and migration", "Bring mailboxes, calendars and contacts across from existing accounts."),
          ("Teams, OneDrive and SharePoint", "Structure collaboration and file storage so your team understands it."),
          ("Security and MFA", "Sign-in through a second factor and sensible basic settings."),
          ("Permissions", "Who may do what: groups, sharing and joiners and leavers handled cleanly."),
          ("Support and documentation", "Everyday questions, changes when needed and a documented setup.")],
    band=dict(title="Have Microsoft 365 checked", lead="The IT check includes an assessment of your setup, sign-in and access.", price=True,
              checks=["Microsoft 365 and MFA", "Email setup", "Users and licences", "Sharing", "Devices and updates", "Backup", "User access", "Security basics"]),
    steps=[("First call", "We clarify who in the team works how and what is used today."),
           ("Concept", "We define users, mailboxes, sharing and security."),
           ("Setup and migration", "We set everything up and bring your existing mail across."),
           ("Handover and care", "We explain the use to your team and are available for questions afterwards.")],
    faq=[("Can you take over my existing email?", "Yes. We move mailboxes, calendars and contacts from existing accounts and agree the timing with you."),
         ("What is MFA?", "When signing in, a second factor is needed in addition to the password, for example a confirmation on your phone. It protects accounts much better."),
         ("Do I buy the licences myself?", "We recommend the right plans and set them up. Whether you license directly or through us is settled in the quote.")],
    related=["it-betreuung", "backup", "care"],
)

SERVICES_EN["backup"] = dict(
    name="Backup, NAS &amp; data",
    title="Backup and NAS for businesses in Vienna | HORANiQ",
    description="Data backup, NAS and tested recovery for practices and offices in Vienna and the surrounding area. So your data comes back when it matters.",
    h1="A backup is only good if recovery works",
    lead="We set up data backup and central storage and regularly check that your data can be brought back in an emergency.",
    assure=["Backup and recovery tested", "NAS and cloud possible", "Understandable reports"],
    report=("Backup at a glance", [
        ("ok", "Daily backup", "Runs and reports errors"),
        ("warn", "Recovery", "Never tested"),
        ("crit", "Off-site backup", "No copy in a second location"),
    ], "You know what you can rely on."),
    pains=["There is a backup, but nobody has ever restored a file.",
           "The backup sits in the same place as the original data.",
           "Files are scattered across individual computers and USB sticks.",
           "A backup error is only noticed after weeks.",
           "Nobody knows how long an outage would last."],
    rows=[("Backup concept", "What is backed up, how often, where to and for how long it is kept."),
          ("NAS and central storage", "One shared location with access rights instead of scattered files."),
          ("Copy in a second location", "An additional backup off site or in the cloud."),
          ("Recovery test", "We regularly restore samples so you can be sure."),
          ("Monitoring", "Failed backups are noticed immediately and fixed."),
          ("Documentation", "You know what is backed up and how recovery works.")],
    band=dict(title="Have your backup checked", lead="The IT check shows whether backups run, what is backed up and whether data can be restored.", price=True,
              checks=["Backup and NAS", "Recovery", "Off-site backup", "PCs and updates", "Firewall", "User access", "Microsoft 365", "Network"]),
    steps=[("First call", "We clarify which data matters and what an outage would cost."),
           ("Concept", "We define backup, storage locations and retention."),
           ("Setup and test", "We install, back up and test the recovery."),
           ("Monitoring", "Regular checks, as part of HORANiQ Care on request.")],
    faq=[("Is an external hard drive enough?", "For very small cases it can be part of the solution. Safer is an automatic backup with a second copy in another location."),
         ("What is a NAS?", "Network storage your team accesses. It serves as a shared file store and as a basis for backups."),
         ("Do you also back up Microsoft 365?", "Yes, on request we additionally back up mailboxes and files from Microsoft 365.")],
    related=["netzwerk", "microsoft-365", "care"],
)

SERVICES_EN["sicherheit"] = dict(
    name="Cameras, alarm &amp; access",
    title="Cameras, alarm systems and access control in Vienna | HORANiQ",
    description="Camera systems, alarm and access control for practices, offices, shops, workshops and warehouses in Vienna. Installation, maintenance, support.",
    h1="More overview, more control, more security",
    lead="Cameras, alarm systems, access systems and more, matched to your premises and daily work. Factual, without scaremongering.",
    assure=["Planning, installation and maintenance", "Matched to premises and workflows", "One contact person"],
    report=("Security technology at a glance", [
        ("ok", "Entrance camera", "Clear image, recording runs"),
        ("warn", "Back entrance", "Viewing angle covers the door only partly"),
        ("crit", "Access system", "Software not updated for years"),
    ], "This shows where improvement makes sense."),
    pains=["You cannot see who enters or leaves your premises.",
           "The existing camera delivers an image that cannot be evaluated.",
           "Keys get lost and locks have to be replaced.",
           "The system is installed, but nobody maintains it.",
           "Several providers for camera, alarm and network pass the responsibility around."],
    rows=[("Camera systems", "IP cameras for indoors and outdoors, with recording and access you can operate safely."),
          ("Alarm systems", "Intrusion detection matched to your premises, with clear procedures when an alarm goes off."),
          ("Access control", "Doors with card, code or chip instead of a bunch of keys, with traceable rights."),
          ("Connection to the network", "Everything runs stably in the right network, separate from your workstations."),
          ("Maintenance and troubleshooting", "Check, maintain, extend or repair existing systems."),
          ("Advice", "We recommend only what makes sense for your business.")],
    band=dict(title="We look at your premises", lead="Before every quote there is a site visit, so that technology and premises fit together.", price=False,
              checks=["Entrances and access", "Camera positions", "Network and power", "Recording and retention", "Access rights", "Signage", "Existing system", "Maintenance"]),
    steps=[("First call and site visit", "We look at premises, entrances and your requirements."),
           ("Concept and quote", "An understandable plan with a clear price, without unnecessary cameras."),
           ("Installation", "Cleanly mounted, connected to the network and tested."),
           ("Handover and maintenance", "Instruction, documentation and regular maintenance on request.")],
    faq=[("Can cameras simply be put up anywhere?", "No. In Austria, data protection rules apply to video surveillance, for example on signage, purpose and retention period. We advise you on this during planning. It does not replace a legal review of your individual case."),
         ("Do you also carry out electrical work?", "For work that requires a qualified electrician, we work with a qualified electrician and coordinate everything for you."),
         ("Can you maintain an existing system?", "Yes. We check existing cameras, alarm and access, fix faults and extend where it makes sense."),
         ("Can I view the cameras on my phone?", "Yes, if you wish. We set up access so that it stays secure and traceable.")],
    related=["netzwerk", "wartung-reparatur", "care"],
)

SERVICES_EN["wartung-reparatur"] = dict(
    name="Computers, devices &amp; maintenance",
    title="PC and laptop maintenance, repair and upgrades in Vienna | HORANiQ",
    description="Maintenance, repair, SSD and RAM upgrades and refurbished PCs and laptops for businesses in Vienna. Use devices longer, create less electronic waste.",
    h1="More life for your technology",
    lead="Your devices should work reliably and last as long as possible. We check what can be repaired or upgraded, so your technology stays in use longer and less electronic waste is created.",
    assure=["Check first, then decide", "Upgrade instead of replace, where it pays off", "New and refurbished devices"],
    report=("Device check", [
        ("ok", "Reception PC", "Runs fast and reliably"),
        ("warn", "Office laptop", "Slow, an SSD brings a noticeable speed-up"),
        ("crit", "Old notebook", "Repair not worthwhile, replacement recommended"),
    ], "An honest recommendation: repair, upgrade or replace."),
    pains=["The computer is slow, but a replacement seems expensive.",
           "You do not know whether a repair is worthwhile.",
           "Devices are replaced although an upgrade would have been enough.",
           "After a switch, data or settings are missing.",
           "Cameras, alarm and access are never maintained."],
    rows=[("Maintain PCs and laptops", "Cleaning, updates and checks so devices run reliably."),
          ("Find and repair faults", "We look for the cause and fix it where it makes economic sense."),
          ("Upgrade with SSD and RAM", "More speed for existing devices, often with little effort."),
          ("New and refurbished devices", "Suitable PCs and laptops, set up and ready to use."),
          ("Setup and data transfer", "Your data and settings move to the new device."),
          ("Maintain security technology", "Check and keep cameras, alarm systems and access systems in order.")],
    band=dict(title="Check first, then decide", lead="You receive an honest recommendation on whether repair or upgrade is worthwhile.", price=False,
              checks=["Condition of the device", "Performance and storage", "Updates and security", "Cost of a repair", "Cost of an upgrade", "Cost of a replacement", "Data transfer", "Disposal"]),
    steps=[("Request", "You describe the problem or the devices you would like checked."),
           ("Diagnosis", "We find the cause and name options with costs."),
           ("Implementation", "Repair, upgrade or replacement including setup and data transfer."),
           ("Handover", "The device is ready to use, your data is there.")],
    faq=[("Is a repair worthwhile?", "We check that in advance. You receive a recommendation with costs for repair, upgrade and replacement."),
         ("What does an SSD bring?", "Older computers with a hard drive often start and work much faster with an SSD."),
         ("Do you also sell devices?", "Yes, new and refurbished PCs and laptops. We choose suitable models, set them up and transfer your data."),
         ("Do you repair phones?", "No. We focus on your business technology: PCs, laptops, network and security technology.")],
    related=["it-betreuung", "sicherheit", "care"],
)

SERVICES_EN["smart-building"] = dict(
    name="Smart building",
    title="Smart building for offices and businesses in Vienna | HORANiQ",
    description="Practical control of lighting, heating, shading and sensors. Smart building for offices, practices, shops and businesses in Vienna.",
    h1="Rooms that adapt to your working day",
    lead="Lighting, heating, blinds and curtains can be controlled so that they make daily life easier and save energy. Planned practically, without gimmicks.",
    assure=["Only what makes your day easier", "Reliably integrated into the network", "Electrical work with a qualified partner"],
    report=("Room check", [
        ("ok", "Office heating", "Times and temperature sensibly regulated"),
        ("warn", "South-side shading", "Manual, rooms heat up in summer"),
        ("crit", "Warehouse lighting", "Burns constantly, no control"),
    ], "You see where automation pays off."),
    pains=["The heating runs although nobody is in the room.",
           "Blinds are operated by hand and are in the wrong position when the sun comes out.",
           "Lights stay on because nobody thinks of it.",
           "Every room has a different remote control or app.",
           "The system was installed, but nobody can operate it."],
    rows=[("Lighting", "Schedules, motion sensors and scenes for office, sales floor or warehouse."),
          ("Heating and thermostats", "Control temperatures by time and room, with an overview of consumption."),
          ("Blinds, shutters and curtains", "Shading automatic or by button, matched to the position of the sun."),
          ("Windows and sensors", "Contacts, motion and room climate as the basis for sensible automation."),
          ("Operation", "A few clear ways to operate it that your team actually uses."),
          ("Integration into the network", "Stable connection and a separate area, so nothing disturbs your workstations.")],
    band=dict(title="We start with your day-to-day", lead="First we clarify what bothers you. Then we decide which technology makes sense.", price=False,
              checks=["Rooms and use", "Heating", "Lighting", "Shading", "Existing technology", "Network and power", "Operation", "Budget"]),
    steps=[("First call", "We clarify what bothers you or costs energy in your rooms day to day."),
           ("Concept and quote", "A plan with the measures that are worthwhile for you."),
           ("Implementation", "Installation and setup, with an electrician partner if needed."),
           ("Instruction", "Your team knows how everything is operated.")],
    faq=[("Is smart building only for large buildings?", "No. Even in small offices and shops, simple control of heating, lighting and shading is worthwhile."),
         ("Do I have to renovate for this?", "Often not. Much can be retrofitted with wireless solutions. We check what is possible in your premises."),
         ("Do you carry out electrical work?", "For work that requires a qualified electrician, we work with a qualified electrician and coordinate everything for you."),
         ("Does it really save energy?", "Suitable control helps avoid unnecessary consumption. Actual savings depend on the building and its use, which is why we do not promise figures.")],
    related=["sicherheit", "netzwerk", "care"],
)

SERVICES_EN["crm-archivierung"] = dict(
    name="CRM and digital filing",
    title="CRM and digital archiving for small businesses in Vienna | HORANiQ",
    description="Customer management, document storage and simple workflows for small and medium-sized businesses in Vienna. Less searching, more overview.",
    h1="Customers and documents you can actually find again",
    lead="We help small businesses organise customer data, documents and recurring workflows clearly. New in our offering, and therefore built up step by step together with you.",
    assure=["Matched to the size of your business", "Step by step instead of a big project", "Integrated with Microsoft 365"],
    report=("Workflow check", [
        ("ok", "Customer list", "Centrally maintained and up to date"),
        ("warn", "Document storage", "Different folders, hard to find"),
        ("crit", "Quotes and follow-up", "Only in heads and emails, gets lost"),
    ], "You see where time is lost."),
    pains=["Customer data sits in emails, Excel lists and notes.",
           "Documents are searched for instead of found.",
           "Quotes and enquiries are not followed up.",
           "Only one person knows where things are.",
           "Paper piles up because there is no digital workflow."],
    rows=[("Customer management", "Contacts, enquiries and quotes in one place, matched to the size of your business."),
          ("Document storage", "Clear structure and rules so everyone finds documents again."),
          ("Digital archiving", "Digitise paper and file it in an orderly way."),
          ("Simplify workflows", "Turn recurring tasks such as enquiries or approvals into clear steps."),
          ("Integration with Microsoft 365", "Use existing tools instead of building new complexity."),
          ("Introduction to the team", "A short briefing so that it is actually used.")],
    band=dict(title="We start small", lead="The area that costs you the most time is organised first.", price=False,
              checks=["Customer data", "Documents", "Quotes", "Workflows", "Permissions", "Existing tools", "Team", "Budget"]),
    steps=[("First call", "We clarify where you lose the most time."),
           ("Concept", "We choose a suitable tool and define structure and rules."),
           ("Setup", "We set everything up and transfer existing data."),
           ("Introduction", "Your team gets to know it, and we stay available.")],
    faq=[("Do I need expensive software for this?", "Not necessarily. Often existing tools are enough, for example from Microsoft 365. We recommend what fits your size."),
         ("Can you digitise paper files?", "We organise the digital filing and support the changeover. Whether we scan ourselves or bring in a partner is settled in the quote."),
         ("Has this long been part of your offering?", "No, it is a new area. We build it together with our first customers and deliberately start small.")],
    related=["microsoft-365", "website-shop", "care"],
)

SERVICES_EN["it-sicherheit"] = dict(
    name="IT security",
    title="IT security for businesses in Vienna: firewall, access rights, MFA | HORANiQ",
    description="Firewall, user rights, access protection and secure sign-in with MFA for small and medium-sized businesses in Vienna. Factual and understandable.",
    h1="Clear access rights and secure sign-in for your business",
    lead="We make sure that only the right people access your systems and data. With a firewall, clean user rights, access protection and secure sign-in. Factual, without scaremongering.",
    assure=["Firewall and access protection", "User rights and MFA", "Explained clearly"],
    report=("IT security at a glance", [
        ("ok", "Firewall", "Up to date and with clear rules"),
        ("warn", "User rights", "Some accounts have more access than necessary"),
        ("crit", "Sign-in", "Important accounts without a second factor (MFA)"),
    ], "You see what should be settled first."),
    pains=["All employees have access to everything because rights were never regulated.",
           "Former employees still have active access.",
           "Important accounts are protected by a password only.",
           "The firewall is old or was never set up properly.",
           "Nobody knows exactly who may access what."],
    rows=[("Firewall", "A secure connection to the internet with rules that fit your business."),
          ("User rights", "Who may do what: assign access by task and remove it cleanly when people leave."),
          ("Access protection", "Secure devices, folders and accounts so that only authorised people get in."),
          ("Secure sign-in with MFA", "Sign-in through a second factor for important accounts such as email and Microsoft 365."),
          ("Inventory", "We look at how your systems are secured today and show the most important gaps."),
          ("Documentation", "You receive a record of what was set up and who has which rights.")],
    band=dict(title="Where does your IT security stand?", lead="The IT check gives a first overview of access, sign-in and firewall. It does not replace a comprehensive security audit.", price=True,
              checks=["Firewall", "User access", "Microsoft 365 and MFA", "PCs and updates", "Backup and NAS", "Network and Wi-Fi", "Router and switches", "Security basics"]),
    steps=[("First call", "We clarify which systems and data matter for your business."),
           ("Inventory", "We check access, sign-in and firewall."),
           ("Quote", "You receive clear measures in a sensible order."),
           ("Implementation and documentation", "We set up, document and explain it to your team.")],
    faq=[("Will we be fully protected afterwards?", "There is no absolute security. We reduce risks through clear rights, secure sign-in and current systems, and tell you openly what we can and cannot check."),
         ("What is MFA?", "When signing in, a second factor is needed in addition to the password, for example a confirmation on your phone. It protects accounts much better."),
         ("Is this only for large companies?", "No. Small businesses also benefit from clear access rights and secure sign-in. We adjust scope and effort to your size."),
         ("Do cameras and alarm systems belong here too?", 'That is a separate area: <a href="/en/sicherheit/">cameras, alarm and access</a>.')],
    related=["microsoft-365", "netzwerk", "backup"],
)

SERVICES_EN["it-beratung"] = dict(
    name="IT consulting &amp; project delivery",
    title="IT consulting and project delivery for businesses in Vienna | HORANiQ",
    description="IT consulting, planning, implementation and documentation from one source, coordinated with your providers. For small and medium-sized businesses in Vienna.",
    h1="From idea to running solution, from one source",
    lead="You know what should work better in your business, but not how? We advise, plan, implement, document and coordinate with your providers.",
    assure=["Consulting, planning and implementation", "Coordination with your providers", "Documentation at the end"],
    report=("Project overview", [
        ("ok", "Goal and scope", "Defined together"),
        ("warn", "Responsibilities", "Not yet clarified with the software provider"),
        ("crit", "Documentation", "Not recorded anywhere so far"),
    ], "You see what needs clarifying before the start."),
    pains=["Several providers are involved and nobody has the overall picture.",
           "You do not know which solution fits your business.",
           "Quotes are hard to compare.",
           "A renovation or move is coming up and the IT is forgotten.",
           "What was set up is not recorded anywhere."],
    rows=[("Consulting", "We clarify needs and the current state and say honestly what is necessary and what is not."),
          ("Planning", "An understandable plan with scope, sequence and cost."),
          ("Implementation", "We carry out the measures or steer implementation with the providers involved."),
          ("Coordination with providers", "We talk to software vendors, providers and suppliers so nothing falls between the cracks."),
          ("Choice of suitable devices", "We recommend devices that fit your requirements and your existing equipment."),
          ("Documentation", "At the end it is recorded what was set up and how it fits together.")],
    band=dict(title="We start with your project", lead="First we clarify what you want to achieve. Then we decide what is needed for it.", price=False,
              checks=["Goal of the project", "Existing technology", "Providers involved", "Schedule", "Budget", "Responsibilities", "Risks", "Documentation"]),
    steps=[("First call", "We clarify your project and your framework."),
           ("Concept and quote", "You receive a clear plan with scope and cost."),
           ("Implementation", "We implement and coordinate those involved."),
           ("Documentation and handover", "You receive a record of what was set up.")],
    faq=[("Do I need an IT check beforehand?", "No. An IT check is a way to see the starting point, but not a prerequisite for consulting or a project."),
         ("Do you work with my existing providers?", "Yes. We coordinate with the responsible providers and clarify responsibilities before we begin."),
         ("Can individual parts of a project be commissioned?", "Yes. You can start with one part and extend later.")],
    related=["it-check", "netzwerk", "care"],
    interest="beratung",
)

SERVICES_EN["care"] = dict(
    name="HORANiQ Care",
    title="HORANiQ Care: IT maintenance contracts in Vienna | HORANiQ",
    description="Maintenance packages for small and medium-sized businesses in Vienna: regular checks, backup monitoring, remote support and priority support.",
    h1="Care you can plan for, instead of help only in an emergency",
    lead="With HORANiQ Care we check your technology regularly, keep it up to date and are reachable when something does not work. The scope depends on your business.",
    assure=["Regular checks", "Priority support", "Clear services, clear price"],
    report=("Care report", [
        ("ok", "Updates and devices", "All workstations up to date"),
        ("warn", "Backup recovery", "Sample check due this month"),
        ("crit", "Expiring certificate", "Renewal needed in 10 days"),
    ], "Every month you know how your technology is doing."),
    pains=["You only call once something is already broken.",
           "Nobody checks updates, backup and access regularly.",
           "There is no agreed response time for faults.",
           "Costs fluctuate strongly from month to month.",
           "What was maintained is not recorded anywhere."],
    rows=[("Regular system checks", "Devices, network, security and access are checked on schedule."),
          ("Backup monitoring", "We check that backups run and that data can be restored."),
          ("Updates", "Devices and systems stay up to date."),
          ("Remote support", "Quick help, often without travel."),
          ("Priority support", "Your requests come first, with an agreed response time depending on the package."),
          ("Documentation and report", "You see what was checked and done.")],
    extra='''<section class="s">
  <div class="wrap split">
    <div class="split-head"><h2>Four packages for different businesses</h2><p>Names and scope may still change. We state prices after the first call.</p></div>
    <ul class="tiers">
      <li><b>Care Start</b><span>For very small businesses: regular checks and remote support.</span></li>
      <li><b>Care Business</b><span>For growing businesses: plus backup monitoring, updates and Microsoft 365 care.</span></li>
      <li><b>Care Pro</b><span>For more devices and users: priority support and regular reports.</span></li>
      <li><b>Care Praxis</b><span>For practices and other businesses where an outage disrupts immediately: short response times, closer backup monitoring and detailed documentation.</span></li>
    </ul>
  </div>
</section>''',
    band=dict(title="The best start is the IT check", lead="It shows what a suitable package should contain.", price=True,
              checks=["Devices and updates", "Network and Wi-Fi", "Backup and NAS", "Firewall", "Microsoft 365 and MFA", "Printers", "User access", "Security basics"]),
    steps=[("First call", "We clarify size, devices and what may happen in an outage."),
           ("IT check", "We check the starting point."),
           ("Package and quote", "You receive a package that fits you, with clear services."),
           ("Start of care", "Regular checks, support and reports get under way.")],
    faq=[("Am I tied in for long?", "We set term and cancellation transparently in the quote. Ask us about it in the first call."),
         ("Why does a package for practices cost more?", "Not because you are a doctor, but because shorter response times, closer backup monitoring and more documentation mean more effort."),
         ("What is included in an emergency?", "That depends on the package. Response times and scope of services are in the contract, so there are no surprises.")],
    related=["it-betreuung", "backup", "microsoft-365"],
    interest="betreuung",
)
