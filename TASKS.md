# Tasks

> **Project:** Cosmos  
> **Version:** v1.8.0  
> **Last Updated:** 2026-01-05  
> **Last Review:** 2026-01-05 (Deep Code Review)

---

## 🔴 Critical Priority

### [x] App.tsx Monolithic Component Refactoring
- **Status:** Deferred - App.tsx is tightly coupled and refactoring risks functionality conflicts
- **Future:** Consider splitting into hooks when major changes are planned

### [x] Missing Test Suite
- **Status:** Complete - Added Vitest with 12 SDK unit tests
- **Files:** `vitest.config.ts`, `src/__tests__/SDK.test.ts`

### [x] README.md Version Mismatch
- **Status:** Complete - Fixed v1.6.0 → v1.9.0

### [x] README "Recent" Changelog Section Outdated
- **Status:** Complete - Updated to show v1.7.0-v1.9.0

---

## 🟠 High Priority

### [x] Inline Shaders → External .glsl Files
- **Status:** Complete - Moved 14 shaders to `src/shaders/` with organized subdirectories

### [x] Duplicate Noise Function Implementations
- **Status:** Complete - Consolidated via NOISE_FUNCTIONS_PLACEHOLDER injection

### [ ] Complete System Independence (Existing Task - Deferred)
- **Note:** Lighting-related task - deferred per user request

