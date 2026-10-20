# Cosmos - Developer Documentation

> Setup, architecture, implementation conventions, and verification guidance.

**Version:** 0.1.1 | **Last Updated:** 2026-10-20

## Table of Contents

- [Setup](#setup)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture and Runtime](#architecture-and-runtime)
- [Configuration](#configuration)
- [Testing](#testing)
- [Performance Profiling](#performance-profiling)
- [Production Build](#production-build)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Setup

Use Node.js 24, or Node.js 22.13+ on the 22.x line. Run application commands from `cosmos-app`.

```bash
cd cosmos-app
npm ci
npm run dev
```

The development server opens at [localhost:5173](http://localhost:5173). Dependency versions are declared in `package.json` and resolved in `package-lock.json`.

## Technology Stack

| Area | Technology |
|---|---|
| Interface | React 19 and CSS |
| Rendering | Three.js 0.182 and custom GLSL |
| Language | TypeScript 5.9 with strict checks |
| Astronomical positions | Astronomy Engine 2.1.19 and checked-in JPL orbital elements |
| Build | Vite 7 |
| Verification | ESLint, TypeScript, Vitest, and Playwright |

## Project Structure

```text
cosmos/
├── cosmos-app/
│   ├── src/
│   │   ├── App.tsx             # React state and asynchronous runtime startup
│   │   ├── main.tsx            # Application entry point
│   │   ├── index.css           # Interface and responsive layouts
│   │   ├── components/        # Navigation, settings, object details, touch input
│   │   ├── core/              # Runtime, physical model, input, assets, diagnostics
│   │   ├── objects/
│   │   │   ├── common/        # Shared planets, moons, orbit paths, heliospheres
│   │   │   ├── solar/         # Solar System objects
│   │   │   └── quantumania/   # Model-backed fictional entities
│   │   ├── shaders/           # Sun, Earth, atmosphere, black hole, Alien X
│   │   ├── materials/         # Shared shader noise
│   │   └── __tests__/         # Unit regressions and reference vectors
│   ├── public/
│   │   ├── textures/          # Surface and background images
│   │   └── models/            # GLB assets
│   ├── e2e/                  # Browser regressions
│   └── scripts/              # Production profiling
├── README.md                 # User overview and controls
├── DEVELOPMENT.md            # Development and verification
├── COSMOS.md                 # Physical model and accuracy limits
├── TASKS.md                  # Unfinished work
├── CHANGELOG.md              # Version history
└── LICENSE.md                # Project license
```

## Architecture and Runtime

React owns interface state. Three.js owns the scene graph, animation loop, input integration, and rendering resources. Per-frame simulation stays in the runtime; sampled values and events update the React interface.

| Module | Responsibility |
|---|---|
| `App.tsx` | Load the runtime asynchronously, pass settings/callbacks, and dispose it on unmount |
| `SceneController.ts` | Own the renderer, input listeners, clocks, camera, and runtime lifecycle |
| `World.ts` | Construct objects and register navigation entities |
| `SystemRenderer.ts` | Render independently lit Solar, Quantumania, interstellar, and Arishem scenes |
| `SceneLifecycle.ts` | Own one animation loop and release scene resources |
| `SceneAssets.ts` | Track texture/model loading, failures, retries, and stale completions |
| `InputHandler.ts` | Integrate keyboard, mouse, touch-button, and gamepad input |
| `Entity.ts` / `SystemManager.ts` | Define entity metadata and identify the active destination |
| `Performance.ts` | Collect bounded timing samples and resource estimates |

### Rendering and lifetime

The controller removes listeners and invalidates asset owners before disposal. Cleanup releases geometry, materials, textures, skeletons, shadow resources, and decoded bitmaps. Asynchronous imports and asset completions are guarded against creating or attaching objects after teardown.

Solar, Quantumania, interstellar objects, and Arishem render in separate scene passes with shared depth. Arishem owns ambient, key, fill, and scale-adjusted accent lights. Three.js layers control visibility; separate scene light collections isolate illumination.

Vite separates the React interface, scene runtime, Three core, Three renderer, and deferred GLTF loader into chunks. The interface can render before the scene runtime loads.

### Assets and model residency

Textures are shared through the scene asset manager. Failed textures receive a neutral fallback and an explicit retry action. Model entities share in-flight promises and discard late results after disposal or eviction.

Quantumania loads through a sequential queue that suspends when the area is hidden. Arishem and its interiors load on approach or selection. The GLTF loader itself is imported on demand.

After 30 active wall-clock seconds away from a model area, its owned resources are evicted. Navigation targets survive eviction, and returning reloads the models. Shared Solar textures remain resident.

### Simulation

`PhysicalScale.ts` defines the common conversion for astronomical distances and sizes. `BodyData.ts` stores physical parameters and source links. `Ephemeris.ts` supplies dated positions, velocities, body orientations, and orbit guides. `SolarOcclusion.ts` supplies analytic eclipse masks.

The astronomical clock defaults to the current UTC date at real-time speed. Saved date, speed, and pause preferences override those defaults. Active wall time advances the model at the selected rate in every destination. Camera and decorative animation use bounded frame deltas; hidden tabs suspend advancement. Pause freezes astronomical and decorative motion while retaining camera controls and loading.

See [COSMOS.md](COSMOS.md) for reference frames, orbital approximations, and verification bounds.

## Configuration

Change configuration at its owning module rather than duplicating values across objects.

| Module | Configuration |
|---|---|
| `PhysicalScale.ts` | 149,597,870.7 km per AU; 200 render units per AU |
| `TimeConfig.ts` | Real-time default, accelerated time presets, and supported dates (1900-01-01 through 2100-01-01) |
| `Lighting.ts` | Automatic exposure metering |
| `Preferences.ts` | 15% default dark-side fill and validated `cosmos-preferences` local storage |
| `Quality.ts` | Quality presets and the `cosmos-quality` local-storage preference |
| `SDK.ts` | Shared object, lighting, and control configuration |
| `Simulation.ts` | Visibility distances, unit conversion, and elapsed-time damping |

| Setting | Low | Medium (default) | High |
|---|---|---|---|
| Main / Kuiper belt representatives | 500 / 125 | 1000 / 250 | 2000 / 500 |
| Stars | 2000 | 5000 | 8000 |
| Black-hole raymarch steps | 48 | 96 | 150 |
| Maximum pixel ratio | 1 | 1 | 1.5 |

Solar eclipses use analytic occlusion at every preset. The Solar light does not allocate a shadow cubemap. Automatic exposure and dark-side fill are separate viewing settings.

Settings persist on the same browser origin: graphics quality, exposure, fill light, orbit guides, fictional extras, labels, HUD visibility, time speed, pause, diagnostics, and an explicit information-panel choice. A selected date is restored as the starting date; choosing Now returns future sessions to the current clock. Corrupt or unavailable browser storage falls back to defaults without preventing exploration.

## Testing

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs lint, typechecking, unit tests, and a production build. The build also enforces typechecking. For focused work, use `npm run lint`, `npm run typecheck`, `npm test`, or `npm run test:watch`.

Unit regressions cover physical calculations, reference vectors, input, animation ownership, assets, disposal, model residency, pause behavior, and resource estimates. Browser regressions cover WebGL rendering, navigation, focus, responsive layouts, loading/retry, touch input, dated camera tracking, and lighting isolation.

`playwright.config.ts` uses one worker and starts the development server. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium executable. Software WebGL and viewport emulation exercise browser behavior but do not establish physical-device performance.

## Performance Profiling

### Collect a report

After installing dependencies and Chromium, run:

```bash
npm run profile
```

The command builds the app and runs `scripts/profile.mjs` against a production preview on port 5174. It samples Low/Medium/High at desktop and phone viewport sizes, then loads, evicts, and reloads the actual Quantumania and Arishem models. Failed residency conditions time out.

| Environment variable | Purpose |
|---|---|
| `PROFILE_OUTPUT` | Report path; defaults to `test-results/performance.json` |
| `PROFILE_BASE_URL` | Profile an existing instance instead of starting a preview |
| `PROFILE_SAMPLES` | Samples per overview; defaults to 60, with a 300-sample window |
| `PROFILE_SYSTEM=cosmic` | Run only the Arishem travel scenario |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Use a specified Chromium executable |

For example, in PowerShell:

```powershell
$env:PROFILE_SAMPLES = '300'
npm run profile
Remove-Item Env:PROFILE_SAMPLES
```

For interactive measurements, open `?profile=1` or enable Performance measurements in Settings, then download the report.

### Interpret results

Reports include frame p50/p95, draw counts, geometry/texture/shadow estimates, model parsing time, and resident model counts. Memory estimates exclude some renderer buffers and driver overhead. Parsing durations include dependency and image decoding; they are not isolated JavaScript CPU timings. JS heap alone does not establish whether resources leak.

Collect isolated samples after warmup before making timing comparisons or hardware recommendations. Software rendering and viewport emulation do not establish performance on physical phones or GPUs.

### Validate physical devices

On a phone, serve the production build on a reachable address and open `?profile=1`. On an integrated GPU, verify the active renderer in browser diagnostics. Compare the same browser version, viewport, camera, simulation date/rate, and quality.

Allow at least 300 warmup frames, then capture a fresh 300-frame window. Check all presets, a black-hole close-up, both loaded model areas, and repeated travel. Inspect resource plateaus and p50/p95 timings. Track unfinished device runs in [TASKS.md](TASKS.md).

## Production Build

```bash
npm run build
npm run preview
```

Vite writes the static site to `cosmos-app/dist`. Use the preview server to inspect that build locally.

## Maintenance

- Use strict TypeScript, shared configuration, and required entity categories.
- Keep GLSL in `src/shaders`; keep simulation work out of React's render cycle.
- For a new astronomical body, supply physical data, an ephemeris or explicit approximation, registration in `World.ts`, and relevant regression coverage. Keep mesh radius and navigation metadata consistent.
- Run checks relevant to changed behavior. Use browser regressions for scene, input, or interface changes.
- Keep version history in [CHANGELOG.md](CHANGELOG.md), model assumptions in [COSMOS.md](COSMOS.md), and only unfinished work in [TASKS.md](TASKS.md).
- Review [LICENSE.md](LICENSE.md) and third-party attribution requirements before contributing or redistributing assets.

## Troubleshooting

| Issue | Check |
|---|---|
| Blank view | Browser console, WebGL support, and failed asset requests |
| Missing models | Asset status/retry, `public/models`, and whether Fictional extras is enabled |
| Low frame rate | Select Low quality and inspect performance measurements |
| Camera remains locked | Press Escape to unlock or Home to reset |
| Browser tests cannot launch | Install Playwright Chromium or set the executable-path variable |
