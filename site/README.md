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
