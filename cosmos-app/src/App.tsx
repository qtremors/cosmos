import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Sun } from './objects/Sun';
import { Stars } from './objects/Stars';
import { Mercury } from './objects/Mercury';
import { Venus } from './objects/Venus';
import { Earth } from './objects/Earth';
import { Mars } from './objects/Mars';
import { Jupiter } from './objects/Jupiter';
import { Saturn } from './objects/Saturn';
import { Uranus } from './objects/Uranus';
import { Neptune } from './objects/Neptune';
import { AsteroidBelt } from './objects/AsteroidBelt';
import { OrbitPath } from './objects/OrbitPath';
import { Pluto } from './objects/Pluto';
import { Spaceship } from './objects/easter_eggs/Spaceship';
import { SpaceStation } from './objects/easter_eggs/SpaceStation';
import { SpecialAsteroid } from './objects/easter_eggs/SpecialAsteroid';
import { EasterEggPlanet } from './objects/easter_eggs/EasterEggPlanet';
import { AlienX } from './objects/easter_eggs/AlienX';
import { SagittariusA } from './objects/easter_eggs/SagittariusA';
import { Cosmos } from './core/SDK';
import {
    InputState,
    LockTarget,
    createInputState,
    updateInputKey,
    pollGamepad,
    applyInputToCamera
} from './core/InputHandler';
import { SettingsPanel } from './components/SettingsPanel';

// =============================================================================
// TYPES
// =============================================================================

interface EntityInfo {
    mesh: THREE.Object3D;
    id: string;
    color: string;
    label: string;
    radius: number;
}

// =============================================================================
// APP COMPONENT
// =============================================================================

