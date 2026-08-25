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
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ── REVEAL ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  /* ── COMPTEURS ── */
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', dur = 1500, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * end) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cObs.unobserve(el);
    });
  }, { threshold: .5 });
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

  /* ── SHIMMER SÉQUENTIEL ALÉATOIRE ── */
  // Une seule carte brille à la fois, ordre aléatoire, délai aléatoire entre chaque
  const cards = Array.from(document.querySelectorAll('.offer-card'));
  if (cards.length) {
    // Supprimer toute animation CSS existante sur .card-shimmer
    cards.forEach(card => {
      const shimmer = card.querySelector('.card-shimmer');
      if (shimmer) shimmer.style.animation = 'none';
    });

    let available = [];
    function pickNext() {
      if (available.length === 0) available = [...Array(cards.length).keys()];
      // Choisir un index aléatoire dans les cartes restantes
      const idx = Math.floor(Math.random() * available.length);
      const cardIdx = available.splice(idx, 1)[0];
      return cardIdx;
    }

    function runShimmer() {
      const cardIdx = pickNext();
      const shimmer = cards[cardIdx].querySelector('.card-shimmer');
      if (!shimmer) { scheduleNext(); return; }

      // Reset
      shimmer.style.transition = 'none';
      shimmer.style.left = '-60%';
      shimmer.style.opacity = '1';

      // Force reflow
      void shimmer.offsetWidth;

      // Sweep : 2x plus rapide = ~1.5s au lieu de 3s
      shimmer.style.transition = 'left 1.5s linear';
      shimmer.style.left = '110%';

      // Attendre fin du sweep + pause aléatoire avant la prochaine carte
      setTimeout(() => {
        shimmer.style.opacity = '0';
        scheduleNext();
      }, 1600);
    }

    function scheduleNext() {
      // Pause aléatoire entre 0.4s et 1.2s avant la prochaine
      const pause = 400 + Math.random() * 800;
      setTimeout(runShimmer, pause);
    }

    // Démarrer après un court délai initial
    setTimeout(runShimmer, 800);
  }

});
