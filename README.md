# Cosmos

A 3D space exploration simulator built with React, TypeScript, and Three.js.

Version: 0.0.9

## Run locally

Use Node.js 22.13 or newer.

```powershell
cd cosmos-app
npm install
npm run dev
```

Open http://localhost:5173/. Drag to look or orbit, scroll to zoom, and use the destination selector for close-ups.

Open the radar for searchable destinations and settings. Use N to cycle objects, Tab to navigate the interface, and Home to reset the view.

## Available in this version

- Establish the React and Three.js viewer, common physical scale, dated orbital calculations, and owned scene resources.
- Render the Sun, Earth, and Moon with surface textures, atmospheric glow, dated orientation, and selectable close-ups.
- Add the remaining planets, major moons, rings, dwarf planets, Halley, orbit guides, and visible asteroid and Kuiper belts.
- Add Alien X and the black hole beyond the Solar region, preserve their relative placement, and introduce system navigation boundaries.
- Add Quantumania terrain, structures, ships, and inhabitants with deferred loading, retries, and model eviction.
- Add Arishem and his interior models with dedicated lighting, Explorer, The Kyln, and a steady distant Sun marker.
- Integrate the scene controller, adaptive flight and tracking, independent lighting, automatic exposure, and analytic solar eclipses.
- Add searchable object navigation, keyboard and touch controls, responsive panels, date and quality settings, and performance readouts.
- Add astronomical reference checks, runtime and input regressions, browser test scenarios, and local profiling tools.

See LICENSE.md for usage and attribution terms.
