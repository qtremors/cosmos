# Tasks

> **Project:** Cosmos  
> **Version:** v1.1.0  
> **Last Updated:** 2025-12-14

---

## 🔴 Critical (Fix Now)

*No critical issues at this time.*

---

## 🟠 High Priority

*No high priority tasks at this time.*

---

## 🟡 Medium Priority

### [x] Add Orbit Path Visualization - 2025-12-14
- **Problem:** Users have no visual reference for planetary orbits
- **Fix:** Created `OrbitPath.ts` component and moon orbit paths
- **Files:** `src/objects/OrbitPath.ts`, `src/objects/Earth.ts`, `Jupiter.ts`, `Saturn.ts`, `Pluto.ts`

### [ ] Implement Time Controls
- **Problem:** Simulation runs at fixed speed with no pause
- **Fix:** Add time scale slider and pause button to HUD
- **Files:** `src/App.tsx`, `src/index.css`

---

## 🟢 Low Priority / Nice to Have

### [ ] Add More Moons
- **Problem:** Only 3 moons implemented (Moon, Europa, Titan)
- **Fix:** Add Ganymede, Callisto, Io for Jupiter; Enceladus for Saturn
- **Files:** `src/objects/Jupiter.ts`, `src/objects/Saturn.ts`, `src/core/SDK.ts`

### [x] Extract Input Handler - 2025-12-14
- **Problem:** Input handling code (150+ lines) embedded in App.tsx
- **Fix:** Created separate `InputHandler.ts` module, refactored App.tsx to import and use it
- **Files:** `src/core/InputHandler.ts`, `src/App.tsx`

### [ ] Move Shaders to External Files
- **Problem:** GLSL shaders embedded as template literals in planet files
- **Fix:** Create `.glsl` files with Vite raw imports
- **Files:** `src/shaders/*.glsl`, planet files

### [ ] Add Unit Tests for SDK
- **Problem:** No automated tests for utility functions
- **Fix:** Add Vitest tests for `getOrbitalPosition`, `smoothstep`, etc.
- **Files:** `src/core/SDK.test.ts`

---

## ✅ Completed

### [x] TypeScript Migration - 2025-12-14
- **Problem:** JavaScript codebase lacked type safety
- **Fix:** Converted all files to TypeScript with strict mode
- **Files:** All `.js`/`.jsx` → `.ts`/`.tsx`

### [x] Add Uranus and Neptune - 2025-12-14
- **Problem:** Solar system incomplete (only 6 planets)
- **Fix:** Created ice giant shaders with storm dynamics
- **Files:** `src/objects/Uranus.ts`, `src/objects/Neptune.ts`

### [x] Implement Gamepad Support - 2025-12-14
- **Problem:** Only keyboard/mouse controls available
- **Fix:** Added full gamepad polling with configurable deadzone
- **Files:** `src/App.tsx`

### [x] Centralize SDK Utilities - 2025-12-14
- **Problem:** Orbital calculations duplicated across planet files
- **Fix:** Created `Cosmos.getOrbitalPosition()` and other utilities
- **Files:** `src/core/SDK.ts`

### [x] Add Pluto & Charon - 2025-12-14
- **Problem:** Solar system missing dwarf planet
- **Fix:** Created Pluto with inclined orbit and Charon moon
- **Files:** `src/objects/Pluto.ts`, `src/core/SDK.ts`

### [x] Implement Orbital Camera Control - 2025-12-14
- **Problem:** Cannot change viewing angle while locked on target
- **Fix:** Added spherical coordinate orbital control via mouse/keyboard/gamepad
- **Files:** `src/core/InputHandler.ts`

### [x] Add Stats HUD - 2025-12-14
- **Problem:** No feedback on camera speed or object info
- **Fix:** Added top-right HUD with speed (km/s) and distance (M km)
- **Files:** `src/App.tsx`, `src/index.css`

### [x] Overhaul Radar Menu - 2025-12-14
- **Problem:** Growing entity list needs organization
- **Fix:** Categorized menu (Star, Planets, Moons, Other) with scrollable list
- **Files:** `src/App.tsx`, `src/index.css`

---

## 📋 Backlog / Future Ideas

- [ ] **VR Support:** WebXR integration for immersive exploration
- [ ] **More Dwarf Planets:** Add Ceres, Eris, Makemake, Haumea
- [ ] **Comet Simulation:** Elliptical orbits with procedural tails
- [ ] **Texture Loading:** Optional high-res textures from NASA
- [ ] **Sound Design:** Ambient space audio and UI feedback sounds
- [ ] **Mobile Touch Controls:** Touch gestures for mobile browsers

---

<!-- 
TASK GUIDELINES:

Priority Levels:
🔴 Critical    - Blocking issues, security vulnerabilities, crashes
🟠 High        - Important features, significant bugs
🟡 Medium      - Regular tasks, minor bugs
🟢 Low         - Polish, nice-to-have, future ideas

Format:
### [ ] Task Title
- **Problem:** What's wrong or what's needed
- **Fix:** Brief approach to solve it
- **Files:** Affected files

When Complete:
- Mark with [x]
- Add completion date
- Move to Completed section

Update this file:
- After every major change
- When discovering new issues
- When completing tasks
-->
