# Cosmos 🌌

> **Experience the infinite.** A modular, high-performance 3D solar system simulation running directly in your browser.

Explore a procedurally generated solar system with 8 planets, custom GLSL shaders, realistic orbital mechanics, and a cinematic camera system with gamepad support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.182-black.svg)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Controls](#-controls)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Roadmap](#-roadmap)
- [Changelog](#-changelog)
- [License](#-license)

---

## 🔍 Overview

The goal of Cosmos is to build a "Virtual Solar System" that scientifically and visually simulates celestial bodies—Stars, Planets, Moons, and Asteroid Belts—in a modular, extensible way.

- **Problem:** Traditional solar system visualizers are either too simple or require complex engines.
- **Solution:** React + Three.js with custom GLSL shaders for beautiful, performant rendering.
- **Audience:** Space enthusiasts, educators, and developers learning 3D graphics.

> **Note:** This is a simulation with artistic liberties taken for visual appeal. Distances and sizes are not to true astronomical scale.

---

## ✨ Features

### 🌍 Complete Solar System
- **8 Planets:** Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **3 Moons:** Moon (Earth), Europa (Jupiter), Titan (Saturn)
- **Asteroid Belt:** 4000 instanced asteroids with orbital motion
- **Starfield:** Background star system

### 🎨 Custom Shaders
- **Sun:** Procedural granulation, corona, and adaptive glare
- **Rocky Planets:** Crater noise (Mercury), cloud dynamics (Venus), terrain generation (Earth/Mars)
- **Ice Giants:** Atmospheric bands with storm dynamics (Uranus/Neptune)
- **Rings:** Procedural ring textures for Saturn

### 🎮 Advanced Controls
- **6-DOF Fly Controls:** WASD movement, roll, pitch, yaw
- **Gamepad Support:** Full controller support
- **Camera Lock-On:** Click radar to follow any celestial body
- **Momentum Zoom:** Smooth inertia-based zooming

### 🗺️ Navigation HUD
- **Radar Map:** Directionally-aware, rotates with camera
- **Smart Labels:** Google Earth-style fade based on distance
- **Top-Down View:** Toggle satellite perspective

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Framework** | React 19 | UI and state management |
| **3D Engine** | Three.js | WebGL rendering |
| **Language** | TypeScript | Full type safety |
| **Build Tool** | Vite 7 | Fast HMR and bundling |
| **Styling** | Vanilla CSS | Custom dark theme |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **npm** or equivalent package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/qtremors/cosmos.git
cd cosmos

# Install dependencies
npm install

# Start development server
npm run dev
```

The simulation will be available at `http://localhost:5173`

### Production Build

```bash
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🎮 Controls

### Keyboard

| Action | Key |
|--------|-----|
| Move Forward/Back | `W` / `S` |
| Strafe Left/Right | `A` / `D` |
| Move Up/Down | `R` / `F` |
| Roll Left/Right | `Q` / `E` |
| Look Around | Arrow Keys |
| Boost Speed | `Shift` |
| Toggle Labels | `L` |
| Toggle HUD | `H` |
| Top-Down View | `T` |
| Unlock Camera | `Escape` |

### Mouse

| Action | Input |
|--------|-------|
| Look Around | Drag (Left Mouse) |
| Zoom | Scroll Wheel |
| Lock On Target | Click Radar Entity |

### Gamepad

| Action | Input |
|--------|-------|
| Move | Left Stick |
| Look | Right Stick |
| Boost | Right Trigger |
| Roll | L1/R1 Bumpers |
| Zoom | D-Pad Up/Down |

---

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Input Handler│ │ Scene Manager│ │ HUD/Radar   │        │
│   └──────┬──────┘  └──────┬──────┘  └─────────────┘        │
└──────────┼────────────────┼─────────────────────────────────┘
           │                │
           ▼                ▼
   ┌────────────────────────────────────────────────────────┐
   │                      core/SDK.ts                        │
   │        Physics Constants • Utility Functions            │
   └────────────────────────────────────────────────────────┘
           │
           ▼
   ┌────────────────────────────────────────────────────────┐
   │                   objects/*.ts                          │
   │   Sun • Mercury • Venus • Earth • Mars • Jupiter       │
   │          Saturn • Uranus • Neptune • AsteroidBelt      │
   └────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

All simulation parameters are centralized in `src/core/SDK.ts`:

| Config | Purpose |
|--------|---------|
| `UNITS` | Solar radius (10), AU scale (200) |
| `PLANETS` | Radius, distance, speed, color for each planet |
| `CONTROLS` | Fly speed (20), boost multiplier (10x), FOV range |
| `RADAR` | Range (2000), entity colors |
| `LIGHTING` | Sun intensity, ambient light |
| `CAMERA` | Lock-on distance, lerp factor |
| `LABELS` | Fade distance multipliers |

---

## 📂 Project Structure

```
cosmos/
├── src/
│   ├── App.tsx              # Main scene and input handling
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global styles and HUD
│   ├── core/
│   │   └── SDK.ts           # Physics engine and constants
│   ├── objects/
│   │   ├── Sun.ts           # Star with granulation/corona
│   │   ├── Earth.ts         # Planet with Moon
│   │   ├── Jupiter.ts       # Gas giant with Europa
│   │   ├── Saturn.ts        # Ringed planet with Titan
│   │   ├── Uranus.ts        # Ice giant (97° tilt)
│   │   ├── Neptune.ts       # Ice giant with storms
│   │   ├── AsteroidBelt.ts  # 4000 instanced asteroids
│   │   └── ...              # Mercury, Venus, Mars, Stars
│   └── materials/
│       └── Noise.ts         # Shared GLSL noise functions
├── public/                  # Static assets
├── package.json
├── tsconfig.json
└── vite.config.js
```

---

## 🗺️ Roadmap

- [ ] **Orbit Paths:** Visual orbit lines for planets
- [ ] **Time Controls:** Speed up/slow down simulation
- [ ] **More Moons:** Add Ganymede, Callisto, and other major moons
- [ ] **Dwarf Planets:** Pluto, Ceres, Eris
- [ ] **Comet Simulation:** Elliptical orbits with tails
- [ ] **VR Support:** WebXR integration

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Recent Updates
- **v1.2.0** - TypeScript migration, Uranus/Neptune, additional moons
- **v1.1.0** - Gamepad support, physics-based zoom
- **v1.0.0** - Initial modular architecture

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with 💖 by <a href="https://github.com/qtremors">Tremors</a>
</p>
