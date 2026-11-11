#!/usr/bin/env python3
"""Build danielyoung.work from the plain text files in _content/.

    python3 _build.py                 build the home page and every case study
    python3 _build.py new "Client"    start a new case study from a template

Edit text in _content/, then run the build, then publish. _HOW-TO-EDIT.md has
the details. Only the standard library is needed.
"""
import os, re, struct, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, '_content')
VARIANTS = 'abcde'
LAYOUTS = ('full', 'free', 'solo', 'pp', 'row3', 'scroll', 'v-a', 'v-b', 'v-c', 'v-d', 'v-e')


class Problem(Exception):
    pass


# ---------------------------------------------------------------- helpers
def esc(s, attr=False):
    """Escape & (unless it is already an entity). Tags such as <em> are left alone."""
    s = re.sub(r'&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)', '&amp;', s)
    if attr:
        s = s.replace('"', '&quot;')
    return s


def plain(s):
    """Text with tags and entities stripped (for <title> and meta tags)."""
    return re.sub(r'<[^>]+>', '', s)


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write_if_changed(path, text):
    if os.path.exists(path) and read(path) == text:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    return True


def image_size(path):
    with open(path, 'rb') as f:
        d = f.read(65536)
    if d[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', d[16:24])
    if d[:2] == b'\xff\xd8':
        i = 2
        while i < len(d) - 9:
            if d[i] != 0xFF:
                i += 1
                continue
            m = d[i + 1]
            if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
                i += 2
                continue
            n = struct.unpack('>H', d[i + 2:i + 4])[0]
            if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack('>HH', d[i + 5:i + 9])
                return w, h
            i += 2 + n
    raise Problem('Cannot read the size of %s. Use a .jpg or .png.' % os.path.relpath(path, ROOT))


# ---------------------------------------------------------------- reading a study
def parse_study(slug):
    path = os.path.join(CONTENT, 'studies', slug + '.txt')
    if not os.path.exists(path):
        raise Problem('%s is in order.txt but _content/studies/%s.txt does not exist.' % (slug, slug))
    text = read(path).replace('\r\n', '\n')
    parts = re.split(r'(?m)^---[ \t]*$', text, maxsplit=1)
    if len(parts) != 2:
        raise Problem('%s.txt needs a line with just --- between the details and the page.' % slug)
    head, body = parts
    s = {'slug': slug, 'facts': [], 'blocks': [], 'prev': None, 'next': None}
    for n, line in enumerate(head.split('\n'), 1):
        line = line.rstrip()
        if not line.strip() or line.lstrip().startswith('//'):
            continue
        if ':' not in line:
            raise Problem('%s.txt, details, line %d: expected "name: value".' % (slug, n))
        k, v = line.split(':', 1)
        k, v = k.strip().lower(), v.strip()
        if k == 'fact':
            if '|' not in v:
                raise Problem('%s.txt: a fact needs the form "fact: Label | Value".' % slug)
            a, b = v.split('|', 1)
            s['facts'].append((a.strip(), b.strip()))
        elif k in ('prev', 'next'):
            bits = [x.strip() for x in v.split('|')]
            if len(bits) != 3:
                raise Problem('%s.txt: %s needs "link | small label | name".' % (slug, k))
            s[k] = bits
        elif k in ('name', 'title', 'description', 'card', 'home', 'home-layout', 'image-folder', 'page-title'):
            s[k] = v
        else:
            raise Problem('%s.txt: unknown detail "%s".' % (slug, k))
    for k in ('name', 'title', 'description', 'card', 'home'):
        if not s.get(k):
            raise Problem('%s.txt: "%s:" is missing or empty.' % (slug, k))
    folder = s.get('image-folder', 'assets/img/case-studies/%s/' % slug).strip('/') + '/'
    s['folder'] = folder

    cur_text = None
    cur_gal = None
    para = []

    def flush_para():
        if para and cur_text is not None:
            cur_text['paras'].append(' '.join(para))
        del para[:]

    for n, raw in enumerate(body.split('\n'), 1):
        line = raw.rstrip()
        if cur_gal is not None:
            if line.startswith((' ', '\t')) and line.strip():
                if not line.strip().startswith('//'):
                    cur_gal['items'].append(line.strip())
                continue
            if not line.strip():
                cur_gal = None
                continue
            cur_gal = None
        if not line.strip():
            flush_para()
            continue
        if line.lstrip().startswith('//'):
            continue
        m = re.match(r'^images(?:\s+([a-z0-9-]+))?:\s*$', line)
        if m:
            flush_para()
            cur_text = None
            layout = m.group(1)
            if layout and layout not in LAYOUTS:
                raise Problem('%s.txt: unknown layout "%s". Choose from: %s.' % (slug, layout, ', '.join(LAYOUTS)))
            cur_gal = {'type': 'images', 'layout': layout, 'items': []}
            s['blocks'].append(cur_gal)
            continue
        if line.startswith('# '):
            flush_para()
            cur_text = {'type': 'text', 'heading': line[2:].strip(), 'paras': []}
            s['blocks'].append(cur_text)
            continue
        if line.startswith('> '):
            flush_para()
            cur_text = None
            s['blocks'].append({'type': 'quote', 'text': line[2:].strip()})
            continue
        if cur_text is None:
            raise Problem('%s.txt, line %d of the page: text must sit under a "# Heading".' % (slug, n))
        para.append(line.strip())
    flush_para()
    return s


# ---------------------------------------------------------------- images
def resolve(s, name):
    name = name.strip()
    src = name if name.startswith('/') else '/' + s['folder'] + name
    full = os.path.join(ROOT, src.lstrip('/'))
    if not os.path.exists(full):
        raise Problem('Missing image: %s (needed by %s.txt). Put the file in %s' % (name, s['slug'], os.path.dirname(src).lstrip('/') + '/'))
    w, h = image_size(full)
    return {'src': src, 'w': w, 'h': h}


def parse_item(s, line):
    bits = [x.strip() for x in line.split(' | ')]
    i = resolve(s, bits[0])
    i['alt'] = bits[1] if len(bits) > 1 else ''
    i['cap'] = bits[2] if len(bits) > 2 else ''
    return i


def is_land(i):
    return i['w'] > i['h']


def img_tag(i, eager=False):
    lazy = '' if eager else ' loading="lazy"'
    return '<img src="%s" width="%d" height="%d"%s alt="%s">' % (i['src'], i['w'], i['h'], lazy, esc(i['alt'], True))


def ph(i, cls, eager=False):
    return '<div class="ph %s">%s</div>' % (cls, img_tag(i, eager))


def render_images(s, block, state, first):
    items = [parse_item(s, x) for x in block['items']]
    if not items:
        raise Problem('%s.txt: an "images:" block has no images under it.' % s['slug'])
    layout = block['layout']
    if not layout:
        if len(items) == 1:
            layout = 'full' if is_land(items[0]) else 'solo'
        elif len(items) == 2 and is_land(items[0]) != is_land(items[1]):
            layout = 'v-' + VARIANTS[state['n'] % 5]
            state['n'] += 1
        elif len(items) == 2:
            layout = 'pp'
        elif len(items) == 3:
            layout = 'row3'
        else:
            raise Problem('%s.txt: an images block holds 1 to 3 images.' % s['slug'])
    if layout == 'full':
        i = items[0]
        cap = '<p class="fcap">%s</p>' % esc(i['cap']) if i['cap'] else ''
        return '<figure class="gal rv full">%s%s</figure>' % (ph(i, 'l', eager=first), cap)
    if layout == 'free':
        i = items[0]
        cap = '<p class="fcap">%s</p>' % esc(i['cap']) if i['cap'] else ''
        return '<figure class="gal rv free"><div class="ph">%s</div>%s</figure>' % (img_tag(i), cap)
    if layout == 'scroll':
        i = items[0]
        label = 'Scrollable preview: ' + i['alt']
        return ('<figure class="gal rv scroll"><div class="sf" tabindex="0" role="region" aria-label="%s">%s</div>'
                '<p class="fcap">%s</p></figure>') % (esc(label, True), img_tag(i), esc(i['cap'] or 'Scroll to see the whole page.'))
    if layout.startswith('v-'):
        if len(items) != 2:
            raise Problem('%s.txt: layout %s needs exactly one landscape and one portrait image.' % (s['slug'], layout))
        return '<div class="gal rv %s">%s</div>' % (layout, ''.join(ph(i, 'l' if is_land(i) else 'p') for i in items))
    # solo, pp, row3
    return '<div class="gal rv %s">%s</div>' % (layout, ''.join(ph(i, 'p') for i in items))


# ---------------------------------------------------------------- pages
def render_case(s, tpl, prev, nxt):
    state = {'n': sum(map(ord, s['slug'])) % 5}
    parts = []
    first = True
    for b in s['blocks']:
        if b['type'] == 'text':
            body = ''.join('<p>%s</p>' % esc(p) for p in b['paras'])
            parts.append('<section class="txt rv"><h2>%s</h2><div>%s</div></section>' % (esc(b['heading']), body))
        elif b['type'] == 'quote':
            parts.append('<p class="quote rv">%s</p>' % esc(b['text']))
        else:
            parts.append(render_images(s, b, state, first))
        first = False
    facts = '\n'.join('        <div><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b)) for a, b in s['facts'])
    pager = []
    for k, (cls, link) in enumerate((('prev', prev), ('next', nxt))):
        href, label, name = link
        pager.append('    <a class="%s" href="%s"><span>%s</span><b>%s</b></a>' % (cls, href, esc(label), esc(name)))
    page_title = s.get('page-title') or (plain(s['name']) + ' · Daniel Young')
    desc = esc(plain(s['description']), True)
    pagernav = '  <nav class="pager" aria-label="More work">\n%s\n  </nav>\n\n' % '\n'.join(pager)
    return fill_page(tpl, page_title, desc, '/work/%s/' % s['slug'], s['title'], facts, '\n'.join(parts),
                     pagernav, ' aria-current="page"', '/#work', 'Work')


def fill_page(tpl, page_title, desc, url, h1, facts, body, pagernav, current, backhref, backlabel):
    out = tpl
    for key, val in (('{{PAGETITLE}}', esc(page_title)), ('{{DESC}}', desc), ('{{URL}}', url),
                     ('{{H1}}', esc(h1)), ('{{FACTS}}', facts), ('{{BODY}}', body), ('{{PAGERNAV}}', pagernav),
                     ('{{CURRENT}}', current), ('{{BACKHREF}}', backhref), ('{{BACKLABEL}}', esc(backlabel))):
        out = out.replace(key, val)
    return out


def render_card(s, index):
    v = s.get('home-layout') or 'v-' + VARIANTS[index % 5]
    pair = []
    for part in s['home'].split(' + '):
        bits = [x.strip() for x in part.split(' | ')]
        i = resolve(s, bits[0])
        if len(bits) > 1:
            alt = bits[1]
        else:
            alt = '%s, identity in use, %s.' % (plain(s['name']), 'landscape' if is_land(i) else 'portrait')
        pair.append((i, alt, is_land(i)))
    if len(pair) != 2 or pair[0][2] == pair[1][2]:
        raise Problem('%s.txt: "home:" needs one landscape and one portrait image, joined with " + ".' % s['slug'])
    order = 'lp' if pair[0][2] else 'pl'
    inner = ''
    for i, alt, land in pair:
        w, h = (2160, 1350) if land else (1080, 1350)
        inner += '<div class="ph %s"><img src="%s" width="%d" height="%d" loading="lazy" alt="%s"></div>' % (
            'l' if land else 'p', i['src'], w, h, esc(alt, True))
    return ('    <a class="work-item %s rv" href="/work/%s/">\n'
            '      <div class="pair %s">%s</div>\n'
            '      <div class="cap"><div class="eyebrow">%s</div><p class="line">%s</p></div>\n'
            '    </a>') % (v, s['slug'], order, inner, esc(s['name']), esc(s['card']))


# ---------------------------------------------------------------- simple text pages (e.g. privacy policies)
def parse_page(name):
    path = os.path.join(CONTENT, 'pages', name)
    text = read(path).replace('\r\n', '\n')
    parts = re.split(r'(?m)^---[ \t]*$', text, maxsplit=1)
    if len(parts) != 2:
        raise Problem('%s needs a line with just --- between the details and the page.' % name)
    d = {'facts': [], 'redirect': [], 'blocks': []}
    for line in parts[0].split('\n'):
        if not line.strip() or line.lstrip().startswith('//'):
            continue
        k, v = line.split(':', 1)
        k, v = k.strip().lower(), v.strip()
        if k == 'fact':
            a, c = v.split('|', 1)
            d['facts'].append((a.strip(), c.strip()))
        elif k == 'redirect-from':
            d['redirect'].append(v.strip('/'))
        elif k in ('path', 'title', 'name', 'description', 'back'):
            d[k] = v
        else:
            raise Problem('%s: unknown detail "%s".' % (name, k))
    for k in ('path', 'title', 'name', 'description', 'back'):
        if not d.get(k):
            raise Problem('%s: "%s:" is missing.' % (name, k))
    cur, para = None, []

    def flush():
        if para and cur is not None:
            cur['items'].append(('p', ' '.join(para)))
        del para[:]
    for raw in parts[1].split('\n'):
        line = raw.rstrip()
        if line.lstrip().startswith('//'):
            continue
        if not line.strip():
            flush()
        elif line.startswith('# '):
            flush()
            cur = {'heading': line[2:].strip(), 'items': []}
            d['blocks'].append(cur)
        elif line.startswith('- '):
            flush()
            if cur is None:
                raise Problem('%s: put a "# Heading" before the text.' % name)
            cur['items'].append(('li', line[2:].strip()))
        elif cur is None:
            raise Problem('%s: put a "# Heading" before the text.' % name)
        else:
            para.append(line.strip())
    flush()
    return d


def render_page(d, tpl):
    body = []
    for blk in d['blocks']:
        inner, items = '', blk['items']
        k = 0
        while k < len(items):
            if items[k][0] == 'li':
                lis = ''
                while k < len(items) and items[k][0] == 'li':
                    lis += '<li>%s</li>' % esc(items[k][1])
                    k += 1
                inner += '<ul>%s</ul>' % lis
            else:
                inner += '<p>%s</p>' % esc(items[k][1])
                k += 1
        body.append('<section class="txt rv"><h2>%s</h2><div>%s</div></section>' % (esc(blk['heading']), inner))
    facts = '\n'.join('        <div><dt>%s</dt><dd>%s</dd></div>' % (esc(a), esc(b)) for a, b in d['facts'])
    bits = [x.strip() for x in d['back'].split('|')]
    if len(bits) != 2:
        raise Problem('"back:" needs "link | label".')
    url = '/' + d['path'].strip('/') + '/'
    return fill_page(tpl, plain(d['name']) + ' \u00b7 Daniel Young', esc(plain(d['description']), True), url,
                     d['title'], facts, '\n'.join(body), '', '', bits[0], bits[1])


REDIRECT = '''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>{name} | Daniel Young</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={url}">
<link rel="canonical" href="https://danielyoung.work{url}">
</head>
<body>
<p>This page has moved to <a href="{url}">{name}</a>.</p>
</body>
</html>
'''


def read_order():
    out = []
    for line in read(os.path.join(CONTENT, 'order.txt')).split('\n'):
        line = line.strip()
        if line and not line.startswith('//'):
            out.append(line)
    return out


def read_keys(name, keys):
    d = {}
    for line in read(os.path.join(CONTENT, name)).split('\n'):
        if ':' in line and not line.strip().startswith('//'):
            k, v = line.split(':', 1)
            d[k.strip()] = v.strip()
    for k in keys:
        if not d.get(k):
            raise Problem('_content/%s: "%s:" is missing.' % (name, k))
    return d


def build():
    order = read_order()
    studies = [parse_study(x) for x in order]
    ring = [s for s in studies if not (s['prev'] or s['next'])]
    case_tpl = read(os.path.join(CONTENT, 'templates', 'case.html'))
    changed = []
    for s in studies:
        if s['prev'] or s['next']:
            if not (s['prev'] and s['next']):
                raise Problem('%s.txt: give both "prev:" and "next:" or neither.' % s['slug'])
            prev, nxt = s['prev'], s['next']
        else:
            k = ring.index(s)
            p, n = ring[k - 1], ring[(k + 1) % len(ring)]
            prev = ['/work/%s/' % p['slug'], 'Previous', plain(p['name'])]
            nxt = ['/work/%s/' % n['slug'], 'Next', plain(n['name'])]
        if write_if_changed(os.path.join(ROOT, 'work', s['slug'], 'index.html'), render_case(s, case_tpl, prev, nxt)):
            changed.append('work/%s/index.html' % s['slug'])
    home = read_keys('home.txt', ('hero',))
    tpl = read(os.path.join(CONTENT, 'templates', 'home.html'))
    cards = '\n'.join(render_card(s, k) for k, s in enumerate(studies))
    out = tpl.replace('{{HERO}}', esc(home['hero'])).replace('{{WORK}}', cards)
    if write_if_changed(os.path.join(ROOT, 'index.html'), out):
        changed.append('index.html')
    about = read_keys('about.txt', ('lede',))
    tpl = read(os.path.join(CONTENT, 'templates', 'about.html'))
    if write_if_changed(os.path.join(ROOT, 'about', 'index.html'), tpl.replace('{{LEDE}}', esc(about['lede']))):
        changed.append('about/index.html')
    pdir = os.path.join(CONTENT, 'pages')
    npages = 0
    if os.path.isdir(pdir):
        for f in sorted(os.listdir(pdir)):
            if not f.endswith('.txt'):
                continue
            d = parse_page(f)
            npages += 1
            url = '/' + d['path'].strip('/') + '/'
            if write_if_changed(os.path.join(ROOT, d['path'].strip('/'), 'index.html'), render_page(d, case_tpl)):
                changed.append(d['path'].strip('/') + '/index.html')
            for old in d['redirect']:
                if write_if_changed(os.path.join(ROOT, old, 'index.html'), REDIRECT.format(name=plain(d['name']), url=url)):
                    changed.append(old + '/index.html')
    # warn about leftovers
    listed = set(order)
    for f in sorted(os.listdir(os.path.join(CONTENT, 'studies'))):
        if f.endswith('.txt') and f[:-4] not in listed:
            print('Note: _content/studies/%s is not in order.txt, so it is not on the site.' % f)
    for d in sorted(os.listdir(os.path.join(ROOT, 'work'))):
        if os.path.isfile(os.path.join(ROOT, 'work', d, 'index.html')) and d not in listed:
            print('Note: work/%s/ still exists but is no longer in order.txt (the old page stays live until you delete that folder).' % d)
    print('Built %d case studies, %d text pages, the home page and the About page.' % (len(studies), npages))
    print('Changed: ' + (', '.join(changed) if changed else 'nothing (already up to date)'))


STARTER = '''name: {name}
title: One line about the project, shown big at the top of the page
description: One or two sentences for search results and link previews.
fact: Client | {name}
fact: Role | Brand Designer
fact: Through | DHD
fact: Services | Brand Strategy, Visual Identity
card: One sentence for the home page: who they are and what you did.
home: 04-landscape.jpg + 05-portrait.jpg

---

// Everything below the --- line is the page, top to bottom.
// Put the images in assets/img/case-studies/{slug}/ then list them here.

images full:
  01-logo.jpg | Describe the image for screen readers.

# Overview

Write the first paragraph here.

Write the second paragraph here.

# Challenge

What the client needed.

images pp:
  02-first-portrait.jpg | Describe the image.
  03-second-portrait.jpg | Describe the image.

# Solution

What you did.

images:
  04-landscape.jpg | Describe the image.
  05-portrait.jpg | Describe the image.

# Results

How it went.
'''


def new_study(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    if not slug:
        raise Problem('Give the case study a name, e.g. python3 _build.py new "Acme Ltd"')
    path = os.path.join(CONTENT, 'studies', slug + '.txt')
    if os.path.exists(path):
        raise Problem('%s already exists.' % os.path.relpath(path, ROOT))
    write_if_changed(path, STARTER.format(name=name, slug=slug))
    os.makedirs(os.path.join(ROOT, 'assets', 'img', 'case-studies', slug), exist_ok=True)
    op = os.path.join(CONTENT, 'order.txt')
    order = read_order()
    order.insert(0, slug)
    write_if_changed(op, '\n'.join(order) + '\n')
    print('Created _content/studies/%s.txt' % slug)
    print('Created assets/img/case-studies/%s/  (put the images here)' % slug)
    print('Added it to the top of _content/order.txt')
    print('Next: replace the placeholder text and image names in the .txt file, add the images, then run: python3 _build.py')


if __name__ == '__main__':
    try:
        if len(sys.argv) >= 2 and sys.argv[1] == 'new':
            new_study(' '.join(sys.argv[2:]).strip())
        elif len(sys.argv) == 1:
            build()
        else:
            print(__doc__)
    except Problem as e:
        print('\nProblem: %s\n' % e)
        sys.exit(1)
