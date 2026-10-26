/* Column wipe page transition.
   Clicking an internal link covers the page with columns that grow down in a stagger,
   then the next page loads under them and the columns shrink away. No libraries.
   Load it with a plain <script src="/wipe.js"></script> in the head of every page. */
(function () {
  var COLOR = '#111';
  var EASE = 'cubic-bezier(.76, 0, .24, 1)';
  var DURATION = 600;
  var STAGGER = 55;
  var KEY = 'wipe';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var arriving = false;
  try {
    var stamp = Number(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    arriving = !reduce && stamp && Date.now() - stamp < 8000;
  } catch (e) {}

  var style = document.createElement('style');
  style.textContent =
    'html.wipe-in{background:' + COLOR + '}' +
    'html.wipe-in body{visibility:hidden}' +
    '.wipe{position:fixed;inset:0;z-index:9999;display:flex;visibility:visible;pointer-events:none}' +
    '.wipe.is-on{pointer-events:all}' +
    '.wipe i{flex:1 0 0;background:' + COLOR + ';box-shadow:0 0 0 1px ' + COLOR + ';transform:scaleY(0);will-change:transform}';
  document.head.appendChild(style);
  if (arriving) root.classList.add('wipe-in');

  var el = null;
  var cols = [];
  var busy = false;

  function build() {
    if (el) return;
    var n = window.innerWidth > 720 ? 6 : 4;
    el = document.createElement('div');
    el.className = 'wipe';
    el.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < n; i++) {
      var c = document.createElement('i');
      el.appendChild(c);
      cols.push(c);
    }
    document.body.insertBefore(el, document.body.firstChild);
  }

  // Animate every column from one scale to another; calls done when the last one lands.
  function play(from, to, origin, done) {
    cols.forEach(function (c, i) {
      c.style.transformOrigin = origin;
      c.animate(
        [{ transform: 'scaleY(' + from + ')' }, { transform: 'scaleY(' + to + ')' }],
        { duration: DURATION, delay: i * STAGGER, easing: EASE, fill: 'both' }
      );
    });
    // A timer, not onfinish, so a background tab still moves on.
    if (done) setTimeout(done, DURATION + (cols.length - 1) * STAGGER);
  }

  function cover(done) {
    build();
    el.classList.add('is-on');
    play(0, 1, 'top', done);
  }

  function reveal() {
    build();
    play(1, 0, 'bottom', function () { el.classList.remove('is-on'); busy = false; });
  }

  function go(url) {
    if (reduce || busy) { if (!busy) location.href = url; return; }
    try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) { location.href = url; return; }
    busy = true;
    cover(function () { location.href = url; });
  }

  // For in-page route changes: cover, run the change under the columns, then reveal.
  window.Wipe = {
    run: function (fn) {
      if (reduce || busy) { fn(); return; }
      busy = true;
      cover(function () { fn(); window.scrollTo(0, 0); setTimeout(reveal, 30); });
    }
  };

  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    e.preventDefault();
    go(u.href);
  });

  // Back and forward can restore a page from cache with the columns still down.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && el) { busy = true; reveal(); }
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (!arriving) return;
    build();
    cols.forEach(function (c) { c.style.transformOrigin = 'top'; c.style.transform = 'scaleY(1)'; });
    el.classList.add('is-on');
    root.classList.remove('wipe-in');
    busy = true;
    var ready = (document.fonts && document.fonts.ready) || Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 500); })]).then(function () {
      setTimeout(reveal, 30);
    });
  });
})();
