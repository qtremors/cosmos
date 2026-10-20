# Cosmos Task Backlog

> **Version:** 0.1.1 | **Last Updated:** 2026-10-20

Only unfinished work is listed. Development procedures belong in [DEVELOPMENT.md](DEVELOPMENT.md); model limitations belong in [COSMOS.md](COSMOS.md).

## Physical-device validation

- [ ] **PERF-001 - Validate representative phones**
  - **Current:** Automated browser scenarios use viewport emulation and software WebGL.
  - **Acceptance:** Record the device, browser, renderer, viewport, and Low/Medium/High results on physical phones. Check touch controls, small-body navigation, black-hole rendering, and repeated Quantumania/Arishem loading and eviction. Retain the reports and record any device-specific issues.

- [ ] **PERF-002 - Validate integrated GPUs**
  - **Current:** Software-rendered browser runs do not establish integrated-GPU performance.
  - **Acceptance:** Run the same quality and travel scenarios on a physical integrated GPU, verify the active renderer, and retain timing/resource reports after warmup. Base performance recommendations on these results.

Use the [profiling procedure](DEVELOPMENT.md#performance-profiling) for comparable measurements.
