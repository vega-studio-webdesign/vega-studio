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

  /* ── SHIMMER SÉQUENTIEL, jamais 2x la même carte ── */
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



  /* ── RÉSEAU DE PARTICULES, section À propos ── */
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
      { n: 'Frédéric Vanek',        f: 'Frédéric Vanek, 46 ans, Plombier' },
      { n: 'Laurent Brissaud',       f: 'Laurent Brissaud, 38 ans, Électricien' },
      { n: 'Pascal Gonthier',        f: 'Pascal Gonthier, 52 ans, Plombier' },
      { n: 'Thierry Marchand',       f: 'Thierry Marchand, 41 ans, Peintre' },
      { n: 'Marc Delcourt',          f: 'Marc Delcourt, 35 ans, Plombier' },
      { n: 'Bruno Teissier',         f: 'Bruno Teissier, 49 ans, Électricien' },
      { n: 'Christophe Mouries',     f: 'Christophe Mouries, 43 ans, Maçon' },
      { n: 'Didier Fourneau',        f: 'Didier Fourneau, 57 ans, Plombier' },
      { n: 'Sébastien Lamour',       f: 'Sébastien Lamour, 33 ans, Électricien' },
      { n: 'Yannick Prévot',         f: 'Yannick Prévot, 44 ans, Plombier' },
      { n: 'Gilles Castagnède',      f: 'Gilles Castagnède, 50 ans, Serrurier' },
      { n: 'Julien Tremblet',        f: 'Julien Tremblet, 29 ans, Plombier' },
      { n: 'Alain Pouget',           f: 'Alain Pouget, 55 ans, Maçon' },
      { n: 'Rémi Charlot',           f: 'Rémi Charlot, 37 ans, Électricien' },
      { n: 'Nicolas Ferriol',        f: 'Nicolas Ferriol, 42 ans, Plombier' },
      { n: 'Stéphane Bouquillon',    f: 'Stéphane Bouquillon, 48 ans, Peintre' },
      { n: 'David Lenfant',          f: 'David Lenfant, 31 ans, Plombier' },
      { n: 'Patrice Vaugelas',       f: 'Patrice Vaugelas, 53 ans, Électricien' },
      { n: 'Éric Dumarché',          f: 'Éric Dumarché, 45 ans, Plombier' },
      { n: 'François Bonnard',       f: 'François Bonnard, 39 ans, Serrurier' },
      { n: 'Olivier Tavernier',      f: 'Olivier Tavernier, 36 ans, Plombier' },
      { n: 'Jean-Pierre Moulinier',  f: 'Jean-Pierre Moulinier, 59 ans, Maçon' },
      { n: 'Antoine Brassac',        f: 'Antoine Brassac, 27 ans, Électricien' },
      { n: 'Hervé Chabrier',         f: 'Hervé Chabrier, 47 ans, Plombier' },
      { n: 'Maxime Tollet',          f: 'Maxime Tollet, 32 ans, Peintre' },
      { n: 'Cédric Vidal-Roux',      f: 'Cédric Vidal-Roux, 40 ans, Plombier' },
      { n: 'Karim Benyounes',        f: 'Karim Benyounes, 38 ans, Électricien' },
      { n: 'Benoît Lartigau',        f: 'Benoît Lartigau, 51 ans, Plombier' },
      { n: 'Damien Souquet',         f: 'Damien Souquet, 34 ans, Maçon' },
      { n: 'Thomas Pérignon',        f: 'Thomas Pérignon, 28 ans, Plombier' },
      { n: 'Philippe Lauzet',        f: 'Philippe Lauzet, 56 ans, Serrurier' },
      { n: 'Arnaud Meunier',         f: 'Arnaud Meunier, 43 ans, Électricien' },
      { n: 'Xavier Bourrelier',      f: 'Xavier Bourrelier, 46 ans, Plombier' },
      { n: 'Loïc Granger',           f: 'Loïc Granger, 30 ans, Peintre' },
      { n: 'Mickael Barthas',        f: 'Mickael Barthas, 39 ans, Plombier' },
      { n: 'Vincent Combes',         f: 'Vincent Combes, 44 ans, Maçon' },
      { n: 'Romain Escoffier',       f: 'Romain Escoffier, 26 ans, Électricien' },
      { n: 'Jean-Marc Pelissier',    f: 'Jean-Marc Pelissier, 54 ans, Plombier' },
      { n: 'Guillaume Sarradet',     f: 'Guillaume Sarradet, 35 ans, Serrurier' },
      { n: 'Adrien Poudevigne',      f: 'Adrien Poudevigne, 29 ans, Plombier' },
      { n: 'Samuel Claverie',        f: 'Samuel Claverie, 41 ans, Électricien' },
      { n: 'Pierre-Antoine Galy',    f: 'Pierre-Antoine Galy, 48 ans, Peintre' },
      { n: 'Ludovic Fauché',         f: 'Ludovic Fauché, 37 ans, Plombier' },
      { n: 'Florent Gombaud',        f: 'Florent Gombaud, 33 ans, Maçon' },
      { n: 'Alexandre Moutet',       f: 'Alexandre Moutet, 45 ans, Plombier' },
      { n: 'Bertrand Lacassagne',    f: 'Bertrand Lacassagne, 52 ans, Électricien' },
      { n: 'Jérôme Baylac',          f: 'Jérôme Baylac, 43 ans, Peintre' },
      { n: 'Cyril Tournadre',        f: 'Cyril Tournadre, 31 ans, Plombier' },
      { n: 'Emmanuel Sabatier',      f: 'Emmanuel Sabatier, 49 ans, Serrurier' },
      { n: 'Quentin Dutheil',        f: 'Quentin Dutheil, 27 ans, Plombier' },
    ];

    const pool      = [...ALL_NAMES].sort(() => Math.random() - .5);
    const active    = [];
    const MAX       = 13;
    const FADE      = 800;   // ms
    const PAD_X     = 28;
    const PAD_Y     = 22;
    const SIZES     = ['.8rem','.88rem','.95rem','1rem','1.05rem','1.12rem'];
    const COLORS    = [
      'rgba(238,238,245,0.85)', 'rgba(238,238,245,0.55)', 'rgba(238,238,245,0.38)',
      'rgba(196,184,255,0.80)', 'rgba(196,184,255,0.55)', 'rgba(139,124,246,0.70)',
    ];

    function overlaps(x, y, w, h) {
      for (const a of active)
        if (x < a.x+a.w+PAD_X && x+w+PAD_X > a.x && y < a.y+a.h+PAD_Y && y+h+PAD_Y > a.y)
          return true;
      return false;
    }

    function spawn() {
      if (active.length >= MAX || pool.length === 0) return;
      const item = pool.shift();
      const isDesktop = window.innerWidth > 768;
      const name = isDesktop ? item.f : item.n;

      /* ---- wrapper : opacity seulement ---- */
      const wrapper = document.createElement('span');
      wrapper.className = 'name-wrapper';
      wrapper.style.opacity = '0';

      /* ---- inner : transform seulement ---- */
      const inner = document.createElement('span');
      inner.className  = 'name-inner';
      inner.textContent = name;
      inner.style.fontSize = SIZES [Math.floor(Math.random() * SIZES .length)];
      inner.style.color    = COLORS[Math.floor(Math.random() * COLORS.length)];

      wrapper.appendChild(inner);
      zone.appendChild(wrapper);

      const w  = wrapper.offsetWidth  + 2;
      const h  = wrapper.offsetHeight + 2;
      const zW = zone.offsetWidth;
      const zH = zone.offsetHeight;

      let x, y, found = false;
      for (let t = 0; t < 40; t++) {
        x = 16 + Math.random() * Math.max(0, zW - w - 32);
        y = 16 + Math.random() * Math.max(0, zH - h - 32);
        if (!overlaps(x, y, w, h)) { found = true; break; }
      }
      if (!found) { zone.removeChild(wrapper); pool.push(name); return; }

      wrapper.style.left = x + 'px';
      wrapper.style.top  = y + 'px';

      const entry = { wrapper, x, y, w, h, item };
      active.push(entry);

      /* Fade in, sur wrapper seulement */
      requestAnimationFrame(() => requestAnimationFrame(() => {
        wrapper.style.opacity = '1';
      }));

      /* Durée de vie puis fade out */
      const life = 2500 + Math.random() * 3500;
      setTimeout(() => {
        wrapper.style.opacity = '0';
        setTimeout(() => {
          if (zone.contains(wrapper)) zone.removeChild(wrapper);
          const i = active.indexOf(entry);
          if (i > -1) active.splice(i, 1);
          pool.push(item);
        }, FADE);
      }, life);
    }

    for (let i = 0; i < 10; i++) setTimeout(spawn, i * 130);

    // Spawn régulier
    setInterval(() => {
      const d = MAX - active.length;
      for (let i = 0; i < Math.min(d, 2); i++) spawn();
    }, 350);

    // Nettoyage des zombies : entrées active dont le wrapper a disparu du DOM
    // (cas de veille/throttling des timers sur mobile)
    setInterval(() => {
      for (let i = active.length - 1; i >= 0; i--) {
        if (!zone.contains(active[i].wrapper)) {
          pool.push(active[i].item);
          active.splice(i, 1);
        }
      }
      // Sécurité : si tout a disparu, relancer
      if (active.length === 0 && pool.length === 0) {
        ALL_NAMES.forEach(it => pool.push(it));
        pool.sort(() => Math.random() - .5);
      }
    }, 2000);

    // Relancer les spawns quand la page redevient visible (retour d'arrière-plan)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Nettoyer les zombies immédiatement
        for (let i = active.length - 1; i >= 0; i--) {
          if (!zone.contains(active[i].wrapper)) {
            pool.push(active[i].item);
            active.splice(i, 1);
          }
        }
        // Relancer si nécessaire
        const d = MAX - active.length;
        for (let i = 0; i < Math.min(d, 5); i++) setTimeout(spawn, i * 150);
      }
    });
  }

  initFloatingNames();
  /* ── SIMULATEUR — PAGE 1 (simulateur.html) ── */
  function initSimulator() {
    if (!document.getElementById('sim-formulas')) return;

    let pages       = 1;
    let selectedFk  = 'starter';
    let months      = 1;
    let discount    = 0;
    const features  = new Set();
    const options   = new Set();
    const optData   = {};

    const FORMULAS = {
      starter:  { name: 'Starter',  creation: 100, monthly: 15 },
      standard: { name: 'Standard', creation: 250, monthly: 25 },
      pro:      { name: 'Pro',      creation: 400, monthly: 35 },
    };
    const INCLUDED_PAGES = { starter: 1, standard: 3, pro: 5 };
    const FORMULA_INCLUDES = {
      starter:  new Set([]),
      standard: new Set(['contact','galerie','google','seo']),
      pro:      new Set(['contact','galerie','google','seo','anim','whatsapp','avis','favicon']),
    };
    // Prix à la création + supplément mensuel de maintenance par add-on
    const FEATURE_ADDONS = {
      contact:  { price: 40, monthly: 2,  label: 'Formulaire de contact' },
      galerie:  { price: 50, monthly: 2,  label: 'Galerie photos' },
      google:   { price: 60, monthly: 3,  label: 'Google Business & Maps' },
      seo:      { price: 50, monthly: 3,  label: 'SEO local' },
      anim:     { price: 60, monthly: 2,  label: 'Animations visuelles' },
      whatsapp: { price: 20, monthly: 1,  label: 'Bouton WhatsApp' },
      avis:     { price: 40, monthly: 2,  label: 'Section avis clients' },
      favicon:  { price: 80, monthly: 0,  label: 'Favicon & identité' },
    };
    const PREM_FEATS = ['rdv','espace','boutique','multi'];

    function calcFormula(fk) {
      const included = FORMULA_INCLUDES[fk];
      const missing  = [...features].filter(f => !included.has(f) && !PREM_FEATS.includes(f));
      const addOnCreation = missing.reduce((s,f) => s + (FEATURE_ADDONS[f]?.price||0), 0);
      const addOnMonthly  = missing.reduce((s,f) => s + (FEATURE_ADDONS[f]?.monthly||0), 0);
      const extraPages    = Math.max(0, pages - INCLUDED_PAGES[fk]);
      const optCreation   = [...options].reduce((s,o) => s + (optData[o]?.price||0), 0);
      const optMonthly    = [...options].reduce((s,o) => s + (optData[o]?.monthly||0), 0);
      return {
        missing,
        creation: FORMULAS[fk].creation + addOnCreation + extraPages*50 + optCreation,
        monthly:  FORMULAS[fk].monthly  + addOnMonthly  + optMonthly,
        extraPages,
      };
    }

    function renderFormulas() {
      const hasPrem = PREM_FEATS.some(f => features.has(f));
      document.getElementById('sim-prem-note').hidden = true;

      // Si une fonctionnalité Premium est sélectionnée → on n'affiche que Premium
      if (hasPrem) {
        document.getElementById('sim-formulas').innerHTML = `
          <div class="sim-formula-card sim-formula-prem">
            <div class="sfc-head">
              <span class="sfc-name">Premium</span>
              <strong class="sfc-creation">Sur devis</strong>
            </div>
            <p class="sim-prem-inline">Votre projet nécessite des fonctionnalités avancées (espace client, boutique, RDV…). Contactez-nous pour un devis personnalisé.</p>
            <a href="contact.html" class="btn btn-primary">Nous contacter →</a>
          </div>`;
        // Masquer durée et total
        document.querySelector('.sim-dur-section').style.display  = 'none';
        document.getElementById('sim-total-live').style.display   = 'none';
        document.getElementById('sim-continue').style.display     = 'none';
        return;
      }

      // Sinon, remettre durée et total visibles
      document.querySelector('.sim-dur-section').style.display  = '';
      document.getElementById('sim-total-live').style.display   = '';
      document.getElementById('sim-continue').style.display     = '';

      document.getElementById('sim-formulas').innerHTML =
        ['starter','standard','pro'].map(fk => {
          const f   = FORMULAS[fk];
          const c   = calcFormula(fk);
          const sel = fk === selectedFk;

          const addOnTags = c.missing.map(ft => {
            const a = FEATURE_ADDONS[ft];
            return `<span class="sim-addon">${a.label} <em>+${a.price}€${a.monthly>0?' +'+a.monthly+'€/m':''}</em></span>`;
          }).join('');
          const extraTag = c.extraPages > 0
            ? `<span class="sim-addon">${c.extraPages} page${c.extraPages>1?'s':''} supp. <em>+${c.extraPages*50}€</em></span>`
            : '';
          const allIn = c.missing.length === 0 && c.extraPages === 0;

          return `<div class="sim-formula-card${sel?' is-selected':''}" data-fk="${fk}">
            <div class="sfc-head">
              <span class="sfc-name">${f.name}</span>
              <div class="sfc-prices">
                <strong class="sfc-creation">${c.creation}€</strong>
                <span class="sfc-monthly">${c.monthly}€<small>/mois</small></span>
              </div>
            </div>
            <div class="sim-alt-addons">
              ${allIn
                ? '<span class="sim-addon sim-addon--ok">Tout inclus</span>'
                : addOnTags + extraTag}
            </div>
            <button class="sfc-select${sel?' sfc-select--active':''}" data-fk="${fk}">
              ${sel ? 'Sélectionné ✓' : 'Sélectionner'}
            </button>
          </div>`;
        }).join('');

      // Réattacher les listeners sur les boutons sélectionner
      document.querySelectorAll('.sfc-select').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedFk = btn.dataset.fk;
          renderFormulas();
          renderTotal();
        });
      });
    }

    function renderTotal() {
      const c        = calcFormula(selectedFk);
      const f        = FORMULAS[selectedFk];
      const mDisc    = Math.round(c.monthly * (1 - discount/100));
      const mTotal   = Math.round(mDisc * months);
      const total    = c.creation + mTotal;
      const saving   = discount > 0 ? Math.round(c.monthly * months * discount/100) : 0;

      document.getElementById('sim-total-live').innerHTML = `
        <div class="stl-row"><span>Création</span><strong>${c.creation}€</strong></div>
        <div class="stl-row"><span>Maintenance (${months} mois à ${mDisc}€)</span><strong>${mTotal}€</strong></div>
        ${saving > 0 ? `<div class="stl-row stl-saving"><span>Économie abonnement</span><strong>−${saving}€</strong></div>` : ''}
        <div class="stl-row stl-grand"><span>Total estimé</span><strong>${total}€</strong></div>`;

      // Mettre à jour le lien du bouton continuer
      const params = new URLSearchParams({
        fk:   selectedFk,
        fn:   f.name,
        cr:   c.creation,
        mo:   c.monthly,
        months,
        discount,
        total,
      });
      document.getElementById('sim-continue').href = `simulateur-total.html?${params}`;
    }

    function update() { renderFormulas(); renderTotal(); }

    // Listeners pages
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        pages = parseInt(btn.dataset.pages) || 6;
        update();
      });
    });
    // Listeners features
    document.querySelectorAll('.sim-chip[data-feature]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const f = chip.dataset.feature;
        features.has(f) ? features.delete(f) : features.add(f);
        update();
      });
    });
    // Listeners options
    document.querySelectorAll('.sim-chip[data-option]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const o = chip.dataset.option;
        optData[o] = { price: parseInt(chip.dataset.price)||0, monthly: parseInt(chip.dataset.monthly)||0 };
        options.has(o) ? options.delete(o) : options.add(o);
        update();
      });
    });
    // Listeners durée
    document.querySelectorAll('.dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        months   = parseInt(btn.dataset.months)   || 1;
        discount = parseInt(btn.dataset.discount) || 0;
        renderTotal();
      });
    });

    update();
  }

  /* ── SIMULATEUR — PAGE 3 (simulateur-total.html) ── */
  function initSimulateurTotal() {
    const el = document.getElementById('total-content');
    if (!el) return;

    const p        = new URLSearchParams(location.search);
    const fn       = p.get('fn')       || 'Starter';
    const cr       = parseInt(p.get('cr'))       || 100;
    const mo       = parseInt(p.get('mo'))       || 15;
    const months   = parseInt(p.get('months'))   || 1;
    const discount = parseInt(p.get('discount')) || 0;
    const total    = parseInt(p.get('total'))    || cr;
    const mDisc    = Math.round(mo * (1 - discount/100));
    const mTotal   = Math.round(mDisc * months);
    const saving   = discount > 0 ? Math.round(mo * months * discount/100) : 0;

    el.innerHTML = `
      <div class="sim-total-box">
        <span class="sim-rec-label">Votre simulation</span>
        <div class="sim-total-rows">
          <div class="sim-total-row"><span>Formule</span><strong>${fn}</strong></div>
          <div class="sim-total-row"><span>Durée</span><strong>${months === 12 ? '1 an' : months + ' mois'}</strong></div>
          <div class="sim-total-row"><span>Création du site</span><strong>${cr}€</strong></div>
          <div class="sim-total-row"><span>Maintenance mensuelle</span><strong>${mDisc}€ / mois${discount > 0 ? ` <em>−${discount}%</em>` : ''}</strong></div>
          <div class="sim-total-row"><span>Maintenance totale (${months} mois)</span><strong>${mTotal}€</strong></div>
          ${saving > 0 ? `<div class="sim-total-row sim-total-saving"><span>Économie sur l'abonnement</span><strong>−${saving}€</strong></div>` : ''}
          <div class="sim-total-row sim-total-grand"><span>Total à régler</span><strong>${total}€</strong></div>
        </div>
        <p class="sim-total-note">Ce tarif est une estimation. Le prix final sera confirmé après étude de votre projet.</p>
        <a href="contact.html" class="btn btn-primary sim-contact-btn">Nous contacter →</a>
        <a href="simulateur.html" class="sim-restart">Recommencer une simulation</a>
      </div>`;
  }

  initSimulator();
  initSimulateurTotal();

});
