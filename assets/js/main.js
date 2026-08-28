document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL ── */
  const nav = document.querySelector('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 50);
  }, { passive: true });

  /* ── BURGER ── */
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  const closeBtn = document.querySelector('.nav-mobile-close');

  function openMenu()  { links.classList.add('open');    burger.classList.add('open'); }
  function closeMenu() { links.classList.remove('open'); burger.classList.remove('open'); }

  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // Fermer en cliquant en dehors du menu
    document.addEventListener('click', e => {
      if (links.classList.contains('open') &&
          !links.contains(e.target) &&
          !burger.contains(e.target)) {
        closeMenu();
      }
    });
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

  /* Effet lumière souris supprimé */

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



  /* ── RÉSEAU DE PARTICULES — section À propos ── */
  function initParticlesNetwork() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const N = 38;
    const LINK_DIST = 110;  // liaisons visibles sur plus grande distance
    const SPEED = 0.35;

    // Créer les particules
    const particles = Array.from({ length: N }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - .5) * SPEED,
      vy: (Math.random() - .5) * SPEED,
      r:  Math.random() * 4.5 + 2.5,  // sphères plus grosses
      lit: Math.random() > .45,          // allumée ou éteinte
      litTarget: Math.random() > .45,
      litAlpha: Math.random() > .45 ? 1 : 0,
      toggleTimer: Math.random() * 180,  // frames avant prochain basculement
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Mettre à jour positions + état lit/éteint
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Rebond sur les bords
        if (p.x < 0)  { p.x = 0;  p.vx *= -1; }
        if (p.x > W)  { p.x = W;  p.vx *= -1; }
        if (p.y < 0)  { p.y = 0;  p.vy *= -1; }
        if (p.y > H)  { p.y = H;  p.vy *= -1; }

        // Légère perturbation aléatoire
        p.vx += (Math.random() - .5) * 0.012;
        p.vy += (Math.random() - .5) * 0.012;
        // Limiter la vitesse
        const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (spd > SPEED * 1.8) { p.vx *= .95; p.vy *= .95; }

        // Basculer l'état allumé/éteint aléatoirement
        p.toggleTimer--;
        if (p.toggleTimer <= 0) {
          p.litTarget = !p.litTarget;
          p.toggleTimer = 80 + Math.random() * 220;
        }
        // Transition douce vers l'état cible
        p.litAlpha += ((p.litTarget ? 1 : 0) - p.litAlpha) * 0.03;
      }

      // Dessiner les liaisons
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.55;  // beaucoup plus visible
            const litness = (particles[i].litAlpha + particles[j].litAlpha) / 2;
            const r = Math.round(100 + litness * 96);
            const g = Math.round(88  + litness * 100);
            const b = Math.round(200 + litness * 56);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth   = 1.2;  // trait plus épais
            ctx.stroke();
          }
        }
      }

      // Dessiner les sphères
      for (const p of particles) {
        const la = p.litAlpha;
        const ra = Math.round(139 + la * 57);
        const ga = Math.round(108 + la * 76);
        const ba = Math.round(232 + la * 23);
        const baseAlpha = 0.25 + la * 0.65;

        // Halo sur les sphères allumées
        if (la > 0.3) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grd.addColorStop(0, `rgba(${ra},${ga},${ba},${la * 0.45})`);
          grd.addColorStop(1, 'rgba(139,108,232,0)');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI*2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Sphère
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${ra},${ga},${ba},${baseAlpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

  initParticlesNetwork();

  /* ── NOMS FLOTTANTS ── */
  function initFloatingNames() {
    const zone = document.getElementById('floating-names');
    if (!zone) return;

    const ALL_NAMES = [
      'Frédéric Vanek', 'Laurent Brissaud', 'Pascal Gonthier', 'Thierry Marchand',
      'Marc Delcourt', 'Bruno Teissier', 'Christophe Mouries', 'Didier Fourneau',
      'Sébastien Lamour', 'Yannick Prévot', 'Gilles Castagnède', 'Julien Tremblet',
      'Alain Pouget', 'Rémi Charlot', 'Nicolas Ferriol', 'Stéphane Bouquillon',
      'David Lenfant', 'Patrice Vaugelas', 'Éric Dumarché', 'François Bonnard',
      'Olivier Tavernier', 'Jean-Pierre Moulinier', 'Antoine Brassac', 'Hervé Chabrier',
      'Maxime Tollet', 'Cédric Vidal-Roux', 'Karim Benyounes', 'Benoît Lartigau',
      'Damien Souquet', 'Thomas Pérignon', 'Philippe Lauzet', 'Arnaud Meunier',
      'Xavier Bourrelier', 'Loïc Granger', 'Mickael Barthas', 'Vincent Combes',
      'Romain Escoffier', 'Jean-Marc Pelissier', 'Guillaume Sarradet', 'Adrien Poudevigne',
      'Samuel Claverie', 'Pierre-Antoine Galy', 'Ludovic Fauché', 'Florent Gombaud',
      'Alexandre Moutet', 'Bertrand Lacassagne', 'Jérôme Baylac', 'Cyril Tournadre',
      'Emmanuel Sabatier', 'Quentin Dutheil'
    ];

    // Mélanger le pool au départ
    const pool = [...ALL_NAMES].sort(() => Math.random() - .5);
    const active = []; // { el, x, y, w, h, name }

    const MAX_ACTIVE   = 13;
    const FADE_MS      = 900;
    const PAD_X        = 28;
    const PAD_Y        = 22;

    const SIZES   = ['.8rem', '.88rem', '.95rem', '1rem', '1.05rem', '1.12rem'];
    const COLORS  = [
      'rgba(238,238,245,0.85)',
      'rgba(238,238,245,0.55)',
      'rgba(238,238,245,0.38)',
      'rgba(196,184,255,0.80)',
      'rgba(196,184,255,0.55)',
      'rgba(139,124,246,0.70)',
    ];

    function overlaps(x, y, w, h) {
      for (const a of active) {
        if (x < a.x + a.w + PAD_X &&
            x + w + PAD_X > a.x &&
            y < a.y + a.h + PAD_Y &&
            y + h + PAD_Y > a.y) return true;
      }
      return false;
    }

    function spawn() {
      if (active.length >= MAX_ACTIVE || pool.length === 0) return;

      const name = pool.shift();
      const el   = document.createElement('span');
      el.className   = 'floating-name';
      el.textContent = name;
      el.style.fontSize  = SIZES [Math.floor(Math.random() * SIZES .length)];
      el.style.color     = COLORS[Math.floor(Math.random() * COLORS.length)];
      el.style.opacity   = '0';

      zone.appendChild(el);

      const w  = el.offsetWidth  + 2;
      const h  = el.offsetHeight + 2;
      const zW = zone.offsetWidth;
      const zH = zone.offsetHeight;

      // Chercher une position libre
      let x, y, found = false;
      for (let t = 0; t < 40; t++) {
        x = 16 + Math.random() * Math.max(0, zW - w - 32);
        y = 16 + Math.random() * Math.max(0, zH - h - 32);
        if (!overlaps(x, y, w, h)) { found = true; break; }
      }

      if (!found) {
        zone.removeChild(el);
        pool.push(name);
        return;
      }

      el.style.left = x + 'px';
      el.style.top  = y + 'px';

      // Flottement unique par élément
      const amp = -(6 + Math.random() * 12);
      const dur =  3200 + Math.random() * 2400;
      const del =  Math.random() * 1200;
      el.style.setProperty('--float-amp', amp + 'px');
      el.style.animation = `nameFloat ${dur}ms ${del}ms ease-in-out infinite alternate`;

      const entry = { el, x, y, w, h, name };
      active.push(entry);

      // Fade in
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));

      // Durée de vie aléatoire
      const life = 3500 + Math.random() * 5000;
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => {
          if (zone.contains(el)) zone.removeChild(el);
          const i = active.indexOf(entry);
          if (i > -1) active.splice(i, 1);
          pool.push(name); // retour dans le pool
        }, FADE_MS);
      }, life);
    }

    // Spawn initial étalé
    for (let i = 0; i < 10; i++) setTimeout(spawn, i * 180);

    // Spawn régulier pour maintenir la densité
    setInterval(() => {
      const deficit = MAX_ACTIVE - active.length;
      for (let i = 0; i < Math.min(deficit, 2); i++) spawn();
    }, 500);
  }

  initFloatingNames();

});
