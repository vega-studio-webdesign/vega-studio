document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL ── */
  const nav = document.querySelector('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 50);
  }, { passive: true });

  /* ── BURGER ── */
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      // Pas de overflow hidden — le menu slide depuis le haut, le contenu reste scrollable
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      burger.classList.remove('open');
    }));
  }

  /* ── REVEAL ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* ── COMPTEURS : durée 3s, démarrent à 0 quand visibles ── */
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const end = +el.dataset.count;
      const suf = el.dataset.suffix || '';
      const dur = 3000; // exactement 3 secondes
      el.textContent = '0' + suf; // reset à 0 visible
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        // easing doux mais pas trop rapide au début
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        el.textContent = Math.round(ease * end) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cObs.unobserve(el);
    });
  }, { threshold: .8 }); // déclenche quand bien visible
  document.querySelectorAll('[data-count]').forEach(el => cObs.observe(el));

  /* ── PARALLAX ── */
  const parallaxLayers = document.querySelectorAll('[data-parallax]');
  if (parallaxLayers.length) {
    window.addEventListener('scroll', () => {
      parallaxLayers.forEach(el => {
        el.style.transform = `translateY(${scrollY * parseFloat(el.dataset.parallax)}px)`;
      });
    }, { passive: true });
  }

  /* ── LUMIÈRE SOURIS HERO ── */
  const heroLight = document.querySelector('.hero-mouse-light');
  const heroEl    = document.querySelector('.hero');
  if (heroLight && heroEl) {
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      heroLight.style.background = `radial-gradient(circle 600px at ${x}% ${y}%, rgba(139,124,246,0.09) 0%, transparent 70%)`;
    });
  }

  /* ── SHIMMER SÉQUENTIEL — jamais 2x la même carte ── */
  const cards = Array.from(document.querySelectorAll('.offer-card'));
  if (cards.length) {
    cards.forEach(card => {
      const s = card.querySelector('.card-shimmer');
      if (s) { s.style.animation = 'none'; s.style.transition = 'none'; }
    });

    let lastIdx = -1;
    let pool = [];

    function pickNext() {
      // Reconstituer le pool sans la dernière carte
      if (pool.length === 0) {
        pool = cards.map((_, i) => i).filter(i => i !== lastIdx);
      }
      const pos = Math.floor(Math.random() * pool.length);
      const idx = pool.splice(pos, 1)[0];
      lastIdx = idx;
      return idx;
    }

    function runShimmer() {
      const idx     = pickNext();
      const shimmer = cards[idx].querySelector('.card-shimmer');
      if (!shimmer) { scheduleNext(); return; }

      shimmer.style.transition = 'none';
      shimmer.style.left    = '-60%';
      shimmer.style.opacity = '1';
      void shimmer.offsetWidth; // force reflow

      // 2x plus rapide : 0.75s
      shimmer.style.transition = 'left 0.75s linear';
      shimmer.style.left = '110%';

      setTimeout(() => {
        shimmer.style.opacity = '0';
        scheduleNext();
      }, 800);
    }

    function scheduleNext() {
      const pause = 300 + Math.random() * 700;
      setTimeout(runShimmer, pause);
    }

    setTimeout(runShimmer, 600);
  }



});
