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


  /* ── ANIMATION 3D SECTION WHY — sphère de points orbitaux ── */
  function initWhyCanvas() {
    const canvas = document.getElementById('why-canvas');
    if (!canvas) return;

    const W = canvas.width  = canvas.offsetWidth  || 420;
    const H = canvas.height = canvas.offsetHeight || 420;
    const ctx = canvas.getContext('2d');
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.36; // rayon de la sphère

    // Génère des points uniformément répartis sur une sphère
    const N = 120;
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < N; i++) {
      const y  = 1 - (i / (N - 1)) * 2;
      const r  = Math.sqrt(1 - y * y);
      const th = phi * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
    }

    // Quelques lignes reliant les points voisins
    const edges = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dz = pts[i].z - pts[j].z;
        const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < 0.38) edges.push([i, j]);
      }
    }

    let angle = 0;
    let tiltX  = 0.3; // inclinaison légère

    function project(p, rotY, rotX) {
      // Rotation Y
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      // Rotation X (tilt)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      // Perspective douce
      const fov  = 2.8;
      const scale = fov / (fov + z2 + 1.2);
      return {
        sx: cx + x1 * R * scale,
        sy: cy + y1 * R * scale,
        z:  z2,
        s:  scale,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;

      const projected = pts.map(p => project(p, angle, tiltX));

      // Trier par z pour le rendu (painter's algorithm)
      const order = projected.map((_, i) => i).sort((a, b) => projected[a].z - projected[b].z);

      // Dessiner les arêtes
      for (const [i, j] of edges) {
        const a = projected[i], b = projected[j];
        const depth = ((a.z + b.z) / 2 + 1.2) / 2.4; // 0..1
        const alpha = depth * 0.18;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.strokeStyle = `rgba(139,124,246,${alpha})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }

      // Dessiner les points
      for (const i of order) {
        const p     = projected[i];
        const depth = (p.z + 1.2) / 2.4; // 0..1, profondeur normalisée
        const alpha = 0.2 + depth * 0.7;
        const r     = (0.9 + depth * 2.2) * p.s;

        // Halo sur les points de devant
        if (depth > 0.72) {
          const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 5);
          grd.addColorStop(0, `rgba(196,184,255,${alpha * 0.35})`);
          grd.addColorStop(1, 'rgba(139,124,246,0)');
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(r, 0.5), 0, Math.PI * 2);
        // Couleur : lilas pour les devant, violet pour les arrière
        const t = depth;
        const rc = Math.round(139 + t * 57);
        const gc = Math.round(124 + t * 60);
        const bc = Math.round(246 + t * 9);
        ctx.fillStyle = `rgba(${rc},${gc},${bc},${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    draw();

    // Resize
    window.addEventListener('resize', () => {
      canvas.width  = canvas.offsetWidth  || 420;
      canvas.height = canvas.offsetHeight || 420;
    }, { passive: true });
  }

  initWhyCanvas();

});
