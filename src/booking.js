// =============================================================================
// Cape Private Tours — Split-Screen Visual Concierge Bootstrap
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { initGlobalErrorHandlers } from './core/errorHandler.js';
import { initBookingWizard } from './ui/bookingWizard.js';
import { mountStaticIcons } from './ui/icons.js';

//------------------------------------------------------------------------------------//
/**
 * Initializes global error handlers, local icon masks, and the 2-step Split-Screen Concierge.
 * @returns {void}
 */
function initBookingPage() {
  initGlobalErrorHandlers();
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
