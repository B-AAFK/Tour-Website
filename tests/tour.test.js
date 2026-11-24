import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import {
  STOPS,
  PARTS,
  FRAME_STEP,
  TOTAL_FRAMES,
  INITIAL_LOAD_TARGET,
  getStopByFrame
} from '../src/config/tourConfig.js';

import {
  buildFrameRegistry,
  getNearestLoadedFrame
} from '../src/core/frameLoader.js';

//------------------------------------------------------------------------------------//
describe('1. Centralized Tour Configuration & Destination Stops', () => {
  test('Contains exactly 9 stops with names and descriptions', () => {
    assert.equal(STOPS.length, 9);
    for (const stop of STOPS) {
      assert.ok(stop.region, `Stop ${stop.name} missing region`);
      assert.ok(stop.name, `Stop missing name`);
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
describe('3. Hospitality Semantic Structure & Clean UI Integrity', () => {
  test('index.html contains boutique hospitality sections and navigation', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    // Navigation and Branding
    assert.ok(html.includes('CAPE PRIVATE TOURS'));
    assert.ok(html.includes('href="#explore"'));
    assert.ok(html.includes('href="#guide"'));
    assert.ok(html.includes('href="#reviews"'));
    assert.ok(html.includes('href="booking.html"'));

    // Hero Section
    assert.ok(html.includes('id="hero"'));
    assert.ok(html.includes('hero-headline'));
    assert.ok(html.includes('hero-scrim-overlay'));

    const tokensCss = fs.readFileSync('src/styles/tokens.css', 'utf8');
    assert.ok(tokensCss.includes('--color-scrim-top'));
    assert.ok(tokensCss.includes('--color-scrim-bottom'));

    // Showcase Section: Cinema Frame is the sole showcase
    assert.ok(html.includes('id="explore"'));
    assert.ok(html.includes('What Cape Town Has to Offer'));
    assert.ok(html.includes('id="sequence-canvas"'));
    assert.ok(html.includes('id="canvas-loader"'));
    assert.ok(html.includes('id="travelogue-caption-bar"'));
    assert.ok(html.includes('id="caption-name"'));
    assert.ok(html.includes('id="caption-progress-fill"'));

    // Split View toggle buttons removed
    assert.ok(!html.includes('btn-toggle-option-a'));
    assert.ok(!html.includes('btn-toggle-option-b'));

    // Cinema Frame active metadata overlay elements
    assert.ok(html.includes('id="caption-name"'));
    assert.ok(html.includes('id="caption-progress-fill"'));

    // Solo guide first-person copy checks
    assert.ok(html.includes('a few of the places I can weave into your private day'));
    assert.ok(html.includes('explored Cape Town and the Peninsula with me'));
    assert.ok(html.includes('Meet Johan Brink'));
    assert.ok(html.includes('Weather &amp; Light First'));
    assert.ok(html.includes('Your Vehicle, Your Pace'));
    assert.ok(html.includes('Local Tables &amp; Cellars'));

    // Reviews section
    assert.ok(html.includes('id="reviews"'));
    assert.ok(html.includes('id="btn-toggle-review-form"'));
    assert.ok(html.includes('id="reviews-grid"'));

    // Stylesheets linked in head for instant first paint
    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/tokens.css">'));
    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/base.css">'));
    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/components.css">'));

    // Debug HUD
    assert.ok(html.includes('id="debug-hud"'));

    // Ensure NO wireframe clutter or GPS coordinates in index.html
    assert.doesNotMatch(html, /\b33\.9212°\b/);
    assert.doesNotMatch(html, /FIG 01/i);
    assert.doesNotMatch(html, /corner-tick/i);
    assert.doesNotMatch(html, /FIELD JOURNAL/i);
  });

  test('booking.html contains calm 3-step wizard structure', () => {
    const html = fs.readFileSync('booking.html', 'utf8');

    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/tokens.css">'));
    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/base.css">'));
    assert.ok(html.includes('<link rel="stylesheet" href="/src/styles/components.css">'));

    assert.ok(html.includes('booking-workspace'));
    assert.ok(html.includes('booking-center-container'));
    assert.ok(html.includes('wizard-step-indicator'));
    assert.ok(html.includes('wizard-step-panel'));
    assert.ok(html.includes('dest-pills-grid'));
    assert.ok(html.includes('dest-pill'));
    assert.ok(html.includes('segmented-control'));
    assert.ok(html.includes('step3-summary-strip'));

    assert.ok(html.includes('id="booking-inquiry-form"'));
    assert.ok(html.includes('id="booking-confirmation"'));
    assert.ok(html.includes('id="confirmation-traveler-name"'));
    assert.ok(html.includes('id="confirmation-summary-details"'));
    assert.ok(html.includes('id="inquiry-name"'));
    assert.ok(html.includes('id="inquiry-email"'));
    assert.ok(html.includes('id="inquiry-dates"'));
    assert.ok(html.includes('id="inquiry-notes"'));

    // Navigation and copy updates
    assert.ok(html.includes('Back to Home'));
    assert.ok(html.includes('Pick any places that catch your interest, and I will shape a route around your pace.'));

    // All showcase destination pills present on Step 1
    const requiredPills = [
      'Bo-Kaap',
      "Lion's Head",
      'Table Mountain',
      'Boulders Beach',
      'Cape of Good Hope',
      'Cape Point',
      'Kirstenbosch Gardens',
      'Groot Constantia',
      'Franschhoek Winelands',
      "Chapman's Peak",
      'suggest-route'
    ];
    for (const pill of requiredPills) {
      assert.ok(html.includes(pill), `Missing destination pill on booking.html: ${pill}`);
    }
  });

  test('scrollController.js and overlayManager.js reference valid DOM section IDs', () => {
    const scrollCode = fs.readFileSync('src/core/scrollController.js', 'utf8');
    const overlayCode = fs.readFileSync('src/ui/overlayManager.js', 'utf8');

    assert.ok(scrollCode.includes("getElementById('explore')"));
    assert.ok(scrollCode.includes('.kill(true)'));
    assert.ok(overlayCode.includes("getElementById('caption-name')"));
    assert.ok(overlayCode.includes("getElementById('caption-progress-fill')"));
  });
});

//------------------------------------------------------------------------------------//
describe('4. Design Tokens, Hardcoded Colors & Emoji Audits', () => {
  test('tokens.css strictly defines crisp coastal gallery-neutral palette with zero cream tones', () => {
    const tokens = fs.readFileSync('src/styles/tokens.css', 'utf8');

    // Expected coastal palette tokens
    assert.ok(tokens.includes('#FFFFFF'));
    assert.ok(tokens.includes('#F3F4F6'));
    assert.ok(tokens.includes('#11171A'));
    assert.ok(tokens.includes('#14171A'));
    assert.ok(tokens.includes('#4E565C'));
    assert.ok(tokens.includes('#6B747B'));
    assert.ok(tokens.includes('#162B30'));
    assert.ok(tokens.includes('#B85D2A'));
    assert.ok(tokens.includes('#E2E6EA'));
    assert.ok(tokens.includes('#CCD2D8'));

    // Old warm cream/sand/terracotta tokens must be eliminated
    assert.doesNotMatch(tokens, /#FAF8F5/i);
    assert.doesNotMatch(tokens, /#F2ECE2/i);
    assert.doesNotMatch(tokens, /#1B241E/i);
    assert.doesNotMatch(tokens, /#B35432/i);
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

  test('Zero emojis anywhere in HTML, CSS, or JS files', () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    function checkDir(dir) {
      for (const item of fs.readdirSync(dir)) {
        if (['node_modules', '.git', '.vite', 'dist', 'frames', 'scripts', 'tests'].includes(item)) continue;
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          checkDir(full);
        } else if (/\.(html|js|css)$/.test(item)) {
          const content = fs.readFileSync(full, 'utf8');
          assert.doesNotMatch(content, emojiRegex, `Emoji found in ${full}`);
        }
      }
    }

    checkDir('.');
  });

  test('All code files adhere to function separators and end-of-file tokens', () => {
    const codeFiles = [
      'src/main.js',
      'src/booking.js',
      'src/config/tourConfig.js',
      'src/core/canvasRenderer.js',
      'src/core/frameLoader.js',
      'src/core/scrollController.js',
      'src/ui/bookingWizard.js',
      'src/ui/overlayManager.js',
      'src/ui/reviewManager.js',
      'src/ui/debugHud.js',
      'vite.config.js'
    ];

    for (const file of codeFiles) {
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
  });
});

//------------------------------End of file---------------------------------------------------//
