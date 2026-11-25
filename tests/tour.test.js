import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import {
  STOPS,
  TOTAL_FRAMES,
  getStopByFrame
} from '../src/config/tourConfig.js';

import {
  buildFrameRegistry,
  getNearestLoadedFrame
} from '../src/core/frameLoader.js';

import {
  stripControlChars,
  normalizeText,
  validateReviewPayload,
  validateInquiryPayload
} from '../src/utils/validator.js';

import {
  REVIEWS_STORAGE_KEY,
  MAX_STORED_REVIEWS,
  SEED_REVIEWS,
  fetchReviews,
  createReview,
  resetReviewServiceState
} from '../src/services/reviewService.js';

import {
  INQUIRIES_STORAGE_KEY,
  submitTourInquiry,
  resetBookingServiceState
} from '../src/services/bookingService.js';

//------------------------------------------------------------------------------------//
describe('1. Centralized Tour Configuration & Destination Stops', () => {
  test('Contains exactly 9 stops with names, regions, regional color tokens, thumbnail frames, and descriptions', () => {
    assert.equal(STOPS.length, 9);
    for (const stop of STOPS) {
      assert.ok(stop.region, `Stop ${stop.name} missing region`);
      assert.ok(stop.regionKey, `Stop ${stop.name} missing regionKey`);
      assert.match(stop.regionColorToken, /^var\(--region-/, `Stop ${stop.name} missing regional CSS token`);
      assert.ok(stop.thumbnailFrame, `Stop ${stop.name} missing thumbnailFrame`);
      const relPath = stop.thumbnailFrame.replace(/^\//, '');
      const diskExists = fs.existsSync(relPath) || fs.existsSync(path.join('public', relPath));
      assert.ok(diskExists, `Thumbnail image missing on disk: ${relPath}`);
      assert.ok(stop.name, 'Stop missing name');
      assert.ok(stop.description, `Stop ${stop.name} missing description`);
      assert.doesNotMatch(stop.name, /^\d{2}\s*\//, 'Stop name must not contain numerical step prefix like 01 /');
    }
  });

  test('Preserves exact required frame bounds for all 9 stops', () => {
    const expected = [
      { id: 1, region: 'City Bowl', name: 'Bo-Kaap', start: 0, end: 22 },
      { id: 2, region: 'Atlantic Seaboard', name: "Lion's Head", start: 34, end: 71 },
      { id: 3, region: 'City Bowl', name: 'Table Mountain', start: 90, end: 126 },
      { id: 4, region: 'False Bay', name: 'Boulders Beach', start: 156, end: 198 },
      { id: 5, region: 'Cape Peninsula', name: 'Cape of Good Hope', start: 218, end: 263 },
      { id: 6, region: 'Cape Peninsula', name: 'Cape Point Nature Reserve', start: 272, end: 308 },
      { id: 7, region: 'Southern Suburbs', name: 'Kirstenbosch Gardens', start: 318, end: 363 },
      { id: 8, region: 'Constantia Valley', name: 'Groot Constantia', start: 378, end: 422 },
      { id: 9, region: 'Cape Winelands', name: 'Franschhoek Winelands', start: 434, end: 449 }
    ];

    for (let i = 0; i < expected.length; i++) {
      const exp = expected[i];
      const actual = STOPS[i];
      assert.equal(actual.id, exp.id);
      assert.equal(actual.name, exp.name);
      assert.equal(actual.startFrame, exp.start);
      assert.equal(actual.endFrame, exp.end);
    }
  });

  test('Resolves active stops and returns null during transition dead-zones', () => {
    assert.equal(getStopByFrame(0)?.name, 'Bo-Kaap');
    assert.equal(getStopByFrame(22)?.name, 'Bo-Kaap');
    assert.equal(getStopByFrame(23), null);

    assert.equal(getStopByFrame(34)?.name, "Lion's Head");
    assert.equal(getStopByFrame(71)?.name, "Lion's Head");
    assert.equal(getStopByFrame(72), null);

    assert.equal(getStopByFrame(90)?.name, 'Table Mountain');
    assert.equal(getStopByFrame(126)?.name, 'Table Mountain');

    assert.equal(getStopByFrame(156)?.name, 'Boulders Beach');
    assert.equal(getStopByFrame(198)?.name, 'Boulders Beach');

    assert.equal(getStopByFrame(218)?.name, 'Cape of Good Hope');
    assert.equal(getStopByFrame(263)?.name, 'Cape of Good Hope');

    assert.equal(getStopByFrame(272)?.name, 'Cape Point Nature Reserve');
    assert.equal(getStopByFrame(308)?.name, 'Cape Point Nature Reserve');

    assert.equal(getStopByFrame(318)?.name, 'Kirstenbosch Gardens');
    assert.equal(getStopByFrame(363)?.name, 'Kirstenbosch Gardens');

    assert.equal(getStopByFrame(378)?.name, 'Groot Constantia');
    assert.equal(getStopByFrame(422)?.name, 'Groot Constantia');

    assert.equal(getStopByFrame(434)?.name, 'Franschhoek Winelands');
    assert.equal(getStopByFrame(449)?.name, 'Franschhoek Winelands');
  });
});

//------------------------------------------------------------------------------------//
describe('2. Frame Registry & Progressive Loader Logic', () => {
  test('Builds registry with exactly 450 frames and correct WebP paths', () => {
    const registry = buildFrameRegistry();
    assert.equal(registry.length, TOTAL_FRAMES);
    assert.equal(registry.length, 450);

    assert.equal(registry[0].url, '/frames/com-part-1/ezgif-frame-001.webp');
    assert.equal(registry[149].url, '/frames/com-part-1/ezgif-frame-299.webp');
    assert.equal(registry[150].url, '/frames/com-part-2/ezgif-frame-001.webp');
    assert.equal(registry[299].url, '/frames/com-part-2/ezgif-frame-299.webp');
    assert.equal(registry[300].url, '/frames/com-part-3/ezgif-frame-001.webp');
    assert.equal(registry[449].url, '/frames/com-part-3/ezgif-frame-299.webp');

    for (const frame of registry) {
      const diskPath = frame.url.replace(/^\//, '');
      assert.ok(fs.existsSync(diskPath), `Frame file missing on disk: ${diskPath}`);
    }
  });

  test('Nearest loaded frame fallback searches backward then forward', () => {
    const registry = buildFrameRegistry();
    assert.equal(getNearestLoadedFrame(10), null);

    registry[5].loaded = true;
    registry[5].img = { width: 1920, height: 1080 };

    assert.equal(getNearestLoadedFrame(5)?.index, 5);
    assert.equal(getNearestLoadedFrame(10)?.index, 5);
    assert.equal(getNearestLoadedFrame(2)?.index, 5);

    registry[15].loaded = true;
    registry[15].img = { width: 1920, height: 1080 };

    assert.equal(getNearestLoadedFrame(12)?.index, 5);
    assert.equal(getNearestLoadedFrame(18)?.index, 15);
  });
});

//------------------------------------------------------------------------------------//
describe('3. Semantic Structure, Interactive Features & Local Icons8 Assets', () => {
  test('index.html contains landing sections, mobile drawer, chapter scrubber, weather widget, and star picker', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    assert.ok(html.includes('CAPE PRIVATE TOURS'));
    assert.ok(html.includes('id="mobile-nav-toggle"'));
    assert.ok(html.includes('id="mobile-nav-drawer"'));

    assert.ok(html.includes('id="hero"'));
    assert.ok(html.includes('hero-scrim-overlay'));

    const tokensCss = fs.readFileSync('src/styles/tokens.css', 'utf8');
    assert.ok(tokensCss.includes('--scrim-top'));
    assert.ok(tokensCss.includes('--scrim-bottom'));

    assert.ok(html.includes('id="explore"'));
    assert.ok(html.includes('What Cape Town Has to Offer'));
    assert.ok(html.includes('id="sequence-canvas"'));
    assert.ok(html.includes('id="canvas-loader"'));
    assert.ok(html.includes('id="travelogue-caption-bar"'));
    assert.ok(html.includes('id="caption-name"'));
    assert.ok(html.includes('id="caption-progress-fill"'));
    assert.ok(html.includes('id="chapter-scrubber"'));

    assert.ok(html.includes('ndebele-rule'));
    assert.ok(html.includes('id="guide-weather-widget"'));
    assert.ok(html.includes('id="review-star-picker"'));
    assert.ok(html.includes('id="reviews-grid"'));
    assert.ok(!html.includes('id="debug-hud"'));
    assert.ok(!fs.existsSync('src/ui/debugHud.js'), 'debugHud.js should be removed');

    assert.ok(html.includes('a few of the places I can weave into your private day'));
    assert.ok(html.includes('explored Cape Town and the Peninsula with me'));
    assert.ok(html.includes('Meet Lance Bowes'));
    assert.ok(html.includes('Guided by Lance Bowes.'));
    assert.ok(!html.includes('Icons by'));

    assert.doesNotMatch(html, /\b33\.9212°\b/);
    assert.doesNotMatch(html, /FIG 01/i);
    assert.doesNotMatch(html, /corner-tick/i);
    assert.doesNotMatch(html, /FIELD JOURNAL/i);
  });

  test('booking.html implements 2-step Split-Screen Visual Concierge with zero SaaS card clutter', () => {
    const html = fs.readFileSync('booking.html', 'utf8');
    const wizardCode = fs.readFileSync('src/ui/bookingWizard.js', 'utf8');

    assert.ok(html.includes('concierge-layout'));
    assert.ok(html.includes('concierge-panel'));
    assert.ok(html.includes('concierge-workspace'));
    assert.ok(html.includes('Plan Your Day in Cape Town'));
    assert.ok(html.includes('Back to Home'));
    assert.ok(html.includes('Step 1 of 2'));
    assert.ok(html.includes('id="dest-tiles-grid"'));
    assert.ok(html.includes('id="route-suggest-toggle"'));
    assert.ok(html.includes('concierge-option-row'));
    assert.ok(html.includes('concierge-underline-input'));
    assert.ok(html.includes('id="booking-inquiry-form"'));
    assert.ok(html.includes('id="booking-confirmation"'));
    assert.ok(html.includes('id="confirmation-traveler-name"'));
    assert.ok(html.includes('id="confirmation-summary-details"'));
    assert.ok(html.includes('Guided by Lance Bowes.'));
    assert.ok(html.includes('/images/Chapmans_Peak_Drive.webp'));
    assert.ok(fs.existsSync('public/images/Chapmans_Peak_Drive.webp'));

    // Old 3-step card wizard & pill clutter must be removed
    assert.ok(!html.includes('booking-card'));
    assert.ok(!html.includes('wizard-step-indicator'));
    assert.ok(!html.includes('dest-pill'));
    assert.ok(!html.includes('Icons by'));

    // Concierge controller must render all 9 STOPS thumbnails and handle 2 steps
    assert.ok(wizardCode.includes('STOPS.map'));
    assert.ok(wizardCode.includes('stop.thumbnailFrame'));
    assert.ok(wizardCode.includes('Step 2 of 2'));
  });

  test('All Icons8 local assets declared in icons8.json exist in src/assets/icons/', () => {
    const lock = JSON.parse(fs.readFileSync('icons8.json', 'utf8'));
    const items = Object.entries(lock.icons.items);
    assert.ok(items.length >= 24, 'Expected at least 24 local Icons8 icons');
    for (const [key, entry] of items) {
      assert.ok(fs.existsSync(entry.file), `Missing local Icons8 asset for ${key}: ${entry.file}`);
    }
  });

  test('scrollController.js and overlayManager.js reference valid DOM IDs and chapter scrolling', () => {
    const scrollCode = fs.readFileSync('src/core/scrollController.js', 'utf8');
    const overlayCode = fs.readFileSync('src/ui/overlayManager.js', 'utf8');

    assert.ok(scrollCode.includes("getElementById('explore')"));
    assert.ok(scrollCode.includes('.kill(true)'));
    assert.ok(scrollCode.includes('scrollToFrame'));
    assert.ok(overlayCode.includes("getElementById('caption-name')"));
    assert.ok(overlayCode.includes("getElementById('caption-progress-fill')"));
    assert.ok(overlayCode.includes("getElementById('chapter-scrubber')"));
  });
});

//------------------------------------------------------------------------------------//
describe('4. Design Tokens, Hardcoded Colors, Buzzwords & Formatting Audits', () => {
  test('tokens.css strictly defines South African gallery-neutral palette with zero cream/old hexes', () => {
    const tokens = fs.readFileSync('src/styles/tokens.css', 'utf8');

    const expectedHexes = [
      '#FFFFFF',
      '#F4F5F7',
      '#0E1719',
      '#172427',
      '#121619',
      '#4A5359',
      '#646E75',
      '#D6492A',
      '#B83A1E',
      '#0F2D33',
      '#E09F1F',
      '#176087',
      '#0E7C7B',
      '#1E7A56',
      '#8C2743'
    ];
    for (const hex of expectedHexes) {
      assert.ok(tokens.includes(hex), `Missing South African design token color: ${hex}`);
    }

    assert.doesNotMatch(tokens, /#FAF8F5/i);
    assert.doesNotMatch(tokens, /#F2ECE2/i);
    assert.doesNotMatch(tokens, /#1B241E/i);
    assert.doesNotMatch(tokens, /#B35432/i);
    assert.doesNotMatch(tokens, /#F3F4F6/i);
    assert.doesNotMatch(tokens, /#11171A/i);
    assert.doesNotMatch(tokens, /#B85D2A/i);
  });

  test('Zero hardcoded colors exist outside tokens.css', () => {
    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
    const rgbRegex = /\brgba?\([^)]+\)/g;

    function checkDir(dir) {
      for (const item of fs.readdirSync(dir)) {
        if (['node_modules', '.git', '.vite', 'dist', 'frames', 'scripts', 'tests'].includes(item)) continue;
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          checkDir(full);
        } else if (/\.(html|js|css)$/.test(item)) {
          if (item === 'tokens.css') continue;
          const content = fs.readFileSync(full, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            const hex = line.match(hexRegex);
            const rgb = line.match(rgbRegex);
            assert.equal(hex, null, `Found HEX color in ${full} line ${idx + 1}: ${line.trim()}`);
            assert.equal(rgb, null, `Found RGB color in ${full} line ${idx + 1}: ${line.trim()}`);
          });
        }
      }
    }

    checkDir('.');
  });

  test('Zero external CDN references, emojis, or banned AI buzzwords in HTML/CSS/JS', () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const cdnRegex = /(cdnjs\.cloudflare\.com|unpkg\.com|jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|code\.jquery\.com|img\.icons8\.com)/i;
    const buzzwordRegex = /\b(bespoke|unhurried|formulate|seamless|curated|travel rhythm|nuanced geography|authentic South African hospitality|elevate|tailor-made proposal)\b/i;

    function checkDir(dir) {
      for (const item of fs.readdirSync(dir)) {
        if (['node_modules', '.git', '.vite', 'dist', 'frames', 'scripts', 'tests'].includes(item)) continue;
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          checkDir(full);
        } else if (/\.(html|js|css)$/.test(item)) {
          const content = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(content, emojiRegex, `Emoji found in ${full}`);
          assert.doesNotMatch(content, cdnRegex, `External CDN/hotlink found in ${full}`);
          assert.doesNotMatch(content, buzzwordRegex, `Banned buzzword found in ${full}`);
        }
      }
    }

    checkDir('.');
  });

  test('All code, CSS, and HTML files adhere to end-of-file markers', () => {
    const jsFiles = [
      'src/main.js',
      'src/booking.js',
      'src/notFound.js',
      'src/config/tourConfig.js',
      'src/core/canvasRenderer.js',
      'src/core/errorHandler.js',
      'src/core/frameLoader.js',
      'src/core/scrollController.js',
      'src/services/bookingService.js',
      'src/services/reviewService.js',
      'src/utils/validator.js',
      'src/ui/bookingWizard.js',
      'src/ui/overlayManager.js',
      'src/ui/reviewManager.js',
      'src/ui/guideWeather.js',
      'src/ui/navManager.js',
      'src/ui/icons.js',
      'vite.config.js'
    ];

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8').trim();
      assert.ok(
        content.endsWith('//------------------------------End of file---------------------------------------------------//'),
        `File ${file} does not end with required end-of-file comment`
      );
    }

    const cssFiles = [
      'src/styles/tokens.css',
      'src/styles/base.css',
      'src/styles/components.css'
    ];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8').trim();
      assert.ok(
        content.endsWith('/* ------------------------------End of file--------------------------------------------------- */'),
        `File ${file} does not end with required end-of-file comment`
      );
    }

    const htmlFiles = ['index.html', 'booking.html', '404.html'];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8').trim();
      assert.ok(
        content.endsWith('<!-- ------------------------------End of file--------------------------------------------------- -->'),
        `File ${file} does not end with required end-of-file comment`
      );
    }
  });
});

//------------------------------------------------------------------------------------//
describe('5. Input Validation, Service Adapters & Anti-Bot Controls', () => {
  function withMockStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    const prev = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    };
    return () => {
      globalThis.localStorage = prev;
    };
  }

  test('validator.js normalizes text, rejects invalid inputs, and supports suggestRoute', () => {
    assert.equal(stripControlChars('Hello\x00World\x07'), 'Hello World ');
    assert.equal(normalizeText('  Cape   Town  ', 5), 'Cape');

    const badReview = validateReviewPayload({
      name: 'A',
      location: 'X',
      rating: 6,
      quote: 'short'
    });
    assert.equal(badReview.valid, false);
    assert.ok(badReview.errors.name);
    assert.ok(badReview.errors.location);
    assert.ok(badReview.errors.rating);
    assert.ok(badReview.errors.quote);

    const xssReview = validateReviewPayload({
      name: '<script>alert(1)</script>',
      location: 'London, UK',
      rating: 5,
      quote: 'Amazing morning on Table Mountain with <img src=x onerror=alert(1)>.'
    });
    assert.equal(xssReview.valid, true);
    assert.equal(xssReview.data.name, '<script>alert(1)</script>');

    const unallowlisted = validateInquiryPayload({
      destinations: ['Injected Place'],
      suggestRoute: false,
      duration: 'Full Day (8 hrs)',
      groupSize: '1–2 Guests',
      name: 'David Vance',
      email: 'david@example.com'
    });
    assert.equal(unallowlisted.valid, false);
    assert.ok(unallowlisted.errors.destinations);

    const suggested = validateInquiryPayload({
      destinations: [],
      suggestRoute: true,
      duration: 'Full Day (8 hrs)',
      groupSize: '1–2 Guests',
      name: 'David Vance',
      email: 'david@example.com',
      phone: '+44 7700 900077'
    });
    assert.equal(suggested.valid, true);
    assert.equal(suggested.data.suggestRoute, true);
    assert.deepEqual(suggested.data.destinations, []);
  });

  test('reviewService recovers from corrupted storage, caps reviews, and enforces honeypot/cooldown', async () => {
    const restore = withMockStorage({ [REVIEWS_STORAGE_KEY]: '{corrupted-json' });
    try {
      resetReviewServiceState();
      const fallback = await fetchReviews();
      assert.equal(fallback.length, SEED_REVIEWS.length);

      const botRes = await createReview(
        { name: 'Bot', location: 'Spam', rating: 5, quote: 'Automated spam submission.' },
        { honeypot: 'http://spam.example', formOpenedAt: 1000, now: 5000 }
      );
      assert.equal(botRes.ok, true);
      assert.equal(botRes.botIgnored, true);

      const tooFast = await createReview(
        { name: 'Fast User', location: 'Berlin', rating: 5, quote: 'Submitted too quickly.' },
        { honeypot: '', formOpenedAt: 5000, now: 5500 }
      );
      assert.equal(tooFast.ok, false);

      const okRes = await createReview(
        { name: 'Sarah Miller', location: 'Boston, USA', rating: 5, quote: 'Wonderful day out along Chapman Peak.' },
        { honeypot: '', formOpenedAt: 1000, now: 10000 }
      );
      assert.equal(okRes.ok, true);

      const cooldownRes = await createReview(
        { name: 'Second Try', location: 'Boston, USA', rating: 5, quote: 'Trying right away again.' },
        { honeypot: '', formOpenedAt: 1000, now: 15000 }
      );
      assert.equal(cooldownRes.ok, false);

      // Verify MAX_STORED_REVIEWS cap
      const oversized = Array.from({ length: MAX_STORED_REVIEWS + 10 }, (_, idx) => ({
        id: `id-${idx}`,
        name: `Guest ${idx}`,
        location: 'Cape Town',
        rating: 5,
        quote: 'Lovely private tour around the Cape Peninsula.'
      }));
      globalThis.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(oversized));
      const capped = await fetchReviews();
      assert.equal(capped.length, MAX_STORED_REVIEWS);
    } finally {
      restore();
    }
  });

  test('bookingService enforces honeypot, timing, validation, and cooldown', async () => {
    const restore = withMockStorage();
    try {
      resetBookingServiceState();
      const botRes = await submitTourInquiry(
        { name: 'Bot', email: 'bot@example.com' },
        { honeypot: 'filled', formOpenedAt: 1000, now: 5000 }
      );
      assert.equal(botRes.ok, true);
      assert.equal(botRes.botIgnored, true);
      assert.equal(globalThis.localStorage.getItem(INQUIRIES_STORAGE_KEY), null);

      const validRes = await submitTourInquiry(
        {
          destinations: ['Bo-Kaap'],
          suggestRoute: false,
          duration: 'Full Day (8 hrs)',
          groupSize: '1–2 Guests',
          name: 'Maya Patel',
          email: 'maya@example.com'
        },
        { honeypot: '', formOpenedAt: 1000, now: 10000 }
      );
      assert.equal(validRes.ok, true);

      const cooldownRes = await submitTourInquiry(
        {
          destinations: [],
          suggestRoute: true,
          duration: 'Half Day (4–5 hrs)',
          groupSize: '3–4 Guests',
          name: 'Maya Patel',
          email: 'maya@example.com'
        },
        { honeypot: '', formOpenedAt: 1000, now: 15000 }
      );
      assert.equal(cooldownRes.ok, false);
    } finally {
      restore();
    }
  });
});

