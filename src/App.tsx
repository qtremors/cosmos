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
import { Cosmos } from './core/SDK';

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

interface LockTarget {
    mesh: THREE.Object3D;
    distance: number;
    isTop: boolean;
}

interface InputState {
    forward: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    rollLeft: boolean;
    rollRight: boolean;
    boost: boolean;
    pitchUp: boolean;
    pitchDown: boolean;
    yawLeft: boolean;
    yawRight: boolean;
}

// =============================================================================
// APP COMPONENT
// =============================================================================

export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showUI, setShowUI] = useState(true);
    const [showRadarList, setShowRadarList] = useState(false);

    const labelRendererRef = useRef<CSS2DRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const entitiesRef = useRef<EntityInfo[]>([]);
    const radarBlipsRef = useRef<Map<string, HTMLElement>>(new Map());

    // Logic refs
    const lockRef = useRef<LockTarget | null>(null);
    const inputRef = useRef<InputState>({
        forward: false, back: false, left: false, right: false,
        up: false, down: false, rollLeft: false, rollRight: false,
        boost: false, pitchUp: false, pitchDown: false, yawLeft: false, yawRight: false
    });
    const zoomVelocity = useRef(0);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const mouseDelta = useRef({ x: 0, y: 0 });

    // Lock functions exposed via refs instead of window globals
    const lockOnTarget = useRef((mesh: THREE.Object3D, radius: number) => {
        lockRef.current = {
            mesh,
            distance: radius * Cosmos.CAMERA.LOCK_DISTANCE_MULTIPLIER,
            isTop: false
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

    useEffect(() => {
        // --- KEYBOARD HANDLERS ---
        const updateInputKey = (code: string, pressed: boolean) => {
            const s = inputRef.current;
            switch (code) {
                case 'KeyW': s.forward = pressed; break;
                case 'KeyS': s.back = pressed; break;
                case 'KeyA': s.left = pressed; break;
                case 'KeyD': s.right = pressed; break;
                case 'ArrowUp': s.pitchUp = pressed; break;
                case 'ArrowDown': s.pitchDown = pressed; break;
                case 'ArrowLeft': s.yawLeft = pressed; break;
                case 'ArrowRight': s.yawRight = pressed; break;
                case 'KeyR': s.up = pressed; break;
                case 'KeyF': s.down = pressed; break;
                case 'KeyQ': s.rollLeft = pressed; break;
                case 'KeyE': s.rollRight = pressed; break;
                case 'ShiftLeft':
                case 'ShiftRight': s.boost = pressed; break;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            updateInputKey(e.code, true);

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
            updateInputKey(e.code, false);
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

        // --- GAMEPAD POLLING ---
        const pollGamepad = (): Gamepad | null => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            return gamepads[0] ?? null;
        };

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
        ];
        orbitPaths.forEach(path => scene.add(path));

        entitiesRef.current = [
            { mesh: sun, id: 'sun-blip', color: Cosmos.RADAR.COLORS.SUN, label: 'Sun', radius: Cosmos.UNITS.SOLAR_RADIUS * 4 },
            { mesh: mercury, id: 'mercury-blip', color: Cosmos.RADAR.COLORS.MERCURY, label: 'Mercury', radius: 10 },
            { mesh: venus, id: 'venus-blip', color: Cosmos.RADAR.COLORS.VENUS, label: 'Venus', radius: 15 },
            { mesh: earth, id: 'earth-blip', color: Cosmos.RADAR.COLORS.EARTH, label: 'Earth', radius: 15 },
            { mesh: earth.moon, id: 'moon-blip', color: Cosmos.RADAR.COLORS.MOON, label: 'Moon', radius: 5 },
            { mesh: mars, id: 'mars-blip', color: Cosmos.RADAR.COLORS.MARS, label: 'Mars', radius: 12 },
            { mesh: jupiter, id: 'jupiter-blip', color: Cosmos.RADAR.COLORS.JUPITER, label: 'Jupiter', radius: 40 },
            { mesh: jupiter.europa, id: 'europa-blip', color: '#fff', label: 'Europa', radius: 5 },
            { mesh: saturn, id: 'saturn-blip', color: Cosmos.RADAR.COLORS.SATURN, label: 'Saturn', radius: 35 },
            { mesh: saturn.titan, id: 'titan-blip', color: '#e6d4be', label: 'Titan', radius: 6 },
            { mesh: uranus, id: 'uranus-blip', color: Cosmos.RADAR.COLORS.URANUS, label: 'Uranus', radius: 25 },
            { mesh: neptune, id: 'neptune-blip', color: Cosmos.RADAR.COLORS.NEPTUNE, label: 'Neptune', radius: 25 },
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

            // 2. INPUT PROCESSING
            const input = inputRef.current;
            const pad = pollGamepad();
            const deadzone = 0.15;

            let moveFwd = input.forward;
            let moveBack = input.back;
            let moveLeft = input.left;
            let moveRight = input.right;
            let moveUp = input.up;
            let moveDown = input.down;
            let rollL = input.rollLeft;
            let rollR = input.rollRight;
            let doBoost = input.boost;

            // Mouse Look
            if (mouseDelta.current.x !== 0 || mouseDelta.current.y !== 0) {
                const SENSITIVITY = 0.002;
                camera.rotateY(-mouseDelta.current.x * SENSITIVITY);
                camera.rotateX(-mouseDelta.current.y * SENSITIVITY);
                mouseDelta.current.x = 0;
                mouseDelta.current.y = 0;
            }

            // Gamepad input
            if (pad) {
                const ax0 = pad.axes[0];
                const ax1 = pad.axes[1];
                const ax2 = pad.axes[2];
                const ax3 = pad.axes[3];

                if (ax1 < -deadzone) moveFwd = true;
                if (ax1 > deadzone) moveBack = true;
                if (ax0 < -deadzone) moveLeft = true;
                if (ax0 > deadzone) moveRight = true;

                if (pad.buttons[0]?.pressed) moveUp = true;
                if (pad.buttons[1]?.pressed) {
                    if (lockRef.current) {
                        unlockCamera.current();
                    } else {
                        moveDown = true;
                    }
                }

                const RS_SENS = 2.0 * delta;
                if (Math.abs(ax3) > deadzone) camera.rotateX(-ax3 * RS_SENS);
                if (Math.abs(ax2) > deadzone) camera.rotateY(-ax2 * RS_SENS);

                if (pad.buttons[4]?.pressed) rollL = true;
                if (pad.buttons[5]?.pressed) rollR = true;
                if (pad.buttons[7]?.value > 0.5) doBoost = true;

                if (pad.buttons[12]?.pressed) zoomVelocity.current -= 1.0;
                if (pad.buttons[13]?.pressed) zoomVelocity.current += 1.0;
            }

            // Auto-Unlock on Move
            if ((moveFwd || moveBack || moveLeft || moveRight || moveUp || moveDown) && lockRef.current) {
                unlockCamera.current();
            }

            // APPLY TO CAMERA
            if (!lockRef.current) {
                const speed = (doBoost ? Cosmos.CONTROLS.FLY_SPEED * Cosmos.CONTROLS.BOOST_MULTIPLIER : Cosmos.CONTROLS.FLY_SPEED) * delta;
                const rotSpeed = Cosmos.CONTROLS.ROLL_SPEED * delta;

                if (moveFwd) camera.translateZ(-speed);
                if (moveBack) camera.translateZ(speed);
                if (moveLeft) camera.translateX(-speed);
                if (moveRight) camera.translateX(speed);
                if (moveUp) camera.translateY(speed);
                if (moveDown) camera.translateY(-speed);

                const lookSpeed = rotSpeed * 0.5;
                if (input.pitchUp) camera.rotateX(lookSpeed);
                if (input.pitchDown) camera.rotateX(-lookSpeed);
                if (input.yawLeft) camera.rotateY(lookSpeed);
                if (input.yawRight) camera.rotateY(-lookSpeed);

                if (rollL) camera.rotateZ(rotSpeed);
                if (rollR) camera.rotateZ(-rotSpeed);

                if (Math.abs(zoomVelocity.current) > 0.01) {
                    camera.translateZ(zoomVelocity.current * delta * 10.0);
                    zoomVelocity.current *= 0.9;
                }

            } else if (lockRef.current.mesh) {
                const target = lockRef.current.mesh;
                const targetPos = new THREE.Vector3();
                target.getWorldPosition(targetPos);

                lockRef.current.distance += zoomVelocity.current * delta * 50;
                zoomVelocity.current *= 0.9;

                const minD = Cosmos.getObjectRadius(target) * 1.5;
                lockRef.current.distance = Math.max(minD, lockRef.current.distance);

                const dist = lockRef.current.distance;
                const offset = new THREE.Vector3();

                if (lockRef.current.isTop) {
                    offset.set(0, dist, 0);
                    camera.up.set(0, 0, -1);
                } else {
                    const c = Cosmos.CAMERA.CHASE_OFFSET;
                    offset.set(dist * c.X, dist * c.Y, dist * c.Z);
                    camera.up.set(0, 1, 0);
                }

                const desiredPos = targetPos.clone().add(offset);
                camera.position.lerp(desiredPos, Cosmos.CAMERA.LERP_FACTOR);
                camera.lookAt(targetPos);
            }

            renderer.render(scene, camera);

            // Toggle labels visibility
            if (labelRendererRef.current) {
                labelRendererRef.current.domElement.style.display = showLabels ? 'block' : 'none';
            }
            labelRenderer.render(scene, camera);

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

            {showUI && (
                <>
                    <div
                        id="radar-container"
                        className="radar-container"
                        style={{ cursor: 'pointer', pointerEvents: 'auto', zIndex: 1000 }}
                        onClick={() => setShowRadarList(prev => !prev)}
                        title="Click to Open/Close Object List"
                    >
                        <div className="radar-center"></div>
                    </div>

                    {showRadarList && (
                        <div className="radar-list" style={{ zIndex: 1001 }}>
                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>LOCK ON:</div>
                            {entitiesRef.current.map((ent) => (
                                <div
                                    key={ent.id}
                                    className="radar-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        lockOnTarget.current(ent.mesh, ent.radius);
                                    }}
                                    style={{ borderLeft: `3px solid ${ent.color}` }}
                                >
                                    {ent.label}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
