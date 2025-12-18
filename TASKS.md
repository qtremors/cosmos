# Tasks

> **Project:** Cosmos  
> **Version:** v1.1.0  
> **Last Updated:** 2025-12-18

---

## 🔴 Critical (Fix Now)

### [ ] Fix Object Transparency/Occlusion Bug
- **Problem:** Objects (Sun, planets) don't occlude things behind them - can see asteroid belt/orbits through the Sun
- **Symptoms:** All celestial bodies appear transparent, depth not working properly
- **Investigation:** Check material `transparent`, `depthWrite`, `depthTest` settings on all objects
- **Files:** All files in `cosmos-app/src/objects/`

### [ ] Fix Duplicate Radar Center Element
- **Problem:** `radar-center` element is created twice - once via JS and once in JSX
- **Location:** `App.tsx` line 239 creates via JS, line 523 creates in JSX
- **Impact:** DOM pollution, potential visual glitches
- **Fix:** Remove the createElement call at line 239, keep only JSX rendering
- **Files:** `cosmos-app/src/App.tsx`

---

## 🟠 High Priority

### [ ] Create Settings Panel UI
- **Problem:** No centralized place for user settings and controls guide
- **Components:**
  - Modal/slide-out panel accessible via button or hotkey
  - **Ambient Light Slider:** Adjust from 0 (realistic) to 0.5 (visible)
  - **Controls Guide:** Visual keyboard/mouse/gamepad reference
  - Extensible for future settings (time controls, graphics options)
- **Files:** `cosmos-app/src/App.tsx`, new `SettingsPanel.tsx`, `cosmos-app/src/index.css`

### [ ] Smart Contextual UI
- **Problem:** HUD shows static info regardless of user context
- **Goal:** UI adapts based on current mode/state
- **Examples:**
  - **Free Flight:** Show speed, heading, nearest object
  - **Locked on Planet:** Show planet info (orbital period, distance, rotation)  
  - **Locked on Moon:** Show parent planet info + moon data
  - **Near Sun:** Show temperature/corona warnings
  - **Approaching Object:** Auto-show info panel
- **Files:** `cosmos-app/src/App.tsx`, HUD components

### [ ] Add Loading State / Splash Screen
- **Problem:** No visual feedback during scene initialization
- **Symptoms:** Blank black screen while 3D scene builds
- **Fix:** Add loading indicator or splash screen with Cosmos branding
- **Location:** `cosmos-app/src/App.tsx`, `cosmos-app/src/index.css`

---

## 🟡 Medium Priority

### [x] Add Orbit Path Visualization - 2025-12-14
- **Problem:** Users have no visual reference for planetary orbits
- **Fix:** Created `OrbitPath.ts` component and moon orbit paths
- **Files:** `cosmos-app/src/objects/OrbitPath.ts`, Earth.ts, Jupiter.ts, Saturn.ts, Pluto.ts

### [ ] Implement Time Controls
- **Problem:** Simulation runs at fixed speed with no pause
- **Fix:** Add time scale slider (0.1x to 10x), pause button, reverse option
- **Location:** Settings Panel
- **Files:** `cosmos-app/src/App.tsx`, `SettingsPanel.tsx`

### [ ] Add Rim/Edge Lighting
- **Problem:** Planets on dark side are invisible
- **Fix:** Subtle shader glow on edges so silhouettes are always visible
- **Files:** All planet shaders in `cosmos-app/src/objects/`

### [ ] Object Info Panel
- **Problem:** No way to learn about objects
- **Fix:** Click or hover on object → popup with facts (size, distance, orbital period, etc.)
- **Files:** `cosmos-app/src/App.tsx`, new `InfoPanel.tsx`

### [ ] Realistic Planet Rotation (Day/Night)
- **Problem:** Planets don't rotate on their axes
- **Fix:** Add axial rotation to all planets based on real rotation periods
- **Note:** Earth = 24h, Jupiter = 10h, Venus = 243 days (retrograde)
- **Files:** All planet files, SDK.ts for rotation constants

### [ ] Orbital Period Display
- **Problem:** Users don't know how long each planet's year lasts
- **Fix:** Show orbital period in Stats HUD or Info Panel when locked
- **Example:** "Earth: 365 days | Mars: 687 days"
- **Files:** `cosmos-app/src/App.tsx`, SDK.ts

