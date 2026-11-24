// =============================================================================
// Cape Private Tours — Progressive Booking Wizard Bootstrap
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { initBookingWizard } from './ui/bookingWizard.js';

//------------------------------------------------------------------------------------//
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingWizard);
} else {
  initBookingWizard();
}

//------------------------------End of file---------------------------------------------------//