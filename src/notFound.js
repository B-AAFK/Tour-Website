// =============================================================================
// Cape Private Tours — Branded 404 Page Bootstrap
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { mountStaticIcons } from './ui/icons.js';

//------------------------------------------------------------------------------------//
/**
 * Hydrates static icon masks on the 404 error page.
 * @returns {void}
 */
function initNotFoundPage() {
  mountStaticIcons();
}

//------------------------------------------------------------------------------------//
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotFoundPage);
} else {
  initNotFoundPage();
}

//------------------------------End of file---------------------------------------------------//
