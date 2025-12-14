import * as THREE from 'three';
import { Cosmos } from './SDK';

// =============================================================================
// TYPES
// =============================================================================

export interface InputState {
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

export interface LockTarget {
    mesh: THREE.Object3D;
    distance: number;
    isTop: boolean;
    theta: number;  // Horizontal orbit angle (radians)
    phi: number;    // Vertical orbit angle (radians)
}

// =============================================================================
// INPUT HANDLER
// =============================================================================

export function createInputState(): InputState {
    return {
        forward: false, back: false, left: false, right: false,
        up: false, down: false, rollLeft: false, rollRight: false,
        boost: false, pitchUp: false, pitchDown: false, yawLeft: false, yawRight: false
    };
}

export function updateInputKey(state: InputState, code: string, pressed: boolean): void {
    switch (code) {
        case 'KeyW': state.forward = pressed; break;
        case 'KeyS': state.back = pressed; break;
        case 'KeyA': state.left = pressed; break;
        case 'KeyD': state.right = pressed; break;
        case 'ArrowUp': state.pitchUp = pressed; break;
        case 'ArrowDown': state.pitchDown = pressed; break;
        case 'ArrowLeft': state.yawLeft = pressed; break;
        case 'ArrowRight': state.yawRight = pressed; break;
        case 'KeyR': state.up = pressed; break;
        case 'KeyF': state.down = pressed; break;
        case 'KeyQ': state.rollLeft = pressed; break;
        case 'KeyE': state.rollRight = pressed; break;
        case 'ShiftLeft':
        case 'ShiftRight': state.boost = pressed; break;
    }
}

export function pollGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return gamepads[0] ?? null;
}

// =============================================================================
// CAMERA CONTROLLER
// =============================================================================

export function applyInputToCamera(
    camera: THREE.PerspectiveCamera,
    input: InputState,
    delta: number,
    mouseDelta: { x: number; y: number },
    zoomVelocity: { current: number },
    lockTarget: LockTarget | null,
    gamepad: Gamepad | null
): boolean {
    const DEADZONE = 0.15;
    const SENSITIVITY = 0.002;

    let moveFwd = input.forward;
    let moveBack = input.back;
    let moveLeft = input.left;
    let moveRight = input.right;
    let moveUp = input.up;
    let moveDown = input.down;
    let rollL = input.rollLeft;
    let rollR = input.rollRight;
    let doBoost = input.boost;

    // Mouse Look / Orbit (only apply in free flight, not in lock mode - handled separately)
    let orbitX = 0;
    let orbitY = 0;
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
        if (!lockTarget) {
            camera.rotateY(-mouseDelta.x * SENSITIVITY);
            camera.rotateX(-mouseDelta.y * SENSITIVITY);
        } else {
            // Store for orbit control
            orbitX = mouseDelta.x * SENSITIVITY;
            orbitY = mouseDelta.y * SENSITIVITY;
        }
        mouseDelta.x = 0;
        mouseDelta.y = 0;
    }

    // Gamepad input
    if (gamepad) {
        const ax0 = gamepad.axes[0];
        const ax1 = gamepad.axes[1];
        const ax2 = gamepad.axes[2];
        const ax3 = gamepad.axes[3];

        if (ax1 < -DEADZONE) moveFwd = true;
        if (ax1 > DEADZONE) moveBack = true;
        if (ax0 < -DEADZONE) moveLeft = true;
        if (ax0 > DEADZONE) moveRight = true;

        if (gamepad.buttons[0]?.pressed) moveUp = true;
        if (gamepad.buttons[1]?.pressed) moveDown = true;

        const RS_SENS = 2.0 * delta;
        if (Math.abs(ax3) > DEADZONE) camera.rotateX(-ax3 * RS_SENS);
        if (Math.abs(ax2) > DEADZONE) camera.rotateY(-ax2 * RS_SENS);

        if (gamepad.buttons[4]?.pressed) rollL = true;
        if (gamepad.buttons[5]?.pressed) rollR = true;
        if (gamepad.buttons[7]?.value > 0.5) doBoost = true;

        if (gamepad.buttons[12]?.pressed) zoomVelocity.current -= 1.0;
        if (gamepad.buttons[13]?.pressed) zoomVelocity.current += 1.0;
    }

    // Check if any movement key is pressed (for auto-unlock)
    const isMoving = moveFwd || moveBack || moveLeft || moveRight || moveUp || moveDown;

    // Apply to camera (free flight mode)
    if (!lockTarget) {
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
    } else if (lockTarget.mesh) {
        // Lock-on mode with orbital camera
        const targetPos = new THREE.Vector3();
        lockTarget.mesh.getWorldPosition(targetPos);

        // Apply zoom
        lockTarget.distance += zoomVelocity.current * delta * 50;
        zoomVelocity.current *= 0.9;

        const minD = Cosmos.getObjectRadius(lockTarget.mesh) * 1.5;
        lockTarget.distance = Math.max(minD, lockTarget.distance);

        // Apply orbital rotation from mouse/keyboard
        const orbitSpeed = 2.0 * delta;
        if (input.yawLeft) lockTarget.theta += orbitSpeed;
        if (input.yawRight) lockTarget.theta -= orbitSpeed;
        if (input.pitchUp) lockTarget.phi = Math.min(Math.PI / 2 - 0.1, lockTarget.phi + orbitSpeed);
        if (input.pitchDown) lockTarget.phi = Math.max(-Math.PI / 2 + 0.1, lockTarget.phi - orbitSpeed);

        // Apply mouse orbit
        lockTarget.theta -= orbitX * 2.0;
        lockTarget.phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, lockTarget.phi + orbitY * 2.0));

        // Apply gamepad right stick for orbit
        if (gamepad) {
            const ax2 = gamepad.axes[2];
            const ax3 = gamepad.axes[3];
            if (Math.abs(ax2) > DEADZONE) lockTarget.theta -= ax2 * 2.0 * delta;
            if (Math.abs(ax3) > DEADZONE) {
                lockTarget.phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, lockTarget.phi + ax3 * 2.0 * delta));
            }
        }

        const dist = lockTarget.distance;
        const offset = new THREE.Vector3();

        if (lockTarget.isTop) {
            offset.set(0, dist, 0);
            camera.up.set(0, 0, -1);
        } else {
            // Spherical coordinates for orbital camera
            offset.set(
                dist * Math.cos(lockTarget.phi) * Math.sin(lockTarget.theta),
                dist * Math.sin(lockTarget.phi),
                dist * Math.cos(lockTarget.phi) * Math.cos(lockTarget.theta)
            );
            camera.up.set(0, 1, 0);
        }

        const desiredPos = targetPos.clone().add(offset);
        camera.position.lerp(desiredPos, Cosmos.CAMERA.LERP_FACTOR);

        // Instant lookAt keeps locked target stable on screen
        camera.lookAt(targetPos);
    }

    return isMoving;
}
