// =============================================================================
// Cape Private Tours — Local Icons8 Asset Registry & Helper
// =============================================================================

import arrowDownUrl from '../assets/icons/arrow-down.png';
import arrowLeftUrl from '../assets/icons/arrow-left.png';
import arrowRightUrl from '../assets/icons/arrow-right.png';
import calendarUrl from '../assets/icons/calendar.png';
import carUrl from '../assets/icons/car.png';
import checkCircleUrl from '../assets/icons/check-circle.png';
import cityUrl from '../assets/icons/city.png';
import clockUrl from '../assets/icons/clock.png';
import closeUrl from '../assets/icons/close.png';
import cloudSunUrl from '../assets/icons/cloud-sun.png';
import compassUrl from '../assets/icons/compass.png';
import editUrl from '../assets/icons/edit.png';
import leafUrl from '../assets/icons/leaf.png';
import lighthouseUrl from '../assets/icons/lighthouse.png';
import locationUrl from '../assets/icons/location.png';
import menuUrl from '../assets/icons/menu.png';
import mountainUrl from '../assets/icons/mountain.png';
import penguinUrl from '../assets/icons/penguin.png';
import quoteUrl from '../assets/icons/quote.png';
import roadUrl from '../assets/icons/road.png';
import seaWavesUrl from '../assets/icons/sea-waves.png';
import starFilledUrl from '../assets/icons/star-filled.png';
import starOutlineUrl from '../assets/icons/star-outline.png';
import sunUrl from '../assets/icons/sun.png';
import usersUrl from '../assets/icons/users.png';
import utensilsUrl from '../assets/icons/utensils.png';
import windUrl from '../assets/icons/wind.png';
import wineUrl from '../assets/icons/wine.png';

export const ICON_URLS = {
  'arrow-down': arrowDownUrl,
  'arrow-left': arrowLeftUrl,
  'arrow-right': arrowRightUrl,
  calendar: calendarUrl,
  car: carUrl,
  'check-circle': checkCircleUrl,
  city: cityUrl,
  clock: clockUrl,
  close: closeUrl,
  'cloud-sun': cloudSunUrl,
  compass: compassUrl,
  edit: editUrl,
  leaf: leafUrl,
  lighthouse: lighthouseUrl,
  location: locationUrl,
  menu: menuUrl,
  mountain: mountainUrl,
  penguin: penguinUrl,
  quote: quoteUrl,
  road: roadUrl,
  'sea-waves': seaWavesUrl,
  'star-filled': starFilledUrl,
  'star-outline': starOutlineUrl,
  sun: sunUrl,
  users: usersUrl,
  utensils: utensilsUrl,
  wind: windUrl,
  wine: wineUrl
};

//------------------------------------------------------------------------------------//
/**
 * Returns HTML markup for a local Icons8 monochrome icon tinted via CSS currentColor.
 * @param {string} name - Key from ICON_URLS.
 * @param {string} [extraClass=''] - Additional CSS class names.
 * @returns {string} HTML span markup for the masked icon.
 */
export function getIconMarkup(name, extraClass = '') {
  const url = ICON_URLS[name];
  if (!url) return '';
  const cls = extraClass ? `icon-glyph ${extraClass}` : 'icon-glyph';
  return `<span class="${cls}" style="--icon-src: url('${url}')" aria-hidden="true"></span>`;
}

//------------------------------------------------------------------------------------//
/**
 * Applies a local Icons8 icon mask URL to an existing DOM element.
 * @param {HTMLElement} el - Target icon container element.
 * @param {string} name - Key from ICON_URLS.
 * @returns {void}
 */
export function applyIconToElement(el, name) {
  if (!el) return;
  const url = ICON_URLS[name];
  if (!url) return;
  el.classList.add('icon-glyph');
  el.style.setProperty('--icon-src', `url('${url}')`);
  if (!el.hasAttribute('aria-hidden')) {
    el.setAttribute('aria-hidden', 'true');
  }
}

//------------------------------------------------------------------------------------//
/**
 * Hydrates all static [data-icon] placeholder elements in the current document.
 * @param {ParentNode} [root=document] - Root node to search for [data-icon] placeholders.
 * @returns {void}
 */
export function mountStaticIcons(root = document) {
  const slots = root.querySelectorAll('[data-icon]');
  slots.forEach((slot) => {
    const iconName = slot.getAttribute('data-icon');
    if (iconName) {
      applyIconToElement(slot, iconName);
    }
  });
}

//------------------------------End of file---------------------------------------------------//
