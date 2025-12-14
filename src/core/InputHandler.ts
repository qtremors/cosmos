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

    // Mouse Look
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
        camera.rotateY(-mouseDelta.x * SENSITIVITY);
        camera.rotateX(-mouseDelta.y * SENSITIVITY);
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
        // Lock-on mode
        const targetPos = new THREE.Vector3();
        lockTarget.mesh.getWorldPosition(targetPos);

        lockTarget.distance += zoomVelocity.current * delta * 50;
        zoomVelocity.current *= 0.9;

        const minD = Cosmos.getObjectRadius(lockTarget.mesh) * 1.5;
        lockTarget.distance = Math.max(minD, lockTarget.distance);

        const dist = lockTarget.distance;
        const offset = new THREE.Vector3();

        if (lockTarget.isTop) {
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

    return isMoving;
}
