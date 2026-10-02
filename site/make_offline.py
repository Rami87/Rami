"""Builds a copy of the site that opens by double-clicking index.html (no server needed).
Usage: python3 site/make_offline.py   ->  writes site/offline/ and horaniq-website-offline.zip
Root-absolute links become relative, folder links get index.html, the icon sprite is inlined."""
import os, re, shutil, subprocess, sys, zipfile
from pathlib import Path

HERE = Path(__file__).parent
env = dict(os.environ); env.pop("PREVIEW", None); env.pop("BASE_PATH", None)
subprocess.run([sys.executable, str(HERE / "build.py")], check=True, env=env, stdout=subprocess.DEVNULL)
SRC, OUT = HERE / "public", HERE / "offline"
if OUT.exists(): shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
sprite = (OUT / "assets/img/icons.svg").read_text(encoding="utf8")
sprite = re.sub(r"^<\?xml[^>]*>\s*", "", sprite)
sprite = sprite.replace("<svg ", '<svg style="display:none" aria-hidden="true" ', 1)

def rel_target(path, rel):
    frag = ""
    if "#" in path: path, frag = path.split("#", 1); frag = "#" + frag
    if path.startswith("/assets/") or re.search(r"\.[a-z0-9]{2,5}$", path):
        return rel + path.lstrip("/") + frag
    return rel + path.lstrip("/") + "index.html" + frag

for f in list(OUT.rglob("*.html")):
    depth = len(f.relative_to(OUT).parts) - 1
    rel = "../" * depth if depth else "./"
    s = f.read_text(encoding="utf8")
    s = re.sub(r'href="/assets/img/icons\.svg\?v=[0-9a-f]+#', 'href="#', s)
    s = re.sub(r'(href|src)="(/(?!/)[^"?]*)(\?v=[0-9a-f]+)?"', lambda m: f'{m.group(1)}="{rel_target(m.group(2), rel)}"', s)
    s = re.sub(r'(href="[^"#]*/)(#|")', lambda m: m.group(0), s)
    s = re.sub(r"<body([^>]*)>", lambda m: f"<body{m.group(1)}>\n{sprite}", s, count=1)
    s = re.sub(r'<link rel="(canonical|alternate)"[^>]*>\n?', "", s)
    s = re.sub(r"<link rel=\"preload\"[^>]*>\n?", "", s)
    f.write_text(s, encoding="utf8")
for junk in ("robots.txt", "sitemap.xml"):
    (OUT / junk).unlink(missing_ok=True)
(OUT / "assets/img/icons.svg").unlink(missing_ok=True)
z = HERE.parent / "horaniq-website-offline.zip"
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    for p in sorted(OUT.rglob("*")):
        if p.is_file(): zf.write(p, Path("horaniq-website") / p.relative_to(OUT))
print("ok", z, z.stat().st_size // 1024, "KB")
