// =============================================================================
// Cape Private Tours — Split-Screen Visual Concierge Bootstrap
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { initBookingWizard } from './ui/bookingWizard.js';
import { mountStaticIcons } from './ui/icons.js';

//------------------------------------------------------------------------------------//
/**
 * Initializes local icon masks and the 2-step Split-Screen Visual Concierge.
 * @returns {void}
 */
function initBookingPage() {
  mountStaticIcons();
  initBookingWizard();
}

//------------------------------------------------------------------------------------//
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingPage);
} else {
  initBookingPage();
}

//------------------------------End of file---------------------------------------------------//
