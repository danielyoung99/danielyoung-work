/* Site navigation: a top bar with the name, a light and dark toggle and a menu button.
   The menu opens as a full-screen sheet. A progressive blur sits along the top edge.
   Loaded on every page with <script src="/nav.js" defer></script>.
   Edit PAGES, SOCIALS and EMAIL to change the menu. */
(function () {
  var PAGES = [
    { name: 'Home', href: '/' },
    { name: 'Work', href: '/work/' },
    { name: 'About', href: '/about/' },
    { name: 'Journal', href: '/journal/' }
  ];
  var SOCIALS = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/daniel-young/' },
    { name: 'Instagram', href: 'https://www.instagram.com/danielyoung.work/' }
  ];
  var EMAIL = 'info@danielyoung.work';
  var EASE = 'cubic-bezier(.19,1,.22,1)';

  // Blur layers, strongest at the top edge and fading out by 100px down.
  var BLUR = [
    { blur: 16, stop: 20 }, { blur: 8, stop: 36 }, { blur: 4, stop: 52 },
    { blur: 2, stop: 68 }, { blur: 1, stop: 84 }, { blur: .5, stop: 100 }
  ];
  var blurCss = BLUR.map(function (l, i) {
    var mask = 'linear-gradient(to bottom,#000 0%,#000 ' + Math.max(0, l.stop - 16) + '%,transparent ' + l.stop + '%)';
    return '.top-blur i:nth-child(' + (i + 1) + '){backdrop-filter:blur(' + l.blur + 'px);-webkit-backdrop-filter:blur(' + l.blur + 'px);' +
      '-webkit-mask-image:' + mask + ';mask-image:' + mask + '}';
  }).join('');

  var css =
    '.top-blur{position:fixed;left:0;right:0;top:0;height:120px;z-index:90;pointer-events:none}' +
    '.top-blur i{position:absolute;inset:0}' + blurCss +

    '.top{position:fixed;left:0;right:0;top:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;' +
    'font:500 17px/1 var(--sans);letter-spacing:-.01em;color:var(--text)}' +
    '.top a{color:inherit;text-decoration:none}' +
    '.top__tools{display:flex;align-items:center;gap:8px}' +
    '.top__btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:9px;background:transparent;color:var(--text);cursor:pointer}' +
    '.top__btn:hover{background:var(--card)}' +
    '.top__btn svg{width:18px;height:18px}' +
    '.top__bars{position:relative;display:block;width:20px;height:12px}' +
    '.top__bars i{position:absolute;left:0;right:0;height:1.5px;border-radius:1px;background:currentColor;transition:transform .5s ' + EASE + '}' +
    '.top__bars i:nth-child(1){top:0}.top__bars i:nth-child(2){top:10.5px}' +
    '.is-menu-open .top__bars i:nth-child(1){transform:translateY(5.25px) rotate(45deg)}' +
    '.is-menu-open .top__bars i:nth-child(2){transform:translateY(-5.25px) rotate(-45deg)}' +

    '.menu{position:fixed;inset:0;z-index:95;display:flex;flex-direction:column;justify-content:space-between;padding:112px 16px 32px;' +
    'background:var(--bg);color:var(--text);clip-path:inset(0 0 100% 0);visibility:hidden;' +
    'transition:clip-path .8s ' + EASE + ',visibility 0s linear .8s}' +
    '.menu.is-open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .8s ' + EASE + ',visibility 0s}' +
    '.menu__pages{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}' +
    '.menu__pages a{display:inline-block;font:400 clamp(44px,9vw,104px)/1.02 var(--serif);letter-spacing:-.02em;color:var(--text);' +
    'transform:translateY(40px);opacity:0;transition:transform .8s ' + EASE + ',opacity .6s,color .25s}' +
    '.menu__pages a:hover{color:var(--muted)}' +
    '.menu__pages a[aria-current="page"]::after{content:"";display:inline-block;width:8px;height:8px;margin-left:12px;border-radius:50%;background:currentColor;vertical-align:middle}' +
    '.menu.is-open .menu__pages a{transform:none;opacity:1}' +
    '.menu.is-open .menu__pages li:nth-child(1) a{transition-delay:.14s}' +
    '.menu.is-open .menu__pages li:nth-child(2) a{transition-delay:.2s}' +
    '.menu.is-open .menu__pages li:nth-child(3) a{transition-delay:.26s}' +
    '.menu.is-open .menu__pages li:nth-child(4) a{transition-delay:.32s}' +
    '.menu__cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:24px;border-top:1px solid var(--line)}' +
    '.menu__label{margin:0 0 8px;font:400 12px/16px var(--mono);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}' +
    '.menu__cols a{display:block;font-size:16px;line-height:24px;color:var(--text)}' +
    '.menu__cols a:hover{color:var(--muted)}' +
    '.menu__cols p{margin:0}' +
    '.top a:focus-visible,.top button:focus-visible,.menu a:focus-visible{outline:2px solid var(--text);outline-offset:3px}' +
    '@media (prefers-reduced-motion:reduce){.menu,.menu__pages a,.top__bars i{transition:none!important}}' +
    '@media (max-width:720px){.menu__cols{grid-template-columns:1fr}}';

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var here = location.pathname.replace(/\/$/, '') || '/';
    var pageItems = PAGES.map(function (p) {
      var target = p.href.replace(/\/$/, '') || '/';
      var current = target === here || (p.href === '/work/' && here.indexOf('/projects') === 0);
      var a = el('a', { href: p.href, text: p.name });
      if (current) a.setAttribute('aria-current', 'page');
      return el('li', {}, [a]);
    });

    // Top bar
    var themeBtn = el('button', { 'class': 'top__btn', type: 'button' });
    themeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
    var menuBtn = el('button', { 'class': 'top__btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-menu', 'aria-label': 'Open menu' },
      [el('span', { 'class': 'top__bars' }, [el('i'), el('i')])]);
    var top = el('header', { 'class': 'top' }, [
      el('a', { href: '/', text: 'Daniel Young' }),
      el('div', { 'class': 'top__tools' }, [themeBtn, menuBtn])
    ]);

    // Menu sheet
    var menu = el('div', { 'class': 'menu', id: 'site-menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' }, [
      el('ul', { 'class': 'menu__pages' }, pageItems),
      el('div', { 'class': 'menu__cols' }, [
        el('div', {}, [
          el('p', { 'class': 'menu__label', text: 'Socials' })
        ].concat(SOCIALS.map(function (s) {
          return el('a', { href: s.href, target: '_blank', rel: 'noopener', text: s.name });
        }))),
        el('div', {}, [
          el('p', { 'class': 'menu__label', text: 'Contact' }),
          el('a', { href: 'mailto:' + EMAIL, text: EMAIL })
        ])
      ])
    ]);

    var blur = el('div', { 'class': 'top-blur', 'aria-hidden': 'true' }, BLUR.map(function () { return el('i'); }));

    document.body.appendChild(blur);
    document.body.appendChild(top);
    document.body.appendChild(menu);

    function isDark() {
      var set = document.documentElement.dataset.theme;
      return set ? set === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function labelTheme() { themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode'); }
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      labelTheme();
    });
    labelTheme();

    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('is-menu-open', open);
      top.classList.toggle('is-menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }
    menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
