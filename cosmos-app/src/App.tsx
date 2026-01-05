import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Sun } from './objects/solar/Sun';
import { Stars } from './objects/Stars';
import { Mercury } from './objects/solar/Mercury';
import { Venus } from './objects/solar/Venus';
import { Earth } from './objects/solar/Earth';
import { Mars } from './objects/solar/Mars';
import { Jupiter } from './objects/solar/Jupiter';
import { Saturn } from './objects/solar/Saturn';
import { Uranus } from './objects/solar/Uranus';
import { Neptune } from './objects/solar/Neptune';
import { AsteroidBelt } from './objects/solar/AsteroidBelt';
import { OrbitPath } from './objects/common/OrbitPath';
import { Pluto } from './objects/solar/Pluto';
import { Heliosphere } from './objects/common/Heliosphere';
import { Explorer } from './objects/solar/Explorer';
import { TheKyln } from './objects/solar/TheKyln';
import { AlienX } from './objects/AlienX';
import { BlackHole } from './objects/BlackHole';
import { Cosmos } from './core/SDK';
import { SystemManager, SystemId } from './core/SystemManager';
import { QuantumaniaSystem } from './objects/quantumania/QuantumaniaSystem';
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
    system?: SystemId; // Which system this entity belongs to
    isSystemProxy?: boolean; // If true, this entity represents the entire system from afar
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
    const [currentSystem, setCurrentSystem] = useState<string>('Solar System');
    const [uiSystem, setUiSystem] = useState<string>('Solar System');

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
    const teleportIndexRef = useRef(0);

    // Lock functions exposed via refs instead of window globals
    const lockOnTarget = useRef((mesh: THREE.Object3D, radius: number) => {
        // Calculate initial spherical coordinates based on CURRENT camera position relative to target
        // This prevents the camera from "snapping" to a default angle/distance
        if (cameraRef.current) {
            const targetPos = new THREE.Vector3();
            mesh.getWorldPosition(targetPos);

            const camPos = cameraRef.current.position.clone();
            const relPos = camPos.sub(targetPos); // Vector from Target to Camera

            // Convert Cartesian to Spherical
            const distance = relPos.length();
            const phi = Math.asin(relPos.y / distance);
            const theta = Math.atan2(relPos.x, relPos.z);

            lockRef.current = {
                mesh,
                distance: radius * Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER, // Set GOAL distance to fly towards
                isTop: false,
                theta: theta,       // Start at current angle to avoid rotation snap
                phi: phi
            };
        } else {
            // Fallback if camera not ready
            lockRef.current = {
                mesh,
                distance: radius * Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER,
                isTop: false,
                theta: Math.PI / 4,
                phi: 0.3
            };
        }
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

    // Auto-update UI system when physically entering a new system
    useEffect(() => {
        setUiSystem(currentSystem);
    }, [currentSystem]);

    useEffect(() => {
        // --- KEYBOARD HANDLERS ---
        const handleKeyDown = (e: KeyboardEvent) => {
            updateInputKey(inputRef.current, e.code, true);

            // TAB TELEPORT (Cycle through system entities)
            if (e.key === 'Tab') {
                e.preventDefault();

                // Get entities for current system (excluding proxies)
                // Use SystemManager to avoid stale closure
                const manager = SystemManager.getInstance();
                const activeSystem = manager.currentSystem;

                const systemEntities = entitiesRef.current.filter(ent =>
                    ent.system === activeSystem && !ent.isSystemProxy
                );

                if (systemEntities.length > 0) {
                    // Cycle index
                    teleportIndexRef.current = (teleportIndexRef.current + 1) % systemEntities.length;
                    const target = systemEntities[teleportIndexRef.current];

                    if (target && target.mesh) {
                        lockOnTarget.current(target.mesh, target.radius);
                    }
                }
                return;
            }

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
        // Start in Solar System with a good overview angle
        camera.position.set(0, 500, 800);
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
            0, 0 // Infinite range (REALISTIC)
        );
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.bias = -0.00001;
        sunLight.layers.set(1); // Layer 1: Solar System Only
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(Cosmos.LIGHTING.AMBIENT_COLOR, Cosmos.LIGHTING.AMBIENT_INTENSITY);
        ambientLightRef.current = ambientLight;
        scene.add(ambientLight);

        // LABELS
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none'; // Click-through
        if (mountRef.current) {
            mountRef.current.innerHTML = '';
            mountRef.current.appendChild(renderer.domElement);
            mountRef.current.appendChild(labelRenderer.domElement);
        }
        labelRendererRef.current = labelRenderer;

        // ENABLE LAYERS (Camera is already created)
        camera.layers.enable(0); // Default
        camera.layers.enable(1); // Solar System
        camera.layers.enable(2); // Quantumania

        // =====================================================================
        // OBJECTS
        // =====================================================================

        // 1. SOLAR SYSTEM (Layer 1)
        const sun = new Sun(Cosmos.UNITS.SOLAR_RADIUS);
        sun.layers.set(1);
        scene.add(sun);

        const stars = new Stars(8000, 5000);
        scene.add(stars); // Stars are generic (Layer 0)

        const mercury = new Mercury();
        mercury.layers.set(1);
        mercury.traverse(c => c.layers.set(1));
        scene.add(mercury);

        const venus = new Venus();
        venus.layers.set(1);
        venus.traverse(c => c.layers.set(1));
        scene.add(venus);

        const earth = new Earth();
        earth.layers.set(1);
        earth.traverse(c => c.layers.set(1));
        scene.add(earth);

        const mars = new Mars();
        mars.layers.set(1);
        mars.traverse(c => c.layers.set(1));
        scene.add(mars);

        const jupiter = new Jupiter();
        jupiter.layers.set(1);
        jupiter.traverse(c => c.layers.set(1));
        scene.add(jupiter);

        const saturn = new Saturn();
        saturn.layers.set(1);
        saturn.traverse(c => c.layers.set(1));
        scene.add(saturn);

        const uranus = new Uranus();
        uranus.layers.set(1);
        uranus.traverse(c => c.layers.set(1));
        scene.add(uranus);

        const neptune = new Neptune();
        neptune.layers.set(1);
        neptune.traverse(c => c.layers.set(1));
        scene.add(neptune);

        const pluto = new Pluto();
        pluto.layers.set(1);
        pluto.traverse(c => c.layers.set(1));
        scene.add(pluto);

        // Asteroid Belt (Points)
        const belt = new AsteroidBelt();
        belt.layers.set(1);
        scene.add(belt);

        // Easter Eggs related to Solar System
        const explorer = new Explorer();
        explorer.layers.set(1);
        explorer.traverse(c => c.layers.set(1));
        scene.add(explorer);

        // "The Kyln" (Prison) - Placed in Solar System for now
        const theKyln = new TheKyln('The Kyln');
        theKyln.layers.set(1);
        theKyln.traverse(c => c.layers.set(1));
        scene.add(theKyln);

        // HELIOSPHERE - Solar System boundary (Layer 1)
        const solarHeliosphere = new Heliosphere(
            SystemManager.SOLAR_SYSTEM_RADIUS,
            SystemManager.SOLAR_SYSTEM_COLOR,
            SystemManager.SOLAR_SYSTEM_CENTER,
            SystemId.SOLAR_SYSTEM
        );
        solarHeliosphere.layers.set(1);
        // Heliosphere mesh itself needs to be on Layer 1
        solarHeliosphere.traverse(c => c.layers.set(1));
        scene.add(solarHeliosphere);

        // SOLAR BEACON (Distant LOD)
        const createSolarBeacon = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 64, 64);
                const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
                g.addColorStop(0, 'rgba(255, 200, 50, 1)');
                g.addColorStop(0.2, 'rgba(255, 200, 50, 0.6)');
                g.addColorStop(1, 'rgba(255, 200, 50, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 64, 64);
            }
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffcc33,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(600, 600, 1);
            sprite.visible = false; // Hidden by default (start inside)
            return sprite;
        };
        const solarBeacon = createSolarBeacon();
        scene.add(solarBeacon);

        // QUANTUMANIA SYSTEM - Floating mountains (Layer 2)
        const quantumania = new QuantumaniaSystem();
        // quantumania layer setup is handled inside its class, or we do it here:
        quantumania.layers.set(2);
        quantumania.traverse(c => c.layers.set(2));
        scene.add(quantumania);

        // ORBIT PATHS (Layer 1)
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
        orbitPaths.forEach(path => {
            path.layers.set(1);
            scene.add(path);
        });

        // OTHER EASTER EGGS (Layer 1 to capture Sun light?)
        const robonaut = new AlienX();
        robonaut.layers.set(1);
        robonaut.traverse(c => c.layers.set(1));
        scene.add(robonaut);

        const blackHole = new BlackHole();
        blackHole.layers.set(1);
        blackHole.traverse(c => c.layers.set(1));
        scene.add(blackHole);

        // SOLAR SYSTEM ENTITIES (Radar)
        const solarSystemEntities: EntityInfo[] = [
            { mesh: sun, id: 'sun-blip', color: Cosmos.RADAR.COLORS.SUN, label: 'Sun', radius: Cosmos.UNITS.SOLAR_RADIUS * 4, system: SystemId.SOLAR_SYSTEM },
            { mesh: mercury, id: 'mercury-blip', color: Cosmos.RADAR.COLORS.MERCURY, label: 'Mercury', radius: 10, system: SystemId.SOLAR_SYSTEM },
            { mesh: venus, id: 'venus-blip', color: Cosmos.RADAR.COLORS.VENUS, label: 'Venus', radius: 15, system: SystemId.SOLAR_SYSTEM },
            { mesh: earth, id: 'earth-blip', color: Cosmos.RADAR.COLORS.EARTH, label: 'Earth', radius: 15, system: SystemId.SOLAR_SYSTEM },
            { mesh: earth.moon, id: 'moon-blip', color: Cosmos.RADAR.COLORS.MOON, label: 'Moon', radius: 5, system: SystemId.SOLAR_SYSTEM },
            { mesh: mars, id: 'mars-blip', color: Cosmos.RADAR.COLORS.MARS, label: 'Mars', radius: 12, system: SystemId.SOLAR_SYSTEM },
            { mesh: belt, id: 'belt-blip', color: '#888888', label: 'Asteroid Belt', radius: 100, system: SystemId.SOLAR_SYSTEM },
            { mesh: jupiter, id: 'jupiter-blip', color: Cosmos.RADAR.COLORS.JUPITER, label: 'Jupiter', radius: 40, system: SystemId.SOLAR_SYSTEM },
            { mesh: jupiter.europa, id: 'europa-blip', color: '#fff', label: 'Europa', radius: 5, system: SystemId.SOLAR_SYSTEM },
            { mesh: saturn, id: 'saturn-blip', color: Cosmos.RADAR.COLORS.SATURN, label: 'Saturn', radius: 35, system: SystemId.SOLAR_SYSTEM },
            { mesh: saturn.titan, id: 'titan-blip', color: '#e6d4be', label: 'Titan', radius: 6, system: SystemId.SOLAR_SYSTEM },
            { mesh: uranus, id: 'uranus-blip', color: Cosmos.RADAR.COLORS.URANUS, label: 'Uranus', radius: 25, system: SystemId.SOLAR_SYSTEM },
            { mesh: neptune, id: 'neptune-blip', color: Cosmos.RADAR.COLORS.NEPTUNE, label: 'Neptune', radius: 25, system: SystemId.SOLAR_SYSTEM },
            { mesh: pluto, id: 'pluto-blip', color: Cosmos.RADAR.COLORS.PLUTO, label: 'Pluto', radius: 8, system: SystemId.SOLAR_SYSTEM },
            { mesh: pluto.charon, id: 'charon-blip', color: '#8a8a8a', label: 'Charon', radius: 4, system: SystemId.SOLAR_SYSTEM },
            // Easter Eggs (Solar System)
            { mesh: explorer, id: 'explorer-blip', color: '#00aaff', label: 'Explorer', radius: 5, system: SystemId.SOLAR_SYSTEM },
            { mesh: theKyln, id: 'kyln-blip', color: '#4488cc', label: 'The Kyln', radius: 8, system: SystemId.SOLAR_SYSTEM },
            // Solar System Proxy (only visible from afar)
            { mesh: sun, id: 'solar-proxy-blip', color: '#fc3', label: 'Solar System', radius: Cosmos.UNITS.SOLAR_RADIUS * 10, system: SystemId.SOLAR_SYSTEM, isSystemProxy: true },
        ];

        const interstellarEntities: EntityInfo[] = [
            { mesh: robonaut, id: 'robonaut-blip', color: '#00ff00', label: 'Alien X', radius: 10, system: SystemId.INTERSTELLAR },
            { mesh: blackHole, id: 'blackhole-blip', color: '#ff6600', label: 'Black Hole', radius: 100, system: SystemId.INTERSTELLAR },
        ];

        // QUANTUMANIA ENTITIES
        const quantumaniaEntities: EntityInfo[] = quantumania.getEntities();
        // Add Quantumania Proxy (Nexus as target)
        const nexusMountain = quantumania.mountains[0]; // Nexus is first
        quantumaniaEntities.push({
            mesh: nexusMountain,
            id: 'quantumania-proxy-blip',
            color: '#bb88ff',
            label: 'Quantumania',
            radius: 200,
            system: SystemId.QUANTUMANIA,
            isSystemProxy: true
        });

        // Combine all entities
        entitiesRef.current = [
            ...solarSystemEntities,
            ...quantumaniaEntities,
            ...interstellarEntities,
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

            // Apply time scale
            if (!isPausedRef.current) {
                const sysManager = SystemManager.getInstance();
                if (sysManager.currentSystem === SystemId.QUANTUMANIA) {
                    // Force Realtime in Quantumania (Walking Simulator Mode)
                    simTime += delta;
                } else {
                    // Use Time Slider for Solar System (Space Sim Mode)
                    simTime += delta * timeScaleRef.current;
                }
            }
            const time = simTime;



            // Visibility rules (LOD):
            // 1. Solar System
            // Show if:
            // - Inside Solar Radius
            // - Inside extended range (4500) covering Alien X
            // - Locked onto any Solar object
            // - Locked specifically onto Alien X (override)
            const sunDist = camera.position.distanceTo(SystemManager.SOLAR_SYSTEM_CENTER);
            const lockedEntity = lockRef.current?.mesh ? entitiesRef.current.find(e => e.mesh === lockRef.current?.mesh) : null;
            const isLockedToSolar = lockedEntity?.system === SystemId.SOLAR_SYSTEM;
            const isLockedToAlienX = lockedEntity?.label === 'Alien X';

            const showSolarSystem = (sunDist < 4500) || isLockedToSolar || isLockedToAlienX;

            // Toggle Solar System (3D Objects vs Beacon)
            const solarObjects = [
                sun, mercury, venus, earth, mars, belt, jupiter, saturn, uranus, neptune, pluto,
                explorer, theKyln
            ];

            solarObjects.forEach(obj => obj.visible = showSolarSystem);
            orbitPaths.forEach(p => p.visible = showSolarSystem);

            // Beacon is visible when 3D system is HIDDEN
            solarBeacon.visible = !showSolarSystem;
            if (solarBeacon.visible) {
                // Pulse beacon
                const p = 0.8 + Math.sin(time * 2) * 0.2;
                solarBeacon.material.opacity = p;
                solarBeacon.lookAt(camera.position); // Always face camera
            }

            // Heliosphere Visibility Rule: Hide when locked onto an object inside the system
            // Heliosphere Visibility Rule: Hide when locked onto an object inside the system
            // (Enforced after update call below)

            // 2. Quantumania System
            const nexusDist = camera.position.distanceTo(SystemManager.QUANTUMANIA_CENTER);
            const isLockedToQuantum = lockedEntity?.system === SystemId.QUANTUMANIA;

            // Show if close (Radius + 500 buffer) OR locked onto it
            const showQuantumania = (nexusDist < SystemManager.QUANTUMANIA_RADIUS + 500) || isLockedToQuantum;

            // Apply to Quantumania class
            quantumania.setVisible(showQuantumania);

            // Hide Quantumania heliosphere if locked onto an object inside it (except proxy)
            // (Enforced after update call below)

            // 1. UPDATE OBJECTS (only if visible)
            if (showSolarSystem) {
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
                explorer.update(time, camera);
                theKyln.update(time, camera);
            }
            solarHeliosphere.update(time, camera);
            // ENFORCE VISIBILITY: Override Heliosphere.update logic which auto-shows it
            if (!showSolarSystem || isLockedToSolar) {
                solarHeliosphere.visible = false;
            }

            // Update Quantumania system (pass visibility flag)
            quantumania.setVisible(showQuantumania);
            quantumania.update(time, camera);

            // ENFORCE VISIBILITY for Quantumania
            const isLockedToQuantumInside = isLockedToQuantum && lockedEntity?.isSystemProxy !== true;
            if (isLockedToQuantumInside) {
                quantumania.heliosphere.visible = false;
            }

            // Track current system based on camera position
            const systemManager = SystemManager.getInstance();
            if (systemManager.updateCurrentSystem(camera.position)) {
                // System changed - update UI
                setCurrentSystem(systemManager.getCurrentSystemName());
            }

            // Update planet positions for Explorer collision avoidance
            // Update planet positions for Explorer collision avoidance
            Explorer.updatePlanetPositions([
                mercury.position, venus.position, earth.position, mars.position,
                jupiter.position, saturn.position, uranus.position, neptune.position, pluto.position
            ]);

            // Interstellar Easter Eggs (always visible/updated)
            robonaut.update(time, camera);
            blackHole.update(time, camera);

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
                    // --- RADAR MAP DECLUTTERING LOGIC ---
                    // Determine if we should show this specific blip based on where we are
                    let shouldShow = true;

                    const sysManager = SystemManager.getInstance();
                    const mySystemId = sysManager.currentSystem;

                    if (ent.system === SystemId.INTERSTELLAR) {
                        // Always show interstellar objects (Alien X, Black Hole)
                        shouldShow = true;
                    } else if (ent.system === mySystemId) {
                        // We are inside this system
                        if (ent.isSystemProxy) {
                            // Hide the "Solar System" big dot when we are INSIDE Solar System
                            shouldShow = false;
                        } else {
                            // Show individual planets/mountains
                            shouldShow = true;
                        }
                    } else {
                        // We are in a DIFFERENT system (or interstellar) looking at this one
                        if (ent.isSystemProxy) {
                            // Show the single big dot for the distant system
                            shouldShow = true;
                        } else {
                            // Hide individual distant planets/mountains to reduce clutter
                            shouldShow = false;
                        }
                    }

                    // Apply visibility
                    blip.style.display = shouldShow ? 'block' : 'none';

                    if (!shouldShow) return;

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
                    {/* Navigation Panel */}
                    <div className="radar-list">
                        {/* System Tabs - Clickable for switching visual list ONLY */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            marginBottom: '10px'
                        }}>
                            {/* Solar System Tab */}
                            <div
                                onClick={() => setUiSystem('Solar System')}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: uiSystem === 'Solar System' ? 'rgba(102, 153, 255, 0.3)' : 'transparent',
                                    borderBottom: uiSystem === 'Solar System' ? '2px solid #6699ff' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    fontSize: '11px'
                                }}
                            >
                                ☀️ Solar
                                {currentSystem === 'Solar System' && <div style={{ fontSize: '8px', color: '#4f4' }}>● HERE</div>}
                            </div>

                            {/* Interstellar Tab */}
                            <div
                                onClick={() => setUiSystem('Interstellar Space')}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: uiSystem === 'Interstellar Space' ? 'rgba(136, 136, 136, 0.3)' : 'transparent',
                                    borderBottom: uiSystem === 'Interstellar Space' ? '2px solid #888' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    fontSize: '11px'
                                }}
                            >
                                🌌 Deep
                                {currentSystem === 'Interstellar Space' && <div style={{ fontSize: '8px', color: '#4f4' }}>● HERE</div>}
                            </div>

                            {/* Quantumania Tab */}
                            <div
                                onClick={() => setUiSystem('Quantumania')}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: uiSystem === 'Quantumania' ? 'rgba(187, 136, 255, 0.3)' : 'transparent',
                                    borderBottom: uiSystem === 'Quantumania' ? '2px solid #bb88ff' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    fontSize: '11px'
                                }}
                            >
                                🏔️ Quantum
                                {currentSystem === 'Quantumania' && <div style={{ fontSize: '8px', color: '#4f4' }}>● HERE</div>}
                            </div>
                        </div>

                        {/* Current System Objects - Filter out proxies for the list */}
                        {uiSystem === 'Solar System' && (
                            <>
                                <div className="radar-category" style={{ color: '#6699ff' }}>☀️ Solar System</div>
                                {entitiesRef.current.filter(e => e.label === 'Sun' && !e.isSystemProxy).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}
                                <div className="radar-category" style={{ fontSize: '10px' }}>Planets</div>
                                {entitiesRef.current.filter(e =>
                                    ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(e.label)
                                ).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}
                                <div className="radar-category" style={{ fontSize: '10px' }}>Moons</div>
                                {entitiesRef.current.filter(e =>
                                    ['Moon', 'Europa', 'Titan', 'Charon'].includes(e.label)
                                ).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}
                                <div className="radar-category" style={{ fontSize: '10px' }}>Other</div>
                                {entitiesRef.current.filter(e =>
                                    ['Asteroid Belt', 'Explorer-1', 'The Kyln'].includes(e.label)
                                ).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}

                                {/* Distant System - Quantumania as single blip */}
                                <div className="radar-category" style={{ fontSize: '10px', marginTop: '10px', color: '#666' }}>Distant Systems</div>
                                <div
                                    className="radar-item"
                                    style={{ opacity: 0.7 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Find Nexus Mountain (center of Quantumania) and lock onto it
                                        const nexus = entitiesRef.current.find(e => e.label === 'The Nexus');
                                        if (nexus && nexus.mesh) {
                                            if (cameraRef.current) {
                                                // Pre-orient camera towards destination for smoother transition if needed
                                                // but lockOnTarget handles position lerp.
                                                // Just triggering lock is enough.
                                            }
                                            lockOnTarget.current(nexus.mesh, nexus.radius);
                                        }
                                    }}
                                >
                                    <div className="radar-item-dot" style={{ backgroundColor: '#bb88ff' }}></div>
                                    🏔️ Quantumania
                                </div>
                            </>
                        )}

                        {uiSystem === 'Interstellar Space' && (
                            <>
                                <div className="radar-category" style={{ color: '#888' }}>🌌 Interstellar Space</div>
                                <div style={{ padding: '5px 10px', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                                    You are between star systems
                                </div>
                                {entitiesRef.current.filter(e => e.system === SystemId.INTERSTELLAR).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}
                                <div style={{ padding: '10px', fontSize: '10px', color: '#555' }}>
                                    💡 Click tabs above to travel
                                </div>
                            </>
                        )}

                        {uiSystem === 'Quantumania' && (
                            <>
                                <div className="radar-category" style={{ color: '#bb88ff' }}>🏔️ Quantumania</div>
                                <div className="radar-category" style={{ fontSize: '10px' }}>Mountains</div>
                                {entitiesRef.current.filter(e => e.system === SystemId.QUANTUMANIA && !e.isSystemProxy).map(ent => (
                                    <div key={ent.id} className="radar-item" onClick={(e) => { e.stopPropagation(); lockOnTarget.current(ent.mesh, ent.radius); }}>
                                        <div className="radar-item-dot" style={{ backgroundColor: ent.color }}></div>
                                        {ent.label}
                                    </div>
                                ))}

                                {/* Distant System - Solar System as single blip */}
                                <div className="radar-category" style={{ fontSize: '10px', marginTop: '10px', color: '#666' }}>Distant Systems</div>
                                <div
                                    className="radar-item"
                                    style={{ opacity: 0.7 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Find Sun (center of Solar System) and lock onto it
                                        const sun = entitiesRef.current.find(e => e.label === 'Sun');
                                        if (sun && sun.mesh) {
                                            lockOnTarget.current(sun.mesh, sun.radius);
                                        }
                                    }}
                                >
                                    <div className="radar-item-dot" style={{ backgroundColor: '#fc3' }}></div>
                                    ☀️ Solar System
                                </div>
                            </>
                        )}

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
                </div >
            )
            }

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
            {
                showUI && (
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
                )
            }
        </div >
    );
}
