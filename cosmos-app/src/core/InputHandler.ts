import * as THREE from 'three';
import { Cosmos } from './SDK';
import { dampingFactor } from './Simulation';

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
    boostHoldTime: number;
    shiftLeft: boolean;
    shiftRight: boolean;
    pitchUp: boolean;
    pitchDown: boolean;
    yawLeft: boolean;
    yawRight: boolean;
}

export interface LockTarget {
    mesh: THREE.Object3D;
    entityId?: string;
    distance: number;
    isTop: boolean;
    theta: number;
    phi: number;
}

const targetPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();

// =============================================================================
// INPUT HANDLER
// =============================================================================

export function createInputState(): InputState {
    return {
        forward: false, back: false, left: false, right: false,
        up: false, down: false, rollLeft: false, rollRight: false,
        boost: false, boostHoldTime: 0, shiftLeft: false, shiftRight: false, pitchUp: false, pitchDown: false, yawLeft: false, yawRight: false
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
        case 'ShiftRight':
            if (code === 'ShiftLeft') state.shiftLeft = pressed;
            else state.shiftRight = pressed;
            state.boost = state.shiftLeft || state.shiftRight;
            if (!state.boost) state.boostHoldTime = 0;
            break;
    }
}

export function pollGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.from(gamepads).find(pad => pad?.connected && pad.mapping === 'standard') ?? null;
}

/**
 * Calculate current boost multiplier based on hold time.
 */
function getProgressiveBoostMultiplier(state: InputState, delta: number, isBoosting: boolean): number {
    if (!isBoosting) {
        state.boostHoldTime = 0;
        return 1;
    }

    state.boostHoldTime += delta;

    // Every 2 seconds, increase multiplier by 10x
    // 0-2s: 10x, 2-4s: 20x, 4-6s: 30x, ... max 100x
    const baseMultiplier = Cosmos.CONTROLS.BOOST_MULTIPLIER; // 10x
    const stages = Math.floor(state.boostHoldTime / 2); // 0, 1, 2, 3... every 2 seconds
    const progressiveMultiplier = baseMultiplier * (1 + stages);

    return Math.min(progressiveMultiplier, 100); // Cap at 100x
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
    gamepad: Gamepad | null,
    flightSpeed = Cosmos.CONTROLS.FLY_SPEED
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
            orbitX = mouseDelta.x * SENSITIVITY;
            orbitY = mouseDelta.y * SENSITIVITY;
        }
        mouseDelta.x = 0;
        mouseDelta.y = 0;
    }

    // Gamepad input
    if (gamepad) {
        const ax0 = gamepad.axes[0] ?? 0;
        const ax1 = gamepad.axes[1] ?? 0;
        const ax2 = gamepad.axes[2] ?? 0;
        const ax3 = gamepad.axes[3] ?? 0;

        if (ax1 < -DEADZONE) moveFwd = true;
        if (ax1 > DEADZONE) moveBack = true;
        if (ax0 < -DEADZONE) moveLeft = true;
        if (ax0 > DEADZONE) moveRight = true;

        if (gamepad.buttons[0]?.pressed) moveUp = true;
        if (gamepad.buttons[1]?.pressed) moveDown = true;

        const RS_SENS = 2.0 * delta;
        if (!lockTarget && Math.abs(ax3) > DEADZONE) camera.rotateX(-ax3 * RS_SENS);
        if (!lockTarget && Math.abs(ax2) > DEADZONE) camera.rotateY(-ax2 * RS_SENS);

        if (gamepad.buttons[4]?.pressed) rollL = true;
        if (gamepad.buttons[5]?.pressed) rollR = true;
        if (gamepad.buttons[7]?.value > 0.5) doBoost = true;

        if (gamepad.buttons[12]?.pressed) zoomVelocity.current -= 60 * delta;
        if (gamepad.buttons[13]?.pressed) zoomVelocity.current += 60 * delta;
    }

    // Check if any movement key is pressed (for auto-unlock)
    const isMoving = moveFwd || moveBack || moveLeft || moveRight || moveUp || moveDown;

    const boostMultiplier = getProgressiveBoostMultiplier(input, delta, doBoost);

    const zoomDecay = Math.pow(0.9, delta * 60);
    const zoomDistance = zoomVelocity.current * (1 - zoomDecay) / (0.1 * 60);
    zoomVelocity.current *= zoomDecay;

    // Apply to camera (free flight mode)
    if (!lockTarget) {
        const speed = flightSpeed * boostMultiplier * delta;
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

        camera.translateZ(zoomDistance * flightSpeed / 2);
    } else if (lockTarget.mesh) {
        // Lock-on mode with orbital camera
        const targetPos = targetPosition;
        lockTarget.mesh.getWorldPosition(targetPos);

        // Apply zoom
        lockTarget.distance *= Math.exp(THREE.MathUtils.clamp(zoomDistance * 0.08, -1, 1));

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
            const ax2 = gamepad.axes[2] ?? 0;
            const ax3 = gamepad.axes[3] ?? 0;
            if (Math.abs(ax2) > DEADZONE) lockTarget.theta -= ax2 * 2.0 * delta;
            if (Math.abs(ax3) > DEADZONE) {
                lockTarget.phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, lockTarget.phi + ax3 * 2.0 * delta));
            }
        }

        const dist = lockTarget.distance;
        const offset = cameraOffset;

        if (lockTarget.isTop) {
            offset.set(0, dist, 0);
            camera.up.set(0, 0, -1);
        } else {
            offset.set(
                dist * Math.cos(lockTarget.phi) * Math.sin(lockTarget.theta),
                dist * Math.sin(lockTarget.phi),
                dist * Math.cos(lockTarget.phi) * Math.cos(lockTarget.theta)
            );
            camera.up.set(0, 1, 0);
        }

        const desiredPos = desiredPosition.copy(targetPos).add(offset);

        // Distance-adaptive lerp: slower for large distances creates smooth "warp travel" effect
        const travelDist = camera.position.distanceTo(desiredPos);
        const lerpFactor = travelDist > 100
            ? Math.max(0.01, Math.min(0.05, 100 / travelDist))
            : Cosmos.CAMERA.LERP_FACTOR;
        camera.position.lerp(desiredPos, dampingFactor(lerpFactor, delta));

        // Instant lookAt keeps locked target stable on screen
        camera.lookAt(targetPos);
    }

    return isMoving;
}
