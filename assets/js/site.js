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
