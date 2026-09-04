(() => {
  document.querySelectorAll('[data-toc-label][aria-controls]').forEach((toggle) => {
    const targetId = toggle.getAttribute('aria-controls');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      const label = toggle.dataset.tocLabel || 'this section';

      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute(
        'aria-label',
        `${isOpen ? 'Expand' : 'Collapse'} subsections under ${label}`
      );
      target.hidden = isOpen;
    });
  });
})();
