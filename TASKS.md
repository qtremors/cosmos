# Cosmos tasks

> **Project:** Cosmos · **Current release:** v2.1.0 · **Updated:** 2026-10-09
>
> Completed work below is implemented on `ag-dev`. It has not been deployed.

## Completed in this improvement branch

- [x] Own and cancel the animation loop during scene teardown, including React Strict Mode replay.
- [x] Dispose scene geometry, shared materials/textures, skeletons, shadow targets, and animation mixers; abort supported asset requests and discard late model results.
- [x] Preserve radar nodes and references across repeated HUD toggles.
- [x] Correct HUD speed sampling, stationary startup speed, and AU-to-kilometre conversions.
- [x] Use Tab for interface navigation and N for cycling objects; keep scene controls out of search/settings fields.
- [x] Limit scene dragging to the canvas, support mouse/touch pointer capture, and reset movement/drag/boost on blur or visibility loss.
- [x] Use accessible destination buttons, visible focus, search, close-button names, and focus restoration.
- [x] Fit navigation/settings panels to narrow screens and keep the stats HUD from intercepting radar clicks.
- [x] Add persistent Low/Medium/High quality presets for shadows, asteroid/star counts, black-hole raymarch steps, and maximum pixel ratio.
- [x] Replace 4096-pixel Sun shadows with a 512-pixel default and a 1024-pixel High preset.
- [x] Add shared texture loading, neutral fallback textures, progress/failure feedback, and retry handling.
- [x] Share actual in-flight GLB/Nexus completion promises and allow retry after failure.
- [x] Load Quantumania models sequentially, suspend the queue when leaving, and avoid overlapping queues or repeated automatic failure retries.
- [x] Defer Arishem and its interior models until the camera approaches; dynamically import the GLTF loader on the first model request.
- [x] Supply required entity categories, use those categories in the object list, and preserve proxy identity when locking onto shared meshes.
- [x] Use elapsed time for camera damping/zoom, Explorer movement, Quantumania ships/inhabitants, and Kyln rotation.
- [x] Reuse vectors in frame updates and remove Explorer's repeated planet-position clones.
- [x] Keep boost acceleration per input state and discover standard gamepads outside slot zero.
- [x] Remove reversed GLSL smoothstep edges and guard the black-hole camera basis at pole views.
- [x] Enable TypeScript ESLint, enforce typechecking in production builds, patch tooling dependencies, and add GitHub Actions checks.
- [x] Add lifecycle, input, unit-conversion, system-transition, loading, and browser regression coverage.
- [x] Remove duplicate comments and duplicate visibility calls, centralize visibility distances, and add explicit button types.
- [x] Refresh documentation, model counts, test commands, and backlog priorities. Remove the absent empty-utils-directory task.

## Remaining work implemented

- [x] Extract scene construction into `World` and runtime ownership into `SceneController`, with a small asynchronous React interface.
- [x] Measure frame timings, geometry/texture/shadow estimates, JS heap where available, model parsing, and model residency; provide report downloads and a repeatable production profiling command.
- [x] Evict distant Quantumania/Arishem models after 30 active wall-clock seconds; preserve navigation targets, release GPU resources/decoded bitmaps, discard late results, and reload on return.
- [x] Isolate lighting using separate Solar, Quantumania, and interstellar render passes, verified with rendered pixels.
- [x] Solve Kepler’s equation for elliptical timing and use physical axes/periods for vis-viva orbital speed.
- [x] Reference moon telemetry to its parent planet and omit physical orbital speed for decorative objects.
- [x] Add object facts and NASA source links; the subsequent scientific model replaces the earlier visual scaling and randomized phases.
- [x] Add touch flight, roll, boost, zoom and view reset, with pointer cancellation and focus-loss cleanup.
- [x] Split startup JavaScript into the React shell, Three core/renderer, scene runtime, and deferred model loader; remove the oversized-chunk warning without raising the threshold.
- [x] Make pause freeze orbital and cosmetic animation while retaining flight/loading; explain rate controls in Settings.
- [x] Reduce duplicated planet/moon setup with shared data-driven classes and precompute asteroid orbital rates.
- [x] Offer adjustable dark-side fill lighting, including the custom Earth shader.
- [x] Add Io, Ganymede, Callisto, and Enceladus.
- [x] Consolidate legacy CSS, remove unused selectors/duplicate rules, and retain responsive navigation.
- [x] Expand unit/browser regressions and document production measurements and reproducible profiling.

## Scientific Solar System implemented

- [x] Use one physical scale for planetary/moon radii, distances and rings; retain small true sizes in close-ups.
- [x] Initialize a UTC clock at now; expose date, pause and rate controls, with consistent astronomical time across destinations.
- [x] Use Astronomy Engine ephemerides for planets, the Moon and Galilean satellites; preserve J2000 ecliptic orientation.
- [x] Use IAU poles/spin, measured planetary flattening, approximate irregular small-body shapes, and independent orbital/body frames.
- [x] Add the major Mars/Saturn/Uranus/Neptune satellites, all five recognised dwarf planets, Halley’s nucleus and a representative Kuiper Belt.
- [x] Source additional bodies’ oriented two-body elements from JPL Horizons and disclose their epoch/precision limitations.
- [x] Add physical ring extents/Cassini division and Jupiter’s faint main ring.
- [x] Use inverse-square solar light, optional auto exposure/fill and analytic eclipse shadows; remove Solar cubemap allocation.
- [x] Adapt near clipping, travel, zoom, flight speed and exact target tracking for tiny bodies and accelerated dates.
- [x] Keep original destinations available by default, with an optional astronomy-only view; expose independent orbit/label viewing aids and scientific information.
- [x] Validate against independent JPL vectors, physical scale/spin/orbits and an observed lunar eclipse; add browser regressions.
- [x] Document the reference frame, sources, representative populations, approximations and omissions in [SCIENCE.md](SCIENCE.md).

## Physical-device validation still required

- [ ] Run Low/Medium/High on integrated GPUs and representative phones. The cloud environment provides a software WebGL renderer and viewport emulation, not these physical devices. `npm run profile` and [PERFORMANCE.md](PERFORMANCE.md) provide the scenarios and measurement procedure; do not substitute cloud timings for hardware validation.

## Optional product ideas reviewed

Audio, detailed/procedural surfaces, WebXR, a complete small-body/satellite catalogue, fully perturbed satellite ephemerides, comet tails and more detailed atmospheric/ring photometry remain extensions. Halley’s nucleus and the recognised dwarf planets are now implemented. [SCIENCE.md](SCIENCE.md) identifies the limits of the current physical model; completed items do not imply that every possible astronomical feature exists.

## Validation

The scientific implementation passes 63 unit tests and all 15 browser scenarios, including default discovery and loading of all 26 Quantumania and seven Arishem models. The production report [measurements/cloud-science.json](measurements/cloud-science.json) verifies zero Solar cubemap allocation and both model eviction/reload cycles with real assets.

Run from `cosmos-app`:

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm audit
npm run profile
```

`npm test` runs once; use `npm run test:watch` for watch mode. Browser tests cover Strict Mode loop ownership, HUD toggling, keyboard/search behavior, quality persistence, mobile layout, texture retry, deferred models, lost-keyup recovery, black-hole shader compilation, physical moon information, touch cancellation/zoom, pause, and rendered-pixel lighting isolation. Unit tests also verify teardown, late completion, eviction/reloading, Kepler timing, shader pause time, and resource estimates.
