# Cosmos Changelog

> **Project:** Cosmos  
> **Version:** 2.1.0  
> **Last Updated:** 2026-02-16

---

## [2.1.0] - 2026-02-16

### 🚀 Features
- **Quantumania Overhaul:**
  - Overhauled the positioning and grouping of objects in Quantumania. 
- **Arishem (The Architect):**
  - Introduced the Titan-scale **Arishem** celestial entity.
  - **Interior Detail:** Multi-point lighting systems, chest-cavity "Architect" figures, and a head-cavity Robot entity.
- Some Bug Fixes and Improvements

## [2.0.0] - 2026-01-10
### Major Refactoring
- **Naming Consistency Overhaul:** Fixed mismatched file/class/variable names across the codebase
  - `robonaut` → `alienX` (App.tsx)
  - `GLBMountain` → `GLBEntity` (6 files)
  - `mountainName` → `entityName` (6 files)
  - `NexusMountain` → `Nexus` (2 files)
  - `MountainEntity` → `QuantumaniaEntity` (1 file)

### Code Cleanup
- **Comment Cleanup:** Removed verbose inline comments from all object files (~30 files)
- **Section Headers Preserved:** Kept structural `// === SECTION ===` comments for navigation

### Licensing
- **Custom License:** Added professional Tremors Source License v1.1
  - Fork & derivatives allowed with permanent attribution
  - Commercial use requires written permission
  - Contributions transfer ownership

### Documentation
- **CONTEXT.md:** Updated file references to match new names
- **README:** Version badge updated

---

## [1.9.5] - 2026-01-10
### UI/HUD System Awareness
- **System-Aware Stats HUD:** Distance now shows "From Sun" / "From Nexus" / "From Origin" depending on entity system
- **Conditional Orbital Speed:** Only shown for Solar System objects (Kepler's laws don't apply to Quantumania)
- **Filtered Nearest Object:** HUD now only searches current system + interstellar (no more "Sun" in Quantumania)
- **Settings Panel:** Time controls disabled in Quantumania with "⏱️ Time locked to real-time" message

### Camera Improvements
- **Distance-Adaptive Transitions:** Long-distance travel now uses slower lerp (0.01-0.05) for smooth "warp" effect
- **System-Aware Lock Distance:** Quantumania objects use 1.5x radius (closer camera) vs 3.0x for planets

### Performance & Build
- **Lazy Model Loading:** 38 Quantumania GLB models (~57MB) now load only when system is entered
- **Sequential Loading:** Center Nexus loads first, then Mountains → Structures → Ships → Inhabitants
- **Wireframe Placeholders:** Models show as wireframes until downloaded
- **Fixed Gitignore:** Removed rule ignoring `public/models/` to enable Vercel deployment

