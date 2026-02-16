# Cosmos - Tasks

> **Project:** Cosmos  
> **Version:** v2.1.0  
> **Last Updated:** 2026-02-18

---

## 🚧 In Progress

### System Independence
- [/] **Separate lighting per system** (Sun shouldn't affect Quantumania)
  - Deferred per user request, but partly implemented with Layers

---

## 📋 To Do

- [ ] **GLTFLoader Lacks Error Handling in CosmicEntity**
  - `loadFigures` and `loadRobot` calls lack error callbacks
  - **Impact:** Silent failures if model files are missing or corrupt
  - **Solution:** Add `onError` handler to `loader.load` that logs the error and index/name

- [ ] **Texture Loading Lacks Error Handling** *(validated)*
  - All `THREE.TextureLoader.load()` calls lack error callbacks
  - Files: `Sun.ts`, `Earth.ts`, `Mars.ts`, `Saturn.ts`, `Jupiter.ts`, `Neptune.ts`, `Pluto.ts`, `Uranus.ts`, `Venus.ts`, `Mercury.ts`, `AlienX.ts`
  - **Impact:** Silent failures if textures fail to load, causing blank objects

- [ ] **Per-Frame Vector3 Allocations Causing GC Churn** *(validated)*
  - ~15+ object files create `new THREE.Vector3()` inside `update()` every frame
  - Files: `Sun.ts:98`, `Earth.ts:141`, `Mars.ts:76`, `Jupiter.ts:136`, `Saturn.ts:184`, `Neptune.ts:108`, `Uranus.ts:110`, `Pluto.ts:137`, `Titan.ts:46`, `Europa.ts:46`, `Charon.ts:46`, `Explorer.ts:100,103,116`, `App.tsx:826`
  - **Solution:** Pre-allocate reusable vectors as class properties (see `BlackHole.ts:32-34` for good example)

- [ ] **ESLint Config Missing TypeScript Support** *(validated)*
  - `eslint.config.js` only targets `**/*.{js,jsx}` (line 10)
  - **Solution:** Add `**/*.{ts,tsx}` to files pattern, add TypeScript ESLint parser

- [ ] **Empty `utils/` Directory** *(validated)*
  - `src/utils/` exists but is empty
  - **Solution:** Delete or populate with utility functions

### 🟠 High Priority

- [ ] **Absolute Paths for Models in CosmicEntity**
  - `loader.load` in `CosmicEntity.ts:35` uses relative paths
  - **Solution:** Change to absolute paths (`/models/...`) for consistent Vite resolution

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

- [ ] **Module-Level Mutable State in InputHandler.ts**
  - `boostState` object declared at module scope outside the class
  - Shared across all potential instances; causes unexpected coupling
  - **Solution:** Move `boostState` into the `InputHandler` class as an instance field

- [ ] **Module-Level Mutable State in Explorer.ts**
  - `planetPositions` array declared at module scope (line 4) outside the class
  - Shared across all `Explorer` instances and accessible via static method
  - **Solution:** Move to a class-level static field or instance field

- [ ] **Missing `dispose()` Methods on All 3D Objects**
  - None of the planet classes, `Sun`, `Stars`, `BlackHole`, `AlienX`, `CosmicEntity`, `TheKyln`, or Quantumania objects implement `dispose()`
  - Geometries, materials, textures, and DOM elements for CSS2DObject labels are never cleaned up
  - **Impact:** Memory leak on hot-reload during development and if objects are ever dynamically removed
  - **Solution:** Add `dispose()` to each class that disposes all owned THREE resources and removes DOM labels

- [ ] **No `cancelAnimationFrame` on Unmount in App.tsx**
  - The animation loop started at `App.tsx:851` with `requestAnimationFrame` stores the frame ID but the cleanup callback at `App.tsx:853` does not call `cancelAnimationFrame`
  - **Impact:** Animation continues running briefly after component unmount, accessing stale refs
  - **Solution:** Store the rAF ID in a ref and call `cancelAnimationFrame(id)` in the cleanup function

### 🟡 Medium Priority

- [ ] **GLBEntity Y-Position Stuck when Floating Disabled**
  - Runtime toggle of `floating` flag leaves `model.position.y` at last sine offset
  - **Solution:** Reset `model.position.y` to 0 (or base Y) when `floating` is false in `update()`

- [ ] **Missing center.y Offset in Mountains/Structures**
  - Placement logic for `Mountains.ts` and `Structures.ts` ignores `center.y`
  - **Solution:** Add `center.y` to all computed Y positions, including 'Bridge' and 'Plates'

- [ ] **Accessibility Issues** *(validated)*
  - Missing ARIA labels: `SettingsPanel.tsx`, `RadarObjectList.tsx`
  - No focus management: `RadarObjectList.tsx` panel has no keyboard navigation
  - No skip links: `App.tsx` has no skip-to-content link

- [ ] **CSS `:root` Duplication** *(validated)*
  - `index.css` has two `:root` blocks (lines 1-6 and 136-148)
  - **Solution:** Consolidate into single `:root` block

- [ ] **App.tsx is Monolithic (980 lines)**
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

- [ ] **Mountains.ts Ignores Config `distance` for Most Items**
  - Lines 39-45: Non-Bridge/Plates mountains use `500 + random * 400` instead of the `distance` value from their config objects
  - Config values like `400`, `550`, `450`, `600`, `350`, `500` on lines 11-16 are unused
  - **Solution:** Use `cfg.distance` as the base orbit radius instead of hardcoded random range

- [ ] **Ships.ts Frame-Rate-Dependent Orbital Movement**
  - Line 70: `item.userData.orbitAngle += item.userData.orbitSpeed * 0.01` applies a fixed increment per frame
  - Ships orbit faster on higher FPS monitors (120Hz vs 60Hz)
  - **Solution:** Multiply by `deltaTime` instead of a fixed `0.01`

- [ ] **Inhabitants.ts Frame-Rate-Dependent Rotation**
  - Line 58: `item.rotation.y += 0.01` for AlienXBaby applies a fixed increment per frame
  - Alien rotates twice as fast on 120Hz vs 60Hz
  - **Solution:** Multiply by `deltaTime` or use `independentTime`

- [ ] **TheKyln.ts Frame-Rate-Dependent Rotation**
  - Line 193: `this.structure.rotation.y += 0.0005` applies a fixed increment per frame
  - **Solution:** Use time-based rotation like other objects

- [ ] **Quantumania Entities Missing `EntityCategory`**
  - Entities from `QuantumaniaSystem.getEntities()` (line 183-213) don't include the `category` field
  - Forces `RadarObjectList.tsx` to fall back on fragile string matching for categorization
  - **Solution:** Add `category: EntityCategory.STRUCTURE` (etc.) to each QuantumaniaEntity

- [ ] **New `GLTFLoader` Created on Every `loadModel()` Call**
  - `GLBEntity.ts:66` and `Nexus.ts:44` create `new GLTFLoader()` each time `loadModel()` is called
  - **Solution:** Share a single loader instance (e.g., static class field or dependency injection)

- [ ] **Duplicate `platesCenter` Calculation in Ships.ts and Structures.ts**
  - Both `Ships.ts:18-25` and `Structures.ts:19-22` independently calculate the Plates center position using the same formula
  - **Solution:** Extract shared position calculation to a constant or utility in `QuantumaniaSystem.ts`

- [ ] **Explorer.ts `avoidPlanets()` Clones Vectors Per Frame**
  - `Explorer.ts:103`: `planetPos.clone().sub(this.position)` creates a new Vector3 for every planet every frame
  - **Solution:** Use a pre-allocated scratch vector and copy methods

- [ ] **`PlanetConfig.SPEED` Field is Dead Code**
  - Every planet config in `SDK.ts` (lines 253-332) has a `SPEED` field but it is never read anywhere in the codebase
  - All orbital motion uses `ORBITAL_PERIODS` with `getRealisticOrbitalAngle()` instead
  - **Solution:** Remove the `SPEED` field from `PlanetConfig` interface and all planet configs

- [ ] **`MoonConfig.SPEED` Field is Dead Code**
  - Similar to `PlanetConfig.SPEED`, the `SPEED` field on `MoonConfig` is never used
  - All moon orbital motion uses `Cosmos.ORBITAL_PERIODS.MOON/EUROPA/TITAN/CHARON` instead
  - **Solution:** Remove `SPEED` from `MoonConfig` interface and all moon configs

- [ ] **`Cosmos.getOrbitalPosition()` is Dead Code**
  - `SDK.ts:448-459`: This method uses the old `SPEED`-based orbital model and is never called
  - All callers use `getRealisticOrbitalAngle()` + `getEllipticalOrbitalPosition()` instead
  - **Solution:** Remove `getOrbitalPosition()` method from `Cosmos` class

- [ ] **`Cosmos.getRealisticOrbitalPosition()` is Dead Code**
  - `SDK.ts:539-551`: This method is never called anywhere in the codebase
  - **Solution:** Remove or document as utility for future use

- [ ] **`Cosmos.getKelvinColor()` is Dead Code**
  - `SDK.ts:495-500`: This method is never called anywhere in the codebase
  - **Solution:** Remove or document as utility for future use

- [ ] **`Cosmos.getSimRadius()` is Dead Code**
  - `SDK.ts:587-590`: This method is never called anywhere in the codebase
  - **Solution:** Remove or document as utility for future use

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
  - `SDK.ts:464-488` - Type assertions for geometry parameters in `getObjectRadius()`

- [ ] **Bundle Size Optimization**
  - 913KB+ chunk warning in production build
  - Consider code-splitting for Quantumania system

- [ ] **Earth Moon Radius Scaled 1.5x Without Explanation**
  - `Earth.ts:61`: Moon geometry uses `data.MOON.RADIUS * 1.5` but no comment explains why
  - This makes the Moon 50% larger than the configured radius
  - **Solution:** Add a comment explaining the visual choice, or adjust `MoonConfig.RADIUS` to include the intended size

- [ ] **`DISTANCES_AU` and `RADII_EARTH` Constants Are Unused**
  - `SDK.ts:175-189` (`DISTANCES_AU`) and `SDK.ts:216-231` (`RADII_EARTH`) are declared but never referenced
  - Planet distances are hardcoded in `PLANETS` configs instead
  - **Solution:** Either use these constants to derive `PLANETS` configs or remove them

- [ ] **Inconsistent Label Opacity Calculation Across Objects**
  - Planets use `Cosmos.getLabelOpacity(dist, radius)` with SDK smoothstep
  - `Explorer.ts:140` uses `Math.min(1, 100 / dist)` — different formula
  - `GLBEntity.ts:124` uses `Math.min(1, 400 / dist)` — different formula, different constant
  - `Nexus.ts:99` uses `Math.min(1, 400 / dist)` — same as GLBEntity
  - `TheKyln.ts:201` uses `Math.min(1, 100 / dist)` — same as Explorer
  - **Solution:** Standardize all label opacity calculations through `Cosmos.getLabelOpacity()`

- [ ] **Duplicate CanvasTexture Ring Creation Pattern**
  - `Saturn.ts:123-161`, `Neptune.ts:49-87`, `Uranus.ts:51-89` all have nearly identical ring creation methods
  - Each creates a canvas, draws a radial gradient, and builds a transparent ring mesh
  - **Solution:** Extract a shared `createRingMesh(config)` utility function

- [ ] **`vite.config.js` Should Be `.ts` for Consistency**
  - All other config files (`vitest.config.ts`, `tsconfig.json`) use TypeScript
  - `vite.config.js` and `eslint.config.js` are plain JS
  - **Solution:** Rename to `.ts` for type-checking of config

- [ ] **CSS Comment `v1.7.5` Outdated**
  - `index.css:132-134`: Comment references "PROFESSIONAL UI PANELS (v1.7.5)" but project is at v2.1.0
  - **Solution:** Update version reference in comment or remove version from comment

- [ ] **`index.css` Has Duplicate "Content Area" Comment**
  - Lines 204-205: `/* Content Area */` comment appears twice consecutively
  - **Solution:** Remove duplicate comment

- [ ] **Several CSS Classes Are Defined but Never Used**
  - `.radar-container` (line 69): The visual radar uses `.radar-visual-container` instead
  - `.settings-panel` (line 153): Only `.settings-panel-inline` is used in `SettingsPanel.tsx`
  - `.radar-item`, `.radar-item-dot` (lines 244, 276): Never referenced in JSX
  - **Solution:** Audit and remove unused CSS classes

- [ ] **`AsteroidBelt.ts` Recalculates Constants Per Asteroid Per Frame**
  - Lines 83-85: `earthDistance`, `periodYears`, and `periodSeconds` are recalculated for each asteroid on every frame
  - `earthDistance` is the same for all asteroids; period calculations could be precomputed
  - **Solution:** Precompute `earthDistance` once; precompute period per asteroid at construction

- [ ] **`Heliosphere` Private `radius` Field Shadows Inherited `THREE.Mesh` Properties**
  - `Heliosphere.ts:8`: Declares `private radius` which shadows the geometry's radius
  - Not a bug currently but could cause confusion if inherited APIs are used
  - **Solution:** Rename to `boundaryRadius` or similar for clarity

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

## 📝 Code Review Summary (2026-02-18)

### Review Scope
Full end-to-end analysis of entire codebase: `App.tsx` (980 lines), `SDK.ts` (592 lines), `InputHandler.ts`, `SystemManager.ts`, all 10 solar system objects, all 7 Quantumania files, 2 common objects, 2 UI components, `index.css` (544 lines), `Noise.ts`, all config files, shader type declarations, and test file.

### New Findings by Category

| Category | High | Medium | Low |
|----------|------|--------|-----|
| Dead Code | 0 | 4 | 2 |
| Frame-Rate Bugs | 0 | 3 | 0 |
| Memory Leaks | 2 | 0 | 0 |
| Code Duplication | 0 | 2 | 2 |
| Config / Data | 0 | 2 | 2 |
| Architecture | 2 | 1 | 0 |
| CSS / Docs | 0 | 0 | 4 |
| Inconsistency | 0 | 1 | 1 |

### Key Concerns
- **Dead code in SDK.ts:** 4 methods and 2 config fields (`SPEED`, `DISTANCES_AU`, `RADII_EARTH`) are declared but never used
- **Frame-rate-dependent motion:** Ships, Inhabitants, and TheKyln use `+= constant` per frame instead of time-based delta
- **Missing cleanup:** No `dispose()` on any 3D object; no `cancelAnimationFrame` on unmount
- **Module-level mutable state:** `InputHandler.ts` and `Explorer.ts` use module-level mutables

### Positive Observations
- `BlackHole.ts` demonstrates proper vector reuse pattern (lines 32-34)
- `SDK.ts` is well-structured with comprehensive orbital mechanics
- Shader extraction to external GLSL files is well-organized
- `SystemManager.ts` singleton pattern is clean and effective
- `GLBEntity.ts` has proper error handling in `loadModel()` with reject path
- `QuantumaniaSystem.ts` sequential loading with error handling is well-designed
- `AsteroidBelt.ts` correctly uses `InstancedMesh` with `DynamicDrawUsage` for performance
- `OrbitPath.ts` is clean and reusable