# Changelog

All notable changes to the Cosmos project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