### Removed
- **Ambient Light Slider:** Removed non-functional graphics setting (shader materials don't respond to THREE.js ambient light)

---

## [1.9.0] - 2026-01-05
### Code Quality & Testing
- **Test Suite:** Added Vitest with 12 unit tests for SDK orbital mechanics (smoothstep, orbital angles, elliptical distance, glare opacity, constants validation)
- **Shader Extraction:** Moved 14 inline GLSL shaders to external `.glsl` files in `src/shaders/` with organized subdirectories (sun, earth, blackhole, atmosphere, alienx)
- **Entity Categories:** Added `EntityCategory` enum to replace hardcoded label filters in RadarObjectList for better maintainability
- **Documentation:** Fixed README version badge (was v1.6.0, now v1.9.0), updated "Recent" changelog section

---

## [1.8.0] - 2026-01-05
### UI & UX Overhaul ("Cosmic Glass" Update)
- **Advanced Panel Layout**: 
  - Implemented a **side-by-side** layout for Radar List and Settings Panel.
  - Added **resizable panels** (via CSS resize) with flexible viewport-based sizing.
  - Restored the **Top-Right HUD** and optimized panel visibility/toggling.
- **Enhanced Navigation**:
  - **"Deep Space" & System Links** (Alien X, Black Hole, Solar/Quantum Switch) are now pinned to the **top** of the list for instant access.
  - Prioritized navigation items to prevent endless scrolling.
- **Detailed Categorization**:
  - **Quantumania**: Split massive list into distinct grids: "Mountains & Terrain", "Structures", "Inhabitants", "Ships".
  - **Solar System**: Categorized into "Planets", "Moons", and "Others".
  - Applied consistent **Grid Layout** (`object-grid`) for all major object groups.
- **Visual Polish**:
  - **Glassmorphism**: Unified panel styles with deep blur and sleek borders.
  - **Invisible Scrollbars**: Hidden native scrollbars for a cleaner, immersive look (`scrollbar-width: none`).
  - **Styled Controls**: Settings panel now displays key bindings as styled 3D keys.

## [1.7.5] - 2026-01-05
### Refactoring & Optimization
- **Quantumania Categorization**: Replaced monolithic `QuantumaniaSystem` config with dedicated category classes:
  - `Mountains.ts`: Natural floating formations.
  - `Structures.ts`: Artificial stations and constructs.
  - `Ships.ts`: Defense net units and drones.
  - `Inhabitants.ts`: Creatures and living entities.
- **Code Cleanup**: Deleted obsolete procedural mountain files (`CityMountain.ts`, `CloudMountain.ts`, etc.).
- **Build Fixes**: Corrected relative import paths in all Solar System objects to fix build failures.

## [1.7.0] - 2026-01-05

### Added

#### ⚡ Performance & Optimization
- **System LOD (Level of Detail):** Quantumania objects only load when camera is within 4000 units (prevents teleport freeze)
- **Strict Layer Separation:** Layer 1 (Solar) and Layer 2 (Quantumania) lighting completely isolated
- **Model Cleanup:** Removed 15+ failing/unused GLB files to reduce build size

#### 🎥 Cinematic Transitions
- **Smooth Teleportation:** Camera now flies smoothly from *current* position to target instead of snapping
- **Smart Angle Logic:** Preserves viewing angle during lock-on for seamless transitions
- **Teleport Zoom:** Correctly zooms in to target radius upon arrival

### Changed
- **Quantumania Lighting:** Boosted intensity to compensate for distance (2M intensity)
- **Time Scale Logic:** Forces "Realtime" in Quantumania (mountains float calmly) vs "Sim Speed" in Solar System
- **Radar Map:** Decluttered blips, hiding Proxy objects and showing distant systems as single icons

### Fixed
- **Tab Teleport:** Fixed logic bug that prevented cycling targets in Quantumania (Stale Closure)
- **Visibility Override:** Fixed bug where Heliosphere wireframe would reappear after locking
- **Heliosphere Hiding:** Wireframes now correctly hide when locked onto an internal object in BOTH systems

---

## [1.6.0] - 2026-01-04

### Added

#### 🏔️ Quantumania System (NEW!)
- **Floating mountains system** at 18,000 units from Solar System
- **11 unique mountains:** The Nexus (central hub), Forest Peak, Frost Summit, Cascade Falls, Sky Metropolis, Crystal Spire, Dune Summit, Ember Peak, Nimbus Haven, Ancient Remnant, Bloom Sanctuary
- **Local lighting:** Mountains have their own PointLights (volcanic glow, crystal glow, city lights)
- **Purple heliosphere** boundary with radius 2,000 units
- **Distant beacon:** Visible as pulsing purple light when viewing from Solar System

#### 🌌 Multi-System Architecture
- **SystemManager singleton** for managing multiple star systems
- **Visibility rules:** Systems hidden when inside another (performance optimization)
- **Camera teleportation:** Click radar tabs to instantly travel between systems
- **System-aware radar:** Shows only current system objects + distant system as single blip

#### 🎛️ Radar Overhaul
- **3 clickable tabs:** Solar, Deep Space, Quantum - click to teleport
- **Current location indicator:** Green "● HERE" badge on active system
- **Distant systems:** "🏔️ Quantumania" or "☀️ Solar System" shown as single radar blip
- **Organized sections:** Planets, Moons, Other, Distant Systems

### Changed
- **Camera spawn:** Now starts at (0, 500, 800) in Solar System
- **Mountain animations:** Removed bobbing (was causing vibration), kept slow rotation

### Fixed
- **Mountain vibration:** Disabled bobbing animation for stability
- **Beacon visibility:** Now correctly shows when system is hidden

---

## [1.5.5] - 2026-01-04

### Added

#### 🌐 Heliosphere Boundary
- **Solar system boundary bubble** - Visual marker showing the extent of the solar system
- **Smart visibility:** Invisible from inside (except near edge), always visible from outside
- **Edge fade-in:** Gradually appears as you approach the boundary from within
- **Distance scaling:** Appears as a glowing dot when viewed from very far away
- **GLSL shader** with logarithmic depth buffer support for proper depth sorting

#### 🏛️ The Kyln (New Easter Egg)
- **The Kyln** - Massive Nova Corps prison from Guardians of the Galaxy
- Industrial structure with tower spires, docking bays, and atmospheric glow
- Red warning lights on top, blue docking lights around perimeter
- Located in the asteroid belt, orbits with Keplerian physics

### Changed
- **Easter Eggs reorganized:**
  - Removed: Tremors (hidden planet), ISS (space station)
  - Replaced: "Quant" asteroid → The Kyln prison structure

### Fixed
- **Alien X glow rendering:** Fixed sprite depth testing that caused visible black boxes when heliosphere was in background

---

## [1.5.0] - 2026-01-03

### Added

#### 🕳️ Sagittarius A* Black Hole
- **Supermassive black hole** at the galactic center (8000 units from Sun)
- **Raymarched accretion disk** with volumetric rendering and gravitational lensing
- **Doppler beaming effect:** Orange/red (receding) and blue (approaching) color shift
- **Solid event horizon core** with proper depth rendering
- **Dynamic camera sync:** Black hole appears correct from all viewing angles
- **Top-view brightness boost:** Disk stays visible when viewed from above/below
- **Independent lighting:** Not affected by scene's global lighting

#### ⚙️ Settings Panel & Smart HUD
- **Settings panel** integrated with radar menu for ambient light and time controls
- **Time scale controls:** Pause, 0.5x, 1x, 2x, 5x, 10x speed presets
- **Ambient light slider:** Adjust scene ambient lighting intensity
- **Smart HUD transparency:** Improved visibility and blur effects

#### � Realistic Physics v2
- **Rotation delta time:** Planet rotations now use proper delta time for smooth animation
- **Time presets:** Quick access to different simulation speeds
- **Pause functionality:** Fully pause simulation while keeping UI responsive

#### 📝 Documentation & Review
- **Deep project review:** Updated TASKS.md with findings and improvements
- Updated README.md and documentation for v1.5.0

### Changed
- Improved rotation calculations using delta time instead of absolute time
- Enhanced HUD transparency and visual polish

---

## [1.2.0] - 2026-01-02

### Added

#### 🚀 Deployment Ready
- **Vercel Deployment:** Project configured for Vercel Hobby plan deployment
- **Custom Favicon:** Cosmos logo as favicon and apple-touch-icon
- **SEO Meta Tags:** Added description, theme-color, and Open Graph tags for social sharing

### Changed
- Updated page title to "Cosmos | 3D Solar System"
- Improved `index.html` structure with proper meta tag ordering

### Removed
- Removed unused `vite.svg` default favicon

---

## [1.1.0] - 2025-12-14

### Added

#### 🪐 Pluto & Charon
- **Pluto** dwarf planet with inclined orbit (oscillates above/below ecliptic)
- **Charon** moon with orbit path visualization
- Added to radar menu and lock-on system

#### 🎯 Orbital Camera Control
- Orbit around locked targets using mouse drag, arrow keys, or gamepad
- Spherical coordinate system for smooth orbital movement
- Preserves lock while changing viewing angle

#### 📊 Stats HUD
- Top-right display panel with transparent blur styling
- **Free Flight:** Shows camera speed in km/s
- **Locked Mode:** Shows orbital speed (km/s) and distance from Sun (M km)

#### 🛸 Moon Orbit Paths
- Visual orbit rings for Moon, Europa, Titan, and Charon
- Subtle transparent lines around parent planets

#### 📡 Radar Menu Overhaul
- Organized into categories: Star, Planets, Moons, Other
- Colored dots for each entity
- Scrollable with custom scrollbar
- Asteroid Belt now lockable

### Changed
- Extracted `InputHandler.ts` module from App.tsx (~120 lines)
- Improved camera lock stability (position lerp + instant lookAt)

### Fixed
- Radar DOM refs preserved when HUD toggled off/on
- Labels toggle now works correctly (ref instead of closure)

---

## [1.0.0] - 2025-12-13

### Added

#### 🌍 Complete Solar System
- **Sun** with animated surface, corona, and glare
- **Rocky planets:** Mercury, Venus, Earth, Mars
- **Gas giants:** Jupiter, Saturn (with rings)
- **Ice giants:** Uranus, Neptune (with subtle rings)
- **4000 instanced asteroids** in the asteroid belt

#### 🌙 Moons
- **Moon** orbiting Earth
- **Europa** orbiting Jupiter
- **Titan** orbiting Saturn

#### 🎮 6-DOF Flight Controls
- WASD + RF movement, Q/E roll
- Mouse drag look, scroll zoom
- Full gamepad support

#### 🎨 Custom GLSL Shaders
- Sun granulation and corona effects
- Planet lighting and atmosphere
- Logarithmic depth buffer for scale handling

#### 🥚 Easter Eggs
- **Explorer-1:** Touring spaceship with collision avoidance
- **ISS:** Space station orbiting Earth
- **Quant:** Golden asteroid in the belt
- **Alien X:** Cosmic entity outside the solar system
- **Tremors:** Hidden planet past Pluto

#### 🛠️ Core Systems
- SDK.ts with centralized physics constants
- CSS2D labels with distance-based opacity
- Radar with entity tracking

---

## [0.1.0] - 2025-12-12

### Added
- Initial project setup with Vite + React + TypeScript
- Three.js integration with OrbitControls
- Basic Sun sphere with texture
