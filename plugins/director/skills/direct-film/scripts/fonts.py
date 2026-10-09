#!/usr/bin/env python3
"""fonts.py <composition/index.html> <config.json>

Any Google Font named in a config renders: the overlay's theme.font (callout lettering) and theme.cardFont
(cards), or the end card's font. Each family gets its own <link> between the fonts:start / fonts:end comments
in the composition's <head>, so HyperFrames loads it before the first frame. A name Google doesn't know
fails here, loudly, instead of rendering in a fallback font.
"""
import json, re, sys, urllib.error, urllib.parse, urllib.request

KEYS = (("theme", "font"), ("theme", "cardFont"), ("font",))
BUILT_IN = {"Caveat Brush", "Permanent Marker", "Kalam", "Bangers", "Plus Jakarta Sans"}  # already linked by the templates


def families(cfg):
    out = []
    for path in KEYS:
        v = cfg
        for k in path:
            v = v.get(k) if isinstance(v, dict) else None
        if isinstance(v, str) and v.strip() and v.strip() not in BUILT_IN and v.strip() not in out:
            out.append(v.strip())
    return out


def css_url(family):
    """The first css2 URL Google accepts: a family that lacks a weight makes the whole request fail (400)."""
    q = urllib.parse.quote_plus(family)
    for spec in (":wght@400;500;600;700;800", ":wght@400;700", ""):
        url = f"https://fonts.googleapis.com/css2?family={q}{spec}&display=block"
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
                if r.status == 200:
                    return url
        except urllib.error.HTTPError as e:
            if e.code != 400:
                raise
    raise SystemExit(f'"{family}" is not a Google Font (check the spelling on fonts.google.com)')


def main(html_path, cfg_path):
    cfg = json.load(open(cfg_path))
    try:
        links = "".join(f'\n    <link href="{css_url(f).replace("&", "&amp;")}" rel="stylesheet" />' for f in families(cfg))
    except urllib.error.URLError as e:  # offline: keep whatever is linked now rather than failing the whole render
        print(f"fonts.py: can't reach Google Fonts ({e.reason}); keeping the current fonts", file=sys.stderr)
        return
    html = open(html_path, encoding="utf-8").read()
    block = f"<!-- fonts:start: scripts/fonts.py -->{links}\n    <!-- fonts:end -->"
    if "<!-- fonts:start" in html:
        html = re.sub(r"<!-- fonts:start.*?-->.*?<!-- fonts:end -->", lambda _: block, html, flags=re.S)
    else:  # a project made before fonts.py: add the block at the end of <head>
        html = html.replace("</head>", f"    {block}\n  </head>", 1)
    open(html_path, "w", encoding="utf-8").write(html)
    print(" ".join(families(cfg)) or "no extra fonts")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