//------------------------------------------------------------------------------------//
describe('6. Security Hardening, Zero innerHTML, Nginx, robots.txt & 404.html', () => {
  test('Zero innerHTML assignments exist anywhere inside src/', () => {
    function scanDir(dir) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (item.endsWith('.js')) {
          const content = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(content, /\.innerHTML\s*=/, `Unsafe innerHTML found in ${full}`);
        }
      }
    }
    scanDir('src');
  });

  test('nginx.conf enforces security headers, rate limits, hotlink guard, and 404 page', () => {
    const nginx = fs.readFileSync('nginx.conf', 'utf8');
    assert.ok(nginx.includes('server_tokens off;'));
    assert.ok(nginx.includes('limit_req_status 429;'));
    assert.ok(nginx.includes('limit_req_zone'));
    assert.ok(nginx.includes('limit_conn_zone'));
    assert.ok(nginx.includes('burst=460 nodelay'));
    assert.ok(nginx.includes('valid_referers'));
    assert.ok(nginx.includes('error_page 404 /404.html;'));
    assert.ok(nginx.includes('Content-Security-Policy'));
    assert.ok(nginx.includes("script-src 'self'"));
    assert.ok(nginx.includes('X-Frame-Options "DENY" always'));
    assert.ok(nginx.includes('Permissions-Policy'));
    assert.ok(nginx.includes('Cross-Origin-Opener-Policy "same-origin" always'));
    assert.ok(nginx.includes('Cross-Origin-Resource-Policy "same-origin" always'));
  });

  test('public/robots.txt and 404.html are configured properly', () => {
    const robots = fs.readFileSync('public/robots.txt', 'utf8');
    assert.ok(robots.includes('Allow: /'));
    assert.ok(robots.includes('Allow: /booking.html'));
    assert.ok(robots.includes('Disallow: /frames/'));

    const notFound = fs.readFileSync('404.html', 'utf8');
    assert.ok(notFound.includes('href="/"'));
    assert.ok(notFound.includes('/src/notFound.js'));
  });
});

//------------------------------End of file---------------------------------------------------//
