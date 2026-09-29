# HORANiQ website

Static site. No framework, no runtime dependencies (Python 3 standard library only for the build).

```
python3 site/build.py                    # writes site/public/
python3 -m http.server -d site/public 8000
```

| URL | Source |
|---|---|
| `/` | `src/pages/index.html` |
| `/arztpraxis/` | `src/pages/arztpraxis.html` |
| `/kanzlei/` | `src/pages/kanzlei.html` |
| `/netzwerk/`, `/unternehmen/` | `src/pages/netzwerk.html`, `src/pages/unternehmen.html` |
| `/leistungen/` and service pages `/it-betreuung/`, `/microsoft-365/`, `/backup/`, `/it-sicherheit/`, `/sicherheit/` (Kameras, Alarm, Zutritt), `/wartung-reparatur/`, `/smart-building/`, `/it-beratung/`, `/crm-archivierung/`, `/care/` | generated from `services.py` (groups and names in `SVC`/`GROUPS`) |
| `/website-shop/`, `/it-check/` | `src/pages/website-shop.html`, `src/pages/it-check.html` (hand-written) |
| `/ar/<service>/`, `/ar/leistungen/` | Arabic versions of every service page: `services_ar.py` plus `src/pages/ar-website-shop.html`, `src/pages/ar-it-check.html` |
| `/ar/` | `src/pages/ar.html` (RTL, Arabic) |
| `/impressum/`, `/datenschutz/` | drafts, `noindex` |

`build.py` adds header, footer, contact form, JSON-LD (LocalBusiness, WebPage, BreadcrumbList, FAQPage from the `<details>` blocks), hreflang, sitemap and robots.txt.

## Before going live
1. Fill `PHONE`, `WHATSAPP`, `FORM_ENDPOINT`, `SAME_AS` at the top of `build.py`. Without a form endpoint the form opens a prefilled e-mail. Without a phone number, call buttons are hidden.
2. Complete `impressum` and `datenschutz` with real data and have them reviewed. Move Google Fonts to local files if you want no third-party requests.
3. Add a real photo of Rami and real reviews once they exist. Nothing here is invented, so there are no testimonials yet.
4. Point the domain at `site/public/`, then verify structured data in Google's Rich Results Test and add the site to Search Console and Google Business Profile.
5. Analytics: the JS only pushes events to `window.dataLayer`. Load GA4 or Google Ads tags only after a consent banner, and update the privacy page.
6. Only keep claims you can honor: "Antwort am selben Werktag" and the Vertraulichkeitsvereinbarung.

## Brand assets
The header and footer use the approved logo (`assets/img/horaniq-logo.webp`, a resized copy of the current reference; the original 2000 px file was not redistributed). The favicon is a crop of the H/Q symbol from that same file. Replace both with the original transparent/high-resolution files when available. There is no approved reversed logo, so the footer shows the logo on a white tile.

## Contact form
`FORM_ENDPOINT` (env var or the constant in `build.py`) must point to a receiving service. Until then the form opens a prefilled e-mail and says so; it never shows a success message it cannot confirm.

## Service inventory
`SERVICE-INVENTORY.md` lists every service, where it appeared before, its target page and what changed. It is an internal file and is not published.
