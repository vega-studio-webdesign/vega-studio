/* ═══════════════════════════════════════════════════════════════════
   VEGA STUDIO — comportements
   Trois choses, rien de plus : l'état de la barre au défilement, le
   menu mobile, et l'apparition des blocs.
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Barre de navigation ── */
  const nav = document.querySelector('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Menu mobile ── */
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');

  if (burger && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    };

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setOpen(false)));

    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }


  /* ── La démonstration ──
     La fenêtre et le téléphone affichent le même modèle et défilent
     ENSEMBLE, puis basculent sur le suivant d'un seul fondu.

     Les deux images n'ont pas la même longueur : la version bureau
     est plus large donc plus courte en pixels. On calcule donc une
     durée commune à partir de la plus longue course, et chacun se
     déplace à sa propre vitesse pour arriver en bas au même instant.
     Sans ça l'un attendrait l'autre et la synchronisation se verrait.

     Le défilement est le contenu de cette page, pas une décoration :
     sous préférence de mouvement réduit il ralentit, il ne se fige
     pas. Un écran figé ne démontre plus rien. */
  const scene = document.querySelector('.showcase');

  if (scene) {
    const vues = [...scene.querySelectorAll('.screen')];       // .browser-view et .phone-screen
    const legende = document.querySelector('.showcase-name');
    const adresse = document.querySelector('.browser-url');
    const nb = vues[0] ? vues[0].querySelectorAll('.shot').length : 0;

    const HAUT  = 800;   // pause en haut de page
    const BAS   = 650;   // pause en bas de page
    const FONDU = 300;   // fondu entre deux modèles

    const calme = window.matchMedia('(prefers-reduced-motion: reduce)');
    let i = 0, t = null, actif = false;

    const course = (vue, n) => {
      const img = vue.querySelectorAll('.shot')[n].querySelector('img');
      return { img, d: Math.max(0, img.offsetHeight - vue.clientHeight) };
    };

    // Le défilement est piloté image par image en JavaScript, pas par
    // une transition CSS. La règle globale de mouvement réduit porte
    // un !important sur transition-duration : elle écrasait la durée
    // et l'aperçu sautait d'un coup tout en bas, puis restait figé.
    // Un transform posé à chaque frame échappe à cette règle.
    let raf = null;
    const stopper = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const enHaut = (img) => { img.style.transform = 'translateY(0)'; };

    const glisser = (paires, duree, fini) => {
      const t0 = performance.now();
      const pas = (now) => {
        const k = Math.min(1, (now - t0) / duree);
        paires.forEach(p => { p.img.style.transform = `translateY(${-p.d * k}px)`; });
        if (k < 1) raf = requestAnimationFrame(pas); else { raf = null; fini(); }
      };
      raf = requestAnimationFrame(pas);
    };

    const cycle = () => {
      clearTimeout(t); stopper();
      if (!actif || !nb) return;

      const paires = vues.map(v => course(v, i));

      // Images pas encore décodées : on repasse au rendu suivant.
      if (paires.every(p => p.d <= 0)) { t = setTimeout(cycle, 250); return; }

      paires.forEach(p => enHaut(p.img));

      // Vitesse de référence, en pixels par seconde. Sous préférence
      // de mouvement réduit on ralentit : un écran figé ne démontre
      // plus rien, et le défilement est ici le contenu de la page.
      const vitesse = calme.matches ? 55 : 115;
      const duree = (Math.max(...paires.map(p => p.d)) / vitesse) * 1000;

      t = setTimeout(() => {
        glisser(paires, duree, () => { t = setTimeout(suivant, BAS); });
      }, HAUT);
    };

    const suivant = () => {
      stopper();
      const j = (i + 1) % nb;

      vues.forEach(v => {
        const shots = v.querySelectorAll('.shot');
        // L'entrant est remis en haut AVANT d'apparaître, pour qu'on
        // ne le voie jamais reprendre en pleine course.
        enHaut(shots[j].querySelector('img'));
        shots[i].style.transition = `opacity ${FONDU}ms linear`;
        shots[j].style.transition = `opacity ${FONDU}ms linear`;
        shots[i].classList.remove('is-on');
        shots[j].classList.add('is-on');
      });

      const prec = i; i = j;
      nommer(i);
      t = setTimeout(() => {
        vues.forEach(v => enHaut(v.querySelectorAll('.shot')[prec].querySelector('img')));
        cycle();
      }, FONDU);
    };

    // L'adresse du navigateur nomme le site affiché : une barre
    // d'adresse figée sur un domaine pendant qu'un autre site défile
    // dessous trahit immédiatement le montage.
    const nommer = (n) => {
      const d = vues[0].querySelectorAll('.shot')[n].dataset;
      if (legende) legende.textContent = d.name || '';
      if (adresse) adresse.textContent = d.url || '';
    };
    if (vues[0]) nommer(0);

    // Le cycle ne tourne que lorsque la démonstration est à l'écran :
    // une animation qui continue hors champ consomme du GPU pour rien.
    new IntersectionObserver((es) => {
      es.forEach(e => {
        const avant = actif;
        actif = e.isIntersecting;
        if (actif && !avant) cycle();
        if (!actif) { clearTimeout(t); stopper(); }
      });
    }, { threshold: 0.08 }).observe(scene);
  }

  /* ── Apparitions ──
     Marge basse négative : le bloc se déclenche quand il est vraiment
     entré dans le cadre, pas dès que son premier pixel affleure. */
  const reveals = document.querySelectorAll('.reveal');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (still || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  reveals.forEach(el => obs.observe(el));
});
