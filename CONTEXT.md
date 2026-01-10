# Cosmos Project Context

A 3D space exploration simulator built with Three.js and React, featuring realistic orbital mechanics, multiple star systems, and interactive navigation.

---

## Architecture Overview

```
cosmos-app/
├── src/
│   ├── App.tsx             # Main component, animation loop, entity management
│   ├── core/
│   │   ├── SDK.ts          # All constants, physics formulas, configuration
│   │   ├── SystemManager.ts # Multi-system tracking (Solar, Quantumania)
│   │   └── InputHandler.ts  # Keyboard, mouse, gamepad input processing
│   ├── objects/
│   │   ├── solar/          # Sun, planets, moons, asteroid belt
│   │   ├── quantumania/    # Floating mountains, structures, ships
│   │   └── common/         # Heliosphere, OrbitPath, Atmosphere
│   ├── components/         # React UI (RadarObjectList, SettingsPanel)
│   └── shaders/            # GLSL shaders (Sun, BlackHole, AlienX, etc.)
```

---

## Core Concepts

### Simulation Units
- **1 AU (Astronomical Unit) = 200 sim units**
- **Solar Radius = 10 sim units**
- Real distances are scaled down but preserve ratios

### Time System
- `simTime` accumulates based on `timeScale`
- Default: 86400 (1 day per second)
- Quantumania forces realtime (1:1) for walking simulator feel
- Pause freezes `simTime` accumulation

### Layer System (Three.js Layers)
| Layer | Purpose |
|-------|---------|
| 0 | Default (Stars, shared objects) |
| 1 | Solar System (planets, sun, moons) |
| 2 | Quantumania (mountains, structures) |

Camera enables all layers. Sun light only affects Layer 1. Quantumania objects have independent lighting.

---

## How Features Work

### Teleportation (Tab Key)
1. `handleKeyDown` catches Tab press
2. Gets current system from `SystemManager.getInstance()`
3. Filters `entitiesRef.current` by system, excludes proxies
4. Cycles `teleportIndexRef` through filtered entities
5. Calls `lockOnTarget(mesh, radius)` with target entity

### Camera Lock System
```typescript
lockRef.current = {
    mesh,           // Target object
    distance,       // Orbital distance (radius × multiplier)
    isTop,          // Top-down view toggle
    theta,          // Horizontal orbit angle
    phi             // Vertical orbit angle
};
```
- Lock multiplier: 3.0 for Solar, 1.5 for Quantumania (closer view)
- Unlock triggers on any WASD movement

### System Detection
- Camera position checked against system spheres each frame
- Solar System: center (0,0,0), radius 2500
- Quantumania: center (18000,0,0), radius 2000
- Outside both = Interstellar (Alien X, Black Hole visible)

### LOD (Level of Detail)
- Objects beyond their system boundary become invisible
- Distant systems show as beacon sprites (pulsing glow)
- Individual entities hidden; only "proxy" dot shown on radar
- Asteroid belt: 2000 instanced meshes with Kepler orbit physics

### Radar System
- Minimap shows entities in camera-relative coordinates
- Blips clamped to edge when beyond range
- Click opens RadarObjectList panel
- System-specific filtering: shows local entities + interstellar

### Realistic Orbital Mechanics
All planets use NASA data from SDK.ts:
- **Elliptical orbits**: `r = a(1-e²) / (1 + e·cos(θ))`
- **Kepler's 3rd Law**: Outer asteroids orbit slower
- **Axial tilt**: Uranus tilted 98°, Venus/Pluto retrograde

---

## Entity Categories

| Category | Examples |
|----------|----------|
| STAR | Sun |
| PLANET | Mercury → Neptune |
| MOON | Moon, Europa, Titan, Charon |
| ASTEROID | Belt (instanced) |
| EASTER_EGG | Explorer, TheKyln, AlienX, BlackHole |
| PROXY | "Solar System" / "Quantumania" distant markers |
| NEXUS | Quantumania central light source |
| MOUNTAIN | MountForest, MountFrost, etc. |
| STRUCTURE | Station, Station1-5 |
| SHIP | Ship1-4 |
| INHABITANT | Inhabitant1-5 |

---

## Quantumania System

A secondary "walking simulator" system with:
- **Lazy loading**: GLB models load only when system becomes visible
- **Nexus**: Central pulsing light source (Cube.glb)
- **Rings**: Entities arranged in distance-based rings (400-800, 1200-1600, 1600-2000)
- **Floating animation**: All objects bob on sine wave
- **Heliosphere**: Purple boundary bubble

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| WASD | Move forward/back/strafe |
| R/F | Up/Down |
| Q/E | Roll left/right |
| Shift | Boost (5x speed) |
| Tab | Teleport to next object |
| T | Toggle top-down view |
| L | Toggle labels |
| H | Toggle HUD |
| Escape | Unlock camera |

---

## Configuration Reference (SDK.ts)

### Key Constants
```
UNITS.AU = 200                    // Sim units per AU
DEFAULT_TIME_SCALE = 86400        // 1 day/second
ASTEROIDS.COUNT = 2000            // Instanced meshes
CAMERA.LOCK_DISTANCE_MULTIPLIER = 3.0
```

### Orbital Periods (days)
Mercury: 88 | Venus: 225 | Earth: 365 | Mars: 687  
Jupiter: 4333 | Saturn: 10759 | Uranus: 30687 | Neptune: 60190

### Eccentricity (0 = circle)
Mercury: 0.206 (most elliptical) | Pluto: 0.248 (crosses Neptune)

---

## Files to Know

| File | Purpose |
|------|---------|
| `SDK.ts` | ALL physics constants, helper functions, planet configs |
| `SystemManager.ts` | Multi-system architecture, boundary detection |
| `InputHandler.ts` | Input state, camera movement logic |
| `App.tsx` | Main loop, entity registration, UI state |
| `GLBEntity.ts` | Lazy-loading 3D model class |
| `QuantumaniaSystem.ts` | Orchestrates Quantumania entities |
