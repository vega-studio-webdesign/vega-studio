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


  /* ── Aperçus téléphone ──
     Un seul aperçu visible à la fois. Il défile de haut en bas à
     vitesse constante, marque un temps d'arrêt en bas, puis cède la
     place au suivant en fondu.

     La durée est proportionnelle à la hauteur réelle de l'image et
     non fixe : à vitesse constante, un modèle deux fois plus long
     doit prendre deux fois plus de temps, sinon le défilement
     s'emballe sur les pages longues.

     Le cycle ne tourne que lorsque le téléphone est à l'écran. Une
     animation qui continue hors champ consomme du GPU pour rien et
     fait chauffer les portables. */
  const screen = document.querySelector('.phone-screen');

  if (screen) {
    const shots = [...screen.querySelectorAll('.shot')];
    const dots  = [...document.querySelectorAll('.phone-dots i')];
    const nameEl  = document.querySelector('.phone-name');
    const tradeEl = document.querySelector('.phone-trade');

    const VITESSE = 118;   // pixels par seconde, proche d'un défilement humain
    const PAUSE   = 900;   // arrêt en haut et en bas, en millisecondes

    let i = 0, timer = null, visible = false;
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)');

    const afficher = (n) => {
      shots.forEach((s, k) => s.classList.toggle('is-on', k === n));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === n));
      const s = shots[n];
      if (nameEl)  nameEl.textContent  = s.dataset.name  || '';
      if (tradeEl) tradeEl.textContent = s.dataset.trade || '';
    };

    const jouer = () => {
      clearTimeout(timer);
      if (!visible) return;

      const img = shots[i].querySelector('img');
      const course = img.offsetHeight - screen.clientHeight;

      // Image pas encore décodée : on repasse au prochain rendu.
      if (course <= 0) { timer = setTimeout(jouer, 300); return; }

      if (calme.matches) {
        img.style.transition = 'none';
        img.style.transform  = 'translateY(0)';
        timer = setTimeout(suivant, 4000);
        return;
      }

      const duree = (course / VITESSE) * 1000;
      img.style.transition = 'none';
      img.style.transform  = 'translateY(0)';

      // Deux images imbriquées : la première laisse le navigateur
      // appliquer la position de départ, sinon la transition part
      // de la valeur précédente et l'aperçu saute.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        timer = setTimeout(() => {
          img.style.transition = `transform ${duree}ms linear`;
          img.style.transform  = `translateY(${-course}px)`;
          timer = setTimeout(suivant, duree + PAUSE);
        }, PAUSE);
      }));
    };

    const suivant = () => {
      const prec = shots[i].querySelector('img');
      i = (i + 1) % shots.length;
      afficher(i);
      // On remet l'aperçu sortant en haut une fois le fondu terminé,
      // pour qu'il ne réapparaisse pas en pleine course au tour suivant.
      setTimeout(() => { prec.style.transition = 'none'; prec.style.transform = 'translateY(0)'; }, 800);
      jouer();
    };

    afficher(0);

    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const avant = visible;
        visible = e.isIntersecting;
        if (visible && !avant) jouer();
        if (!visible) clearTimeout(timer);
      });
    }, { threshold: 0.15 }).observe(screen);
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
