"""Build danielyoung.work.

Each file in _src/pages/ is a page body with a short header comment:

    <!--
    title: Page title
    description: One line for search and sharing
    path: /work/
    nav: work
    -->

Run:  python3 _src/build.py
It wraps every body in the shared layout, works out reading times and
writes index.html files into the site folder. Edit pages, not the output.
"""

import html
import re
from pathlib import Path

SRC = Path(__file__).parent / "pages"
OUT = Path(__file__).parent.parent
SITE = "https://danielyoung.work"
UPDATED = "2 November 2026"
WPM = 220

NAV = [("work", "Work", "/work/"), ("about", "About", "/about/"), ("notes", "Notes", "/notes/"), ("contact", "Contact", "/contact/")]

ICON_AUTO = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>'
ICON_SUN = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
ICON_MOON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>'
ICON_MENU = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 6.5h12M3 11.5h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
FAVICON = "data:image/svg+xml," + (
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23181715'/%3E"
    "%3Ctext x='16' y='22.5' text-anchor='middle' font-family='Georgia,serif' font-size='17' fill='%23f3f0e8'%3EDY%3C/text%3E%3C/svg%3E"
)

# Applied before first paint so a saved theme never flashes the wrong colours
THEME_BOOT = (
    "<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;"
    "var s=localStorage.getItem('size');if(s)document.documentElement.style.setProperty('--reading-size',{s:'1.0625rem',m:'1.1875rem',l:'1.375rem'}[s]);}catch(e){}</script>"
)


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--(.*?)-->\s*", text, re.S)
    meta = {}
    for line in m.group(1).strip().splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    meta["body"] = text[m.end():]
    return meta


def minutes(body):
    m = re.search(r"<!--prose-->(.*?)<!--/prose-->", body, re.S)
    if not m:
        return None
    words = len(re.sub(r"<[^>]+>", " ", m.group(1)).split())
    return max(1, round(words / WPM))


def layout(p):
    title = p["title"] if p["path"] == "/" else f'{p["title"]} · Daniel Young'
    desc = html.escape(p["description"], quote=True)
    current = ' aria-current="page"'
    nav = "".join(
        f'<a href="{href}"{current if p.get("nav") == key else ""}>{label}</a>' for key, label, href in NAV
    )
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}{p["path"]}">
<meta property="og:title" content="{html.escape(title, quote=True)}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}{p["path"]}">
<meta property="og:type" content="{"article" if p.get("nav") == "notes" and p["path"] != "/notes/" else "website"}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="{FAVICON}">
<link rel="preload" href="/fonts/TimelessSerifVF.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/TimelessSansVF.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap">
<link rel="stylesheet" href="/assets/site.css">
{THEME_BOOT}
<script src="/assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Daniel Young, home"><span class="brand-name">Daniel Young</span><span class="brand-role">Brand Designer</span></a>
    <nav class="nav" id="nav" aria-label="Main">{nav}</nav>
    <div class="header-tools">
      <div class="theme-switch" role="group" aria-label="Colour theme">
        <button type="button" data-mode="auto" aria-pressed="true" title="Match my system">{ICON_AUTO}<span class="visually-hidden">Auto</span></button>
        <button type="button" data-mode="light" aria-pressed="false" title="Light">{ICON_SUN}<span class="visually-hidden">Light</span></button>
        <button type="button" data-mode="dark" aria-pressed="false" title="Dark">{ICON_MOON}<span class="visually-hidden">Dark</span></button>
      </div>
      <button class="icon-btn menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu">{ICON_MENU}</button>
    </div>
  </div>
</header>
<main id="main">
{p["body"].strip()}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="colophon">
        <p class="note">Every word here was written or edited by me. Claude helped build the site.</p>
        <p class="muted">Set in Timeless Serif and Timeless Sans.</p>
      </div>
      <div>
        <h2>Pages</h2>
        <ul><li><a href="/">Home</a></li><li><a href="/work/">Work</a></li><li><a href="/about/">About</a></li><li><a href="/notes/">Notes</a></li><li><a href="/contact/">Contact</a></li><li><a href="/cv/">CV</a></li></ul>
      </div>
      <div>
        <h2>Get in touch</h2>
        <ul><li><a href="mailto:info@danielyoung.work">info@danielyoung.work</a></li><li><button class="kbd-hint" type="button" data-copy="info@danielyoung.work">Copy email address</button></li></ul>
      </div>
      <div>
        <h2>Local time</h2>
        <p class="clock" data-clock style="align-items:flex-start"><span class="pulse" style="margin-top:7px"></span><span data-clock-text>Northern Ireland</span></p>
      </div>
    </div>
    <div class="footer-base">
      <span>© 2026 Daniel Young. Last updated {UPDATED}.</span>
      <button class="kbd-hint" type="button" data-keys>Press <kbd>?</kbd> for keyboard shortcuts</button>
    </div>
  </div>
</footer>
<dialog class="keys" aria-labelledby="keys-title">
  <h2 id="keys-title">Keyboard shortcuts</h2>
  <dl>
    <dt><kbd>g</kbd> <kbd>h</kbd></dt><dd>Home</dd>
    <dt><kbd>g</kbd> <kbd>w</kbd></dt><dd>Work</dd>
    <dt><kbd>g</kbd> <kbd>a</kbd></dt><dd>About</dd>
    <dt><kbd>g</kbd> <kbd>n</kbd></dt><dd>Notes</dd>
    <dt><kbd>g</kbd> <kbd>c</kbd></dt><dd>Contact</dd>
    <dt><kbd>t</kbd></dt><dd>Switch theme: auto, light, dark</dd>
    <dt><kbd>?</kbd></dt><dd>Show this list</dd>
  </dl>
  <form method="dialog"><button class="btn ghost" type="submit">Close</button></form>
</dialog>
<div class="preview" aria-hidden="true"><img alt=""></div>
</body>
</html>
"""


def main():
    pages = [parse(f) for f in sorted(SRC.glob("*.html"))]
    reads = {}
    for p in pages:
        m = minutes(p["body"])
        if m:
            reads[p["path"]] = m
    for p in pages:
        body = p["body"]
        body = re.sub(r"\{\{read:(\S+?)\}\}", lambda m: f"{reads.get(m.group(1), 1)} min read", body)
        body = body.replace("{{read}}", str(reads.get(p["path"], 1)))
        p["body"] = body
        dest = OUT / p["path"].strip("/") / "index.html" if p["path"] != "/404" else OUT / "404.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(layout(p), encoding="utf-8")
        print(f"{p['path']:<40} {str(reads.get(p['path'], '')) + ' min' if p['path'] in reads else ''}")


if __name__ == "__main__":
    main()
