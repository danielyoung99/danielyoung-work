/* danielyoung.work: motion and interaction for Home, About, Work, Journal and Contact.
   Needs GSAP, ScrollTrigger and (optionally) Lenis, loaded before it with defer.
   Everything is switched on by a data attribute or a class in the markup:
     [data-rise]      heading whose words rise out of a mask
     [data-fade]      block that fades up on scroll
     #field           canvas: a dot grid that bends away from the pointer
     [data-marquee]   looping line that speeds up with scroll
     [data-cmp]       draft versus crafted slider
     [data-odo]       number that rolls up like an odometer
     [data-steps]     process list with a machine / me filter
     [data-rail]      drag-to-scroll row
     [data-peek]      row that shows a preview image beside the pointer
     [data-magnetic]  button that leans toward the pointer
     [data-cv]        CV filter chips
     [data-pick]      contact form that builds an email
   With reduced motion or no GSAP, pages show in their final state. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var EASE = 'expo.out';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var canAnimate = !!gsap && !reduce;

  if (ST && gsap) gsap.registerPlugin(ST);
  if (canAnimate) document.documentElement.classList.add('anim');

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (canAnimate && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTop() { if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /* ---------- scroll progress ---------- */
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function progress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  /* ---------- cursor ---------- */
  var cursor = null, setCursor = function () {};
  if (canAnimate && fine) {
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span></span>';
    document.body.appendChild(cursor);
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    var label = cursor.firstChild;
    window.addEventListener('pointermove', function (e) { cursor.classList.add('is-on'); cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-on'); });
    setCursor = function (size, text) {
      label.textContent = text || '';
      cursor.classList.toggle('is-big', !!text);
      gsap.to(cursor, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, duration: 0.5, ease: EASE });
    };
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-cursor], a, button, input, textarea, label');
      if (!t) { setCursor(14); return; }
      var txt = t.getAttribute && t.getAttribute('data-cursor');
      setCursor(txt ? 84 : 36, txt || '');
    });
  }

  /* ---------- words rise out of a mask (keeps <em> and other inline tags) ---------- */
  function splitNode(node, out) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          var i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.appendChild(i); frag.appendChild(w); out.push(i);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1) splitNode(c, out);
    });
  }
  if (canAnimate) {
    $$('[data-rise]').forEach(function (el, n) {
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      var words = [];
      splitNode(el, words);
      var opts = { yPercent: 115, duration: 1.2, ease: EASE, stagger: 0.045 };
      var inHero = el.closest('.hero') || n === 0;
      if (inHero || !ST) { opts.delay = 0.15; gsap.from(words, opts); }
      else { opts.scrollTrigger = { trigger: el, start: 'top 88%' }; gsap.from(words, opts); }
    });
    $$('[data-fade]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-fade')) || 0;
      var inHero = el.closest('.hero');
      var cfg = { opacity: 1, y: 0, duration: 1.1, ease: EASE, delay: inHero ? 0.5 + d : d };
      if (!inHero && ST) cfg.scrollTrigger = { trigger: el, start: 'top 90%' };
      gsap.to(el, cfg);
    });
  }

  /* ---------- hero field: dots bend away from the pointer ---------- */
  var field = $('#field');
  if (field && field.getContext) {
    var ctx = field.getContext('2d');
    var dots = [], W = 0, H = 0, dpr = 1, mx = -999, my = -999, tx = -999, ty = -999, running = true, colDot = '#000', colHot = '#ff4b1f';
    var GAP = 30;
    var readColours = function () {
      var cs = getComputedStyle(document.documentElement);
      colDot = cs.getPropertyValue('--text').trim() || '#000';
      colHot = cs.getPropertyValue('--accent').trim() || '#ff4b1f';
    };
    var size = function () {
      var r = field.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      field.width = W * dpr; field.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var y = GAP / 2; y < H; y += GAP) for (var x = GAP / 2; x < W; x += GAP) dots.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0 });
      draw(0);
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      mx += (tx - mx) * 0.15; my += (ty - my) * 0.15;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var wave = Math.sin(d.ox * 0.012 + t * 0.0008) * Math.cos(d.oy * 0.014 + t * 0.0006);
        var dx = d.x - mx, dy = d.y - my, dist = Math.sqrt(dx * dx + dy * dy), R = 170;
        if (dist < R && dist > 0.1) { var f = (1 - dist / R); d.vx += dx / dist * f * 3.2; d.vy += dy / dist * f * 3.2; }
        d.vx += (d.ox - d.x) * 0.06; d.vy += (d.oy - d.y) * 0.06;
        d.vx *= 0.84; d.vy *= 0.84; d.x += d.vx; d.y += d.vy;
        var hot = dist < R ? 1 - dist / R : 0;
        var r = 1.1 + wave * 0.5 + hot * 2.4;
        ctx.globalAlpha = 0.18 + hot * 0.8 + (wave + 1) * 0.06;
        ctx.fillStyle = hot > 0.12 ? colHot : colDot;
        ctx.beginPath(); ctx.arc(d.x, d.y, Math.max(.5, r), 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    var loop = function (t) { if (running) draw(t); requestAnimationFrame(loop); };
    readColours(); size();
    window.addEventListener('resize', size);
    new MutationObserver(readColours).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColours);
    if (!reduce) {
      field.parentNode.addEventListener('pointermove', function (e) { var r = field.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
      field.parentNode.addEventListener('pointerleave', function () { tx = ty = -999; });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(field);
      requestAnimationFrame(loop);
    }
  }

  /* ---------- marquee: loops, and leans into the scroll ---------- */
  $$('[data-marquee]').forEach(function (m) {
    var track = $('.marquee__track', m);
    if (!track || !canAnimate) return;
    var item = track.firstElementChild;
    track.appendChild(item.cloneNode(true)); track.appendChild(item.cloneNode(true));
    var x = 0, boost = 0, last = window.scrollY;
    gsap.ticker.add(function () {
      var w = item.offsetWidth; if (!w) return;
      var dy = window.scrollY - last; last = window.scrollY;
      boost += (Math.min(40, Math.abs(dy)) - boost) * 0.1;
      x -= 0.7 + boost * 0.6;
      if (x <= -w) x += w;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    });
  });

  /* ---------- draft versus crafted ---------- */
  $$('[data-cmp]').forEach(function (box) {
    var input = $('input', box), pos = 50;
    var set = function (v) { pos = Math.max(2, Math.min(98, v)); box.style.setProperty('--pos', pos + '%'); input.value = pos; };
    set(50);
    input.addEventListener('input', function () { set(parseFloat(input.value)); });
    if (canAnimate && ST) {
      var o = { v: 98 };
      set(98);
      ST.create({ trigger: box, start: 'top 75%', once: true, onEnter: function () {
        gsap.to(o, { v: 50, duration: 1.8, ease: 'power3.inOut', onUpdate: function () { set(o.v); } });
      } });
    }
  });

  /* ---------- odometer ---------- */
  $$('[data-odo]').forEach(function (el) {
    var value = String(el.getAttribute('data-odo')), cols = [];
    el.setAttribute('aria-label', value);
    el.innerHTML = '';
    value.split('').forEach(function (ch) {
      var col = document.createElement('span'); col.className = 'odo__col'; col.setAttribute('aria-hidden', 'true');
      var digits = '';
      for (var r = 0; r < 2; r++) for (var n = 0; n < 10; n++) digits += '<span>' + n + '</span>';
      col.innerHTML = digits;
      el.appendChild(col); cols.push({ col: col, d: parseInt(ch, 10) });
    });
    var final = function (c) { return -(c.d + 10) * 100 / 20; };
    if (canAnimate && ST) {
      cols.forEach(function (c) { gsap.set(c.col, { yPercent: 0 }); });
      ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
        cols.forEach(function (c, i) { gsap.to(c.col, { yPercent: final(c), duration: 2.2 + i * 0.4, ease: 'expo.out', delay: i * 0.1 }); });
      } });
    } else {
      cols.forEach(function (c) { c.col.style.transform = 'translateY(' + final(c) + '%)'; });
    }
  });

  /* ---------- process list ---------- */
  $$('[data-steps]').forEach(function (list) {
    var mode = list.getAttribute('data-for');
    var group = mode ? document.getElementById(mode) : null;
    if (group) $$('button', group).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', group).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        list.setAttribute('data-show', b.getAttribute('data-mode'));
      });
    });
    if (canAnimate && ST) $$('.step', list).forEach(function (s) {
      s.style.setProperty('--p', 0);
      ST.create({ trigger: s, start: 'top 80%', once: true, onEnter: function () {
        gsap.to(s, { '--p': 1, duration: 1.4, ease: EASE });
      } });
    });
    else $$('.step', list).forEach(function (s) { s.style.setProperty('--p', 1); });
  });

  /* ---------- drag rail (mouse drag with a little throw; touch uses native scroll) ---------- */
  $$('[data-rail]').forEach(function (rail) {
    if (!fine) return;
    var down = false, startX = 0, startLeft = 0, lastX = 0, vel = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      down = true; moved = 0; startX = lastX = e.clientX; startLeft = rail.scrollLeft; vel = 0;
      rail.style.scrollSnapType = 'none';
      if (window.gsap) gsap.killTweensOf(rail);
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) rail.classList.add('is-drag');
      vel = e.clientX - lastX; lastX = e.clientX;
      rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      rail.classList.remove('is-drag');
      if (moved > 5 && gsap) gsap.to(rail, { scrollLeft: rail.scrollLeft - vel * 14, duration: 1, ease: 'power3.out', onComplete: function () { rail.style.scrollSnapType = ''; } });
      else rail.style.scrollSnapType = '';
    });
    rail.addEventListener('click', function (e) { if (moved > 5) e.preventDefault(); }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---------- hover preview that follows the pointer ---------- */
  var peekRows = $$('[data-peek]');
  if (peekRows.length && fine && canAnimate) {
    var peek = document.createElement('div'); peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
    document.body.appendChild(peek);
    var px = gsap.quickTo(peek, 'x', { duration: 0.6, ease: 'power3.out' });
    var py = gsap.quickTo(peek, 'y', { duration: 0.6, ease: 'power3.out' });
    var rot = gsap.quickTo(peek, 'rotation', { duration: 0.6, ease: 'power3.out' });
    var lx = 0;
    window.addEventListener('pointermove', function (e) { px(e.clientX + 24); py(e.clientY - 150); rot(Math.max(-8, Math.min(8, (e.clientX - lx) * 0.4))); lx = e.clientX; }, { passive: true });
    peekRows.forEach(function (r) {
      r.addEventListener('pointerenter', function () {
        var src = r.getAttribute('data-peek');
        peek.innerHTML = src.charAt(0) === '.' ? '<div class="' + src.slice(1) + '"></div>' : '<img src="' + src + '" alt="">';
        peek.classList.add('is-on');
      });
      r.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (canAnimate && fine) $$('[data-magnetic]').forEach(function (b) {
    var mxq = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3.out' });
    var myq = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3.out' });
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      mxq((e.clientX - r.left - r.width / 2) * 0.3); myq((e.clientY - r.top - r.height / 2) * 0.45);
    });
    b.addEventListener('pointerleave', function () { mxq(0); myq(0); });
  });

  /* ---------- cv filter ---------- */
  $$('[data-cv]').forEach(function (wrap) {
    var chips = $$('.chip', wrap), items = $$('.cv__item');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-f');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        var show = [];
        items.forEach(function (it) {
          var on = f === 'all' || it.getAttribute('data-k') === f;
          it.classList.toggle('is-off', !on);
          if (on) show.push(it);
        });
        if (canAnimate) gsap.fromTo(show, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.05 });
        if (ST) ST.refresh();
      });
    });
  });

  /* ---------- contact: build an email from the choices ---------- */
  $$('[data-pick]').forEach(function (form) {
    var name = $('[name=name]', form), msg = $('[name=message]', form), go = $('[data-go]', form);
    var chips = $$('.chip', form);
    var EMAIL = 'info@danielyoung.work';
    chips.forEach(function (c) { c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); build(); }); });
    [name, msg].forEach(function (f) { f.addEventListener('input', build); });
    function build() {
      var needs = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).map(function (c) { return c.textContent; });
      var subject = needs.length ? 'Project enquiry: ' + needs.join(', ') : 'Project enquiry';
      var body = (msg.value ? msg.value + '\n\n' : '') + (name.value ? name.value : '');
      go.setAttribute('href', 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
    }
    build();
  });
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy'), done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
    });
  });

  /* ---------- footer ---------- */
  var foot = document.createElement('footer');
  foot.className = 'foot';
  foot.innerHTML = '<div class="foot__in"><span>&copy; ' + new Date().getFullYear() + ' Daniel Young. Made with AI, checked by a person.</span>' +
    '<span><a class="link" href="mailto:info@danielyoung.work">info@danielyoung.work</a> &nbsp;/&nbsp; <a class="link" href="https://www.linkedin.com/in/daniel-young/" target="_blank" rel="noopener">LinkedIn</a> &nbsp;/&nbsp; <a class="link" href="https://www.instagram.com/danielyoung.work/" target="_blank" rel="noopener">Instagram</a></span>' +
    '<button class="foot__top" type="button">Back to top &uarr;</button></div>';
  document.body.appendChild(foot);
  $('.foot__top', foot).addEventListener('click', scrollToTop);

  if (ST) window.addEventListener('load', function () { ST.refresh(); });
})();
