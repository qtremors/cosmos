# Cosmos - Developer Documentation

> Comprehensive documentation for developers working on Cosmos.

**Version:** 2.1.0 | **Last Updated:** 2026-10-08

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

### Stack suitability

React, TypeScript, Three.js, and Vite are appropriate for this project. React manages accessible interface state; Three.js owns the render loop, WebGL resources, scene graph, custom GLSL, and gamepad-driven camera. Keep simulation changes out of React's per-frame state updates, and pass only sampled HUD data to the UI.

TypeScript makes entity metadata and loading/lifecycle contracts easier to maintain. Vite supports the static client and shader imports without requiring a server framework. Vitest covers deterministic calculations and ownership contracts; Playwright covers the browser, WebGL, focus, and interaction paths that unit tests cannot represent.

A move to React Three Fiber is optional if declarative scene authoring becomes valuable. It would be a separate architectural choice, and would still require sensible asset, shader, and quality budgets. A framework migration is not required for the fixes in this branch.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Centralized SDK | All physics constants in one file for easy tuning |
| Multi-system architecture | Enables separate lighting and LOD per system |
| Scene-owned assets | Progress, fallback textures, retry, bounded model queues, and late-result disposal |
| Graphics presets | Conservative shadow budgets and adjustable rendering cost |
| Animation ownership | One cancellable RAF chain; bounded elapsed-time updates |
| External GLSL shaders | Better IDE support and separation of concerns |

---

## Project Structure

```
cosmos/
├── cosmos-app/
│   ├── src/
│   │   ├── App.tsx               # Scene coordination and React UI
│   │   ├── main.tsx              # React entry point
│   │   ├── index.css             # Glassmorphism UI styles
│   │   ├── assets/           # Static assets (images, svg)
│   │   ├── core/
│   │   │   ├── SDK.ts            # Physics constants & utilities
│   │   │   ├── InputHandler.ts   # Keyboard/mouse/gamepad input
│   │   │   ├── SystemManager.ts  # Multi-system detection
│   │   │   ├── SceneLifecycle.ts # Animation ownership and GPU cleanup
│   │   │   ├── SceneAssets.ts    # Asset status, retry, and late-result handling
│   │   │   ├── Quality.ts        # Persistent graphics presets
│   │   │   ├── Simulation.ts     # Units, visibility constants, damping
│   │   │   └── Entity.ts         # Shared required entity metadata
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
│   │       └── SDK.test.ts       # SDK, input, lifecycle, assets, system regressions
│   └── public/
│       ├── textures/             # 2K NASA textures
│       └── models/               # 34 GLB files; 26 Quantumania model entities
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

Camera enables all layers. Layers select lights and objects against the camera. With all layers enabled in a single render pass, they do not guarantee illumination isolation between systems. Separate lighting remains a deferred project task.

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

## Runtime ownership and loading

`SceneLifecycle.startAnimationLoop` owns one RAF chain, cancels it during cleanup, skips hidden-tab updates, and caps long frame gaps. `disposeObject3D` releases shared geometry, materials, shader-uniform textures, skeletons, and light shadow resources. App removes listeners and invalidates asset/scene owners before disposing the renderer.

Each scene has a `SceneAssets` manager. Texture failures receive a neutral fallback and a visible retry action. Model results arriving after disposal are released. Supported requests are aborted on teardown; image loading that cannot be aborted is guarded against stale callbacks.

`GLBEntity` and `Nexus` retain the actual in-flight promise. Quantumania starts one sequential queue when shown and stops starting new requests when hidden. Failures are retried explicitly. Arishem and its interior models load when the camera approaches; the GLTF loader's JavaScript is also imported on demand.

Quality presets apply without rebuilding the scene and persist under `cosmos-quality` in local storage. Low disables shadows; Medium uses 512-pixel shadows; High uses 1024-pixel shadows. Presets also control asteroid/star counts, black-hole raymarch steps, and the maximum pixel ratio.

Orbit time follows the Solar System time controls. Cosmetic animations use active elapsed time independently. Explorer/Kyln movement pauses with the Solar simulation; full pause semantics remain a backlog item. Camera damping and zoom use real frame delta, and movement state resets when focus is lost.

## Testing

Use Node.js 24, or Node.js 22.13+ on the supported 22.x line.

```bash
cd cosmos-app
npm ci
npm run check       # TypeScript lint, unit tests, strict production build
npm run typecheck  # Standalone compiler check
npm run test:watch # Unit test watch mode
npx playwright install chromium
npm run test:e2e
npm audit
```

GitHub Actions runs project checks and Chromium regressions on pushes and pull requests. Failed browser checks retain traces as workflow artifacts.

The current suite contains 30 unit tests across six files plus eight browser scenarios. Coverage targets animation ownership/teardown, late model disposal, loading promises and queue suspension/retry, input timing/boost, unit conversions, system transitions, HUD toggles, keyboard/search navigation, saved quality, small-screen layout, failed textures, deferred models, lost-keyup recovery, and black-hole shader compilation.

If using an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. The browser configuration supports software WebGL for CI; hardware performance must be measured separately.

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
- [ ] Models load on selection/proximity and failed assets can be retried
- [ ] No console errors
- [ ] Initial bundle and on-demand GLTF chunk are measured; a large initial Three.js chunk warning still exists

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

Open browser DevTools and check the console. Inspect scene/renderer state by setting a breakpoint in the scene update callback in `App.tsx`. The app does not expose a global scene object. Use the browser Performance/Memory panels to compare quality settings and repeated mount/unmount behavior.

---

## Contributing

### Code Style

- TypeScript strict mode is enforced by `npm run build` and `npm run typecheck`
- Run TypeScript ESLint and browser regressions for scene/input changes
- Prefer `const` over `let`
- Use SDK constants instead of magic numbers
- Extract shaders to separate GLSL files

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `npm run check` and relevant browser regressions (`npm run test:e2e`)
5. Commit with clear messages
6. Push and create a Pull Request

### Adding a Celestial Body

1. Add config to `SDK.ts` → `PLANETS`
2. Create class in `src/objects/solar/`
3. Add to scene in `App.tsx`
4. Add to radar entities with a unique ID, required category/system, and correct radius
5. Update documentation

---

<p align="center">
  <a href="README.md">← Back to README</a>
</p>
