# Cosmos tasks

> **Project:** Cosmos · **Current release:** v2.1.0 · **Updated:** 2026-10-08
>
> Completed work below is implemented on `improve/cosmos-reliability-and-navigation`. It has not been deployed.

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

## High priority follow-up

- [ ] Extract the remaining scene construction/update code from App into a scene controller with a small React interface. Lifecycle and asset ownership utilities are already separate; App still coordinates too much.
- [ ] Profile Low/Medium/High on integrated GPUs and representative phones. Record frame time and GPU/CPU memory before making hardware/RAM claims.
- [ ] Measure GLB parsing and texture residency during extended travel; decide whether distant models need eviction and on-demand reloading.

## Deferred project decision

- [ ] **Separate lighting per system** — preserve the existing deferral. Three.js layers select lights/objects for a camera; they do not isolate illumination between object layers in the current single render pass. Independent scenes/passes or explicit lighting/material design are needed before calling this complete.

## Medium priority

- [ ] Solve Kepler's equation for elliptical orbital timing. Current orbit shapes and periods are represented, but true anomaly advances uniformly rather than satisfying equal-area motion.
- [ ] Replace the HUD's approximate circular orbital-speed formula with a calculation matched to orbital mechanics; distinguish planet, moon, and decorative-object reference frames.
- [ ] Add an object information panel with facts, source attribution, and a clear explanation of visual scale.
- [ ] Add touch flight/zoom controls if full mobile free flight is a supported goal. Touch dragging and object selection are now available.
- [ ] Profile remaining startup JavaScript and geometry detail. The model loader is split out, but the initial Three.js bundle still exceeds Vite's 500 kB advisory threshold.
- [ ] Make all simulation/cosmetic pause semantics explicit in the UI before expanding time controls.

## Later improvements

- [ ] Reduce duplicated planet/moon setup with data-driven configurations.
- [ ] Offer adjustable dark-side visibility/rim lighting after lighting behavior is settled.
- [ ] Add moons such as Io, Ganymede, Callisto, and Enceladus.
- [ ] Consolidate remaining legacy CSS and remove unused styles.
- [ ] Consider audio, comets, more dwarf planets, procedural surfaces, WebXR, or physics workers when product goals and profiling justify them.

## Validation

Run from `cosmos-app`:

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm audit
```

`npm test` runs once; use `npm run test:watch` for watch mode. Browser tests cover Strict Mode loop ownership, HUD toggling, keyboard/search behavior, quality persistence, mobile layout, texture retry, deferred models, lost-keyup recovery, and black-hole shader compilation. Lifecycle unit tests also verify teardown and late model disposal.
