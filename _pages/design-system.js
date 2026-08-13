(() => {
  const jump = document.querySelector('#dsJump');
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.ds-section-nav a[href^="#"]')];

  jump?.addEventListener('change', () => {
    document.getElementById(jump.value)?.scrollIntoView({ behavior: 'smooth' });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      if (jump) jump.value = id;
      navLinks.forEach((link) => {
        const active = link.hash === `#${id}` || (['spacing', 'shape-motion'].includes(id) && link.hash === '#typography') || (['forms', 'navigation', 'content-components', 'conversion'].includes(id) && link.hash === '#buttons');
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-30% 0px -60%', threshold: [0, .15, .5] });
    sections.forEach((section) => observer.observe(section));
  }

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy || '');
        const label = button.querySelector('span');
        if (label) label.textContent = 'Copied';
        window.setTimeout(() => { if (label) label.textContent = 'Copy'; }, 1400);
      } catch {
        button.title = 'Copy unavailable in this browser';
      }
    });
  });
})();
