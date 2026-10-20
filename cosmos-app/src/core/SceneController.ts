import { MIN_DATE, MAX_DATE } from './Ephemeris';
import { createWorld } from './World';
import { FrameProfiler, resourceEstimates, type PerformanceSnapshot } from './Performance';
import { orbitalSpeedKmS } from './OrbitalMechanics';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from './SDK';
import { SystemManager, SystemId } from './SystemManager';
import {
    LockTarget,
    createInputState,
    updateInputKey,
    pollGamepad,
    applyInputToCamera
} from './InputHandler';
import { EntityCategory, type EntityInfo } from './Entity';
import { startAnimationLoop, disposeObject3D } from './SceneLifecycle';
import { SceneAssets, type AssetStatus } from './SceneAssets';
import { QUALITY_PRESETS, type QualityLevel } from './Quality';
import { simulationDistanceToKm, VISIBILITY } from './Simulation';
import { projectRadarPoint } from './Radar';
import { sceneExposure } from './Lighting';
import { JetFlight, type JetFlightState } from './JetFlight';
import type { JetStatus } from './JetConfig';


export interface LockedInfo {
    name: string; orbitalSpeed: number; refDist: number; refName: string; showOrbitalSpeed: boolean; viewDistanceKm: number;
}
export interface SceneSettings {
    jetEnabled?: boolean;
    quality: QualityLevel; showLabels: boolean; timeScale: number; paused: boolean; darkSideFill: number; diagnostics: boolean; epoch: number; showOrbits: boolean; fiction: boolean; autoExposure: boolean;
}
export interface SceneOptions extends SceneSettings {
    onJetEnabled?: (enabled: boolean) => void;
    onJetStatus?: (status: JetStatus) => void;
    onJetFlight?: (state: JetFlightState) => void;
    onDate: (date: string) => void;
    radarButton: HTMLButtonElement | null;
    onAssets: (status: AssetStatus) => void;
    onError: (error: string) => void;
    onEntities: (entities: EntityInfo[]) => void;
    onSpeed: (speed: number) => void;
    onLockedInfo: (info: LockedInfo | null) => void;
    onNearest: (nearest: { name: string; distance: number } | null) => void;
    onSystem: (name: string) => void;
    onLock: (entity: EntityInfo | null) => void;
    onCloseRadar: () => void;
    onToggleLabels: () => void;
    onToggleHUD: () => void;
    onPerformance: (snapshot: PerformanceSnapshot) => void;
}
export type SceneController = ReturnType<typeof createSceneController>;

/** Owns the renderer, simulation, inputs, assets and teardown independently of React. */
export function createSceneController(mount: HTMLDivElement, options: SceneOptions) {
    const cleanup: (() => void)[] = [];
    try {
        const controller = initializeSceneController(mount, options, cleanup);
        cleanup.length = 0;
        return controller;
    } catch (error) {
        for (const release of cleanup.reverse()) {
            try { release(); } catch { /* Preserve the original initialization error. */ }
        }
        throw error;
    }
}

