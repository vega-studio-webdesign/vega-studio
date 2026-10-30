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


  /* ── Écran du téléphone ──
     Un cycle, quatre temps : pause en haut, défilement intégral à
     vitesse constante, pause en bas, puis fondu court vers le modèle
     suivant qui démarre en haut de sa page.

     La durée suit la hauteur réelle de chaque image. À vitesse
     constante, un site deux fois plus long doit prendre deux fois
     plus de temps ; une durée fixe ferait filer les pages longues.

     Le cycle ne tourne que lorsque le téléphone est visible : une
     animation qui continue hors champ consomme du GPU pour rien. */
  const screen = document.querySelector('.phone-screen');

  if (screen) {
    const phone = document.querySelector('.phone');
    const stage = document.querySelector('.stage');
    const shots = [...screen.querySelectorAll('.shot')];

    const VITESSE = 125;   // pixels par seconde, proche d'une lecture au pouce
    const HAUT    = 700;   // pause en haut de page
    const BAS     = 550;   // pause en bas de page
    const FONDU   = 280;   // durée du fondu entre deux modèles

    const calme = window.matchMedia('(prefers-reduced-motion: reduce)');
    let i = 0, t = null, actif = false;

    const haut = (img) => { img.style.transition = 'none'; img.style.transform = 'translateY(0)'; };

    const cycle = () => {
      clearTimeout(t);
      if (!actif) return;

      const img = shots[i].querySelector('img');
      const course = img.offsetHeight - screen.clientHeight;

      // Image pas encore décodée : on repasse au rendu suivant.
      if (course <= 0) { t = setTimeout(cycle, 250); return; }

      haut(img);

      if (calme.matches) { t = setTimeout(suivant, 3500); return; }

      const duree = (course / VITESSE) * 1000;

      // Double rAF : la première image laisse le navigateur appliquer
      // la position de départ. Sans elle la transition part de la
      // valeur précédente et l'aperçu saute.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        t = setTimeout(() => {
          img.style.transition = `transform ${duree}ms linear`;
          img.style.transform  = `translateY(${-course}px)`;
          t = setTimeout(suivant, duree + BAS);
        }, HAUT);
      }));
    };

    const suivant = () => {
      const sortant = shots[i];
      const entrant = shots[(i + 1) % shots.length];

      // L'entrant est remis en haut AVANT d'apparaître, pour qu'on
      // ne le voie jamais reprendre en pleine course.
      haut(entrant.querySelector('img'));

      sortant.style.transition = `opacity ${FONDU}ms linear`;
      entrant.style.transition = `opacity ${FONDU}ms linear`;
      sortant.classList.remove('is-on');
      entrant.classList.add('is-on');

      i = (i + 1) % shots.length;
      t = setTimeout(() => { haut(sortant.querySelector('img')); cycle(); }, FONDU);
    };

    // Le téléphone n'apparaît que pendant la scène, et il est fixé au
    // viewport : hors de cette zone il flotterait sur le hero.
    if (stage && phone) {
      new IntersectionObserver((es) => {
        es.forEach(e => phone.classList.toggle('is-here', e.isIntersecting));
      }, { rootMargin: '-10% 0px -10% 0px' }).observe(stage);
    }

    new IntersectionObserver((es) => {
      es.forEach(e => {
        const avant = actif;
        actif = e.isIntersecting;
        if (actif && !avant) cycle();
        if (!actif) clearTimeout(t);
      });
    }, { threshold: 0.1 }).observe(screen);
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
