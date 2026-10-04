"""Decorative network diagram for the home hero: one core switch, three distribution switches, nine devices.
Pure SVG, no script. A few small packets travel along the lines (SMIL); they are hidden for reduced motion in CSS."""


def _switch(cx, cy, w, ports, active):
    h = 24
    x, y = cx - w / 2, cy - h / 2
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#fff" stroke="#b7c8d6" stroke-width="1.5"/>'
    gap = (w - 16) / ports
    for i in range(ports):
        px = x + 8 + i * gap + (gap - 7) / 2
        out += f'<rect x="{px:.1f}" y="{cy + 1}" width="7" height="6" rx="1.5" fill="{"#33A1C2" if i in active else "#d3dee7"}"/>'
    out += f'<circle cx="{x + 10}" cy="{cy - 5}" r="2" fill="#48B78C"/><rect x="{x + 16}" y="{cy - 6.5}" width="{w * 0.35:.0f}" height="3" rx="1.5" fill="#d3dee7"/>'
    return out


def _device(cx, cy, lit=False):
    st = "#0B7A77" if lit else "#b7c8d6"
    return (f'<rect x="{cx - 11}" y="{cy - 8}" width="22" height="15" rx="3" fill="#fff" stroke="{st}" stroke-width="1.5"/>'
            f'<path d="M{cx - 6} {cy + 11}h12M{cx} {cy + 7}v4" stroke="{st}" stroke-width="1.5" stroke-linecap="round"/>')


PATHS = {
    "a1": "M300 94V150H110V190", "a2": "M300 94V190", "a3": "M300 94V150H490V190",
    "b11": "M110 214V270H50V320", "b12": "M110 214V320", "b13": "M110 214V270H170V320",
    "b21": "M300 214V270H240V320", "b22": "M300 214V320", "b23": "M300 214V270H360V320",
    "b31": "M490 214V270H430V320", "b32": "M490 214V320", "b33": "M490 214V270H550V320",
    "up": "M300 70V8",
}
ACTIVE = ("a2", "b22")                       # the highlighted route, like a path in an IT-Check
PACKETS = (("a2", 3.2, 0), ("b22", 2.6, 1.2), ("a1", 4.4, 0.6), ("b13", 3.8, 2.0), ("a3", 4.0, 1.6), ("b32", 3.4, 0.2))


def network_svg():
    parts = ['<svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" focusable="false">']
    for key, d in PATHS.items():
        hot = key in ACTIVE
        dash = ' stroke-dasharray="3 5"' if key == "up" else ""
        parts.append(f'<path id="hn-{key}" d="{d}" fill="none" stroke="{"#0B7A77" if hot else "#c5d4e0"}" stroke-width="{2.4 if hot else 1.6}" stroke-linejoin="round"{dash}/>')
    parts.append(_switch(300, 82, 128, 10, {2, 3, 7}))
    for x, act in ((110, {1, 4}), (300, {2, 3}), (490, {0, 5})):
        parts.append(_switch(x, 202, 100, 7, act))
    for x in (50, 110, 170, 240, 300, 360, 430, 490, 550):
        parts.append(_device(x, 332, lit=(x == 300)))
    for key, dur, begin in PACKETS:
        parts.append(f'<circle r="3.6" fill="#33A1C2" class="pkt"><animateMotion dur="{dur}s" begin="{begin}s" repeatCount="indefinite" rotate="auto"><mpath href="#hn-{key}"/></animateMotion></circle>')
    parts.append("</svg>")
    return "".join(parts)
