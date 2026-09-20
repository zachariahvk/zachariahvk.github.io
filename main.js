/* ==========================================================================
   Zachariah V. Kurien — portfolio
   Motion layer: Lenis (smooth scroll) + GSAP/ScrollTrigger (reveals).

   Design rules enforced here:
     - Only transform and opacity are ever animated.
     - The page must be fully readable with this file absent, blocked or
       broken. Nothing is hidden until we have confirmed GSAP is alive.
     - Touch devices skip the expensive effects rather than running them badly.
     - prefers-reduced-motion disables the whole motion layer, not just parts.

   Contents
     0. Environment
     1. Theme
     2. Bail-out path
     3. Smooth scroll
     4. Page chrome (progress, intro, cursor)
     5. Hero
     6. Scroll reveals
     7. Parallax
     8. Pointer effects (tilt, magnetic)
     9. Top bar state
    10. Anchors
   ========================================================================== */

(function () {
  'use strict';

  /* 0. Environment ========================================================= */

  var root = document.documentElement;
  var EASE = 'power3.out'; // GSAP's equivalent of cubic-bezier(0.22, 1, 0.36, 1)

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' &&
                typeof window.ScrollTrigger !== 'undefined';

  /* 1. Theme ===============================================================
     Runs regardless of motion support — it is a preference, not an effect. */

  (function theme() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { /* private mode */ }
    if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      toggle.setAttribute('aria-label',
        next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  })();

  /* 2. Bail-out path =======================================================
     If motion is unwanted or GSAP never arrived, stop here. The `js` class is
     what activates the hidden-until-revealed styles, so by not setting it we
     guarantee every word stays on screen. */

  if (reduced || !hasGSAP) {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.remove('reveal', 'reveal-up', 'reveal-fade');
    });
    initStickyBar();
    initAnchors(null);
    return;
  }

  root.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);

  /* 3. Smooth scroll =======================================================
     Desktop only. On touch, native momentum scrolling beats anything we can
     synthesise, and Lenis costs frames we would rather spend on reveals. */

  var lenis = null;

  if (!coarse && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.95
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* 4. Page chrome =========================================================
     Built in JS, never in markup: if this file dies, no overlay is left
     covering the page and no decorative nodes are read by a screen reader. */

  // Scroll progress bar
  (function progress() {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
  })();

  // Load intro — one short wipe, then removed entirely
  (function intro() {
    var el = document.createElement('div');
    el.className = 'intro';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span>Zachariah V. Kurien</span>';
    document.body.appendChild(el);

    var tl = gsap.timeline({
      onComplete: function () { el.remove(); heroIn(); }
    });

    tl.fromTo(el.querySelector('span'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE })
      .to(el.querySelector('span'),
        { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.25')
      .to(el,
        { yPercent: -100, duration: 0.8, ease: EASE }, '-=0.1');
  })();

  // Cursor follower — fine pointers only
  if (!coarse) (function cursor() {
    var dot  = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor';
    ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // quickTo gives us a cheap lerp without a manual rAF loop.
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });
    var shown = false;

    window.addEventListener('mousemove', function (e) {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      shown = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    });

    // Ring swells over anything clickable.
    document.querySelectorAll('a, button, .card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
    });
  })();

  /* 5. Hero ================================================================
     Called by the intro's onComplete so the two never overlap. */

  function heroIn() {
    var tl = gsap.timeline();

    tl.from('.hero .line-mask > span', {
        yPercent: 108,
        duration: 1.0,
        ease: EASE,
        stagger: 0.09          // 90ms — inside the 60-100ms brief
      })
      .from('.hero .line', { opacity: 0, y: 18, duration: 0.8, ease: EASE }, '-=0.55')
      .from('.hero .blurb', { opacity: 0, y: 18, duration: 0.8, ease: EASE }, '-=0.6')
      .from('.hero .quickcontact .btn', {
        opacity: 0, y: 14, duration: 0.7, ease: EASE, stagger: 0.07
      }, '-=0.55')
      .from('.topbar', { opacity: 0, y: -14, duration: 0.7, ease: EASE }, '-=0.7')
      .from('.scroll-cue', { opacity: 0, duration: 0.6, ease: EASE }, '-=0.4');
  }

  /* 6. Scroll reveals ======================================================
     One ScrollTrigger per group rather than per element — fewer listeners,
     and it produces the staggered cascade the brief asked for. */

  gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
    var items = group.querySelectorAll('.reveal');
    if (!items.length) return;

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: EASE,
      stagger: 0.08,           // 80ms
      scrollTrigger: {
        trigger: group,
        start: 'top 82%',
        once: true
      }
    });
  });

  // Standalone reveals not inside a group
  gsap.utils.toArray('.reveal').forEach(function (el) {
    if (el.closest('[data-reveal-group]')) return;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  /* 7. Parallax ============================================================
     Deliberately shallow. Large offsets read as a gimmick and fight the
     reading position. */

  if (!coarse) {
    gsap.utils.toArray('.parallax').forEach(function (el) {
      var depth = parseFloat(el.dataset.depth || '0.12');
      gsap.to(el, {
        yPercent: -depth * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    });
  }

  /* 8. Pointer effects =====================================================
     Both skipped on touch: tilt needs a hover state that does not exist, and
     magnetic buttons on a finger just make targets move away from the tap. */

  if (!coarse) {
    // Card tilt
    document.querySelectorAll('.card').forEach(function (card) {
      var MAX = 5; // degrees — subtle enough to read as depth, not novelty

      var setRX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      var setRY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
      var setY  = gsap.quickTo(card, 'y',         { duration: 0.5, ease: 'power3' });

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        setRY(px * MAX * 2);
        setRX(-py * MAX * 2);
        setY(-6);
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        setRX(0); setRY(0); setY(0);
      });
    });

    // Magnetic buttons
    document.querySelectorAll('.magnetic').forEach(function (el) {
      var PULL = 0.28;
      var setX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
      var setY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        setX((e.clientX - (r.left + r.width  / 2)) * PULL);
        setY((e.clientY - (r.top  + r.height / 2)) * PULL);
      }, { passive: true });

      el.addEventListener('mouseleave', function () { setX(0); setY(0); });
    });
  }

  /* 9. Top bar state ======================================================= */

  function initStickyBar() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;

    var apply = function () {
      bar.classList.toggle('is-stuck', window.scrollY > 40);
    };
    apply();
    window.addEventListener('scroll', apply, { passive: true });
  }
  initStickyBar();

  /* 10. Anchors ============================================================
     Lenis owns the scroll position, so native anchor jumps have to be routed
     through it or the two disagree about where the page is. */

  function initAnchors(instance) {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        if (instance) instance.scrollTo(target, { offset: -70, duration: 1.1 });
        else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });

        // Keep keyboard focus with the visual jump.
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });

    var top = document.querySelector('.pagefoot .top');
    if (top) top.addEventListener('click', function () {
      if (instance) instance.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
  initAnchors(lenis);

  // Late-loading webfonts change text metrics; recalc so triggers stay honest.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
