# Cosmos 🌌

> **Experience the infinite.** A modular, high-performance 3D solar system simulation running directly in your browser.

Explore a procedurally generated solar system with 9 planets (including Pluto), custom GLSL shaders, realistic orbital mechanics, and a cinematic camera system with gamepad support.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.2.0-green.svg)
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
- **9 Planets:** Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- **4 Moons:** Moon (Earth), Europa (Jupiter), Titan (Saturn), Charon (Pluto)
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
- **Orbital Camera:** Rotate around locked target with mouse/keyboard
- **Momentum Zoom:** Smooth inertia-based zooming

### 🗺️ Navigation HUD
- **Radar Map:** Directionally-aware, rotates with camera
- **Smart Labels:** Google Earth-style fade based on distance
- **Top-Down View:** Toggle satellite perspective
- **Stats HUD:** Shows camera speed or locked object info (orbital speed, distance)

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
cd cosmos/cosmos-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The simulation will be available at `http://localhost:5173`

### Production Build

```bash
cd cosmos-app      # If not already in the app directory
npm run build      # Build for production
npm run preview    # Preview production build
```

### Deploy to Vercel

This project is optimized for **Vercel Hobby plan** (free tier):

1. **Via CLI:**
   ```bash
   cd cosmos-app
   npx vercel
   ```

2. **Via Dashboard:**
   - Import your GitHub repository at [vercel.com/new](https://vercel.com/new)
   - Set **Root Directory** to `cosmos-app`
   - Framework will auto-detect as Vite
   - Click Deploy

> **Note:** No serverless functions or databases required - it's a fully static site.

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
   │   Saturn • Uranus • Neptune • Pluto • AsteroidBelt     │
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
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── CHANGELOG.md               # Version history
├── ARCHITECTURE.md            # Technical architecture
├── TASKS.md                   # Development tasks
├── AGENTS.md                  # AI assistant guidelines
├── PRIVACY.md                 # Privacy policy
│
└── cosmos-app/                # Application code
    ├── src/
    │   ├── App.tsx            # Main scene and input handling
    │   ├── main.tsx           # React entry point
    │   ├── index.css          # Global styles and HUD
    │   ├── core/
    │   │   ├── SDK.ts         # Physics engine and constants
    │   │   └── InputHandler.ts # Input processing
    │   ├── objects/           # All celestial bodies
    │   │   └── ...            # Sun, Planets, Moons, etc.
    │   └── materials/
    │       └── Noise.ts       # Shared GLSL noise
    ├── public/                # Static assets
    ├── package.json
    ├── tsconfig.json
    └── vite.config.js
```

---

## 🗺️ Roadmap

- [x] **Orbit Paths:** Visual orbit lines for planets and moons ✅
- [ ] **Time Controls:** Speed up/slow down simulation
- [ ] **More Moons:** Add Ganymede, Callisto, and other major moons
- [x] **Dwarf Planets:** Pluto with Charon ✅
- [ ] **Comet Simulation:** Elliptical orbits with tails
- [ ] **VR Support:** WebXR integration

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Recent Updates
- **v1.2.0** - Vercel deployment ready, custom favicon, SEO meta tags
- **v1.1.0** - Pluto, orbital camera, Stats HUD, moon orbit paths, radar overhaul
- **v1.0.0** - Initial release with 8 planets, gamepad support, modular architecture

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with 💖 by <a href="https://github.com/qtremors">Tremors</a>
</p>
