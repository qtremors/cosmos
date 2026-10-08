import { useCallback, useEffect, useRef, useState } from 'react';
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
import { CosmicEntity } from './objects/CosmicEntity';
import {
    InputState,
    LockTarget,
    createInputState,
    updateInputKey,
    pollGamepad,
    applyInputToCamera
} from './core/InputHandler';
import { SettingsPanel } from './components/SettingsPanel';
import { RadarObjectList } from './components/RadarObjectList';
import { EntityCategory, type EntityInfo } from './core/Entity';
import { startAnimationLoop, disposeObject3D } from './core/SceneLifecycle';
import { SceneAssets, EMPTY_ASSET_STATUS } from './core/SceneAssets';
import { QUALITY_PRESETS, getSavedQuality, saveQuality, type QualityLevel } from './core/Quality';
import { simulationDistanceToKm, VISIBILITY } from './core/Simulation';

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// APP COMPONENT
// =============================================================================

export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showUI, setShowUI] = useState(true);
    const [showRadarList, setShowRadarList] = useState(false);
    const [cameraSpeed, setCameraSpeed] = useState(0);
    const [lockedInfo, setLockedInfo] = useState<{
        name: string;
        orbitalSpeed: number;
        refDist: number;
        refName: string;
        showOrbitalSpeed: boolean;
    } | null>(null);

    const [nearestObject, setNearestObject] = useState<{ name: string; distance: number } | null>(null);
    const [timeScale, setTimeScale] = useState(Cosmos.DEFAULT_TIME_SCALE);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSystem, setCurrentSystem] = useState<string>('Solar System');
    const [entities, setEntities] = useState<EntityInfo[]>([]);
    const [quality, setQuality] = useState<QualityLevel>(getSavedQuality);
    const [assetStatus, setAssetStatus] = useState(EMPTY_ASSET_STATUS);
    const [sceneError, setSceneError] = useState<string | null>(null);
    const qualityRef = useRef(quality);
    const retryAssetsRef = useRef(() => {});
    const radarButtonRef = useRef<HTMLButtonElement>(null);
    const [lockedEntity, setLockedEntity] = useState<EntityInfo | null>(null);

    const labelRendererRef = useRef<CSS2DRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const entitiesRef = useRef<EntityInfo[]>([]);
    const radarBlipsRef = useRef<Map<string, HTMLElement>>(new Map());
    const showLabelsRef = useRef(showLabels);

    const lockRef = useRef<LockTarget | null>(null);
    const inputRef = useRef<InputState>(createInputState());
    const zoomVelocity = useRef(0);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const mouseDelta = useRef({ x: 0, y: 0 });
    const lastCameraPos = useRef(new THREE.Vector3());


    const timeScaleRef = useRef(timeScale);
    const isPausedRef = useRef(isPaused);
    const teleportIndexRef = useRef(0);

    const closeRadar = useCallback(() => {
        setShowRadarList(false);
        radarButtonRef.current?.focus();
    }, []);

    const lockOnTarget = useCallback((entity: EntityInfo) => {
        const { mesh, radius } = entity;
        const camera = cameraRef.current;
        if (!camera) return;
        const targetPos = mesh.getWorldPosition(new THREE.Vector3());
        const relative = camera.position.clone().sub(targetPos);
        const distance = Math.max(relative.length(), 1e-6);
        lockRef.current = {
            mesh,
            entityId: entity.id,
            distance: radius * (entity.system === SystemId.QUANTUMANIA ? 1.5 : Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER),
            isTop: false,
            theta: Math.atan2(relative.x, relative.z),
            phi: Math.asin(THREE.MathUtils.clamp(relative.y / distance, -1, 1)),
        };
        setLockedEntity(entity);
        closeRadar();
        mountRef.current?.querySelector('canvas')?.focus();
    }, [closeRadar]);

    const unlockCamera = useCallback(() => {
        lockRef.current = null;
        setLockedEntity(null);
    }, []);

    const toggleTopView = useCallback((camera: THREE.PerspectiveCamera) => {
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
    }, []);

    useEffect(() => {
        showLabelsRef.current = showLabels;
    }, [showLabels]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;
        const radarBlips = radarBlipsRef.current;
        const assets = new SceneAssets(setAssetStatus);
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        } catch {
            assets.dispose();
            queueMicrotask(() => setSceneError('Your browser could not start the 3D view. Try enabling hardware acceleration or using another browser.'));
            return;
        }
        const resetInput = () => {
            inputRef.current = createInputState();
            isDragging.current = false;
            mouseDelta.current.x = mouseDelta.current.y = 0;
            zoomVelocity.current = 0;
        };
        const handleVisibility = () => { if (document.hidden) resetInput(); };
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target;
            if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key === 'Escape') {
                if (radarButtonRef.current?.getAttribute('aria-expanded') === 'true') closeRadar();
                else unlockCamera();
                return;
            }
            if (target instanceof HTMLElement && target.closest('[data-ui]') && !['h', 'l'].includes(e.key.toLowerCase())) return;
            updateInputKey(inputRef.current, e.code, true);
            if (e.code.startsWith('Arrow')) e.preventDefault();

            if (e.code === 'KeyN' && !e.repeat) {
                e.preventDefault();

                // Get entities for current system (excluding proxies)
                const manager = SystemManager.getInstance();
                const activeSystem = manager.currentSystem;

                const systemEntities = entitiesRef.current.filter(ent =>
                    ent.system === activeSystem && !ent.isSystemProxy
                );

                if (systemEntities.length > 0) {
                    teleportIndexRef.current = (teleportIndexRef.current + 1) % systemEntities.length;
                    const target = systemEntities[teleportIndexRef.current];

                    if (target && target.mesh) {
                        lockOnTarget(target);
                    }
                }
                return;
            }

            if (e.repeat) return;
            if (e.key.toLowerCase() === 'l') setShowLabels(prev => !prev);
            if (e.key.toLowerCase() === 'h') setShowUI(prev => !prev);
            if (e.key.toLowerCase() === 't' && cameraRef.current) {
                toggleTopView(cameraRef.current);
            }
        };



        const handleKeyUp = (e: KeyboardEvent) => {
            updateInputKey(inputRef.current, e.code, false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', resetInput);
        document.addEventListener('visibilitychange', handleVisibility);

        // --- MOUSE WHEEL (Momentum Zoom) ---
        const handleWheel = (e: WheelEvent) => {
            // Don't capture wheel events inside radar panels (allow scrolling)
            const target = e.target as HTMLElement;
            if (target.closest('[data-ui]')) {
                return;
            }

            e.preventDefault();
            const dir = e.deltaY > 0 ? 1 : -1;
            const force = e.shiftKey ? 20.0 : 5.0;
            zoomVelocity.current += dir * force;
        };
        window.addEventListener('wheel', handleWheel, { passive: false });

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
        // Start in Solar System with a good overview angle
        camera.position.set(0, 500, 800);
        camera.lookAt(0, 0, 0);
        camera.rotation.z = 0;
        cameraRef.current = camera;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        const sunLight = new THREE.PointLight(
            Cosmos.LIGHTING.SUN_COLOR,
            Cosmos.LIGHTING.SUN_INTENSITY,
            0, 0
        );
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 512;
        sunLight.shadow.mapSize.height = 512;
        sunLight.shadow.bias = -0.00001;
        sunLight.layers.set(1);
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(Cosmos.LIGHTING.AMBIENT_COLOR, Cosmos.LIGHTING.AMBIENT_INTENSITY);
        // Enable ambient light on all layers so it affects all objects
        ambientLight.layers.enableAll();
        scene.add(ambientLight);

        // LABELS
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none';
        mount.replaceChildren(renderer.domElement, labelRenderer.domElement);
        labelRendererRef.current = labelRenderer;

        camera.layers.enable(0);
        camera.layers.enable(1);
        camera.layers.enable(2);

        // =====================================================================
        // OBJECTS
        // =====================================================================

        // 1. SOLAR SYSTEM (Layer 1)
        const sun = new Sun(Cosmos.UNITS.SOLAR_RADIUS, assets);
        sun.layers.set(1);
        scene.add(sun);

        const stars = new Stars(8000, 5000);
        scene.add(stars);

        const mercury = new Mercury(assets);
        mercury.layers.set(1);
        mercury.traverse(c => c.layers.set(1));
        scene.add(mercury);

        const venus = new Venus(assets);
        venus.layers.set(1);
        venus.traverse(c => c.layers.set(1));
        scene.add(venus);

        const earth = new Earth(assets);
        earth.layers.set(1);
        earth.traverse(c => c.layers.set(1));
        scene.add(earth);

        const mars = new Mars(assets);
        mars.layers.set(1);
        mars.traverse(c => c.layers.set(1));
        scene.add(mars);

        const jupiter = new Jupiter(assets);
        jupiter.layers.set(1);
        jupiter.traverse(c => c.layers.set(1));
        scene.add(jupiter);

        const saturn = new Saturn(assets);
        saturn.layers.set(1);
        saturn.traverse(c => c.layers.set(1));
        scene.add(saturn);

        const uranus = new Uranus(assets);
        uranus.layers.set(1);
        uranus.traverse(c => c.layers.set(1));
        scene.add(uranus);

        const neptune = new Neptune(assets);
        neptune.layers.set(1);
        neptune.traverse(c => c.layers.set(1));
        scene.add(neptune);

        const pluto = new Pluto(assets);
        pluto.layers.set(1);
        pluto.traverse(c => c.layers.set(1));
        scene.add(pluto);

        const belt = new AsteroidBelt();
        belt.layers.set(1);
        scene.add(belt);

        const explorer = new Explorer();
        explorer.layers.set(1);
        explorer.traverse(c => c.layers.set(1));
        scene.add(explorer);

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
        solarHeliosphere.traverse(c => c.layers.set(1));
        scene.add(solarHeliosphere);

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
            sprite.visible = false;
            return sprite;
        };
        const solarBeacon = createSolarBeacon();
        scene.add(solarBeacon);

        const quantumania = new QuantumaniaSystem(assets);
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

        const alienX = new AlienX(assets);
        alienX.layers.set(1);
        alienX.traverse(c => c.layers.set(1));
        scene.add(alienX);

        const blackHole = new BlackHole();
        blackHole.layers.set(1);
        blackHole.traverse(c => c.layers.set(1));
        scene.add(blackHole);

        const cosmicEntity = new CosmicEntity(assets);
        scene.add(cosmicEntity);


        const solarSystemEntities: EntityInfo[] = [
            { mesh: sun, id: 'sun-blip', color: Cosmos.RADAR.COLORS.SUN, label: 'Sun', radius: Cosmos.UNITS.SOLAR_RADIUS * 4, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.STAR },
            { mesh: mercury, id: 'mercury-blip', color: Cosmos.RADAR.COLORS.MERCURY, label: 'Mercury', radius: 10, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: venus, id: 'venus-blip', color: Cosmos.RADAR.COLORS.VENUS, label: 'Venus', radius: 15, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: earth, id: 'earth-blip', color: Cosmos.RADAR.COLORS.EARTH, label: 'Earth', radius: 15, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: earth.moon, id: 'moon-blip', color: Cosmos.RADAR.COLORS.MOON, label: 'Moon', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
            { mesh: mars, id: 'mars-blip', color: Cosmos.RADAR.COLORS.MARS, label: 'Mars', radius: 12, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: belt, id: 'belt-blip', color: '#888888', label: 'Asteroid Belt', radius: 100, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.ASTEROID },
            { mesh: jupiter, id: 'jupiter-blip', color: Cosmos.RADAR.COLORS.JUPITER, label: 'Jupiter', radius: 40, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: jupiter.europa, id: 'europa-blip', color: '#fff', label: 'Europa', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
            { mesh: saturn, id: 'saturn-blip', color: Cosmos.RADAR.COLORS.SATURN, label: 'Saturn', radius: 35, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: saturn.titan, id: 'titan-blip', color: '#e6d4be', label: 'Titan', radius: 6, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
            { mesh: uranus, id: 'uranus-blip', color: Cosmos.RADAR.COLORS.URANUS, label: 'Uranus', radius: 25, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: neptune, id: 'neptune-blip', color: Cosmos.RADAR.COLORS.NEPTUNE, label: 'Neptune', radius: 25, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: pluto, id: 'pluto-blip', color: Cosmos.RADAR.COLORS.PLUTO, label: 'Pluto', radius: 8, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
            { mesh: pluto.charon, id: 'charon-blip', color: '#8a8a8a', label: 'Charon', radius: 4, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
            // NASA data attribution remains here if any (none in this block)
            { mesh: explorer, id: 'explorer-blip', color: '#00aaff', label: 'Explorer', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.EASTER_EGG },
            { mesh: theKyln, id: 'kyln-blip', color: '#4488cc', label: 'The Kyln', radius: 8, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.EASTER_EGG },
            // Solar System Proxy (only visible from afar)
            { mesh: sun, id: 'solar-proxy-blip', color: '#fc3', label: 'Solar System', radius: Cosmos.UNITS.SOLAR_RADIUS * 10, system: SystemId.SOLAR_SYSTEM, isSystemProxy: true, category: EntityCategory.PROXY },
        ];

        const interstellarEntities: EntityInfo[] = [
            { mesh: alienX, id: 'alienX-blip', color: '#00ff00', label: 'Alien X', radius: 10, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
            { mesh: blackHole, id: 'blackhole-blip', color: '#ff6600', label: 'Black Hole', radius: 100, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
            // Target the HEAD for lock/radar
            // Increased radius (1500) to keep camera at a safe distance from the massive model
            { mesh: cosmicEntity.head, id: 'architect-blip', color: '#00ffff', label: 'Cosmic Entity', radius: 1500, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
        ];

        // QUANTUMANIA ENTITIES
        const quantumaniaEntities: EntityInfo[] = quantumania.getEntities();
        // Add Quantumania Proxy (Nexus as target)
        const nexusMountain = quantumania.nexus; // Nexus is the main target
        quantumaniaEntities.push({
            mesh: nexusMountain,
            id: 'quantumania-proxy-blip',
            color: '#bb88ff',
            label: 'Quantumania',
            radius: 200,
            system: SystemId.QUANTUMANIA,
            isSystemProxy: true,
            category: EntityCategory.PROXY
        });

        // Combine all entities
        entitiesRef.current = [
            ...solarSystemEntities,
            ...quantumaniaEntities,
            ...interstellarEntities,
        ];

        queueMicrotask(() => { if (!disposed) setEntities(entitiesRef.current); });

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
                radarBlips.set(ent.id, b);
            });
        }

        // Reset FOV
        camera.fov = Cosmos.CONTROLS.FOV_DEFAULT;
        camera.updateProjectionMatrix();

        let activePointer: number | null = null;
        const handleMouseDown = (e: PointerEvent) => {
            if (e.button === 0 && e.isPrimary) {
                e.preventDefault();
                renderer.domElement.focus();
                activePointer = e.pointerId;
                renderer.domElement.setPointerCapture(e.pointerId);
                isDragging.current = true;
                lastMouse.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            activePointer = null;
        };

        const handleMouseMove = (e: PointerEvent) => {
            if (!isDragging.current || e.pointerId !== activePointer) return;
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;

            lastMouse.current = { x: e.clientX, y: e.clientY };

            mouseDelta.current.x += dx;
            mouseDelta.current.y += dy;
        };

        renderer.domElement.tabIndex = 0;
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.setAttribute('aria-label', 'Space exploration view. Use WASD to move and N to visit the next object.');
        renderer.domElement.addEventListener('pointerdown', handleMouseDown);
        renderer.domElement.addEventListener('pointerup', handleMouseUp);
        renderer.domElement.addEventListener('pointercancel', handleMouseUp);
        renderer.domElement.addEventListener('lostpointercapture', handleMouseUp);
        renderer.domElement.addEventListener('pointermove', handleMouseMove);

        const onWinResize = () => {
            if (cameraRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
            }
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWinResize);

        let simTime = 0;
        let elapsedTime = 0;
        let statsElapsed = 0;
        let disposed = false;
        let appliedQuality: QualityLevel | null = null;
        const targetPosition = new THREE.Vector3();
        const radarVector = new THREE.Vector3();
        const inverseRotation = new THREE.Quaternion();
        lastCameraPos.current.copy(camera.position);
        const solarObjects = [sun, mercury, venus, earth, mars, belt, jupiter, saturn, uranus, neptune, pluto, explorer, theKyln];
        const planetPositions = [mercury.position, venus.position, earth.position, mars.position, jupiter.position, saturn.position, uranus.position, neptune.position, pluto.position];
        const onContextLost = (event: Event) => {
            event.preventDefault();
            stopAnimation();
            setSceneError('The 3D view lost its graphics connection. Reload to continue exploring.');
        };
        renderer.domElement.addEventListener('webglcontextlost', onContextLost);
        retryAssetsRef.current = () => {
            assets.retryTextures();
            quantumania.retryFailedModels();
            cosmicEntity.retryFailedModels();
        };
        const stopAnimation = startAnimationLoop(delta => {
            elapsedTime += delta;
            statsElapsed += delta;
            if (appliedQuality !== qualityRef.current) {
                appliedQuality = qualityRef.current;
                const preset = QUALITY_PRESETS[appliedQuality];
                renderer.shadowMap.enabled = preset.shadows;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, preset.pixelRatio));
                renderer.setSize(window.innerWidth, window.innerHeight);
                scene.traverse(object => {
                    if (object instanceof THREE.PointLight && object.castShadow) {
                        object.shadow.map?.dispose();
                        object.shadow.map = null;
                        object.shadow.mapSize.set(preset.shadowSize, preset.shadowSize);
                        object.shadow.needsUpdate = true;
                    }
                });
                belt.setCount(preset.asteroids);
                stars.setCount(preset.stars);
                blackHole.setRaySteps(preset.raySteps);
            }

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
            const lockedEntity = lockRef.current?.mesh ? entitiesRef.current.find(e => e.id === lockRef.current?.entityId) : null;
            const isLockedToSolar = lockedEntity?.system === SystemId.SOLAR_SYSTEM;
            const isLockedToAlienX = lockedEntity?.label === 'Alien X';

            const showSolarSystem = (sunDist < VISIBILITY.SOLAR_RANGE) || isLockedToSolar || isLockedToAlienX;

            // Toggle Solar System (3D Objects vs Beacon)
            solarObjects.forEach(obj => obj.visible = showSolarSystem);
            orbitPaths.forEach(p => p.visible = showSolarSystem);

            solarBeacon.visible = !showSolarSystem;
            if (solarBeacon.visible) {
                const p = 0.8 + Math.sin(time * 2) * 0.2;
                solarBeacon.material.opacity = p;
                solarBeacon.lookAt(camera.position);
            }

            // Heliosphere Visibility Rule: Hide when locked onto an object inside the system
            // (Enforced after update call below)

            // 2. Quantumania System
            const nexusDist = camera.position.distanceTo(SystemManager.QUANTUMANIA_CENTER);
            const isLockedToQuantum = lockedEntity?.system === SystemId.QUANTUMANIA;

            // Show if close (Radius + 500 buffer) OR locked onto it
            const showQuantumania = (nexusDist < SystemManager.QUANTUMANIA_RADIUS + VISIBILITY.QUANTUMANIA_BUFFER) || isLockedToQuantum;

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
                explorer.update(time, camera, isPausedRef.current ? 0 : delta);
                theKyln.update(time, camera, isPausedRef.current ? 0 : delta);
            }
            solarHeliosphere.update(time, camera);
            if (!showSolarSystem || isLockedToSolar) {
                solarHeliosphere.visible = false;
            }

            // Update Quantumania system (pass visibility flag)
            quantumania.setVisible(showQuantumania);
            quantumania.update(time, camera, elapsedTime);

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
            explorer.updatePlanetPositions(planetPositions);

            // Interstellar Easter Eggs (always visible/updated)
            alienX.update(time, camera, elapsedTime);
            blackHole.update(time, camera, elapsedTime);
            cosmicEntity.update(time, camera, elapsedTime, delta);

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
                unlockCamera();
            }

            renderer.render(scene, camera);

            // Toggle labels visibility
            if (labelRendererRef.current) {
                labelRendererRef.current.domElement.style.display = showLabelsRef.current ? 'block' : 'none';
            }
            labelRenderer.render(scene, camera);

            // STATS HUD UPDATE (throttled to avoid excessive re-renders)
            if (statsElapsed >= 1 / 6) {
                const speedKmS = simulationDistanceToKm(camera.position.distanceTo(lastCameraPos.current)) / statsElapsed;
                statsElapsed = 0;
                lastCameraPos.current.copy(camera.position);
                setCameraSpeed(Math.round(speedKmS));

                // Update locked object info
                if (lockRef.current?.mesh) {
                    const targetPos = targetPosition;
                    lockRef.current.mesh.getWorldPosition(targetPos);

                    // Find entity to determine which system it belongs to
                    const entity = entitiesRef.current.find(e => e.id === lockRef.current?.entityId);
                    const entitySystem = entity?.system || SystemId.SOLAR_SYSTEM;

                    // Determine reference point and name based on system
                    let refPoint: THREE.Vector3;
                    let refName: string;
                    let showOrbitalSpeed = false;

                    if (entitySystem === SystemId.QUANTUMANIA) {
                        refPoint = SystemManager.QUANTUMANIA_CENTER;
                        refName = 'Nexus';
                    } else if (entitySystem === SystemId.INTERSTELLAR) {
                        refPoint = SystemManager.SOLAR_SYSTEM_CENTER; // Origin
                        refName = 'Origin';
                    } else {
                        // Solar System
                        refPoint = SystemManager.SOLAR_SYSTEM_CENTER;
                        refName = 'Sun';
                        showOrbitalSpeed = true; // Only show orbital speed for Solar System
                    }

                    const distFromRef = targetPos.distanceTo(refPoint);
                    const distAU = distFromRef / Cosmos.UNITS.AU;
                    const distMillionKm = simulationDistanceToKm(distFromRef) / 1_000_000;

                    const orbitalSpeedKmS = showOrbitalSpeed && distAU > 0.1 ? 30 / Math.sqrt(distAU) : 0;

                    setLockedInfo({
                        name: entity?.label || 'Unknown',
                        orbitalSpeed: Math.round(orbitalSpeedKmS * 10) / 10,
                        refDist: Math.round(distMillionKm),
                        refName,
                        showOrbitalSpeed
                    });
                    setNearestObject(null);
                } else {
                    setLockedInfo(null);

                    // Calculate nearest object for free flight mode
                    // Only include entities from current system + interstellar
                    let closest: { name: string; distance: number } | null = null;
                    let minDist = Infinity;
                    const sysManager = SystemManager.getInstance();
                    const mySystemId = sysManager.currentSystem;

                    entitiesRef.current.forEach(ent => {
                        // Filter to current system + interstellar objects only
                        if (ent.mesh && !ent.isSystemProxy &&
                            (ent.system === mySystemId || ent.system === SystemId.INTERSTELLAR)) {
                            const pos = targetPosition;
                            ent.mesh.getWorldPosition(pos);
                            const dist = camera.position.distanceTo(pos);
                            if (dist < minDist) {
                                minDist = dist;
                                // Convert to display units (thousands of km)
                                const distKm = simulationDistanceToKm(dist);
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
            const invQuat = inverseRotation.copy(camera.quaternion).invert();

            entitiesRef.current.forEach(ent => {
                const blip = radarBlips.get(ent.id);
                if (blip && ent.mesh) {
                    const mySystemId = systemManager.currentSystem;
                    const shouldShow = ent.system === SystemId.INTERSTELLAR ||
                        (ent.system === mySystemId ? !ent.isSystemProxy : ent.isSystemProxy === true);

                    // Apply visibility
                    blip.style.display = shouldShow ? 'block' : 'none';

                    if (!shouldShow) return;

                    const vec = radarVector;
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
        });

        return () => {
            disposed = true;
            stopAnimation();
            resetInput();
            assets.dispose();
            quantumania.dispose();
            cosmicEntity.dispose();
            disposeObject3D(scene);
            radarBlips.clear();
            entitiesRef.current = [];
            lockRef.current = null;
            cameraRef.current = null;
            labelRendererRef.current = null;
            retryAssetsRef.current = () => {};
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('wheel', handleWheel);
            renderer.domElement.removeEventListener('pointerdown', handleMouseDown);
            renderer.domElement.removeEventListener('pointerup', handleMouseUp);
            renderer.domElement.removeEventListener('pointercancel', handleMouseUp);
            renderer.domElement.removeEventListener('lostpointercapture', handleMouseUp);
            renderer.domElement.removeEventListener('pointermove', handleMouseMove);
            renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
            window.removeEventListener('blur', resetInput);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('resize', onWinResize);
            mount.replaceChildren();
            renderer.dispose();
        };
    }, [closeRadar, lockOnTarget, toggleTopView, unlockCamera]);

    useEffect(() => { qualityRef.current = quality; saveQuality(quality); }, [quality]);

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
                    [N] Next Object | [ESC] Unlock<br />
                </span>
            </div>

            <div className="hud-layer" hidden={!showUI} data-ui>
                    {/* Floating UI Layer */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

                        {/* Main UI Container */}
                        <div className="ui-panels-container">
                            {/* Visual Radar Circle */}
                            <button
                                type="button"
                                ref={radarButtonRef}
                                aria-label="Explore objects and settings"
                                aria-expanded={showRadarList}
                                aria-controls="navigation-panels"
                                id="radar-container"
                                className="radar-visual-container"
                                style={{
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    visibility: showUI ? 'visible' : 'hidden'
                                }}
                                onClick={() => setShowRadarList(prev => !prev)}
                                title="Click to Open/Close Object List"
                            >
                                <span className="radar-center" aria-hidden="true"></span>
                            </button>

                            <div id="navigation-panels" className="navigation-panels" hidden={!showRadarList}>

                            {/* Radar Object List Panel */}
                            <RadarObjectList
                                isOpen={showRadarList}
                                entities={entities}
                                currentSystem={currentSystem}
                                lockedEntity={lockedEntity}
                                onLockConfig={lockOnTarget}
                                onToggle={closeRadar}
                            />

                            {/* Settings Panel */}
                            <SettingsPanel
                                isOpen={showRadarList}
                                timeScale={timeScale}
                                onTimeScaleChange={setTimeScale}
                                isPaused={isPaused}
                                onPauseToggle={() => setIsPaused(p => !p)}
                                currentSystem={currentSystem}
                                quality={quality}
                                onQualityChange={setQuality}
                            />
                            </div>
                        </div>

                        {/* Stats HUD */}
                        <div className="stats-hud" style={{ pointerEvents: 'auto' }}>
                            {lockedInfo ? (
                                <>
                                    <div className="stats-hud-title">Locked: {lockedInfo.name}</div>
                                    {lockedInfo.showOrbitalSpeed && (
                                        <div className="stats-hud-row">
                                            <span className="stats-hud-label">Orbital Speed:</span>
                                            <span className="stats-hud-value">{lockedInfo.orbitalSpeed} km/s</span>
                                        </div>
                                    )}
                                    <div className="stats-hud-row">
                                        <span className="stats-hud-label">From {lockedInfo.refName}:</span>
                                        <span className="stats-hud-value">{lockedInfo.refDist}M km</span>
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
                    </div>
            </div>
            {(assetStatus.loading || assetStatus.failed.length > 0) && (
                <div className="asset-status" role="status" data-ui>
                    {assetStatus.loading ? `Loading scenery… ${assetStatus.loaded}/${assetStatus.total}` : 'Some scenery could not load.'}
                    {assetStatus.failed.length > 0 && <button type="button" onClick={() => retryAssetsRef.current()}>Retry loading</button>}
                </div>
            )}
            {sceneError && (
                <div className="scene-error" role="alert" data-ui>
                    <h1>Unable to display the cosmos</h1>
                    <p>{sceneError}</p>
                    <button type="button" onClick={() => window.location.reload()}>Reload</button>
                </div>
            )}
        </div>
    );
}
