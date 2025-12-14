# Changelog

All notable changes to the Cosmos project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-14

### 🎉 Initial Release

**Cosmos** is a modular, high-performance 3D solar system simulation built with React 19, Three.js, and TypeScript.

### Added

#### 🌍 Complete Solar System
- **Sun** with procedural granulation, corona, and adaptive glare shaders
- **8 Planets**: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **3 Moons**: Moon (Earth), Europa (Jupiter), Titan (Saturn)
- **Asteroid Belt** with 4000 instanced asteroids
- **Background Starfield**

#### 🎨 Custom GLSL Shaders
- Procedural crater noise for Mercury
- Swirling cloud dynamics for Venus
- Land/ocean/cloud terrain generation for Earth
- Thin atmospheric glow for Mars
- Banded textures with Great Red Spot for Jupiter
- Procedural ring system for Saturn
- Ice giant storm dynamics for Uranus and Neptune

#### 🎮 Advanced Controls
- **6-DOF Fly Controls**: WASD movement, roll (Q/E), pitch/yaw (arrows)
- **Gamepad Support**: Full controller support with configurable deadzone
- **Camera Lock-On**: Click radar to follow any celestial body
- **Top-Down View**: Toggle satellite perspective with T key
- **Momentum Zoom**: Smooth inertia-based mouse wheel zooming

#### 🗺️ Navigation HUD
- **Radar Map**: Directionally-aware, rotates with camera heading
- **Smart Labels**: CSS2D labels that fade based on distance
- **Lock-On Menu**: Click radar to open planet selection list
- **Control Overlay**: Dynamic HUD with keyboard shortcuts

#### 🛠️ Cosmos SDK
- Centralized physics engine in `src/core/SDK.ts`
- Configurable constants for all planets (radius, distance, speed, color)
- Utility functions: `getOrbitalPosition()`, `getLabelOpacity()`, `smoothstep()`
- Full TypeScript interfaces for extensibility

#### 📦 Architecture
- Modular scene graph with each celestial body as a distinct class
- Shared GLSL noise functions in `src/materials/Noise.ts`
- Clean separation: `src/core/`, `src/objects/`, `src/materials/`

---

[1.0.0]: https://github.com/qtremors/cosmos/releases/tag/v1.0.0
