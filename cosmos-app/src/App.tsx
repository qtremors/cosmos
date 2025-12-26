import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Stars } from './objects/Stars';
import { SceneAssets } from './core/SceneAssets';
import { startAnimationLoop, disposeObject3D } from './core/SceneLifecycle';
import { Sun } from './objects/solar/Sun';
import { Earth } from './objects/solar/Earth';
import { Mercury } from './objects/solar/Mercury';
import { Venus } from './objects/solar/Venus';
import { Mars } from './objects/solar/Mars';
import { Jupiter } from './objects/solar/Jupiter';
import { Saturn } from './objects/solar/Saturn';
import { Uranus } from './objects/solar/Uranus';
import { Neptune } from './objects/solar/Neptune';
import { Pluto } from './objects/solar/Pluto';
import { DwarfPlanet } from './objects/solar/DwarfPlanet';
import { AsteroidBelt } from './objects/solar/AsteroidBelt';
import { OrbitPath } from './objects/common/OrbitPath';
import { AlienX } from './objects/AlienX';
import { BlackHole } from './objects/BlackHole';
import { placeInterstellarPair } from './core/InterstellarLayout';
import { SystemManager } from './core/SystemManager';
import { QuantumaniaSystem } from './objects/quantumania/QuantumaniaSystem';
import { CosmicEntity } from './objects/CosmicEntity';
import { Explorer } from './objects/solar/Explorer';
import { TheKyln } from './objects/solar/TheKyln';
import { SunBeacon } from './objects/solar/SunBeacon';
import { SystemRenderer } from './core/SystemRenderer';