export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showUI, setShowUI] = useState(true);
    const [showRadarList, setShowRadarList] = useState(false);
    const [cameraSpeed, setCameraSpeed] = useState(0);
    const [lockedInfo, setLockedInfo] = useState<{ name: string; orbitalSpeed: number; sunDist: number } | null>(null);
    const [ambientIntensity, setAmbientIntensity] = useState(Cosmos.LIGHTING.AMBIENT_INTENSITY);
    const [nearestObject, setNearestObject] = useState<{ name: string; distance: number } | null>(null);
    const [timeScale, setTimeScale] = useState(Cosmos.DEFAULT_TIME_SCALE);
    const [isPaused, setIsPaused] = useState(false);

    const labelRendererRef = useRef<CSS2DRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const entitiesRef = useRef<EntityInfo[]>([]);
    const radarBlipsRef = useRef<Map<string, HTMLElement>>(new Map());
    const showLabelsRef = useRef(showLabels);

    // Logic refs
    const lockRef = useRef<LockTarget | null>(null);
    const inputRef = useRef<InputState>(createInputState());
    const zoomVelocity = useRef(0);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const mouseDelta = useRef({ x: 0, y: 0 });
    const lastCameraPos = useRef(new THREE.Vector3());
    const statsFrameCount = useRef(0);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const timeScaleRef = useRef(timeScale);
    const isPausedRef = useRef(isPaused);

    // Lock functions exposed via refs instead of window globals
    const lockOnTarget = useRef((mesh: THREE.Object3D, radius: number) => {
        let initialTheta = Math.PI / 4;

        // Special handling for Alien X to view Black Hole behind it
        // Alien X is at 0.75 PI. Black Hole is at 0.75 PI (further out).
        // We want Camera -> Alien X -> Black Hole.
        // So Camera should be "Sun-side" of Alien X.
        // Relative vector (Cam - AlienX) should point towards Sun (approx 1.75 PI).
        const entity = entitiesRef.current.find(e => e.mesh === mesh);
        if (entity?.label === 'Alien X') {
            initialTheta = Math.PI * 0.75;
        }

        lockRef.current = {
            mesh,
            distance: radius * Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER,
            isTop: false,
            theta: initialTheta,
            phi: 0.3            // Start slightly above horizon
        };
        setShowRadarList(false);
    });

    const unlockCamera = useRef(() => {
        lockRef.current = null;
    });

    const toggleTopView = useRef((camera: THREE.PerspectiveCamera) => {
        if (lockRef.current?.mesh) {
            lockRef.current.isTop = !lockRef.current.isTop;
        } else {
            camera.position.set(0, 1000, 0);
            camera.lookAt(0, 0, 0);
            camera.rotation.z = 0;
            camera.rotation.x = -Math.PI / 2;
            camera.rotation.y = 0;
            camera.updateProjectionMatrix();
        }
    });

    // Keep ref in sync with state for use in animate loop
    useEffect(() => {
        showLabelsRef.current = showLabels;
    }, [showLabels]);

    useEffect(() => {
        // --- KEYBOARD HANDLERS ---
        const handleKeyDown = (e: KeyboardEvent) => {
            updateInputKey(inputRef.current, e.code, true);

            if (e.repeat) return;
            if (e.key.toLowerCase() === 'l') setShowLabels(prev => !prev);
            if (e.key.toLowerCase() === 'h') setShowUI(prev => !prev);
            if (e.key.toLowerCase() === 't' && cameraRef.current) {
                toggleTopView.current(cameraRef.current);
            }
            if (e.key === 'Escape') {
                unlockCamera.current();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            updateInputKey(inputRef.current, e.code, false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // --- MOUSE WHEEL (Momentum Zoom) ---
        const handleWheel = (e: WheelEvent) => {
            // Don't capture wheel events inside radar panels (allow scrolling)
            const target = e.target as HTMLElement;
            if (target.closest('.radar-panels') || target.closest('.radar-list')) {
                return; // Let the panel scroll naturally
            }

            e.preventDefault();
            const dir = e.deltaY > 0 ? 1 : -1;
            const force = e.shiftKey ? 20.0 : 5.0;
            zoomVelocity.current += dir * force;
        };
        window.addEventListener('wheel', handleWheel, { passive: false });

        // --- ENGINE INIT ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
        // Start in top-down view (T mode)
        camera.position.set(0, 1000, 0);
        camera.lookAt(0, 0, 0);
        camera.rotation.z = 0;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // LIGHTING
        const sunLight = new THREE.PointLight(
            Cosmos.LIGHTING.SUN_COLOR,
            Cosmos.LIGHTING.SUN_INTENSITY,
            0, 0
        );
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.bias = -0.00001;
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(Cosmos.LIGHTING.AMBIENT_COLOR, Cosmos.LIGHTING.AMBIENT_INTENSITY);
        ambientLightRef.current = ambientLight;
        scene.add(ambientLight);

        // LABELS
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none';
        labelRendererRef.current = labelRenderer;

        if (mountRef.current) {
            mountRef.current.innerHTML = '';
            mountRef.current.appendChild(renderer.domElement);
            mountRef.current.appendChild(labelRenderer.domElement);
        }

        // OBJECTS
        const sun = new Sun(Cosmos.UNITS.SOLAR_RADIUS);
        scene.add(sun);
        const stars = new Stars(8000, 5000);
        scene.add(stars);
        const mercury = new Mercury();
        scene.add(mercury);
        const venus = new Venus();
        scene.add(venus);
        const earth = new Earth();
        scene.add(earth);
        const mars = new Mars();
        scene.add(mars);
        const belt = new AsteroidBelt();
        scene.add(belt);
        const jupiter = new Jupiter();
        scene.add(jupiter);
        const saturn = new Saturn();
        scene.add(saturn);
        const uranus = new Uranus();
        scene.add(uranus);
        const neptune = new Neptune();
        scene.add(neptune);
        const pluto = new Pluto();
        scene.add(pluto);

        // ORBIT PATHS (with eccentricity and inclination)
        const orbitPaths = [
            new OrbitPath(Cosmos.PLANETS.MERCURY.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.MERCURY, Cosmos.INCLINATION.MERCURY),
            new OrbitPath(Cosmos.PLANETS.VENUS.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.VENUS, Cosmos.INCLINATION.VENUS),
            new OrbitPath(Cosmos.PLANETS.EARTH.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.EARTH, Cosmos.INCLINATION.EARTH),
            new OrbitPath(Cosmos.PLANETS.MARS.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.MARS, Cosmos.INCLINATION.MARS),
            new OrbitPath(Cosmos.PLANETS.JUPITER.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.JUPITER, Cosmos.INCLINATION.JUPITER),
            new OrbitPath(Cosmos.PLANETS.SATURN.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.SATURN, Cosmos.INCLINATION.SATURN),
            new OrbitPath(Cosmos.PLANETS.URANUS.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.URANUS, Cosmos.INCLINATION.URANUS),
            new OrbitPath(Cosmos.PLANETS.NEPTUNE.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.NEPTUNE, Cosmos.INCLINATION.NEPTUNE),
            new OrbitPath(Cosmos.PLANETS.PLUTO.DISTANCE, 0xffffff, Cosmos.ECCENTRICITY.PLUTO, Cosmos.INCLINATION.PLUTO),
        ];
        orbitPaths.forEach(path => scene.add(path));

        // EASTER EGGS
        const spaceship = new Spaceship();
        scene.add(spaceship);
        const spaceStation = new SpaceStation();
        spaceStation.setEarthReference(earth);
        scene.add(spaceStation);
        const specialAsteroid = new SpecialAsteroid('Quant');
        scene.add(specialAsteroid);
        const robonaut = new AlienX(); // This is now AlienXFinalForm
        scene.add(robonaut);
        const easterEggPlanet = new EasterEggPlanet();
        scene.add(easterEggPlanet);
        const sagittariusA = new SagittariusA();
        scene.add(sagittariusA);

        entitiesRef.current = [
            { mesh: sun, id: 'sun-blip', color: Cosmos.RADAR.COLORS.SUN, label: 'Sun', radius: Cosmos.UNITS.SOLAR_RADIUS * 4 },
            { mesh: mercury, id: 'mercury-blip', color: Cosmos.RADAR.COLORS.MERCURY, label: 'Mercury', radius: 10 },
            { mesh: venus, id: 'venus-blip', color: Cosmos.RADAR.COLORS.VENUS, label: 'Venus', radius: 15 },
            { mesh: earth, id: 'earth-blip', color: Cosmos.RADAR.COLORS.EARTH, label: 'Earth', radius: 15 },
            { mesh: earth.moon, id: 'moon-blip', color: Cosmos.RADAR.COLORS.MOON, label: 'Moon', radius: 5 },
            { mesh: mars, id: 'mars-blip', color: Cosmos.RADAR.COLORS.MARS, label: 'Mars', radius: 12 },
            { mesh: belt, id: 'belt-blip', color: '#888888', label: 'Asteroid Belt', radius: 100 },
            { mesh: jupiter, id: 'jupiter-blip', color: Cosmos.RADAR.COLORS.JUPITER, label: 'Jupiter', radius: 40 },
            { mesh: jupiter.europa, id: 'europa-blip', color: '#fff', label: 'Europa', radius: 5 },
            { mesh: saturn, id: 'saturn-blip', color: Cosmos.RADAR.COLORS.SATURN, label: 'Saturn', radius: 35 },
            { mesh: saturn.titan, id: 'titan-blip', color: '#e6d4be', label: 'Titan', radius: 6 },
            { mesh: uranus, id: 'uranus-blip', color: Cosmos.RADAR.COLORS.URANUS, label: 'Uranus', radius: 25 },
            { mesh: neptune, id: 'neptune-blip', color: Cosmos.RADAR.COLORS.NEPTUNE, label: 'Neptune', radius: 25 },
            { mesh: pluto, id: 'pluto-blip', color: Cosmos.RADAR.COLORS.PLUTO, label: 'Pluto', radius: 8 },
            { mesh: pluto.charon, id: 'charon-blip', color: '#8a8a8a', label: 'Charon', radius: 4 },
            // Easter Eggs
            { mesh: spaceship, id: 'spaceship-blip', color: '#00aaff', label: 'Explorer-1', radius: 5 },
            { mesh: spaceStation, id: 'iss-blip', color: '#ffffff', label: 'ISS', radius: 3 },
            { mesh: specialAsteroid, id: 'special-blip', color: '#ffaa33', label: 'Quant', radius: 5 },
            { mesh: robonaut, id: 'robonaut-blip', color: '#00ff00', label: 'Alien X', radius: 10 },
            { mesh: easterEggPlanet, id: 'tremors-blip', color: '#ff66ff', label: 'Tremors', radius: 8 },
            { mesh: sagittariusA, id: 'sagittariusa-blip', color: '#ff6600', label: 'Sagittarius A*', radius: 100 },
        ];

        // RADAR INIT - Cache DOM references
        const radarContainer = document.getElementById('radar-container');
        if (radarContainer) {
            // Clear only blips (not the radar-center which is in JSX)
            const existingBlips = radarContainer.querySelectorAll('.radar-blip');
            existingBlips.forEach(blip => blip.remove());

            entitiesRef.current.forEach(ent => {
                if (!ent.mesh) return;
                const b = document.createElement('div');
                b.id = ent.id;
                b.className = 'radar-blip';
                b.style.backgroundColor = ent.color;
                b.title = ent.label;
                const l = document.createElement('div');
                l.className = 'radar-label';
                l.textContent = ent.label;
                b.appendChild(l);
                radarContainer.appendChild(b);
                radarBlipsRef.current.set(ent.id, b);
            });
        }

        // Reset FOV
        camera.fov = Cosmos.CONTROLS.FOV_DEFAULT;
        camera.updateProjectionMatrix();

        // MOUSE LOOK
        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            if (e.button === 0) {
                isDragging.current = true;
                lastMouse.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;

            lastMouse.current = { x: e.clientX, y: e.clientY };

            mouseDelta.current.x += dx;
            mouseDelta.current.y += dy;
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        // RESIZE LISTENER
        const onWinResize = () => {
            if (cameraRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
            }
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWinResize);

        // LOOP
        const clock = new THREE.Clock();
        let simTime = 0; // Accumulated simulation time

        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();

            // Apply time scale (only accumulate time when not paused)
            if (!isPausedRef.current) {
                simTime += delta * timeScaleRef.current;
            }
            const time = simTime;

            // 1. UPDATE OBJECTS
            sun.update(time, camera);
            mercury.update(time, camera);
            venus.update(time, camera);
            earth.update(time, camera);
            mars.update(time, camera);
            belt.update(time);
            jupiter.update(time, camera);
            saturn.update(time, camera);
            uranus.update(time, camera);
            neptune.update(time, camera);
            pluto.update(time, camera);

            // Update planet positions for Explorer collision avoidance
            Spaceship.updatePlanetPositions([
                mercury.position, venus.position, earth.position, mars.position,
                jupiter.position, saturn.position, uranus.position, neptune.position, pluto.position
            ]);

            // Easter Eggs
            spaceship.update(time, camera);
            spaceStation.update(time, camera);
            specialAsteroid.update(time, camera);
            robonaut.update(time, camera);
            easterEggPlanet.update(time, camera);
            sagittariusA.update(time, camera);

            // 2. INPUT PROCESSING
            const pad = pollGamepad();
            const isMoving = applyInputToCamera(
                camera,
                inputRef.current,
                delta,
                mouseDelta.current,
                zoomVelocity,
                lockRef.current,
                pad
            );

            // Auto-Unlock on Move
            if (isMoving && lockRef.current) {
                unlockCamera.current();
            }

            renderer.render(scene, camera);

            // Toggle labels visibility
            if (labelRendererRef.current) {
                labelRendererRef.current.domElement.style.display = showLabelsRef.current ? 'block' : 'none';
            }
            labelRenderer.render(scene, camera);

            // STATS HUD UPDATE (throttled to avoid excessive re-renders)
            statsFrameCount.current++;
            if (statsFrameCount.current >= 10) {
                statsFrameCount.current = 0;

                const AU = Cosmos.UNITS.AU; // 200 sim units = 1 AU
                const KM_PER_AU = 150000000; // 150 million km per AU

                // Calculate camera speed (in km/s)
                const speedRaw = camera.position.distanceTo(lastCameraPos.current) / (delta * 10);
                const speedKmS = (speedRaw / AU) * (KM_PER_AU / 1000); // Convert to thousands of km/s for readability
                lastCameraPos.current.copy(camera.position);
                setCameraSpeed(Math.round(speedKmS));

                // Update locked object info
                if (lockRef.current?.mesh) {
                    const targetPos = new THREE.Vector3();
                    lockRef.current.mesh.getWorldPosition(targetPos);

                    // Distance from Sun in AU then convert to millions of km
                    const sunDistAU = targetPos.length() / AU;
                    const sunDistMillionKm = sunDistAU * 150; // 1 AU = 150 million km

                    // Calculate orbital speed (approximation based on distance - Kepler's law)
                    // v = sqrt(GM/r) simplified as v proportional to 1/sqrt(r)
                    // Using Earth as reference (1 AU = 30 km/s orbital speed)
                    const orbitalSpeedKmS = sunDistAU > 0.1 ? 30 / Math.sqrt(sunDistAU) : 0;

                    // Find entity label
                    const entity = entitiesRef.current.find(e => e.mesh === lockRef.current?.mesh);
                    setLockedInfo({
                        name: entity?.label || 'Unknown',
                        orbitalSpeed: Math.round(orbitalSpeedKmS * 10) / 10,
                        sunDist: Math.round(sunDistMillionKm)
                    });
                    setNearestObject(null);
                } else {
                    setLockedInfo(null);

                    // Calculate nearest object for free flight mode
                    let closest: { name: string; distance: number } | null = null;
                    let minDist = Infinity;

                    entitiesRef.current.forEach(ent => {
                        if (ent.mesh) {
                            const pos = new THREE.Vector3();
                            ent.mesh.getWorldPosition(pos);
                            const dist = camera.position.distanceTo(pos);
                            if (dist < minDist) {
                                minDist = dist;
                                // Convert to display units (thousands of km)
                                const distKm = (dist / AU) * 150000; // Convert AU to km
                                closest = {
                                    name: ent.label,
                                    distance: Math.round(distKm)
                                };
                            }
                        }
                    });
                    setNearestObject(closest);
                }
            }

            // RADAR UPDATE (using cached DOM refs)
            const range = Cosmos.RADAR.RANGE;
            const radius = Cosmos.RADAR.RADIUS;
            const invQuat = camera.quaternion.clone().invert();

            entitiesRef.current.forEach(ent => {
                const blip = radarBlipsRef.current.get(ent.id);
                if (blip && ent.mesh) {
                    const vec = new THREE.Vector3();
                    ent.mesh.getWorldPosition(vec);
                    vec.sub(camera.position);
                    vec.applyQuaternion(invQuat);
                    const rx = vec.x;
                    const ry = vec.z;
                    let x = (rx / range) * radius;
                    let y = (ry / range) * radius;
                    const d = Math.sqrt(x * x + y * y);
                    let clamped = false;
                    if (d > radius - 10) {
                        const r = (radius - 10) / d;
                        x *= r;
                        y *= r;
                        clamped = true;
                    }
                    blip.style.transform = `translate(${x + radius}px, ${y + radius}px)`;
                    if (clamped) {
                        blip.classList.add('clamped');
                    } else {
                        blip.classList.remove('clamped');
                    }
                }
            });
        };
        animate();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', onWinResize);
            if (mountRef.current) mountRef.current.innerHTML = '';
            renderer.dispose();
        };
    }, []);

    // Update ambient light when intensity changes
    useEffect(() => {
        if (ambientLightRef.current) {
            ambientLightRef.current.intensity = ambientIntensity;
        }
    }, [ambientIntensity]);

    // Sync time control refs
    useEffect(() => { timeScaleRef.current = timeScale; }, [timeScale]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    return (
        <div className="container">

            <div ref={mountRef} className="canvas-container" style={{ position: 'relative' }} />
            <div className="overlay" style={{ opacity: showUI ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none' }}>
                Cosmos<br />
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                    [WASD] Move | [R/F] Up/Down<br />
                    [Q/E] Roll | [MOUSE] Look (Drag)<br />
                    [SHIFT] Boost<br />
                    [SCROLL] Smooth Zoom<br />
                    [L] Labels | [H] HUD | [T] Top View<br />
                </span>
            </div>

            {showUI && showRadarList && entitiesRef.current.length > 0 && (
                <div className="radar-panels" style={{ zIndex: 1001, display: 'flex', gap: '10px' }}>
                    {/* Objects Panel */}
                    <div className="radar-list">
                        {/* Stars */}
                        <div className="radar-category">Star</div>
                        {entitiesRef.current.filter(e => e.label === 'Sun').map(ent => (
                            <div
                                key={ent.id}
                                className="radar-item"
                                onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}
                            >
                                <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                {ent.label}
                            </div>
                        ))}

                        {/* Planets */}
                        <div className="radar-category">Planets</div>
                        {entitiesRef.current.filter(e =>
                            ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(e.label)
                        ).map(ent => (
                            <div
                                key={ent.id}
                                className="radar-item"
                                onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}
                            >
                                <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                {ent.label}
                            </div>
                        ))}

                        {/* Moons */}
                        <div className="radar-category">Moons</div>
                        {entitiesRef.current.filter(e =>
                            ['Moon', 'Europa', 'Titan', 'Charon'].includes(e.label)
                        ).map(ent => (
                            <div
                                key={ent.id}
                                className="radar-item"
                                onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}
                            >
                                <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                {ent.label}
                            </div>
                        ))}

                        {/* Other */}
                        <div className="radar-category">Other</div>
                        {entitiesRef.current.filter(e =>
                            e.label === 'Asteroid Belt'
                        ).map(ent => (
                            <div
                                key={ent.id}
                                className="radar-item"
                                onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}
                            >
                                <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                {ent.label}
                            </div>
                        ))}

                        {/* Easter Eggs */}
                        <div className="radar-category">Easter Eggs</div>
                        {entitiesRef.current.filter(e =>
                            ['Explorer-1', 'ISS', 'Quant', 'Alien X', 'Tremors', 'Sagittarius A*'].includes(e.label)
                        ).map(ent => (
                            <div
                                key={ent.id}
                                className="radar-item"
                                onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}
                            >
                                <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                {ent.label}
                            </div>
                        ))}
                    </div>

                    {/* Settings Panel (beside objects panel) */}
                    <SettingsPanel
                        isOpen={true}
                        ambientIntensity={ambientIntensity}
                        onAmbientChange={setAmbientIntensity}
                        timeScale={timeScale}
                        onTimeScaleChange={setTimeScale}
                        isPaused={isPaused}
                        onPauseToggle={() => setIsPaused(p => !p)}
                    />
                </div>
            )}

            {/* Radar always rendered but visibility controlled to preserve DOM refs */}
            <div
                id="radar-container"
                className="radar-container"
                style={{
                    cursor: 'pointer',
                    pointerEvents: showUI ? 'auto' : 'none',
                    zIndex: 1000,
                    visibility: showUI ? 'visible' : 'hidden'
                }}
                onClick={() => { if (entitiesRef.current.length > 0) setShowRadarList(prev => !prev); }}
                title="Click to Open/Close Object List"
            >
                <div className="radar-center"></div>
            </div>

            {/* Stats HUD */}
            {showUI && (
                <div className="stats-hud">
                    {lockedInfo ? (
                        <>
                            <div className="stats-hud-title">Locked: {lockedInfo.name}</div>
                            <div className="stats-hud-row">
                                <span className="stats-hud-label">Orbital Speed:</span>
                                <span className="stats-hud-value">{lockedInfo.orbitalSpeed} km/s</span>
                            </div>
                            <div className="stats-hud-row">
                                <span className="stats-hud-label">From Sun:</span>
                                <span className="stats-hud-value">{lockedInfo.sunDist}M km</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stats-hud-title">🚀 Free Flight</div>
                            <div className="stats-hud-row">
                                <span className="stats-hud-label">Speed:</span>
                                <span className="stats-hud-value">{cameraSpeed} km/s</span>
                            </div>
                            {nearestObject && (
                                <>
                                    <div className="stats-hud-row">
                                        <span className="stats-hud-label">Nearest:</span>
                                        <span className="stats-hud-value">{nearestObject.name}</span>
                                    </div>
                                    <div className="stats-hud-row">
                                        <span className="stats-hud-label">Distance:</span>
                                        <span className="stats-hud-value">{nearestObject.distance.toLocaleString()} km</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