### [ ] Elliptical Orbits
- **Problem:** Current orbits are perfect circles, not realistic
- **Fix:** Implement elliptical orbits with proper eccentricity for each planet
- **High Eccentricity:** Mercury (0.21), Pluto (0.25)
- **Low Eccentricity:** Venus (0.007), Earth (0.017)
- **Files:** `cosmos-app/src/core/SDK.ts`, `OrbitPath.ts`, all planet files

### [ ] Fix Rotation Not Using Delta Time
- **Problem:** Planet rotations use fixed values (e.g., `+= 0.01`) instead of delta time
- **Symptoms:** Rotation speed varies with frame rate
- **Locations:**
  - `Saturn.ts` line 207: `this.mesh.rotation.y += 0.01`
  - `Jupiter.ts` line 179: `this.mesh.rotation.y += 0.01`
  - `Pluto.ts` line 138: `this.mesh.rotation.y += 0.002`
  - `Sun.ts` lines 180-181: rotation uses fixed values
  - `Earth.ts` line 201: `this.mesh.rotation.y = time * 0.1`
  - `AsteroidBelt.ts` lines 97-99: rotation speed increments
- **Fix:** Pass `delta` parameter to update() and use `+= rotSpeed * delta`
- **Files:** All planet files in `cosmos-app/src/objects/`

---

## 🟢 Low Priority / Nice to Have

### [ ] Add More Moons
- **Problem:** Only 4 moons implemented (Moon, Europa, Titan, Charon)
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

### [ ] Remove Unused SDK Constants
- **Problem:** SDK has constants that are never used
- **Unused:**
  - `LIGHT_SPEED` in `UNITS` - not referenced anywhere
  - Potential: `MOON_COLOR` in `LIGHTING` - only used in Earth.ts moonLight
- **Files:** `cosmos-app/src/core/SDK.ts`

### [ ] Refactor Duplicate Moon Class Patterns
- **Problem:** Europa, Titan, and Charon classes are nearly identical
- **Current:** Each moon has its own class with identical structure
- **Fix:** Create generic `Moon` class that takes config and name as constructor params
- **Files:** `Jupiter.ts`, `Saturn.ts`, `Pluto.ts`, new `Moon.ts`

### [ ] CSS Cleanup - Commented Out Styles
- **Problem:** index.css has commented-out styles (lines 59-64, 79-85)
- **Fix:** Remove dead CSS code or document why it's kept
- **Files:** `cosmos-app/src/index.css`

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

### [ ] Performance Mode
- **Problem:** Simulation may be slow on older devices
- **Fix:** Toggle to reduce asteroid count (4000 → 500), simpler shaders, lower shadow resolution
- **Location:** Settings Panel

### [ ] Sound Design & Ambient Audio
- **Problem:** No audio feedback or atmosphere
- **Fix:** 
  - Ambient space music/drone
  - UI click/hover sounds
  - Object proximity audio cues
- **Note:** Use Web Audio API, provide mute toggle

### [ ] Comet Simulation
- **Problem:** No comets in the simulation
- **Fix:** 
  - Highly elliptical orbits crossing planetary orbits
  - Procedural particle tail pointing away from Sun
  - Example: Halley's Comet (76-year period)
- **Files:** New `Comet.ts`, particle system

### [ ] VR Support
- WebXR integration for immersive exploration

### [ ] More Dwarf Planets
- Add Ceres, Eris, Makemake, Haumea

### [ ] Texture Loading
- Optional high-res NASA textures for planets

### [ ] Mobile Touch Controls
- Touch gestures for mobile browsers

### [ ] Improve Memory Efficiency in Animation Loop
- **Problem:** Animation loop creates new THREE.Vector3 instances every frame
- **Locations:**
  - `App.tsx` line 362: `new THREE.Vector3()` in stats update
  - `App.tsx` line 394: `new THREE.Vector3()` per radar blip
  - Multiple planet files create vectors in update()
- **Fix:** Pre-allocate reusable vector instances, reuse in animation loop

### [ ] Extract Scene Setup from App.tsx
- **Problem:** App.tsx is 555 lines, mixing scene setup with React component logic
- **Fix:** Extract scene initialization to `SceneManager.ts` or similar
- **Benefit:** Cleaner separation, easier testing

### [ ] Add Error Boundaries
- **Problem:** No error handling for WebGL context loss or Three.js failures
- **Fix:** Wrap 3D canvas in React error boundary, show fallback UI

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
