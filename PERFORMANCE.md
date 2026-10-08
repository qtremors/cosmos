# Performance measurements

Recorded on 2026-10-08 against the production build using Chromium 151.0.7922.173 on Linux x64. The renderer was **ANGLE / SwiftShader**, a software WebGL implementation. Viewport emulation is not a physical phone test. These results validate the measurement and resource lifecycle paths; they do not establish hardware frame-rate targets.

The raw report is [measurements/cloud-webgl.json](measurements/cloud-webgl.json). The run used `PROFILE_SAMPLES=30`; each overview row includes an initial sampling window after texture loading, including startup scheduling/shader work. The p95 values are especially sensitive to startup and cloud scheduling. All six overview scenarios reported no JavaScript page errors.

## Quality and viewport samples

| Viewport | Quality | Samples | Frame p50 / p95 (ms) | Texture estimate (MiB) | Shadow estimate (MiB) |
|---|---|---:|---:|---:|---:|
| 1280 × 720 | low | 39 | 115.8 / 1746.9 | 148.32 | 0 |
| 1280 × 720 | medium | 36 | 231.6 / 1352.3 | 148.32 | 12 |
| 1280 × 720 | high | 36 | 383.7 / 1314.7 | 148.32 | 48 |
| 390 × 844 | low | 43 | 56.4 / 110.7 | 148.32 | 0 |
| 390 × 844 | medium | 31 | 155.6 / 1094 | 148.32 | 12 |
| 390 × 844 | high | 37 | 264 / 1174.1 | 148.32 | 48 |

The smaller viewport used a device pixel ratio of 2, capped by the selected preset. Memory estimates describe owned resources, including shared Solar textures and currently hidden resources. A point-light shadow uses six faces: the estimated colour/depth storage is 12 MiB at 512 px and 48 MiB at 1024 px per allocated light. Low allocates no shadow targets.

## Travel and model residency

The runner travelled to Quantumania, loaded all 26 models, returned to the Solar overview, waited for eviction, and revisited Quantumania. This was a production browser run against the actual model files.

| Stage | Resident models | Model loads (cumulative) | Geometry buffers (MiB) | Texture estimate (MiB) | Renderer textures |
|---|---:|---:|---:|---:|---:|
| travel-before | 0 | 0 | 1.99 | 148.32 | 14 |
| travel-quantum-loaded | 26 | 26 | 11.47 | 286.99 | 35 |
| travel-after-eviction | 0 | 26 | 1.99 | 148.32 | 14 |
| travel-reloaded | 26 | 52 | 11.47 | 286.99 | 35 |

The initial 26 model loads spent 19794.2 ms in GLTF parsing/dependency decoding, with a longest individual load of 1797.5 ms. The cumulative parsing/dependency time after reloading was 40622.6 ms. This asynchronous duration includes dependency/image decoding; it is not isolated JavaScript CPU time.

Eviction returned geometry/texture estimates to their pre-travel values; the second visit returned to the same loaded estimates and model count. Some placeholder geometry and newly visited Solar meshes can remain uploaded, so renderer geometry counts need not equal the first frame’s count. Solar textures and lightweight navigation/placeholder objects stay owned by the scene. JS heap is collected asynchronously and is not a reliable total-memory or leak verdict by itself.

## Cosmic model travel

A second production run loaded, evicted, and reloaded all seven Arishem/interior models. The raw report is [measurements/cloud-cosmic-travel.json](measurements/cloud-cosmic-travel.json); it also monitored JavaScript and WebGL shader errors and recorded none. Run this scenario alone with `PROFILE_SYSTEM=cosmic npm run profile`.

| Stage | Resident models | Model loads (cumulative) | Geometry buffers (MiB) | Texture estimate (MiB) | Renderer textures |
|---|---:|---:|---:|---:|---:|
| travel-cosmic-before | 0 | 0 | 1.99 | 148.32 | 12 |
| travel-cosmic-loaded | 7 | 7 | 3.11 | 185.66 | 19 |
| travel-cosmic-evicted | 0 | 7 | 1.99 | 148.32 | 12 |
| travel-cosmic-reloaded | 7 | 14 | 3.11 | 185.66 | 19 |

Stable head/navigation targets survived the eviction and attached to the reloaded model. Counts and texture/geometry estimates returned to their original levels after leaving. The full profiling command now exercises both model areas.

## Production JavaScript

| Chunk | Size | Gzip |
|---|---:|---:|
| Interface | 25.35 kB | 8.66 kB |
| React | 221.84 kB | 69.03 kB |
| Scene controller/world | 91.57 kB | 28.05 kB |
| Three core | 254.07 kB | 70.42 kB |
| Three renderer | 339.60 kB | 83.76 kB |
| Deferred GLTF loader | 44.88 kB | 13.27 kB |

The interface renders before the dynamically imported scene runtime. The GLTF loader is requested on the first model load. These chunks are independently cacheable and below Vite’s default 500 kB warning threshold. Total rendering JavaScript remains necessary; chunk splitting does not eliminate it.

## Reproduce and validate physical devices

From `cosmos-app`, install Chromium once with `npx playwright install chromium`, then run:

```bash
npm run profile

# Use an installed system Chromium if needed
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run profile

# Longer overview sampling on a capable device
PROFILE_SAMPLES=300 npm run profile
```

The runner builds and starts a local production preview, uses deterministic starting phases for overview comparisons, and writes `test-results/performance.json`. `PROFILE_OUTPUT` selects another output path; `PROFILE_BASE_URL` profiles an already running instance. It also verifies all model loads, eviction, and reloading in both Quantumania and Arishem. Reports downloaded in the interface include the renderer identity when the browser exposes it. A failed residency condition times out rather than being reported as a successful measurement.

For physical phones, serve the production build on a reachable address and open `?profile=1` in the phone’s browser. Use Settings → Performance measurements to download the report. For physical integrated GPUs, run the browser with that GPU and verify the renderer identity in browser diagnostics. Use the same browser version, viewport, camera view, time preset, and quality for comparisons.

Allow at least 300 frames of warmup for a steady-state comparison; the bounded 300-frame window then drops startup samples. Record all presets, a black-hole close-up, loaded Quantumania/Arishem, and repeated travel. Compare p50/p95 timings and resource plateaus before setting device recommendations. Use browser GPU/Memory tools for actual driver allocations; the panel’s RGBA/mipmap and colour/depth estimates exclude instance/skinning buffers, render buffers, compression differences, alignment, and driver overhead. Geometry figures cover mesh attributes, morph attributes, and indices rather than every buffer owned by the renderer.

**Still required:** representative phone and integrated-GPU runs. This cloud session cannot truthfully mark those physical-device checks complete.
