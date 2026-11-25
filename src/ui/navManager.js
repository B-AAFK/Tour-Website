// =============================================================================
// Cape Private Tours — Navigation Bar & Mobile Slide-Down Drawer Manager
// =============================================================================

import { applyIconToElement } from './icons.js';

//------------------------------------------------------------------------------------//
/**
 * Configures the transparent-to-solid scroll transition and mobile drawer controls.
 * @param {boolean} [alwaysScrolled=false] - Keep navbar solid regardless of scroll position.
 * @returns {void}
 */
export function initNavigation(alwaysScrolled = false) {
  const navEl = document.querySelector('.site-nav');
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const drawerEl = document.getElementById('mobile-nav-drawer');

  if (navEl && !alwaysScrolled) {
    const updateNavState = () => {
      const isDrawerOpen = drawerEl ? drawerEl.classList.contains('is-open') : false;
      navEl.classList.toggle('is-scrolled', window.scrollY > 60 || isDrawerOpen);
    };
    window.addEventListener('scroll', updateNavState, { passive: true });
    updateNavState();
  }

  if (!toggleBtn || !drawerEl) return;

  const iconEl = toggleBtn.querySelector('.icon-glyph');

  function setDrawerOpen(open) {
    drawerEl.classList.toggle('is-open', open);
    drawerEl.setAttribute('aria-hidden', String(!open));
    toggleBtn.setAttribute('aria-expanded', String(open));
    toggleBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

    if (iconEl) {
      applyIconToElement(iconEl, open ? 'close' : 'menu');
    }

    if (navEl && !alwaysScrolled) {
      navEl.classList.toggle('is-scrolled', window.scrollY > 60 || open);
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawerEl.classList.contains('is-open');
    setDrawerOpen(!isOpen);
  });

  drawerEl.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setDrawerOpen(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerEl.classList.contains('is-open')) {
      setDrawerOpen(false);
      toggleBtn.focus();
    }
  });
}

//------------------------------End of file---------------------------------------------------//
