# Tasks

> **Project:** Cosmos  
> **Version:** v1.9.0  
> **Last Updated:** 2026-01-05  

---

##  High Priority

### [ ] Complete System Independence
- **Problem:** Solar System, Quantumania, and Interstellar share resources (lighting, time, scene)
- **Goal:** Make all three regions completely independent
- **Required Changes:**
  - Separate lighting per system (Sun shouldn't affect Quantumania)
  - Optional: Per-system time controls
  - Separate ambient light settings per system
- **Files:** `App.tsx`, `SystemManager.ts`, `QuantumaniaSystem.ts`
- **Note:** Deferred per user request

---

## 🟡 Medium Priority

### [ ] Keyboard Accessibility Issues
- Container `div` has duplicate key handlers (window and onKeyDown)
- No focus management for panels or keyboard navigation for radar list
- Range slider in SettingsPanel lacks aria-label
- **Files:** `App.tsx`, `SettingsPanel.tsx`, `RadarObjectList.tsx`

### [ ] Magic Numbers → SDK Constants
- `4500` visibility range, `500` buffer distance, `1000` fade distance scattered throughout
- Move to `Cosmos.VISIBILITY` config in SDK.ts

### [ ] Object Info Panel
- Click object → popup with facts (size, distance, orbital period)
- **Files:** `App.tsx`, new `InfoPanel.tsx`

### [ ] Rim/Edge Lighting for Dark Side Planets
- Subtle shader glow on edges so silhouettes are always visible
- **Files:** Planet shaders in `objects/`

### [ ] Stats HUD Speed Calculation Fix
- Current calculation uses stale delta due to throttling
- Track accumulated distance over throttle period

### [ ] README Project Structure Update
- Missing `components/`, `utils/`, `objects/solar/`, `objects/quantumania/`, `objects/common/`

---

## 🟢 Low Priority

### [ ] Texture Loading Error Handling
- Add error callbacks or fallbacks for `THREE.TextureLoader.load()` calls

### [ ] CSS `:root` Duplication
- Consolidate two `:root` blocks in index.css

### [ ] Unused `src/utils/` Directory
- Remove if unused, or add utility functions

### [ ] QuantumaniaSystem Typo
- "NEUXS" → "NEXUS" in comment (line 59)

### [ ] Add More Moons
- Ganymede, Callisto, Io (Jupiter); Enceladus (Saturn)

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
- Bundle Size Optimization
- Lazy Loading for Quantumania System
- Web Workers for Physics Calculations

---

## ✅ Recently Completed

### v1.9.0 (2026-01-05)
- Test suite (Vitest + 12 SDK tests)
- Shader extraction (14 shaders → `src/shaders/`)
- EntityCategory enum for radar filtering
- BlackHole lookAt fix

### v1.8.0 (2026-01-05)
- Cosmic Glass UI overhaul
- Side-by-side resizable panels
- Category-based navigation

### v1.7.0 (2026-01-05)
- System LOD & layer separation
- Cinematic transitions
- Tab teleport fix
