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
import { Cosmos } from './core/SDK';
import {
    InputState,
    LockTarget,
    createInputState,
    updateInputKey,
    pollGamepad,
    applyInputToCamera
} from './core/InputHandler';

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

    // Lock functions exposed via refs instead of window globals
    const lockOnTarget = useRef((mesh: THREE.Object3D, radius: number) => {
        lockRef.current = {
            mesh,
            distance: radius * Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER,
            isTop: false,
            theta: Math.PI / 4,  // Start at 45° horizontal
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
        camera.position.set(0, 100, 300);
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

        // ORBIT PATHS
        const orbitPaths = [
            new OrbitPath(Cosmos.PLANETS.MERCURY.DISTANCE, Cosmos.RADAR.COLORS.MERCURY),
            new OrbitPath(Cosmos.PLANETS.VENUS.DISTANCE, Cosmos.RADAR.COLORS.VENUS),
            new OrbitPath(Cosmos.PLANETS.EARTH.DISTANCE, Cosmos.RADAR.COLORS.EARTH),
            new OrbitPath(Cosmos.PLANETS.MARS.DISTANCE, Cosmos.RADAR.COLORS.MARS),
            new OrbitPath(Cosmos.PLANETS.JUPITER.DISTANCE, Cosmos.RADAR.COLORS.JUPITER),
            new OrbitPath(Cosmos.PLANETS.SATURN.DISTANCE, Cosmos.RADAR.COLORS.SATURN),
            new OrbitPath(Cosmos.PLANETS.URANUS.DISTANCE, Cosmos.RADAR.COLORS.URANUS),
            new OrbitPath(Cosmos.PLANETS.NEPTUNE.DISTANCE, Cosmos.RADAR.COLORS.NEPTUNE),
            new OrbitPath(Cosmos.PLANETS.PLUTO.DISTANCE, Cosmos.RADAR.COLORS.PLUTO),
        ];
        orbitPaths.forEach(path => scene.add(path));

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
        ];

        // RADAR INIT - Cache DOM references
        const radarContainer = document.getElementById('radar-container');
        if (radarContainer) {
            radarContainer.innerHTML = '<div class="radar-center"></div>';
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

        const animate = () => {
            requestAnimationFrame(animate);

            const time = performance.now() * 0.001;
            const delta = clock.getDelta();

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
                } else {
                    setLockedInfo(null);
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

            {showUI && showRadarList && (
                <div className="radar-list" style={{ zIndex: 1001 }}>
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
                onClick={() => setShowRadarList(prev => !prev)}
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
