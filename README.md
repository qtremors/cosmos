# Universimulation - A Virtual Cosmos

A modular, procedurally generated universe simulation inspired by "Cosmos: A Spacetime Odyssey". Built with React, Three.js, and WebGL.

## 🌌 Project Vision

The goal is to build a "Virtual Cosmos" that scientifically and visually simulates celestial bodies—Stars, Planets, Black Holes, Nebulas—in a modular, extensible way.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the simulation
npm run dev
```

## 🎮 Controls

The simulation uses **Fly Controls** (Spaceship mode):

-   **WASD**: Move (Forward/Left/Back/Right) - *Relative to camera*
-   **R / F**: Move Up / Down
-   **Q / E**: Roll Left / Right
-   **Mouse Drag**: Pitch / Yaw (Look around)
-   **Scroll Wheel**: Optical Zoom (Adjust FOV)
-   **L**: Toggle Labels On/Off
-   **H**: Toggle HUD On/Off

## 🏗️ Architecture

The project follows a **Scene Graph** architecture where every celestial entity is a distinct class.

### Core Modules

-   **`src/objects/`**: Contains the logic for individual entities.
    -   `Sun.js`: Procedural G2V Star with Granulation, Corona, and Adaptive Glare.
    -   `Stars.js`: Background starfield system.
    -   `Mercury.js`: Procedural Rocky Planet with crater shader.
-   **`src/core/`**: The Simulation Engine & SDK.
    -   `SDK.js`: **The Cosmos SDK**. Defines physics constants (`UNITS`), Planet data (`PLANETS`), and Control settings (`CONTROLS`).
-   **`src/materials/`**: Shared Shader logic (GLSL).
    -   `Noise.js`: Perlin/Simplex noise functions reused across shaders.
-   **`src/App.jsx`**: The React entry point that assembles the scene and manages inputs/HUD.

## 🛠️ Cosmos SDK

The **Cosmos SDK** (`src/core/SDK.js`) is the central brain of the simulation.

### Configuration
You can tweak global simulation parameters in `SDK.js`:
-   **`CONTROLS`**: Fly speed, Roll speed, FOV limits.
-   **`UNITS`**: Sun size base unit, AU scaling.
-   **`PLANETS`**: Data definitions for celestial bodies.

### Logic
-   **`getAdaptiveGlareOpacity(dist, radius)`**: Calculates fade-out logic for bright objects to reveal surface details upon approach.

## 🔭 Features

-   **Realistic Sun**: High-fidelity procedural shaders for the Photosphere and Corona.
-   **Smart Labels**: "Google Earth" style labels that fade away when you get close to an object or stay visible from afar.
-   **Optical Zoom**: Binocular-like zoom functionality.
-   **Modular Design**: Easily add/remove solar systems or galaxies.

## License
MIT
