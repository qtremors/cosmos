# Cosmos - Tasks

> **Project:** Cosmos  
> **Version:** v2.1.0  
> **Last Updated:** 2026-02-16

---

## 🚧 In Progress

### System Independence
- [/] **Separate lighting per system** (Sun shouldn't affect Quantumania)
  - Deferred per user request, but partly implemented with Layers

---

## 📋 To Do

### 🔴 Critical Priority

- [ ] **Texture Loading Lacks Error Handling** *(validated)*
  - All `THREE.TextureLoader.load()` calls lack error callbacks
  - Files: `Sun.ts`, `Earth.ts`, `Mars.ts`, `Saturn.ts`, `Jupiter.ts`, `Neptune.ts`, `Pluto.ts`, `Uranus.ts`, `Venus.ts`, `Mercury.ts`, `AlienX.ts`
  - **Impact:** Silent failures if textures fail to load, causing blank objects

- [ ] **Per-Frame Vector3 Allocations Causing GC Churn** *(validated)*
  - ~15+ object files create `new THREE.Vector3()` inside `update()` every frame
  - Files: `Sun.ts:101`, `Earth.ts:147`, `Saturn.ts:188`, `Uranus.ts:112`, `InputHandler.ts:209,241,256`, `App.tsx:729,745,786`
  - **Solution:** Pre-allocate reusable vectors as class properties (see `BlackHole.ts:32-34` for good example)

- [ ] **ESLint Config Missing TypeScript Support** *(validated)*
  - `eslint.config.js` only targets `**/*.{js,jsx}` (line 10)
  - **Solution:** Add `**/*.{ts,tsx}` to files pattern, add TypeScript ESLint parser

- [ ] **Empty `utils/` Directory** *(validated)*
  - `src/utils/` exists but is empty
  - **Solution:** Delete or populate with utility functions

### 🟠 High Priority

- [ ] **Duplicate Comment Lines in App.tsx**
  - Lines 621-622: "Heliosphere Visibility Rule:" duplicated
  - Lines 677-678: "Update planet positions for Explorer collision avoidance" duplicated
  - **Solution:** Remove duplicate comments

- [ ] **Magic Numbers in App.tsx**
  - Line 601: `4500` (Solar System visibility distance)
  - Line 630: `500` (Quantumania buffer distance)
  - **Solution:** Move to `SDK.ts` as named constants (e.g., `VISIBILITY.SOLAR_SYSTEM_RANGE`, `VISIBILITY.QUANTUMANIA_BUFFER`)

- [ ] **Missing `type="button"` on Buttons** *(validated)*
  - Files: `SettingsPanel.tsx`, `RadarObjectList.tsx`
  - All `<button>` elements lack explicit type, defaulting to "submit"
  - **Solution:** Add `type="button"` to all non-submit buttons

- [ ] **RadarObjectList Uses Fragile String Matching** *(validated)*
  - Lines 181, 196, 209, 222, 233, 242: Uses `startsWith()` and `includes()` for categorization
  - **Issue:** Breaks if entity names change; bypasses `EntityCategory` enum
  - **Solution:** Use `EntityCategory` enum from existing `category` field instead

### 🟡 Medium Priority

- [ ] **Accessibility Issues** *(validated)*
  - Missing ARIA labels: `SettingsPanel.tsx`, `RadarObjectList.tsx`
  - No focus management: `RadarObjectList.tsx` panel has no keyboard navigation
  - No skip links: `App.tsx` has no skip-to-content link

- [ ] **CSS `:root` Duplication** *(validated)*
  - `index.css` has two `:root` blocks (lines 1-6 and 136-148)
  - **Solution:** Consolidate into single `:root` block

- [ ] **App.tsx is Monolithic (1001 lines)**
  - Main component handles scene setup, animation loop, input, UI state
  - **Suggested refactor:** Extract into:
    - `hooks/useThreeScene.ts` - Three.js scene/renderer setup
    - `hooks/useEntitySystem.ts` - Entity management
    - `hooks/useCameraControls.ts` - Camera lock/teleport logic

- [ ] **Stats HUD Speed Calculation Inaccurate**
  - `App.tsx:722` - Speed calculated based on 10-frame throttle but uses single-frame delta
  - **Solution:** Track accumulated distance over throttle period

- [ ] **Object Info Panel (Feature Request)**
  - Click object → popup with facts
  - Low effort, high user value

- [ ] **Rim/Edge Lighting for Dark Side Planets**
  - Subtle shader glow on edges for visibility
  - Enhances realism

### 🟢 Low Priority

- [ ] **Add More Moons**
  - Ganymede, Callisto, Io, Enceladus
  - Infrastructure already exists

- [ ] **Refactor Duplicate Moon Patterns**
  - `Titan`, Moon, Europa, Charon share similar code
  - **Solution:** Create generic `Moon` base class

- [ ] **Performance Mode Toggle**
  - Add setting to reduce asteroid count (`SDK.ASTEROIDS.COUNT`)
  - Would help lower-end devices

- [ ] **Test Coverage Expansion** *(validated)*
  - Needs tests for `InputHandler.ts`, `SystemManager.ts`, planet classes
  - Current: 12 tests in `SDK.test.ts` only

- [ ] **TypeScript Strict Mode Compliance**
  - Some `as` casts could use type guards
  - `SDK.ts:500,510` - Type assertions for geometry parameters

- [ ] **Bundle Size Optimization**
  - 913KB+ chunk warning in production build
  - Consider code-splitting for Quantumania system

---


## 🐛 Bug Fixes

- [ ] **Texture Loading:** Silent failures if textures fail to load (see Critical Priority)
- [ ] **GC Churn:** Per-frame allocations causing stutters (see Critical Priority)
- [ ] **Duplicate setVisible Call:** `App.tsx:633` and `App.tsx:661` both call `quantumania.setVisible(showQuantumania)`

---

## 💡 Ideas / Future

- [ ] Sound Design & Ambient Audio
- [ ] Comet Simulation
- [ ] VR Support (WebXR)
- [ ] More Dwarf Planets (Ceres, Eris)
- [ ] Mobile Touch Controls
- [ ] Web Workers for Physics Calculations
- [ ] Procedural Planet Surfaces

---

## 🏗️ Architecture Notes

- **Component-Based 3D Architecture:** React UI -> Three.js Scene -> Core SDK
- **Multi-System Manager:** Singletons used for managing distinct star systems (Solar, Quantumania)
- **Lazy Loading:** Models load only when entering their system boundary
- **Layer System:** Layer 0 (Default), Layer 1 (Solar System), Layer 2 (Quantumania)

---

## 📝 Code Review Summary (2026-01-14)

### Validated Existing Tasks
All existing TASKS.md entries were verified as accurate and still applicable.

### New Findings by Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Code Quality | 4 | 4 | 3 | 5 |
| Architecture | 0 | 0 | 1 | 2 |
| Performance | 1 | 1 | 1 | 1 |
| UI/UX | 0 | 1 | 1 | 0 |
| Documentation | 0 | 0 | 0 | 1 |

### Positive Observations
- `BlackHole.ts` demonstrates proper vector reuse pattern (lines 32-34)
- `SDK.ts` is well-structured with comprehensive orbital mechanics
- Shader extraction to external GLSL files is well-organized
- `SystemManager.ts` singleton pattern is clean and effective