# Cosmos - Developer Documentation

> Comprehensive documentation for developers working on Cosmos.

**Version:** 2.1.0 | **Last Updated:** 2026-02-16

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Configuration](#configuration)
- [Key Components](#key-components)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Architecture Overview

Cosmos follows a **Component-Based 3D Architecture**:

```
┌──────────────────────────────────────────────────────────────┐
│                         React UI                              │
│              App.tsx, RadarObjectList, SettingsPanel          │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Three.js Scene Layer                       │
│              Objects, Shaders, Materials, Camera              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       Core SDK Layer                          │
│              Physics, Constants, InputHandler                 │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Centralized SDK | All physics constants in one file for easy tuning |
| Multi-system architecture | Enables separate lighting and LOD per system |
| Lazy model loading | Prevents freeze when loading <53MB of GLB models (async loading) |
| External GLSL shaders | Better IDE support and separation of concerns |

---

## Project Structure

```
cosmos/
├── cosmos-app/
│   ├── src/
│   │   ├── App.tsx               # Main component, animation loop (1001 lines)
│   │   ├── main.tsx              # React entry point
│   │   ├── index.css             # Glassmorphism UI styles
│   │   ├── utils/            # Shared utilities
│   │   ├── assets/           # Static assets (images, svg)
│   │   ├── core/
│   │   │   ├── SDK.ts            # Physics constants & utilities
│   │   │   ├── InputHandler.ts   # Keyboard/mouse/gamepad input
│   │   │   └── SystemManager.ts  # Multi-system singleton
│   │   ├── objects/
│   │   │   ├── solar/            # Sun, planets (13 files)
│   │   │   ├── quantumania/      # Mountains, structures, ships, inhabitants (7 files)
│   │   │   ├── common/           # Heliosphere, OrbitPath
│   │   │   ├── AlienX.ts         # Easter egg
│   │   │   ├── BlackHole.ts      # Easter egg
│   │   │   ├── CosmicEntity.ts   # Arishem / Celestial
│   │   │   └── Stars.ts          # Background stars
│   │   ├── shaders/
│   │   │   ├── sun/              # Surface, corona, glare
│   │   │   ├── earth/            # Day/night cycle
│   │   │   ├── blackhole/        # Raymarched accretion disk
│   │   │   ├── atmosphere/       # Atmospheric glow
│   │   │   ├── alienx/           # Cosmic entity shader
│   │   │   └── other/            # Miscellaneous shaders
│   │   ├── components/
│   │   │   ├── RadarObjectList.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── materials/
│   │   │   └── Noise.ts          # Shared simplex noise GLSL
│   │   └── __tests__/
│   │       └── SDK.test.ts       # Vitest unit tests
│   └── public/
│       ├── textures/             # 2K NASA textures
│       └── models/               # 33 GLB models (~53MB)
├── README.md                     # User-facing documentation
├── DEVELOPMENT.md                # This file
├── CHANGELOG.md                  # Version history
├── TASKS.md                      # Development tasks
└── LICENSE.md                    # License terms
```

---

## Core Concepts

### Simulation Units

| Unit | Value | Purpose |
|------|-------|---------|
| 1 AU | 200 sim units | Astronomical Unit scale |
| Solar Radius | 10 sim units | Base star size |
| Time Scale | 86400 (default) | 1 day per second |

### Layer System (Three.js Layers)

| Layer | Purpose |
|-------|---------|
| 0 | Default (Stars, shared objects) |
| 1 | Solar System (planets, sun, moons) |
| 2 | Quantumania (mountains, structures, ships, inhabitants) |

Camera enables all layers. Sun light only affects Layer 1. Quantumania objects have independent lighting.

### System Detection

- **Solar System**: center (0, 0, 0), radius 2500
- **Quantumania**: center (18000, 0, 0), radius 2000
- **Interstellar**: Outside both systems (Alien X, Black Hole visible)

---

## Configuration

### SDK.ts Key Constants

| Category | Key | Value | Description |
|----------|-----|-------|-------------|
| Units | `UNITS.AU` | 200 | Sim units per AU |
| Time | `DEFAULT_TIME_SCALE` | 86400 | 1 day/second |
| Asteroids | `ASTEROIDS.COUNT` | 2000 | Instanced meshes |
| Camera | `LOCK_DISTANCE_MULTIPLIER` | 3.0 | Lock-on zoom |

### Orbital Periods (days)

Mercury: 88 | Venus: 225 | Earth: 365 | Mars: 687  
Jupiter: 4333 | Saturn: 10759 | Uranus: 30687 | Neptune: 60190

### Eccentricity (0 = circular)

Mercury: 0.206 (most elliptical) | Pluto: 0.248 (crosses Neptune's orbit)

---

## Key Components

### SDK (core/SDK.ts)

Central physics engine with all constants and utility functions.

| Function | Description |
|----------|-------------|
| `smoothstep(min, max, value)` | Hermite interpolation |
| `getAdaptiveGlareOpacity()` | Distance-based fade |
| `getRealisticOrbitalAngle()` | Kepler-based orbital position |
| `getEllipticalOrbitalPosition()` | 3D position with inclination |
| `getRealisticRotation()` | Planet rotation angle |

### SystemManager (core/SystemManager.ts)

Singleton for multi-system architecture.

| Method | Description |
|--------|-------------|
| `getInstance()` | Get singleton |
| `updateCurrentSystem(pos)` | Detect current system |
| `isInSystem(id)` | Check camera location |

### InputHandler (core/InputHandler.ts)

Unified input handling.

| Feature | Description |
|---------|-------------|
| Progressive boost | 10x → 100x over ~10 seconds |
| Lock-on camera | Orbital movement around targets |
| Gamepad support | Full controller mapping |

---

## Testing

### Running Tests

```bash
cd cosmos-app

# All tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

### Test Coverage

| Test File | Coverage |
|-----------|----------|
| `SDK.test.ts` | 12 tests for orbital mechanics |

**Areas needing tests**: InputHandler, SystemManager, planet classes

---

## Deployment

### Vercel Deployment

1. Push to `main` branch
2. Vercel auto-deploys from GitHub
3. Live at: https://cosmox.vercel.app/

```bash
# Production build
npm run build

# Preview locally
npm run preview
```

### Production Checklist

- [ ] All textures loading correctly
- [ ] Models lazy-loading on Quantumania entry
- [ ] No console errors
- [ ] Bundle size acceptable (913KB chunk warning exists)

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Models not loading** | Check `public/models/` not in `.gitignore` |
| **Blank screen** | Check console for WebGL errors |
| **Low FPS** | Reduce `ASTEROIDS.COUNT` in SDK.ts |
| **Camera stuck** | Press Escape to unlock |

### Debug Mode

Open browser DevTools and check the console. All Three.js objects are accessible via:

```javascript
// In browser console
window.__THREE_DEVTOOLS__
```

---

## Contributing

### Code Style

- TypeScript strict mode enabled
- Prefer `const` over `let`
- Use SDK constants instead of magic numbers
- Extract shaders to separate GLSL files

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with clear messages
6. Push and create a Pull Request

### Adding a Celestial Body

1. Add config to `SDK.ts` → `PLANETS`
2. Create class in `src/objects/solar/`
3. Add to scene in `App.tsx`
4. Add to radar entities
5. Update documentation

---

<p align="center">
  <a href="README.md">← Back to README</a>
</p>
