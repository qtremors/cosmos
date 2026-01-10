# Tasks

> **Project:** Cosmos  
> **Version:** v2.0.0  
> **Last Updated:** 2026-01-10

---

## 🔴 Critical Priority

### [ ] Texture Loading Lacks Error Handling
- **Problem:** All `THREE.TextureLoader.load()` calls lack error callbacks
- **Risk:** Silent failures if textures fail to load; user sees broken planets
- **Solution:** Add error callbacks with fallback textures or error states
- **Files:** `Sun.ts`, `Earth.ts`, `Mars.ts`, `Jupiter.ts`, `Saturn.ts`, `Neptune.ts`, `Uranus.ts`, `Pluto.ts`, `Mercury.ts`, `Venus.ts`

---

## 🟠 High Priority

### [ ] Complete System Independence
- **Problem:** Solar System, Quantumania, and Interstellar share resources
- **Goal:** Separate lighting per system (Sun shouldn't affect Quantumania)
- **Files:** `App.tsx`, `SystemManager.ts`, `QuantumaniaSystem.ts`
- **Note:** Deferred per user request

### [ ] Per-Frame Vector3 Allocations Causing GC Churn
- **Problem:** ~15+ object files create `new THREE.Vector3()` inside `update()` every frame
- **Impact:** Garbage collection stutters on low-end devices
- **Solution:** Reuse instance-level vectors (like `BlackHole.ts` fix pattern)
- **Files:** `Sun.ts:101`, `Uranus.ts:112`, `Saturn.ts:188`, `Neptune.ts:110`, `Mars.ts:78`, `Jupiter.ts:140`, `Pluto.ts:141`, `InputHandler.ts:209,241`, `App.tsx:117,729,786,847`

### [ ] ESLint Config Missing TypeScript Support
- **Problem:** `eslint.config.js` only targets `*.{js,jsx}`, ignoring all TypeScript files
- **Impact:** No linting for the entire codebase (100% TypeScript)
- **Solution:** Add `**/*.{ts,tsx}` to files pattern and TypeScript parser
- **File:** `eslint.config.js`

### [ ] Empty `utils/` Directory
- **Problem:** Directory exists but is completely empty
- **Solution:** Either add utility functions or delete the directory
- **File:** `src/utils/`

---

## 🟡 Medium Priority

### [ ] Accessibility Issues

#### Missing ARIA Labels
- **Problem:** No `aria-label` on any interactive elements
- **Affected:** Range sliders in SettingsPanel, close buttons, radar items
- **Files:** `SettingsPanel.tsx`, `RadarObjectList.tsx`

#### No Focus Management
- **Problem:** Panels lack keyboard navigation for radar list items
- **Impact:** Keyboard-only users cannot navigate through object lists
- **Files:** `RadarObjectList.tsx`

#### No Skip Links
- **Problem:** 3D canvas traps focus, no skip to controls
- **Files:** `App.tsx`

### [ ] Magic Numbers → SDK Constants
- **Problem:** Scattered constants throughout codebase
  - `4500` visibility range
  - `500` buffer distance
  - `1000` fade distance
  - `100` delay ms in loadModelsSequentially
- **Solution:** Add `Cosmos.VISIBILITY` and `Cosmos.LOADING` configs
- **Files:** `App.tsx`, `QuantumaniaSystem.ts`, various objects

### [ ] RadarObjectList Uses Fragile String Matching
- **Problem:** Filters entities by substring matching labels:
  ```typescript
  e.label.startsWith('Mount') || e.label.includes('Station')
  ```
- **Risk:** New entities may be miscategorized if naming convention changes
- **Solution:** Use `EntityCategory` enum (already exists but underutilized)
- **File:** `RadarObjectList.tsx` lines 181, 196, 209, 222, 233, 243

### [ ] Stats HUD Speed Calculation
- **Problem:** Uses stale delta due to throttling
- **Solution:** Track accumulated distance over throttle period
- **Files:** `App.tsx`

### [ ] Object Info Panel (Feature Request)
- **Description:** Click object → popup with facts (size, distance, orbital period)
- **Files:** New `InfoPanel.tsx`, `App.tsx`

### [ ] Rim/Edge Lighting for Dark Side Planets
- **Description:** Subtle shader glow on edges so silhouettes are visible
- **Files:** Planet shaders in `objects/solar/`

---

## 🟢 Low Priority

### [ ] CSS `:root` Duplication
- **Problem:** Two `:root` blocks in index.css (lines 1-6 and 136-148)
- **Solution:** Consolidate into single `:root` block
- **File:** `index.css`

### [ ] Missing `type="button"` on Buttons
- **Problem:** Buttons inside forms default to `type="submit"`
- **Risk:** Accidental form submissions
- **Solution:** Add `type="button"` to all non-submit buttons
- **Files:** `SettingsPanel.tsx`, `RadarObjectList.tsx`

### [ ] Add More Moons
- **Description:** Ganymede, Callisto, Io (Jupiter); Enceladus (Saturn)
- **Files:** New moon classes, `SDK.ts`

### [ ] Refactor Duplicate Moon Patterns
- **Problem:** Each planet with a moon duplicates moon setup code
- **Solution:** Create generic `Moon` class
- **Files:** `Earth.ts`, `Jupiter.ts`, `Saturn.ts`, `Pluto.ts`

### [ ] Performance Mode Toggle
- **Description:** Reduce asteroid count, simpler shaders for low-end devices
- **Files:** `SDK.ts`, `AsteroidBelt.ts`, new setting in `SettingsPanel.tsx`

### [ ] Test Coverage
- **Problem:** Only SDK.test.ts (12 tests) exists; no component/object tests
- **Coverage:** ~5% of codebase
- **Needs Tests:** `InputHandler.ts`, `SystemManager.ts`, planet classes
- **File:** `src/__tests__/`

### [ ] TypeScript Strict Mode Compliance
- **Problem:** Some `as` casts could be replaced with proper type guards
- **Files:** Various (already fixed in `GLBEntity.ts`, `Nexus.ts`)

---

## 📄 Documentation

### [ ] README Project Structure Outdated
- **Problem:** Missing directories in structure diagram:
  - `components/` (RadarObjectList, SettingsPanel)
  - `utils/` (empty, should be removed or documented)
  - `objects/solar/` and `objects/quantumania/`
  - `objects/common/` (Heliosphere, OrbitPath)
  - `shaders/` (alienx, atmosphere, blackhole, earth, sun)
  - `__tests__/`
- **File:** `README.md`

### [ ] README Still References MIT License
- **Problem:** License badge updated but some text may reference old license
- **Solution:** Full audit for any "MIT" references
- **File:** `README.md`

---

## 📋 Backlog (Future Versions)

- Sound Design & Ambient Audio
- Comet Simulation
- VR Support (WebXR)
- More Dwarf Planets (Ceres, Eris)
- Mobile Touch Controls
- Bundle Size Optimization (913KB chunk warning)
  - Code-splitting with dynamic `import()`
  - `manualChunks` in Vite config for Three.js
- Web Workers for Physics Calculations