function initializeSceneController(mount: HTMLDivElement, options: SceneOptions, cleanup: (() => void)[]) {
    let disposed = false;
    cleanup.push(() => { disposed = true; });
    const cell = <T,>(current: T) => ({ current });
    const mountRef = cell(mount);
    const radarButtonRef = cell(options.radarButton);
    const qualityRef = cell(options.quality);
    const showOrbitsRef = cell(options.showOrbits);
    const fictionRef = cell(options.fiction);
    const autoExposureRef = cell(options.autoExposure);
    let epoch = options.epoch;
    let simTime = epoch;
    const minTime = Date.parse(MIN_DATE) / 1000;
    const maxTime = Date.parse(MAX_DATE) / 1000;
    const showLabelsRef = cell(options.showLabels);
    const timeScaleRef = cell(options.timeScale);
    const isPausedRef = cell(options.paused);
    const labelRendererRef = cell<CSS2DRenderer | null>(null);
    const cameraRef = cell<THREE.PerspectiveCamera | null>(null);
    const entitiesRef = cell<EntityInfo[]>([]);
    const radarBlipsRef = cell(new Map<string, HTMLElement>());
    const lockRef = cell<LockTarget | null>(null);
    const lastLockPosition = new THREE.Vector3();
    const inputRef = cell(createInputState());
    const keyboardCodes = new Set<string>();
    const touchCodes = new Set<string>();
    const setKey = (code: string, pressed: boolean, source = touchCodes) => {
        if (pressed) source.add(code); else source.delete(code);
        updateInputKey(inputRef.current, code, keyboardCodes.has(code) || touchCodes.has(code));
    };
    const darkSideFillRef = cell(options.darkSideFill);
    const diagnosticsRef = cell(options.diagnostics);
    const profiler = new FrameProfiler();
    let profileElapsed = 0;
    const lastWallUpdate = cell(performance.now());
    const zoomVelocity = cell(0);
    const isDragging = cell(false);
    const lastMouse = cell({ x: 0, y: 0 });
    const mouseDelta = cell({ x: 0, y: 0 });
    const lastCameraPos = cell(new THREE.Vector3());
    const teleportIndexRef = cell(0);
    const retryAssetsRef = cell(() => {});
    const jet = new JetFlight(options.onJetStatus);
    cleanup.push(() => jet.dispose());
    let jetEnabled = false;
    const setJetEnabled = (enabled: boolean) => {
        if (jetEnabled === enabled || !cameraRef.current) return;
        jetEnabled = enabled;
        resetInput();
        if (enabled) {
            unlockCamera();
            jet.enter(cameraRef.current);
            void jet.load(assets);
        } else jet.leave(cameraRef.current);
        options.onJetEnabled?.(enabled);
        options.onJetFlight?.({ throttle: 0, boosting: false });
        mount.querySelector('canvas')?.focus();
        lastCameraPos.current.copy(cameraRef.current.position);
        setCameraSpeed(0);
    };
    const { onAssets: setAssetStatus, onError: setSceneError, onEntities: setEntities,
        onSpeed: setCameraSpeed, onLockedInfo: setLockedInfo, onNearest: setNearestObject,
        onSystem: setCurrentSystem, onLock: setLockedEntity, onCloseRadar: closeRadar } = options;
    const lockOnTarget = (entity: EntityInfo) => {
        setJetEnabled(false);
        const { mesh, radius } = entity;
        const camera = cameraRef.current;
        if (!camera) return;
        resetInput();
        const targetPos = mesh.getWorldPosition(new THREE.Vector3());
        lastLockPosition.copy(targetPos);
        const relative = entity.viewDirection?.clone() ?? camera.position.clone().sub(targetPos);
        const distance = Math.max(relative.length(), 1e-6);
        lockRef.current = {
            mesh,
            entityId: entity.id,
            distance: radius * (entity.system === SystemId.QUANTUMANIA ? 1.5 : Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER),
            isTop: false,
            theta: Math.atan2(relative.x, relative.z),
            phi: Math.asin(THREE.MathUtils.clamp(relative.y / distance, -1, 1)),
        };
        // Instant navigation avoids spending minutes approaching a millimetric target.
        const lock = lockRef.current;
        camera.position.copy(targetPos).add(new THREE.Vector3(Math.cos(lock.phi) * Math.sin(lock.theta), Math.sin(lock.phi), Math.cos(lock.phi) * Math.cos(lock.theta)).multiplyScalar(lock.distance));
        camera.up.set(0, 1, 0); camera.lookAt(targetPos);
        camera.near = Math.max(1e-8, Math.min(1, radius * 0.02)); camera.updateProjectionMatrix();
        lastCameraPos.current.copy(camera.position); setCameraSpeed(0);
        setLockedEntity(entity);
        closeRadar();
        mountRef.current?.querySelector('canvas')?.focus();
    };

    const unlockCamera = () => {
        lockRef.current = null;
        setLockedEntity(null);
    };

    const toggleTopView = (camera: THREE.PerspectiveCamera) => {
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
    };

    const resetView = () => {
        const camera = cameraRef.current;
        if (!camera) return;
        setJetEnabled(false);
        unlockCamera();
        resetInput();
        statsElapsed = 0;
        camera.position.set(0, 500, 800); camera.lookAt(0, 0, 0);
        lastCameraPos.current.copy(camera.position);
        setCameraSpeed(0);
        closeRadar();
        mount.querySelector('canvas')?.focus();
        profiler.reset();
    };

    const radarBlips = radarBlipsRef.current;
    const assets = new SceneAssets(setAssetStatus);
    cleanup.push(() => assets.dispose());
    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    } catch {
        assets.dispose();
        jet.dispose();
        queueMicrotask(() => { if (!disposed) setSceneError('Your browser could not start the 3D view. Try enabling hardware acceleration or using another browser.'); });
        return { dispose() { disposed = true; }, lock() {}, unlock() {}, retry() {}, configure() {}, key() {}, resetView() {} };
    }
    cleanup.push(() => renderer.dispose());
    const resetInput = () => {
        inputRef.current = createInputState();
        keyboardCodes.clear(); touchCodes.clear();
        jet.halt();
        isDragging.current = false;
        mouseDelta.current.x = mouseDelta.current.y = 0;
        zoomVelocity.current = 0;
    };
    const handleVisibility = () => { if (document.hidden) resetInput(); profiler.reset(); lastWallUpdate.current = performance.now(); };
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.defaultPrevented) return;
        const target = e.target;
        const flightKey = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyR', 'KeyF', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
        const editing = target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]');
        const rangeFlightKey = target instanceof HTMLInputElement && target.type === 'range'
            && (flightKey || e.code === 'KeyJ') && !e.code.startsWith('Arrow');
        if (editing && !rangeFlightKey) return;
        if (e.code === 'Home') { e.preventDefault(); resetView(); return; }
        if (e.key === 'Escape') {
            if (radarButtonRef.current?.getAttribute('aria-expanded') === 'true') closeRadar();
            else if (jetEnabled) setJetEnabled(false);
            else unlockCamera();
            return;
        }
        const inUI = target instanceof HTMLElement && target.closest('[data-ui]');
        // Buttons keep native Space/Enter activation; flight keys still work after panel clicks.
        if (inUI && !rangeFlightKey && !flightKey && !['KeyJ', 'KeyH', 'KeyL'].includes(e.code)) return;
        if (e.code === 'KeyJ' && !e.repeat) { e.preventDefault(); setJetEnabled(!jetEnabled); return; }
        setKey(e.code, true, keyboardCodes);
        if (flightKey && !e.code.startsWith('Shift') && inUI && target instanceof HTMLButtonElement) renderer.domElement.focus();
        if (flightKey) e.preventDefault();

        if (e.code === 'KeyN' && !e.repeat) {
            e.preventDefault();

            // Get entities for current system (excluding proxies)
            const manager = SystemManager.getInstance();
            const activeSystem = manager.currentSystem;

            const systemEntities = entitiesRef.current.filter(ent =>
                ent.system === activeSystem && !ent.isSystemProxy && (fictionRef.current || (ent.system === SystemId.SOLAR_SYSTEM && ent.category !== EntityCategory.EASTER_EGG))
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
        if (e.key.toLowerCase() === 'l') options.onToggleLabels();
        if (e.key.toLowerCase() === 'h') options.onToggleHUD();
        if (e.key.toLowerCase() === 't' && cameraRef.current) {
            setJetEnabled(false);
            toggleTopView(cameraRef.current);
        }
    };



    const handleKeyUp = (e: KeyboardEvent) => {
        setKey(e.code, false, keyboardCodes);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetInput);
    document.addEventListener('visibilitychange', handleVisibility);
    cleanup.push(() => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', resetInput);
        document.removeEventListener('visibilitychange', handleVisibility);
    });

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
    cleanup.push(() => window.removeEventListener('wheel', handleWheel));

    const scene = new THREE.Scene();
    cleanup.push(() => disposeObject3D(scene));
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.001, 300000);
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

    // LABELS
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    cleanup.push(() => mount.replaceChildren());
    mount.replaceChildren(renderer.domElement, labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    camera.layers.enable(0);
    camera.layers.enable(1);
    camera.layers.enable(2);

    const {
        sun, stars, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto,
        belt, kuiperBelt, dwarfPlanets, explorer, theKyln, solarHeliosphere, solarBeacon, quantumania, orbitPaths,
        alienX, blackHole, cosmicEntity, renderWorld, entities,
    } = createWorld(scene, assets);
    scene.add(jet.scene);
    cleanup.push(() => { quantumania.dispose(); cosmicEntity.dispose(); });
    entitiesRef.current = entities;
    SystemManager.getInstance().updateCurrentSystem(camera.position);

    queueMicrotask(() => { if (!disposed) setEntities(entitiesRef.current.filter(entity => fictionRef.current || (entity.system === SystemId.SOLAR_SYSTEM && entity.category !== EntityCategory.EASTER_EGG))); });

    // RADAR INIT - Cache DOM references
    const radarContainer = document.getElementById('radar-container');
    const radarViewport = radarContainer?.querySelector<HTMLElement>('.radar-viewport');
    cleanup.push(() => { radarBlips.forEach(blip => blip.remove()); radarBlips.clear(); });
    if (radarContainer && radarViewport) {
        // Clear only blips (not the radar-center which is in JSX)
        const existingBlips = radarContainer.querySelectorAll('.radar-blip');
        existingBlips.forEach(blip => blip.remove());

        entitiesRef.current.forEach(ent => {
            if (!ent.mesh) return;
            const b = document.createElement('span');
            b.id = ent.id;
            b.className = 'radar-blip';
            b.style.backgroundColor = ent.color;
            b.title = ent.label;
            radarViewport.appendChild(b);
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
    cleanup.push(() => {
        renderer.domElement.removeEventListener('pointerdown', handleMouseDown);
        renderer.domElement.removeEventListener('pointerup', handleMouseUp);
        renderer.domElement.removeEventListener('pointercancel', handleMouseUp);
        renderer.domElement.removeEventListener('lostpointercapture', handleMouseUp);
        renderer.domElement.removeEventListener('pointermove', handleMouseMove);
    });

    const onWinResize = () => {
        if (cameraRef.current) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWinResize);
    cleanup.push(() => window.removeEventListener('resize', onWinResize));

    let elapsedTime = 0;
    let statsElapsed = 0;
    let appliedQuality: QualityLevel | null = null;
    const targetPosition = new THREE.Vector3();
    const referencePosition = new THREE.Vector3();
    const radarVector = new THREE.Vector3();
    const inverseRotation = new THREE.Quaternion();
    lastCameraPos.current.copy(camera.position);
    const solarObjects = [sun, mercury, venus, earth, mars, belt, kuiperBelt, jupiter, saturn, uranus, neptune, pluto, ...dwarfPlanets];
    const planetPositions = [mercury.position, venus.position, earth.position, mars.position, jupiter.position, saturn.position, uranus.position, neptune.position, pluto.position];
    const onContextLost = (event: Event) => {
        event.preventDefault();
        stopAnimation();
        setSceneError('The 3D view lost its graphics connection. Reload to continue exploring.');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    cleanup.push(() => renderer.domElement.removeEventListener('webglcontextlost', onContextLost));
    retryAssetsRef.current = () => {
        assets.retryTextures();
        quantumania.retryFailedModels();
        cosmicEntity.retryFailedModels();
        if (jetEnabled) void jet.load(assets);
    };
    if (options.jetEnabled) setJetEnabled(true);
    const stopAnimation = startAnimationLoop(delta => {
        const frameStart = performance.now();
        const wallDelta = Math.max(0, (frameStart - lastWallUpdate.current) / 1000);
        lastWallUpdate.current = frameStart;
        const animationDelta = isPausedRef.current ? 0 : delta;
        elapsedTime += animationDelta;
        statsElapsed += wallDelta;
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
            kuiperBelt.setCount(Math.round(preset.asteroids / 4));
            stars.setCount(preset.stars);
            blackHole.setRaySteps(preset.raySteps);
        }

        if (!isPausedRef.current) simTime = Math.min(maxTime, Math.max(minTime, simTime + wallDelta * timeScaleRef.current));
        const time = simTime;



        // Visibility rules (LOD):
        // 1. Solar System
        // Show if:
        // - Inside Solar Radius
        // - Inside the extended solar visibility range
        // - Locked onto any Solar object
        const sunDist = camera.position.distanceTo(SystemManager.SOLAR_SYSTEM_CENTER);
        const lockedEntity = lockRef.current?.mesh ? entitiesRef.current.find(e => e.id === lockRef.current?.entityId) : null;
        const isLockedToSolar = lockedEntity?.system === SystemId.SOLAR_SYSTEM;

        const showSolarSystem = (sunDist < VISIBILITY.SOLAR_RANGE) || isLockedToSolar;

        // Toggle Solar System (3D Objects vs Beacon)
        solarObjects.forEach(obj => obj.visible = showSolarSystem);
        orbitPaths.forEach(p => { p.update(time); p.visible = showSolarSystem && showOrbitsRef.current; });

        solarBeacon.update(camera.position);

        // Heliosphere Visibility Rule: Hide when locked onto an object inside the system
        // (Enforced after update call below)

        // 2. Quantumania System
        const nexusDist = camera.position.distanceTo(SystemManager.QUANTUMANIA_CENTER);
        const isLockedToQuantum = lockedEntity?.system === SystemId.QUANTUMANIA;

        // Show if close (Radius + 500 buffer) OR locked onto it
        const showQuantumania = fictionRef.current && ((nexusDist < SystemManager.QUANTUMANIA_RADIUS + VISIBILITY.QUANTUMANIA_BUFFER) || isLockedToQuantum);

        // Hide Quantumania heliosphere if locked onto an object inside it (except proxy)
        // (Enforced after update call below)

        // Keep ephemerides current so distant selections/date jumps use the correct state.
        {
            sun.update(time, camera, elapsedTime);
            mercury.update(time, camera);
            venus.update(time, camera);
            earth.update(time, camera);
            mars.update(time, camera);
            belt.update(time);
            kuiperBelt.update(time);
            jupiter.update(time, camera);
            saturn.update(time, camera);
            uranus.update(time, camera);
            neptune.update(time, camera);
            pluto.update(time, camera);
            for (const dwarf of dwarfPlanets) dwarf.update(time);
            explorer.visible = theKyln.visible = fictionRef.current && showSolarSystem;
            explorer.update(time, camera, isPausedRef.current ? 0 : delta);
            theKyln.update(time, camera, animationDelta, elapsedTime);
        }
        solarHeliosphere.update(time, camera);
        if (!fictionRef.current || !showSolarSystem || isLockedToSolar) {
            solarHeliosphere.visible = false;
        }

        // Update Quantumania system (pass visibility flag)
        quantumania.setVisible(showQuantumania);
        quantumania.visible = fictionRef.current;
        if (fictionRef.current) quantumania.update(time, camera, elapsedTime);
        quantumania.updateResidency(wallDelta);

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
        if (fictionRef.current) cosmicEntity.update(time, camera, elapsedTime, animationDelta);
        else cosmicEntity.suspend();
        alienX.visible = blackHole.visible = fictionRef.current;
        stars.position.copy(camera.position);
        for (const object of solarObjects) object.traverse(child => { if (child.userData.orbitGuide) child.visible = showOrbitsRef.current; });
        cosmicEntity.updateResidency(wallDelta);

        // Follow the target's translation exactly, including large time/date changes.
        // Camera smoothing then affects only the relative orbit, not orbital tracking.
        if (lockRef.current?.mesh) {
            lockRef.current.mesh.getWorldPosition(targetPosition);
            camera.position.add(referencePosition.copy(targetPosition).sub(lastLockPosition));
            lastLockPosition.copy(targetPosition);
        }

        // 2. INPUT PROCESSING
        if (touchCodes.has('ZoomIn')) zoomVelocity.current -= 60 * delta;
        if (touchCodes.has('ZoomOut')) zoomVelocity.current += 60 * delta;
        // Travel speed and near clipping follow local physical dimensions.
        let clearance = Infinity;
        for (const entity of entitiesRef.current) {
            if (entity.isSystemProxy || !entity.mesh.visible || !('radius' in entity.mesh)) continue;
            entity.mesh.getWorldPosition(targetPosition);
            clearance = Math.min(clearance, Math.max(Number(entity.mesh.radius) * 0.1, camera.position.distanceTo(targetPosition) - Number(entity.mesh.radius)));
        }
        const flightSpeed = Math.max(1e-6, Math.min(Cosmos.CONTROLS.FLY_SPEED, clearance * 0.5));
        camera.near = Math.max(1e-8, Math.min(1, clearance * 0.01)); camera.updateProjectionMatrix();
        const pad = pollGamepad();
        if (jetEnabled) jet.update(camera, delta, inputRef.current, mouseDelta.current, zoomVelocity, pad, flightSpeed);
        const isMoving = !jetEnabled && applyInputToCamera(
            camera,
            inputRef.current,
            delta,
            mouseDelta.current,
            zoomVelocity,
            lockRef.current,
            pad, flightSpeed
        );

        // Auto-Unlock on Move
        if (isMoving && lockRef.current) {
            unlockCamera();
        }

        renderer.toneMappingExposure = sceneExposure(camera.position, entitiesRef.current, lockedEntity ?? null, showSolarSystem, autoExposureRef.current);
        // Keep the visibility aid stable as exposure compensates for weaker sunlight.
        const fill = darkSideFillRef.current / renderer.toneMappingExposure;
        renderWorld.fill.intensity = fill;
        earth.setDarkSideFill(fill);
        renderWorld.render(renderer, camera, showSolarSystem, showQuantumania);
        if (jetEnabled) renderer.render(jet.scene, camera);

        // Toggle labels visibility
        if (labelRendererRef.current) {
            labelRendererRef.current.domElement.style.display = showLabelsRef.current ? 'block' : 'none';
        }
        labelRenderer.render(scene, camera);

        // STATS HUD UPDATE (throttled to avoid excessive re-renders)
        if (statsElapsed >= 1 / 6) {
            options.onDate(new Date(simTime * 1000).toISOString());
            const speedKmS = jetEnabled ? jet.speedKmS : simulationDistanceToKm(camera.position.distanceTo(lastCameraPos.current)) / statsElapsed;
            statsElapsed = 0;
            lastCameraPos.current.copy(camera.position);
            setCameraSpeed(jetEnabled ? Number(speedKmS.toFixed(2)) : Math.round(speedKmS));
            if (jetEnabled) options.onJetFlight?.({ throttle: jet.throttle, boosting: jet.boosting });

            // Update locked object info
            if (lockRef.current?.mesh) {
                const targetPos = targetPosition;
                lockRef.current.mesh.getWorldPosition(targetPos);

                // Find entity to determine which system it belongs to
                const entity = entitiesRef.current.find(e => e.id === lockRef.current?.entityId);
                const entitySystem = entity?.system || SystemId.SOLAR_SYSTEM;

                const orbit = entity?.mesh.userData.orbit;
                const hasOrbit = orbit && typeof orbit.axisKm === 'number' && typeof orbit.periodDays === 'number';
                const refName = hasOrbit ? orbit.parent : entitySystem === SystemId.QUANTUMANIA ? 'Nexus (visual scale)' : 'Origin (visual scale)';
                const refPoint = referencePosition;
                if (hasOrbit && entity?.category === EntityCategory.MOON && entity.mesh.parent) entity.mesh.parent.getWorldPosition(refPoint);
                else refPoint.copy(entitySystem === SystemId.QUANTUMANIA ? SystemManager.QUANTUMANIA_CENTER : SystemManager.SOLAR_SYSTEM_CENTER);
                const visualDistance = targetPos.distanceTo(refPoint);
                const physicalDistance = hasOrbit ? visualDistance / orbit.visualAxis * orbit.axisKm : simulationDistanceToKm(visualDistance);
                const speed = hasOrbit ? (orbit.speedKmS ?? orbitalSpeedKmS(orbit.axisKm, orbit.periodDays, physicalDistance)) : 0;
                setLockedInfo({
                    name: entity?.label || 'Unknown',
                    orbitalSpeed: Math.round(speed * 100) / 100,
                    refDist: Math.round(physicalDistance / 1000) / 1000,
                    refName,
                    showOrbitalSpeed: Boolean(hasOrbit),
                    viewDistanceKm: simulationDistanceToKm(camera.position.distanceTo(targetPos)),
                });
            } else {
                setLockedInfo(null);
            }

            // Keep nearest-object distance available in both flight and orbit views.
            let closest: { name: string; distance: number } | null = null;
            let minDist = Infinity;
            const sysManager = SystemManager.getInstance();
            const mySystemId = sysManager.currentSystem;
            const observerPosition = jetEnabled ? jet.position : camera.position;

            entitiesRef.current.forEach(ent => {
                // Filter to current system + interstellar objects only
                if (ent.mesh && !ent.isSystemProxy && (fictionRef.current || (ent.system === SystemId.SOLAR_SYSTEM && ent.category !== EntityCategory.EASTER_EGG)) &&
                    (ent.system === mySystemId || ent.system === SystemId.INTERSTELLAR)) {
                    const pos = targetPosition;
                    ent.mesh.getWorldPosition(pos);
                    const dist = observerPosition.distanceTo(pos);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = {
                            name: ent.label,
                            distance: Math.round(simulationDistanceToKm(dist))
                        };
                    }
                }
            });
            setNearestObject(closest);
        }

        // RADAR UPDATE (using cached DOM refs)
        const range = Cosmos.RADAR.RANGE;
        const invQuat = inverseRotation.copy(camera.quaternion).invert();

        entitiesRef.current.forEach(ent => {
            const blip = radarBlips.get(ent.id);
            if (blip && ent.mesh) {
                const mySystemId = systemManager.currentSystem;
                const allowed = fictionRef.current || (ent.system === SystemId.SOLAR_SYSTEM && ent.category !== EntityCategory.EASTER_EGG);
                const shouldShow = allowed && (ent.system === SystemId.INTERSTELLAR ||
                    (ent.system === mySystemId ? !ent.isSystemProxy : ent.isSystemProxy === true));

                // Apply visibility
                blip.style.display = shouldShow ? 'block' : 'none';

                if (!shouldShow) return;

                const vec = radarVector;
                ent.mesh.getWorldPosition(vec);
                vec.sub(camera.position);
                vec.applyQuaternion(invQuat);
                const point = projectRadarPoint(vec.x, vec.z, range);
                if (!point) { blip.style.display = 'none'; return; }
                blip.style.left = `${point.x}%`;
                blip.style.top = `${point.y}%`;
                blip.classList.toggle('selected', ent.id === lockRef.current?.entityId);
            }
        });
        if (diagnosticsRef.current) {
            profiler.record(frameStart, performance.now() - frameStart);
            profileElapsed += wallDelta;
            if (profileElapsed >= 1) {
                profileElapsed = 0;
                const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
                options.onPerformance({
                    quality: qualityRef.current, system: systemManager.getCurrentSystemName(),
                    ...profiler.timings(), ...resourceEstimates(scene),
                    drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
                    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
                    programs: renderer.info.programs?.length ?? 0,
                    jsHeapMiB: heap ? Math.round(heap.usedJSHeapSize / 1048576 * 100) / 100 : null,
                    ...assets.metrics,
                    modelParseMs: Math.round(assets.metrics.modelParseMs * 100) / 100,
                    modelParseMaxMs: Math.round(assets.metrics.modelParseMaxMs * 100) / 100,
                    residentModels: [...quantumania.getEntities()].filter(entity => 'loaded' in entity.mesh && entity.mesh.loaded).length + cosmicEntity.residentModelCount,
                    cameraPosition: camera.position.toArray(), simulationTime: simTime,
                    dateUTC: new Date(simTime * 1000).toISOString(), cameraNear: camera.near,
                    lockedTargetPosition: lockRef.current?.mesh?.getWorldPosition(targetPosition).toArray() ?? null,
                });
            }
        }
    });

    cleanup.push(stopAnimation);
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        stopAnimation();
        resetInput();
        assets.dispose();
        quantumania.dispose();
        cosmicEntity.dispose();
        jet.dispose();
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
    return {
        dispose,
        lock: lockOnTarget,
        unlock: unlockCamera,
        retry: () => retryAssetsRef.current(),
        configure: (settings: SceneSettings) => {
            setJetEnabled(settings.jetEnabled ?? false);
            if (qualityRef.current !== settings.quality || diagnosticsRef.current !== settings.diagnostics) profiler.reset();
            diagnosticsRef.current = settings.diagnostics;
            qualityRef.current = settings.quality;
            showLabelsRef.current = settings.showLabels;
            timeScaleRef.current = settings.timeScale;
            isPausedRef.current = settings.paused;
            darkSideFillRef.current = settings.darkSideFill;
            autoExposureRef.current = settings.autoExposure;
            showOrbitsRef.current = settings.showOrbits;
            if (settings.epoch !== epoch) { epoch = settings.epoch; simTime = Math.min(maxTime, Math.max(minTime, epoch)); }
            if (settings.fiction !== fictionRef.current) {
                fictionRef.current = settings.fiction;
                setEntities(entities.filter(entity => settings.fiction || (entity.system === SystemId.SOLAR_SYSTEM && entity.category !== EntityCategory.EASTER_EGG)));
                if (!settings.fiction && lockRef.current) {
                    const locked = entities.find(entity => entity.id === lockRef.current?.entityId);
                    if (locked?.system !== SystemId.SOLAR_SYSTEM || locked.category === EntityCategory.EASTER_EGG) resetView();
                }
            }
        },
        key: setKey,
        resetView,
    };
}
