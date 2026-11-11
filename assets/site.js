/* Kal Crush site: email buttons, page transitions and scroll-reveal animations. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Email buttons: the address is assembled here, so it isn't written in the page.
  document.querySelectorAll('.js-mail').forEach(function (a) {
    var e = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.setAttribute('href', 'mailto:' + e + '?subject=' + encodeURIComponent('Kal Crush'));
    a.setAttribute('title', 'Send us an email');
  });

  // phone menu
  var mb = document.querySelector('.menu-btn'), header = document.querySelector('.site-header');
  if (mb && header) {
    mb.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('menu-open'); mb.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') header.classList.remove('menu-open'); });
  }

  if (reduce) { root.classList.add('ready'); return; }

  // ---- page enter
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ready'); }); });

  // ---- page leave: fade out, then go
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.classList.contains('js-mail')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    if (url.pathname === location.pathname && url.hash) return;          // same-page anchor: smooth scroll
    ev.preventDefault();
    root.classList.add('leaving');
    setTimeout(function () { location.href = url.href; }, 320);
  });
  // coming back with the browser's Back button
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { root.classList.remove('leaving'); root.classList.add('ready'); }
  });


  // ---- liquid-glass specular highlight follows the pointer
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.card,.game-card,.glass');
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // ---- 3D tilt: [data-tilt] follows the pointer; data-tilt-area names a bigger element to listen on
  if (window.matchMedia('(hover: hover)').matches) document.querySelectorAll('[data-tilt]').forEach(function (el) {
    var max = parseFloat(el.getAttribute('data-tilt')) || 8;
    var area = el.getAttribute('data-tilt-area') ? el.closest(el.getAttribute('data-tilt-area')) : el;
    if (!area) area = el;
    var raf = 0;
    area.addEventListener('pointermove', function (e) {
      var r = area.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.classList.add('tilting');
        el.style.transform = 'perspective(1100px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg)';
      });
    });
    area.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf); el.classList.remove('tilting'); el.style.transform = '';
    });
  });

  // ---- scroll reveal
  var groups = [
    '.section-head', '.grid', '.two-col > *', '.shots', '.cta-band', '.stores',
    '.doc > h2', '.doc > p', '.doc > ul', '.doc > .note', '.doc > .contact-card', '.doc > details'
  ];
  var items = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.game-hero') || el.closest('.doc-hero')) return;
      if (el.classList.contains('grid')) {
        Array.prototype.forEach.call(el.children, function (c, i) {
          c.classList.add('reveal'); c.style.setProperty('--d', (i % 4) * 90 + 'ms'); items.push(c);
        });
      } else if (el.classList.contains('shots')) {
        Array.prototype.forEach.call(el.children, function (c, i) {
          c.classList.add('reveal', 'reveal-side'); c.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms'); items.push(c);
        });
      } else if (!el.classList.contains('reveal')) {
        el.classList.add('reveal'); items.push(el);
      }
    });
  });
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();
