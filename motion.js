/* Motion for danielyoung.work, built on GSAP 3 and ScrollTrigger.
   Load after both GSAP scripts, with defer. Without GSAP, or with reduced motion,
   the page shows in its final state. Hooks used in the markup:
     [data-split]   heading whose words rise into place
     [data-reveal]  element that wipes in when it scrolls into view (cards and tiles
                    in the hero wipe in on load)
     [data-rule]    hairline that draws across on scroll */
(function () {
  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var EASE = 'expo.out';
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (ST) gsap.registerPlugin(ST);

  // Hidden states only apply once this runs, so a failed CDN load leaves the page visible.
  document.documentElement.classList.add('anim');

  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(function (w) {
      return '<span class="w" aria-hidden="true"><span class="wi">' + w + '</span></span>';
    }).join(' ');
    return el.querySelectorAll('.wi');
  }

  // Heading: words rise up out of a mask.
  var titles = document.querySelectorAll('[data-split]');
  [].forEach.call(titles, function (el) {
    gsap.from(splitWords(el), { yPercent: 115, duration: 1.2, ease: EASE, stagger: 0.045, delay: 0.1 });
  });

  // Hero collage: cards wipe up in a scattered order.
  var heroCards = document.querySelectorAll('.collage [data-reveal]');
  if (heroCards.length) {
    gsap.fromTo(heroCards,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE, delay: 0.35, stagger: { each: 0.07, from: 'random' } });
  }

  if (ST) {
    // Hairlines draw across as they reach the viewport.
    [].forEach.call(document.querySelectorAll('[data-rule]'), function (el) {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1.4, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    // Tiles and framed screens wipe in on scroll, a row at a time.
    [].forEach.call(document.querySelectorAll('.row'), function (row) {
      var items = row.querySelectorAll('[data-reveal]');
      if (!items.length) return;
      gsap.fromTo(items,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: EASE, stagger: 0.09,
          scrollTrigger: { trigger: row, start: 'top 88%' } });
    });

    [].forEach.call(document.querySelectorAll('.frame'), function (frame) {
      gsap.fromTo(frame,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE,
          scrollTrigger: { trigger: frame, start: 'top 88%' } });
    });

    // Gentle parallax inside framed screens. The image is scaled up so the edges never show.
    [].forEach.call(document.querySelectorAll('.frame img'), function (img) {
      gsap.fromTo(img, { yPercent: -4, scale: 1.1 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, scrub: true, start: 'top bottom', end: 'bottom top' }
      });
    });

    window.addEventListener('load', function () { ST.refresh(); });
  }

  // Tile hover: the picture eases in a little. Fine pointers only.
  if (canHover) {
    [].forEach.call(document.querySelectorAll('.tile'), function (box) {
      var img = box.querySelector('img');
      if (!img) return;
      var zoom = gsap.quickTo(img, 'scale', { duration: 0.7, ease: EASE });
      box.addEventListener('pointerenter', function () { zoom(1.05); });
      box.addEventListener('pointerleave', function () { zoom(1); });
    });
  }
})();
