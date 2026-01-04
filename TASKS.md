# Tasks

> **Project:** Cosmos  
> **Version:** v1.6.0  
> **Last Updated:** 2026-01-04

---

## 🔴 High Priority

### [ ] Complete System Independence
- **Problem:** Solar System, Quantumania, and Interstellar share resources (lighting, time, scene)
- **Goal:** Make all three regions completely independent
- **Required Changes:**
  - Separate lighting per system (Sun shouldn't affect Quantumania)
  - Optional: Per-system time controls
  - Separate ambient light settings per system
  - Ensure no shared state affects other systems
- **Files:** `App.tsx`, `SystemManager.ts`, `QuantumaniaSystem.ts`

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

## ✅ Completed (2026-01-04) - v1.6.0

- **Quantumania System** - New floating mountains system at 18,000 units with 11 unique mountains
- **Multi-System Architecture** - SystemManager singleton, visibility rules, system-aware radar
- **Radar Overhaul** - 3 clickable tabs for teleporting, distant system blips
- **Distant Beacon** - Purple pulsing light visible from Solar System
- **Mountain Animations** - Slow rotation only (removed bobbing to fix vibration)

## ✅ Completed (2026-01-04) - v1.5.5

- **High-res NASA Textures** - All planets now use 2K resolution texture maps
- **Earth Day/Night System** - Smooth terminator transition with separate day/night textures + cloud layer
- **Planet Rings** - Added rings to Uranus (dark, narrow) and Neptune (faint, bluish)
- **Easter Eggs** - Added hidden objects: Explorer-1 (touring spaceship), The Kyln (prison), Alien X (cosmic entity), Sagittarius A* (black hole)
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
