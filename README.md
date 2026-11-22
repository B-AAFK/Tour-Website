# Cape Town Tour Guide — Scroll-Driven Sequence

A high-performance, scroll-driven web experience showcasing a 9-stop tour of Cape Town. Built with Vite, Vanilla JavaScript, HTML5 Canvas, and GSAP ScrollTrigger. Zero external CDNs or fonts are used.

---

## What It Currently Does

1. **Scroll-Driven Canvas Scrubbing**
   - Renders a 450-frame pre-rendered image sequence (using odd-numbered frames `001, 003, 005...` from `frames/com-part-1/`, `frames/com-part-2/`, and `frames/com-part-3/`).
   - Pins a full-viewport HTML5 `<canvas>` across a 12,000px virtual scroll track using GSAP ScrollTrigger with `scrub: 0.5` for smooth inertia.
   - Preserves aspect ratio using DPR-aware `object-fit: cover` math with automatic centering and resize handling.
   - Falls back gracefully to the nearest loaded frame if the user scrolls past frames still loading.

2. **Progressive Preloading**
   - Unlocks the scroll sequence as soon as the initial 40 frames buffer (`INITIAL_LOAD_TARGET = 40`), while the remaining frames load in the background with a concurrency limit of 8.

3. **Frame-Synced Location Captions**
   - Synchronizes minimal, lower-left location cards strictly to exact frame trigger windows:
     - **Bo-Kaap**: Frames 0 – 22
     - **Lion's Head**: Frames 34 – 71
     - **Table Mountain**: Frames 90 – 126
     - **Boulders Beach**: Frames 156 – 198
     - **Cape of Good Hope**: Frames 218 – 263
     - **Cape Point Nature Reserve**: Frames 272 – 308
     - **Kirstenbosch Gardens**: Frames 318 – 363
     - **Groot Constantia**: Frames 378 – 422
     - **Franschhoek Winelands**: Frames 434 – 449
   - Features intentional dead zones between stops where captions fade out cleanly during aerial wipes and transition pans.
   - Includes a minimal 1px progress line fixed across the top of the viewport.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
