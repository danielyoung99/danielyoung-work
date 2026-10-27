/* Site navigation: a floating bar at the bottom that opens upward into the page list,
   with a progressive blur fading in behind it. Loaded on every page with
   <script src="/nav.js" defer></script>. Edit PAGES, SOCIALS and EMAIL to change the menu. */
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

  var css =
    '.nav-blur{position:fixed;left:0;right:0;bottom:0;height:150px;z-index:90;pointer-events:none}' +
    '.nav-blur i{position:absolute;inset:0}' +
    '.nav-blur i:nth-child(1){backdrop-filter:blur(.5px);-webkit-backdrop-filter:blur(.5px);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 12.5%,#000 25%,transparent 37.5%);mask-image:linear-gradient(to bottom,transparent 0%,#000 12.5%,#000 25%,transparent 37.5%)}' +
    '.nav-blur i:nth-child(2){backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px);-webkit-mask-image:linear-gradient(to bottom,transparent 12.5%,#000 25%,#000 37.5%,transparent 50%);mask-image:linear-gradient(to bottom,transparent 12.5%,#000 25%,#000 37.5%,transparent 50%)}' +
    '.nav-blur i:nth-child(3){backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);-webkit-mask-image:linear-gradient(to bottom,transparent 25%,#000 37.5%,#000 50%,transparent 62.5%);mask-image:linear-gradient(to bottom,transparent 25%,#000 37.5%,#000 50%,transparent 62.5%)}' +
    '.nav-blur i:nth-child(4){backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);-webkit-mask-image:linear-gradient(to bottom,transparent 37.5%,#000 50%,#000 62.5%,transparent 75%);mask-image:linear-gradient(to bottom,transparent 37.5%,#000 50%,#000 62.5%,transparent 75%)}' +
    '.nav-blur i:nth-child(5){backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);-webkit-mask-image:linear-gradient(to bottom,transparent 50%,#000 62.5%,#000 75%,transparent 87.5%);mask-image:linear-gradient(to bottom,transparent 50%,#000 62.5%,#000 75%,transparent 87.5%)}' +
    '.nav-blur i:nth-child(6){backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);-webkit-mask-image:linear-gradient(to bottom,transparent 62.5%,#000 75%,#000 100%);mask-image:linear-gradient(to bottom,transparent 62.5%,#000 75%,#000 100%)}' +

    '.nav{position:fixed;left:50%;bottom:16px;z-index:100;width:min(340px,calc(100vw - 32px));transform:translateX(-50%);font:400 15px/24px "Instrument Sans",-apple-system,system-ui,"Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.005em;color:#000;-webkit-font-smoothing:antialiased}' +
    '.nav a{color:inherit;text-decoration:none}' +
    '.nav__panel{background:#fcfcfc;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.05),0 10px 32px rgba(0,0,0,.09)}' +
    '.nav__menu{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .55s cubic-bezier(.32,.72,0,1),visibility 0s linear .55s}' +
    '.nav.is-open .nav__menu{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .55s cubic-bezier(.32,.72,0,1),visibility 0s}' +
    '.nav__inner{min-height:0;overflow:hidden}' +
    '.nav__pages{list-style:none;margin:0;padding:20px 16px 0;display:flex;flex-direction:column}' +
    '.nav__pages a{display:inline-block;font-size:24px;line-height:34px;letter-spacing:-.01em;transition:opacity .2s}' +
    '.nav__pages a:hover{opacity:.45}' +
    '.nav__pages a[aria-current="page"]::after{content:"";display:inline-block;width:6px;height:6px;margin-left:10px;border-radius:50%;background:currentColor;vertical-align:middle}' +
    '.nav__cols{display:flex;gap:40px;margin:16px 16px 0;padding:16px 0 16px;border-top:1px solid rgba(0,0,0,.1)}' +
    '.nav__label{margin:0 0 4px;font-size:11px;line-height:16px;letter-spacing:.08em;text-transform:uppercase;color:rgba(0,0,0,.45)}' +
    '.nav__cols a{display:block;font-size:14px;line-height:22px;transition:opacity .2s}' +
    '.nav__cols a:hover{opacity:.45}' +
    '.nav__pages li,.nav__cols>div{opacity:0;transform:translateY(8px);transition:opacity .3s,transform .4s cubic-bezier(.32,.72,0,1)}' +
    '.nav.is-open .nav__pages li,.nav.is-open .nav__cols>div{opacity:1;transform:none;transition-duration:.5s,.6s}' +
    '.nav.is-open li:nth-child(1){transition-delay:.08s}.nav.is-open li:nth-child(2){transition-delay:.12s}.nav.is-open li:nth-child(3){transition-delay:.16s}.nav.is-open li:nth-child(4){transition-delay:.2s}' +
    '.nav.is-open .nav__cols>div:nth-child(1){transition-delay:.26s}.nav.is-open .nav__cols>div:nth-child(2){transition-delay:.3s}' +
    '.nav__bar{display:flex;align-items:center;justify-content:space-between;height:56px;padding:8px 8px 8px 16px}' +
    '.nav__btn{position:relative;width:40px;height:40px;padding:0;border:0;border-radius:9px;background:#111;cursor:pointer}' +
    '.nav__btn i{position:absolute;left:12px;right:12px;height:1.5px;border-radius:1px;background:#fff;transition:transform .45s cubic-bezier(.32,.72,0,1)}' +
    '.nav__btn i:nth-child(1){top:15.5px}.nav__btn i:nth-child(2){top:23px}' +
    '.nav.is-open .nav__btn i:nth-child(1){transform:translateY(3.75px) rotate(45deg)}' +
    '.nav.is-open .nav__btn i:nth-child(2){transform:translateY(-3.75px) rotate(-45deg)}' +
    '.nav a:focus-visible,.nav__btn:focus-visible{outline:2px solid #111;outline-offset:2px}' +
    'body{padding-bottom:88px}' +
    '@media (prefers-reduced-motion:reduce){.nav__menu,.nav__pages li,.nav__cols>div,.nav__btn i{transition:none!important}}';

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
    var pages = el('ul', { 'class': 'nav__pages' }, PAGES.map(function (p) {
      var current = (p.href.replace(/\/$/, '') || '/') === here ||
        (p.href === '/work/' && here.indexOf('/projects') === 0);
      var a = el('a', { href: p.href, text: p.name });
      if (current) a.setAttribute('aria-current', 'page');
      return el('li', {}, [a]);
    }));

    var socials = el('div', {}, [el('p', { 'class': 'nav__label', text: 'Socials' })].concat(SOCIALS.map(function (s) {
      return el('a', { href: s.href, target: '_blank', rel: 'noopener', text: s.name });
    })));
    var contact = el('div', {}, [
      el('p', { 'class': 'nav__label', text: 'Contact' }),
      el('a', { href: 'mailto:' + EMAIL, text: EMAIL })
    ]);

    var menu = el('div', { 'class': 'nav__menu', id: 'nav-menu' }, [
      el('div', { 'class': 'nav__inner' }, [pages, el('div', { 'class': 'nav__cols' }, [socials, contact])])
    ]);
    var btn = el('button', { 'class': 'nav__btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-menu', 'aria-label': 'Menu' },
      [el('i'), el('i')]);
    var bar = el('div', { 'class': 'nav__bar' }, [el('a', { href: '/', text: 'Daniel Young' }), btn]);
    var nav = el('nav', { 'class': 'nav', 'aria-label': 'Main' }, [el('div', { 'class': 'nav__panel' }, [menu, bar])]);

    var blur = el('div', { 'class': 'nav-blur', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i'), el('i'), el('i'), el('i')]);
    document.body.appendChild(blur);
    document.body.appendChild(nav);

    function set(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) set(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
