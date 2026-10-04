"""Services stage: a circle carousel on the home page. One card per service, grouped by colour.
Pure markup; behaviour lives in assets/js/site.js and styles in assets/css/site.css."""

COLORS = ["#0F2E40", "#0B7A77", "#17698a", "#1f7a5a", "#1d4a63"]

ARROW_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
ARROW_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'


def stage_html(groups, names, prefix, t):
    """groups: [(name, blurb, [slugs])]; names: {slug: (name, blurb)}; prefix: "" or "/ar"; t: language strings."""
    cards, chips = "", ""
    for gi, (gname, _blurb, slugs) in enumerate(groups):
        chips += f'<button type="button" class="chip" aria-current="false">{gname}</button>'
        for sl in slugs:
            nm, tag = names[sl]
            cards += (
                f'<li class="card" data-g="{gi}" data-color="{COLORS[gi % len(COLORS)]}" data-gname="{gname}">'
                f'<a href="{prefix}/{sl}/" data-track="stage-{sl}">'
                f'<span class="disc"><span class="disc-in">{{{{ICON:{sl}}}}}</span></span>'
                f'<h3>{nm}</h3><p class="tag">{tag}</p><span class="go">{t["stage_more"]}</span></a></li>'
            )
    return (
        f'<div class="stage" role="region" aria-roledescription="carousel" aria-label="{t["stage_aria"]}">'
        '<svg class="stage-arc" aria-hidden="true"><defs><path id="stage-arc-path" d=""/></defs>'
        '<text><textPath href="#stage-arc-path" startOffset="50%" text-anchor="middle"></textPath></text></svg>'
        f'<ul class="track" tabindex="0">{cards}</ul>'
        f'<div class="stage-ctl"><button type="button" class="stage-btn stage-prev" aria-label="{t["stage_prev"]}">{ARROW_PREV}</button>'
        f'<div class="chips">{chips}</div>'
        f'<button type="button" class="stage-btn stage-next" aria-label="{t["stage_next"]}">{ARROW_NEXT}</button></div></div>'
    )
