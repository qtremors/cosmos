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
| 🏔️ **Quantumania** | Secondary realm with 38 floating 3D models — mountains, structures, ships, and inhabitants |
| 🎨 **Custom Shaders** | Sun granulation, Earth day/night cycle, raymarched black hole |
| 🎮 **6-DOF Controls** | Keyboard, mouse, and full gamepad support |
| 🥚 **Easter Eggs** | Black Hole, The Kyln, Explorer, Alien X |
| 👾 **Arishem** | Massive 3D Cosmic Entity (The Architect) with interior details |
| 📡 **Radar System** | Minimap with entity tracking and teleportation |

---

## Live Website 

**➡️ [cosmox.vercel.app](https://cosmox.vercel.app/)**

> [!WARNING]
> **Resource Intensive**: This project can consume **6-7 GB of RAM** when running on devices without an external dedicated GPU. Ensure you have sufficient system resources before launching.

> **Live Website Limitations**: Performance depends on device GPU capabilities.

---

## 🚀 Quick Start

```bash
# Clone and navigate
git clone https://github.com/qtremors/cosmos.git
cd cosmos/cosmos-app

# Install dependencies
npm install

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
| Teleport | Tab | - |
| Labels | L | - |
| HUD | H | - |

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
│   │   ├── core/                # SDK, InputHandler, SystemManager
│   │   ├── objects/             # Component-based 3D entities
│   │   │   ├── solar/           # Planets and moons
│   │   │   ├── quantumania/     # Realm-specific models
│   │   │   └── common/          # Shared 3D objects
│   │   ├── shaders/             # Custom GLSL (sun, earth, blackhole, etc.)
│   │   ├── materials/           # Shared material logic
│   │   ├── components/          # React UI components
│   │   ├── assets/              # Static SVG/Image assets
│   │   ├── utils/               # Shared utilities
│   │   └── __tests__/           # Vitest unit tests
│   └── public/
│       ├── textures/            # 2K NASA textures
│       └── models/              # 38+ GLB models
├── DEVELOPMENT.md               # Architecture & setup
├── CHANGELOG.md                 # Version history
├── TASKS.md                     # Roadmap & backlog
└── LICENSE.md                   # TSL License
```

## 📊 System Resource usage and impact

- **CPU**: Moderate (calculation heavy)
- **RAM**: 6-7 GB (High, especially without dGPU)
- **Disk**: ~60MB (Assets)


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
npm test
```

---

## 📄 License

**Tremors Source License (TSL)** - Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
