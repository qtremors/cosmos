# Tasks

> **Project:** Cosmos  
> **Version:** v1.2.0  
> **Last Updated:** 2026-01-02

---

##  Medium Priority

### [x] Implement Time Controls - 2026-01-02
- **Problem:** Simulation runs at fixed speed with no pause
- **Fix:** Added pause button and time scale slider (0.1x to 10x) in Settings Panel
- **Files:** `App.tsx`, `SettingsPanel.tsx`, `index.css`

### [ ] Add Rim/Edge Lighting
- **Problem:** Planets on dark side are invisible
- **Fix:** Subtle shader glow on edges so silhouettes are always visible
- **Files:** All planet shaders in `objects/`

### [ ] Object Info Panel
- **Problem:** No way to learn about objects
- **Fix:** Click object → popup with facts (size, distance, orbital period)
- **Files:** `App.tsx`, new `InfoPanel.tsx`

### [x] Elliptical Orbits - 2026-01-03
- **Problem:** Current orbits are perfect circles
- **Fix:** Implemented elliptical orbits with NASA eccentricity values
- **Files:** `SDK.ts`, `OrbitPath.ts`, all planet files

---

## 🟢 Low Priority

### [ ] Add More Moons
- Ganymede, Callisto, Io for Jupiter; Enceladus for Saturn

### [ ] Move Shaders to External Files
- Create `.glsl` files with Vite raw imports

### [ ] Refactor Duplicate Moon Patterns
- Create generic `Moon` class

### [ ] Performance Mode
- Toggle to reduce asteroid count, simpler shaders

---

## 📋 Backlog

- Sound Design & Ambient Audio
- Comet Simulation
- VR Support (WebXR)
- More Dwarf Planets (Ceres, Eris)
- Mobile Touch Controls

---

## ✅ Completed (2026-01-03)

- **High-res NASA Textures** - All planets now use 2K resolution texture maps
- **Earth Day/Night System** - Smooth terminator transition with separate day/night textures + cloud layer
- **Planet Rings** - Added rings to Uranus (dark, narrow) and Neptune (faint, bluish)
- **Easter Eggs** - Added 5 hidden objects: Explorer-1 (touring spaceship), ISS, Quant (golden asteroid), Alien X (cosmic entity), Tremors (hidden planet)
- **Elliptical Orbits** - All planets now use NASA eccentricity values. Pluto visibly crosses inside Neptune's orbit!
- **Settings Panel** - Moved to radar menu (inline). Aligned height with objects panel. Widened for usability.
- **Ambient Slider** - Fixed mouse capture issue (stopPropagation).
- **Progressive Boost** - Holding Shift increases speed multiplier (10x -> 100x max) over time for faster travel.

## ✅ Completed (2026-01-02)

- **Realistic Orbital Mechanics** - True Keplerian physics for all bodies. Scale: Real periods, artistic distances.
- **Time Controls with Presets** - Real-time, 1m/s, 30m/s... up to Max (Pluto 1min/orbit). Default: 1 Day/sec.
- **Physics Fixes** - Asteroids scale correctly, Sun shader visuals decoupled from time warp.
- **Visuals** - Orbit paths are white, Sun looks consistent at high speeds.
- **Settings Panel UI** - Fixed scrolling, z-index, and layout.
- **Transparency Fix** - Added logdepthbuf chunks to all planet shaders
- **Smart Contextual UI** - HUD shows nearest object in free flight
- **Top-down Start** - Camera now starts in T mode
- **Rotation Delta Time** - Frame-rate independent rotation

## ✅ Completed (Earlier)

- TypeScript Migration
- Uranus/Neptune Ice Giants
- Gamepad Support
- SDK Utilities
- Pluto & Charon
- Orbital Camera Control
- Stats HUD
- Radar Menu Overhaul
- Orbit Path Visualization
- Input Handler Extraction