/** Small viewer used while the astronomical and destination modules are introduced. */
export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    useEffect(() => {
        const mount = mountRef.current!, select = selectRef.current!;
        const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
        const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.000001, 300000);
        camera.position.set(0, 500, 800); camera.lookAt(0, 0, 0); camera.layers.enable(1); camera.layers.enable(2);
        const renderer = new THREE.WebGLRenderer({ antialias: false, logarithmicDepthBuffer: true });
        renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); renderer.toneMapping = THREE.ACESFilmicToneMapping;
        const labels = new CSS2DRenderer(); labels.setSize(innerWidth, innerHeight);
        labels.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
        mount.append(renderer.domElement, labels.domElement);
        const assets = new SceneAssets(), stars = new Stars(2000, 100000);
        const ambient = new THREE.AmbientLight(0xffffff, 0.15), sunlight = new THREE.PointLight(0xffffff, 200000, 0, 2);
        const solar: THREE.Object3D[] = [sunlight, ambient], space: THREE.Object3D[] = [stars], quantumObjects: THREE.Object3D[] = [];
        const targets: { label: string; mesh: THREE.Object3D; radius: number }[] = [];
        const sun = new Sun(undefined, assets), earth = new Earth(assets);
        solar.push(sun, earth);
        targets.push({ label: 'Sun', mesh: sun, radius: sun.radius * 4 }, { label: 'Earth', mesh: earth, radius: earth.radius }, { label: 'Moon', mesh: earth.moon, radius: earth.moon.radius });
        const planets = [new Mercury(assets), new Venus(assets), new Mars(assets), new Jupiter(assets), new Saturn(assets), new Uranus(assets), new Neptune(assets), new Pluto(assets)];
        const names = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        planets.forEach((planet, i) => { solar.push(planet); targets.push({ label: names[i], mesh: planet, radius: names[i] === 'Saturn' ? planet.radius * 2.4 : planet.radius }); });
        const dwarfs = ['Ceres', 'Eris', 'Haumea', 'Makemake', 'Halley'].map(name => new DwarfPlanet(name, 0xaaa099));
        dwarfs.forEach(dwarf => { solar.push(dwarf); targets.push({ label: dwarf.name, mesh: dwarf, radius: dwarf.radius }); });
        const orbits = [...names, 'Earth', ...dwarfs.map(dwarf => dwarf.name)].map(name => new OrbitPath(name)); solar.push(...orbits);
        const belt = new AsteroidBelt(420, 660, 1000), kuiper = new AsteroidBelt(6000, 10000, 250, 50); solar.push(belt, kuiper);
        const alien = new AlienX(assets), blackHole = new BlackHole(); placeInterstellarPair(alien, blackHole); space.push(alien, blackHole);
        targets.push({ label: 'Alien X', mesh: alien, radius: 10 }, { label: 'Black Hole', mesh: blackHole, radius: 100 });
        const quantum = new QuantumaniaSystem(assets); quantumObjects.push(quantum);
        targets.push(...quantum.getEntities().map(entity => ({ label: entity.label, mesh: entity.mesh, radius: entity.radius })));
        const cosmic = new CosmicEntity(assets), explorer = new Explorer(), kyln = new TheKyln('The Kyln'), beacon = new SunBeacon();
        solar.push(explorer, kyln); space.push(beacon);
        targets.push({ label: 'Arishem', mesh: cosmic.head, radius: 1500 }, { label: 'Explorer', mesh: explorer, radius: 5 }, { label: 'The Kyln', mesh: kyln, radius: 8 });
        scene.add(...solar, ...space, ...quantumObjects);
        const passes = new SystemRenderer(scene, solar, quantumObjects, space, [cosmic]); passes.fill.intensity = 0.15;
        select.replaceChildren(new Option('Overview', ''));
        targets.forEach((target, index) => select.add(new Option(target.label, String(index))));
        let selected: typeof targets[number] | null = null, distance = 900, theta = 0, phi = 0.4;
        let dragging = false, lastX = 0, lastY = 0, elapsed = 0;
        const targetPosition = new THREE.Vector3(), keys = new Set<string>();
        select.onchange = () => {
            selected = select.value === '' ? null : targets[Number(select.value)];
            if (selected) distance = Math.max(selected.radius * 4, 0.0001);
            else { camera.position.set(0, 500, 800); camera.lookAt(0, 0, 0); }
        };
        const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
        const up = () => { dragging = false; };
        const move = (event: PointerEvent) => {
            if (!dragging) return;
            const dx = (event.clientX - lastX) * 0.003, dy = (event.clientY - lastY) * 0.003;
            if (selected) { theta -= dx; phi = THREE.MathUtils.clamp(phi + dy, -1.4, 1.4); }
            else { camera.rotateY(-dx); camera.rotateX(-dy); }
            lastX = event.clientX; lastY = event.clientY;
        };
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            if (selected) distance = Math.max(selected.radius * 1.5, distance * Math.exp(event.deltaY * 0.001));
            else camera.translateZ(event.deltaY * 0.1);
        };
        const keydown = (event: KeyboardEvent) => { if (event.target === renderer.domElement || event.target === document.body) keys.add(event.code); };
        const keyup = (event: KeyboardEvent) => { keys.delete(event.code); };
        const blur = () => { keys.clear(); dragging = false; };
        const resize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight); };
        renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up);
        renderer.domElement.addEventListener('pointercancel', up); renderer.domElement.addEventListener('pointermove', move);
        renderer.domElement.addEventListener('wheel', wheel, { passive: false });
        window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur); window.addEventListener('resize', resize);
        const epoch = Date.now() / 1000;
        const stop = startAnimationLoop(delta => {
            elapsed += delta; const time = epoch + elapsed;
            sun.update(time, camera, elapsed); earth.update(time, camera);
            planets.forEach(planet => planet.update(time, camera)); dwarfs.forEach(dwarf => dwarf.update(time)); orbits.forEach(orbit => orbit.update(time)); belt.update(time); kuiper.update(time);
            SystemManager.getInstance().updateCurrentSystem(camera.position); alien.update(time, camera, elapsed); blackHole.update(time, camera, elapsed);
            quantum.setVisible(camera.position.distanceTo(SystemManager.QUANTUMANIA_CENTER) < 2500); quantum.update(time, camera, elapsed); quantum.updateResidency(delta);
            cosmic.update(time, camera, elapsed, delta); cosmic.updateResidency(delta); explorer.update(time, camera, delta); kyln.update(time, camera, delta, elapsed); beacon.update(camera.position);
            if (selected) {
                selected.mesh.getWorldPosition(targetPosition);
                camera.position.copy(targetPosition).add(new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(phi), Math.cos(theta) * Math.cos(phi)).multiplyScalar(distance));
                camera.lookAt(targetPosition); camera.near = Math.max(1e-8, Math.min(1, distance * 0.01)); camera.updateProjectionMatrix();
            } else {
                const speed = delta * (keys.has('ShiftLeft') ? 500 : 50);
                if (keys.has('KeyW')) camera.translateZ(-speed); if (keys.has('KeyS')) camera.translateZ(speed);
                if (keys.has('KeyA')) camera.translateX(-speed); if (keys.has('KeyD')) camera.translateX(speed);
            }
            stars.position.copy(camera.position);
            passes.render(renderer, camera, true, true); labels.render(scene, camera);
        });
        return () => {
            stop(); quantum.dispose(); cosmic.dispose(); assets.dispose(); disposeObject3D(scene); renderer.dispose(); mount.replaceChildren(); select.onchange = null;
            window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); window.removeEventListener('resize', resize);
        };
    }, []);
    return <><div ref={mountRef} style={{ position: 'fixed', inset: 0 }} /><div style={{ position: 'fixed', top: 16, left: 16, background: '#111d', padding: 16, borderRadius: 8 }}><strong>Cosmos</strong><p>Drag to look or orbit. Scroll to zoom. WASD to fly.</p><label>Destination <select ref={selectRef} aria-label="Destination" /></label></div></>;
}
