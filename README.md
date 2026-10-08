<p align="center">
  <img src="cosmos-app/public/cosmos.png" alt="Cosmos Logo" width="120"/>
</p>

<h1 align="center"><a href="https://cosmox.vercel.app/">Cosmos</a></h1>

<p align="center">
  <b>Experience the infinite.</b> A 3D space exploration simulator featuring the Solar System, the Quantumania realm, and cosmic easter eggs — built with Three.js and custom GLSL shaders.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Three.js-0.182-black?logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7-646cff?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Vitest-4-yellow?logo=vitest" alt="Vitest">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Personal Project** 🎯 I've always been fascinated by space and the vastness of the cosmos. That passion inspired me to build this project. Feel free to explore and learn from it!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌍 **Solar System** | 9 planets with 2K NASA textures, 4 moons, 2000 asteroids |
| 🏔️ **Quantumania** | Secondary realm with 26 model entities — mountains, structures, ships, and inhabitants |
| 🎨 **Custom Shaders** | Sun granulation, Earth day/night cycle, raymarched black hole |
| 🎮 **6-DOF Controls** | Keyboard, mouse, and full gamepad support |
| 🥚 **Easter Eggs** | Black Hole, The Kyln, Explorer, Alien X |
| 👾 **Arishem** | Massive 3D Cosmic Entity (The Architect) with interior details |
| 📡 **Radar System** | Minimap with entity tracking and teleportation |

---

## Live Website 

**➡️ [cosmox.vercel.app](https://cosmox.vercel.app/)**

Graphics settings offer **Low**, **Medium**, and **High** quality. Start with Low on slower devices; actual performance depends on GPU and browser support. The default Medium preset uses 512-pixel shadows, and large models load when their area is approached or selected.

A desktop keyboard/gamepad provides full free flight. On touch devices, use the object list to travel and drag the scene to orbit/look; full touch flight and zoom controls remain on the roadmap.

---

## 🚀 Quick Start

```bash
# Clone and navigate
git clone https://github.com/qtremors/cosmos.git
cd cosmos/cosmos-app

# Install dependencies (Node.js 24 recommended; Node.js 22.13+ also supported)
npm ci

# Run the project
npm run dev
```

Visit **http://localhost:5173** 🎉

---

## 🎮 Controls

| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Move | WASD + R/F | Left Stick |
| Look | Arrows / Mouse | Right Stick |
| Roll | Q/E | L1/R1 |
| Boost | Shift (hold) | RT |
| Next Object | N | - |
| Labels | L | - |
| HUD | H | - |
| Interface navigation | Tab | - |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 |
| **3D Engine** | Three.js 0.182 |
| **Language** | TypeScript 5.9 |
| **Build** | Vite 7 |
| **Testing** | Vitest |

---

## 📁 Project Structure

```
cosmos/
├── cosmos-app/
│   ├── src/
│   │   ├── App.tsx              # Main scene and animation loop
│   │   ├── main.tsx             # Entry point
│   │   ├── index.css            # Global styles
│   │   ├── core/                # SDK, input, assets, lifecycle, quality, entity types
│   │   ├── objects/             # Component-based 3D entities
│   │   │   ├── solar/           # Planets and moons
│   │   │   ├── quantumania/     # Realm-specific models
│   │   │   └── common/          # Shared 3D objects
│   │   ├── shaders/             # Custom GLSL (sun, earth, blackhole, etc.)
│   │   ├── materials/           # Shared material logic
│   │   ├── components/          # React UI components
│   │   ├── assets/              # Static SVG/Image assets
│   │   └── __tests__/           # Vitest unit tests
│   └── public/
│       ├── textures/            # 2K NASA textures
│       └── models/              # 34 GLB asset files
├── DEVELOPMENT.md               # Architecture & setup
├── CHANGELOG.md                 # Version history
├── TASKS.md                     # Roadmap & backlog
└── LICENSE.md                   # TSL License
```

## 📊 Rendering quality

Open the radar to access Settings. Quality choices persist in the browser and apply without rebuilding the scene.

| Setting | Low | Medium (default) | High |
|---------|-----|------------------|------|
| Shadows | Off | 512 px | 1024 px |
| Asteroids | 500 | 1000 | 2000 |
| Stars | 2000 | 5000 | 8000 |
| Black-hole raymarch steps | 48 | 96 | 150 |
| Maximum pixel ratio | 1 | 1 | 1.5 |

Public assets occupy about 65 MiB on disk; decoded CPU/GPU memory is larger and depends on quality, travel, and the browser. The former blanket 6–7 GB RAM estimate should be replaced by measurements after the lifecycle and shadow-budget improvements.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, configuration, contributing |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [TASKS.md](TASKS.md) | Current and planned development tasks |
| [LICENSE.md](LICENSE.md) | License terms and attribution |

---

## 🧪 Testing

```bash
cd cosmos-app
npm run check

# Browser regressions
npx playwright install chromium
npm run test:e2e
```

---

## 📄 License

**Tremors Source License (TSL)** - Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
