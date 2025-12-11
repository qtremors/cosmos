import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import { Sun } from './objects/Sun.js';
import { Stars } from './objects/Stars.js';
import { Mercury } from './objects/Mercury.js';
import { Cosmos } from './core/SDK.js';

export default function App() {
  const mountRef = useRef(null);
  const [showLabels, setShowLabels] = React.useState(true);
  const [showUI, setShowUI] = React.useState(true);
  const labelRendererRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'l') setShowLabels(prev => !prev);
      if (e.key.toLowerCase() === 'h') setShowUI(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (labelRendererRef.current) {
      labelRendererRef.current.domElement.style.opacity = showLabels ? '1' : '0';
    }
  }, [showLabels]);

  useEffect(() => {
    // --- ENGINE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 3000); // Increased Near clip for Fly, Max far
    camera.position.set(0, 20, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // LABEL RENDERER
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; // Click through to canvas
    labelRenderer.domElement.style.transition = 'opacity 0.3s ease'; // Smooth toggle
    labelRendererRef.current = labelRenderer;

    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
      mountRef.current.appendChild(labelRenderer.domElement);
    }

    // --- COSMOS ENTITIES ---
    const sun = new Sun(Cosmos.UNITS.SOLAR_RADIUS);
    scene.add(sun);

    const stars = new Stars(3000, 1000);
    scene.add(stars);

    const mercury = new Mercury();
    scene.add(mercury);


    // --- CONTROLS (FLY) ---
    const controls = new FlyControls(camera, renderer.domElement);
    controls.movementSpeed = Cosmos.CONTROLS.FLY_SPEED;
    controls.rollSpeed = Cosmos.CONTROLS.ROLL_SPEED;
    controls.autoForward = false;
    controls.dragToLook = true;

    // --- ZOOM (FOV) ---
    const handleWheel = (e) => {
      e.preventDefault();
      // Clamp FOV between 10 (Zoomed in) and 100 (Wide)
      camera.fov += e.deltaY * 0.05;
      camera.fov = Math.max(Cosmos.CONTROLS.FOV_MIN, Math.min(Cosmos.CONTROLS.FOV_MAX, camera.fov));
      camera.updateProjectionMatrix();
    };
    window.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      const delta = clock.getDelta();

      // Update Entities
      sun.update(time, camera);
      mercury.update(time, camera);

      // Update Controls
      controls.update(delta);

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="container">
      <div ref={mountRef} className="canvas-container" style={{ position: 'relative' }} />
      <div className="overlay" style={{ opacity: showUI ? 1 : 0, transition: 'opacity 0.5s' }}>
        Cosmos: Freedom<br />
        [WASD] Move | [R/F] Up/Down<br />
        [Q/E] Roll | [Mouse] Look<br />
        [Scroll] Optical Zoom<br />
        [L] Labels | [H] HUD<br />
        Drag to Look
      </div>
    </div>
  );
}
