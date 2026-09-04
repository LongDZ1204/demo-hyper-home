(() => {
  const toc = document.querySelector('.toc');
  if (!toc) return;

  const panel = toc.querySelector('.toc-panel');
  const tocLinks = [...toc.querySelectorAll('.toc-list a[href^="#"]')];
  const tracked = tocLinks
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      return { link, heading: id ? document.getElementById(id) : null };
    })
    .filter(({ heading }) => heading);

  const setGroupExpanded = (toggle, expanded) => {
    const targetId = toggle.getAttribute('aria-controls');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const label = toggle.dataset.tocLabel || 'this section';
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute(
      'aria-label',
      `${expanded ? 'Collapse' : 'Expand'} subsections under ${label}`
    );
    target.hidden = !expanded;
  };

  toc.querySelectorAll('[data-toc-label][aria-controls]').forEach((toggle) => {
    const group = toggle.closest('.toc-list-item--group');

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setGroupExpanded(toggle, !isOpen);
      group?.classList.toggle('is-user-collapsed', isOpen);
    });
  });

  let activeLink = null;
  let activeGroup = null;
  let ticking = false;

  const keepActiveVisible = (link) => {
    if (!toc.open || !panel || !link) return;

    const panelRect = panel.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const title = panel.querySelector('.toc-panel-title');
    const safeTop = panelRect.top + (title?.getBoundingClientRect().height || 0) + 22;
    const safeBottom = panelRect.bottom - 18;

    if (linkRect.top < safeTop) {
      panel.scrollTo({ top: panel.scrollTop + linkRect.top - safeTop - 8, behavior: 'smooth' });
    } else if (linkRect.bottom > safeBottom) {
      panel.scrollTo({ top: panel.scrollTop + linkRect.bottom - safeBottom + 8, behavior: 'smooth' });
    }
  };

  const syncActiveHeading = () => {
    ticking = false;
    if (!tracked.length) return;

    const chromeHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--chrome-h')
    ) || 0;
    const activationLine = document.documentElement.classList.contains('chrome-off')
      ? 40
      : chromeHeight + 32;

    let current = tracked[0];
    tracked.forEach((entry) => {
      if (entry.heading.getBoundingClientRect().top <= activationLine) current = entry;
    });

    if (current.link === activeLink) return;

    activeLink?.removeAttribute('aria-current');
    current.link.setAttribute('aria-current', 'location');
    activeLink = current.link;

    const nextGroup = current.link.closest('.toc-list-item--group');
    if (nextGroup !== activeGroup) {
      activeGroup?.classList.remove('is-user-collapsed');
      activeGroup = nextGroup;
    }

    if (activeGroup && !activeGroup.classList.contains('is-user-collapsed')) {
      const toggle = activeGroup.querySelector('.toc-section-toggle');
      if (toggle) setGroupExpanded(toggle, true);
    }

    requestAnimationFrame(() => keepActiveVisible(current.link));
  };

  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncActiveHeading);
  };

  toc.addEventListener('toggle', () => {
    if (toc.open) requestAnimationFrame(() => {
      syncActiveHeading();
      keepActiveVisible(activeLink);
    });
  });

  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync, { passive: true });
  syncActiveHeading();
})();
