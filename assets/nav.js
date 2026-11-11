/* Mobile menu: see nav.css. Builds a Menu button and a full-screen overlay from the header links. */
(function () {
  var root = document.documentElement;
  root.classList.add('nav-js');
  document.addEventListener('DOMContentLoaded', function () {
    var top = document.querySelector('.top');
    var nav = top && top.querySelector('nav');
    if (!nav) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-btn';
    btn.textContent = 'Menu';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'site-menu');
    top.appendChild(btn);

    var home = top.querySelector('a');
    var links = [].slice.call(nav.querySelectorAll('a')).map(function (a) {
      return '<li><a href="' + a.getAttribute('href') + '"' + (a.hasAttribute('aria-current') ? ' aria-current="page"' : '') + '>' + a.textContent + '</a></li>';
    }).join('');
    var more = [].slice.call(document.querySelectorAll('.foot a')).filter(function (a) {
      return a.textContent.trim() !== 'All work';
    }).map(function (a) {
      var ext = /^https?:/.test(a.getAttribute('href'));
      return '<a href="' + a.getAttribute('href') + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + a.textContent + '</a>';
    }).join('');

    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.id = 'site-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menu');
    menu.innerHTML =
      '<div class="menu-bar"><a href="' + home.getAttribute('href') + '">' + home.textContent + '</a>' +
      '<button type="button" class="menu-close">Close</button></div>' +
      '<ul class="menu-links">' + links + '</ul>' +
      '<div class="menu-more">' + more + '</div>';
    document.body.appendChild(menu);

    var close = menu.querySelector('.menu-close');
    var mq = window.matchMedia('(max-width:760px)');
    function open() {
      menu.setAttribute('data-open', '');
      root.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      close.focus();
    }
    function shut(refocus) {
      if (!menu.hasAttribute('data-open')) return;
      menu.removeAttribute('data-open');
      root.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    }
    btn.addEventListener('click', open);
    close.addEventListener('click', function () { shut(true); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) shut(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!menu.hasAttribute('data-open')) return;
      if (e.key === 'Escape') { shut(true); return; }
      if (e.key === 'Tab') { // keep focus inside the menu
        var f = [].slice.call(menu.querySelectorAll('a,button'));
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { if (!mq.matches) shut(false); });
  });
})();