### [ ] Complete System Independence (Existing Task)
- **Problem:** Solar System, Quantumania, and Interstellar share resources (lighting, time, scene)
- **Goal:** Make all three regions completely independent
- **Required Changes:**
  - Separate lighting per system (Sun shouldn't affect Quantumania)
  - Optional: Per-system time controls
  - Separate ambient light settings per system
  - Ensure no shared state affects other systems
- **Files:** `App.tsx`, `SystemManager.ts`, `QuantumaniaSystem.ts`

### [x] RadarObjectList Hardcoded Entity Filtering
- **Status:** Complete - Added `EntityCategory` enum with 12 types; filter by category instead of hardcoded label arrays

---

## 🟡 Medium Priority

### [ ] Keyboard Accessibility Issues
- **Problem:**
  - Container `div` has `tabIndex={0}` but duplicate key handlers exist (window and onKeyDown)
  - No focus management for panels
  - No keyboard navigation for radar list items
  - Range slider in SettingsPanel lacks aria-label
- **Impact:** Poor accessibility for keyboard/screen reader users
- **Recommended:**
  - Remove duplicate keydown handler from container `onKeyDown`
  - Add `role="button"` and `tabindex` to object items
  - Add `aria-label` to sliders
- **Files:** `App.tsx` lines 844-855, `SettingsPanel.tsx`, `RadarObjectList.tsx`

### [ ] Magic Numbers Throughout Codebase
- **Problem:** Many magic numbers not centralized in SDK:
  - `4500` visibility range for solar system (App.tsx line 575)
  - `500` buffer distance for Quantumania (line 604)
  - `1000` fade distance for Heliosphere
  - Shader-specific constants in BlackHole.ts, AlienX.ts
- **Impact:** Hard to tune, inconsistent behavior
- **Recommended:** Add to `Cosmos.VISIBILITY` config in SDK.ts
- **Files:** `App.tsx`, `Heliosphere.ts`, various object files

### [ ] Object Info Panel (Existing Task)
- **Problem:** No way to learn about objects
- **Fix:** Click object → popup with facts (size, distance, orbital period)
- **Files:** `App.tsx`, new `InfoPanel.tsx`

### [ ] Add Rim/Edge Lighting (Existing Task)
- **Problem:** Planets on dark side are invisible
- **Fix:** Subtle shader glow on edges so silhouettes are always visible
- **Files:** All planet shaders in `objects/`

### [ ] Stats HUD Speed Calculation Inaccuracy
- **Problem:** Speed calculation uses `distanceTo(lastCameraPos) / (delta * 10)` - the `* 10` appears arbitrary and the throttling (every 10 frames) makes delta stale
- **Impact:** Displayed speed is not accurate
- **Recommended:** Track accumulated distance over throttle period, or use velocity vector
- **Files:** `App.tsx` lines 696-699

### [ ] Project Structure Documentation
- **Problem:** README project structure is incomplete - doesn't show:
  - `components/` directory
  - `utils/` directory  
  - `objects/solar/`, `objects/quantumania/`, `objects/common/` subdirectories
- **Fix:** Update project structure diagram to reflect actual layout
- **Files:** `README.md` lines 94-110

---

## 🟢 Low Priority

### [ ] Texture Loading Without Error Handling
- **Problem:** All `THREE.TextureLoader.load()` calls have no error callback
- **Impact:** Silent failures if textures are missing
- **Recommended:** Add error callbacks or use async loading with fallbacks
- **Files:** `Earth.ts`, `Sun.ts`, `AlienX.ts`, `QuantumaniaSystem.ts`

### [ ] CSS Custom Properties Duplication
- **Problem:** `:root` is defined twice in index.css (lines 1-6 and 136-148)
- **Impact:** Potential confusion; second definition overrides first
- **Recommended:** Consolidate into single `:root` block
- **Files:** `index.css` lines 1-6, 136-148

### [ ] Unused utils Directory
- **Problem:** `src/utils/` directory exists but appears empty
- **Impact:** Organizational debt
- **Recommended:** Remove if unused, or use for utility functions
- **Files:** `src/utils/`

### [ ] QuantumaniaSystem Typo
- **Problem:** Comment says "NEUXS" instead of "NEXUS" on line 59
- **Files:** `QuantumaniaSystem.ts` line 59

### [ ] Add More Moons (Existing Task)
- Ganymede, Callisto, Io for Jupiter; Enceladus for Saturn

### [ ] Move Shaders to External Files (Existing Task - Elevated to High)
- Create `.glsl` files with Vite raw imports

### [ ] Refactor Duplicate Moon Patterns (Existing Task)
- Create generic `Moon` class

### [ ] Performance Mode (Existing Task)
- Toggle to reduce asteroid count, simpler shaders

---

## 📋 Backlog

- Sound Design & Ambient Audio
- Comet Simulation
- VR Support (WebXR)
- More Dwarf Planets (Ceres, Eris)
- Mobile Touch Controls
- Bundle Size Analysis (React 19 + Three.js is likely 500KB+)
- Lazy Loading for Quantumania System
- Web Workers for Physics Calculations

---

## ✅ Completed (2026-01-05) - v1.8.0

- **Advanced Panel Layout** - Side-by-side layout for Radar List and Settings Panel with resizable panels
- **Enhanced Navigation** - Deep Space & System Links pinned to top, prioritized navigation items
- **Detailed Categorization** - Quantumania split into Mountains/Structures/Inhabitants/Ships; Solar categorized
- **Visual Polish** - Glassmorphism unified styles, invisible scrollbars, 3D styled key bindings

## ✅ Completed (2026-01-05) - v1.7.5

- **Quantumania Categorization** - Replaced monolithic config with dedicated category classes
- **Code Cleanup** - Deleted obsolete procedural mountain files
- **Build Fixes** - Corrected relative import paths

## ✅ Completed (2026-01-05) - v1.7.0

- **System LOD** - Quantumania objects only load when camera is within 4000 units
- **Strict Layer Separation** - Layer 1 (Solar) and Layer 2 (Quantumania) lighting isolated
- **Cinematic Transitions** - Smooth teleportation preserving viewing angle
- **Tab Teleport Fix** - Fixed stale closure bug preventing cycling in Quantumania

## ✅ Completed (2026-01-04) - v1.6.0

- **Quantumania System** - New floating mountains system at 18,000 units with 11 unique mountains
- **Multi-System Architecture** - SystemManager singleton, visibility rules, system-aware radar
- **Radar Overhaul** - 3 clickable tabs for teleporting, distant system blips
- **Distant Beacon** - Purple pulsing light visible from Solar System

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
- High-res NASA Textures
- Earth Day/Night System
- Planet Rings (Uranus, Neptune)
- Easter Eggs (Explorer-1, The Kyln, Alien X, Sagittarius A*)
- Elliptical Orbits with NASA eccentricity values
- Time Controls with Presets
- Progressive Boost
