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
    boostMultiplier: number;
    boostPresses: number;
    boostWasActive: boolean;
    boostCruising: boolean;
    brakingBoost: boolean;
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
        boost: false, boostHoldTime: 0, boostMultiplier: 1, boostPresses: 0,
        boostWasActive: false, boostCruising: false, brakingBoost: false,
        shiftLeft: false, shiftRight: false, pitchUp: false, pitchDown: false, yawLeft: false, yawRight: false
    };
}

export function updateInputKey(state: InputState, code: string, pressed: boolean): void {
    switch (code) {
        case 'KeyW': state.forward = pressed; break;
        case 'KeyS':
            state.back = pressed;
            if (!pressed) state.brakingBoost = false;
            break;
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
            if (pressed && !state.boost) state.boostPresses++;
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

/** Shared action decoding for the free camera and the piloted ship. */
export function readFlightInput(input: InputState, gamepad: Gamepad | null) {
    const axis = (index: number) => {
        const value = gamepad?.axes[index] ?? 0;
        return Math.abs(value) > 0.15 ? value : 0;
    };
    return {
        forward: Math.max(Number(input.forward), -axis(1), 0),
        back: Math.max(Number(input.back), axis(1), 0),
        left: Math.max(Number(input.left), -axis(0), 0),
        right: Math.max(Number(input.right), axis(0), 0),
        up: input.up || !!gamepad?.buttons[0]?.pressed,
        down: input.down || !!gamepad?.buttons[1]?.pressed,
        rollLeft: input.rollLeft || !!gamepad?.buttons[4]?.pressed,
        rollRight: input.rollRight || !!gamepad?.buttons[5]?.pressed,
        boost: input.boost || (gamepad?.buttons[7]?.value ?? 0) > 0.5,
        zoomIn: !!gamepad?.buttons[12]?.pressed,
        zoomOut: !!gamepad?.buttons[13]?.pressed,
        lookX: axis(2), lookY: axis(3),
        pitch: Number(input.pitchUp) - Number(input.pitchDown),
        yaw: Number(input.yawLeft) - Number(input.yawRight),
    };
}

/** Shift adds speed; release holds it. S sheds boost before ordinary braking. */
export function getProgressiveBoostMultiplier(state: InputState, delta: number, isBoosting: boolean, isBraking = false): number {
    const dt = Math.max(0, delta);
    if (!isBraking) state.brakingBoost = false;
    else if (state.boostMultiplier > 1) state.brakingBoost = true;
    if (isBraking) {
        // Keep this brake press in cruise recovery, even once normal speed is reached.
        if (state.brakingBoost) state.boostMultiplier = Math.max(1, state.boostMultiplier * Math.exp(-2 * dt));
        else state.boostCruising = false;
    } else {
        const presses = state.boostPresses || Number(isBoosting && !state.boostWasActive);
        if (presses) {
            state.boostMultiplier += presses * Cosmos.CONTROLS.BOOST_MULTIPLIER;
            state.boostCruising = true;
        }
        if (isBoosting) {
            state.boostCruising = true;
            // Continuous acceleration, with no gameplay speed ceiling or stepped stages.
            const accelerationOffset = 2 * Cosmos.CONTROLS.BOOST_MULTIPLIER - 1;
            state.boostMultiplier += (state.boostMultiplier + accelerationOffset) * Math.expm1(0.5 * dt);
        }
    }
    state.boostPresses = 0;
    state.boostWasActive = isBoosting;
    state.boostHoldTime = isBoosting ? state.boostHoldTime + dt : 0;
    return state.boostMultiplier;
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

    const controls = readFlightInput(input, gamepad);
    const moveFwd = controls.forward > 0, moveBack = controls.back > 0;
    const moveLeft = controls.left > 0, moveRight = controls.right > 0;
    const moveUp = controls.up, moveDown = controls.down;
    const rollL = controls.rollLeft, rollR = controls.rollRight;
    const doBoost = controls.boost;

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
        const ax2 = gamepad.axes[2] ?? 0;
        const ax3 = gamepad.axes[3] ?? 0;

        const RS_SENS = 2.0 * delta;
        if (!lockTarget && Math.abs(ax3) > DEADZONE) camera.rotateX(-ax3 * RS_SENS);
        if (!lockTarget && Math.abs(ax2) > DEADZONE) camera.rotateY(-ax2 * RS_SENS);

        if (controls.zoomIn) zoomVelocity.current -= 60 * delta;
        if (controls.zoomOut) zoomVelocity.current += 60 * delta;
    }

    // Check if any movement key is pressed (for auto-unlock)
    let travel = delta;
    if (lockTarget) {
        input.boostPresses = 0;
        input.boostWasActive = doBoost;
    } else {
        getProgressiveBoostMultiplier(input, 0, doBoost, moveBack);
        travel = 0;
        let remaining = delta;
        while (remaining > 1e-9) {
            const step = Math.min(remaining, 1 / 120);
            remaining -= step;
            const previous = input.boostMultiplier;
            const next = getProgressiveBoostMultiplier(input, step, doBoost, moveBack);
            travel += (previous + next) * 0.5 * step;
        }
    }
    const isMoving = moveFwd || moveBack || moveLeft || moveRight || moveUp || moveDown || (!lockTarget && input.boostCruising);

    const zoomDecay = Math.pow(0.9, delta * 60);
    const zoomDistance = zoomVelocity.current * (1 - zoomDecay) / (0.1 * 60);
    zoomVelocity.current *= zoomDecay;

    // Apply to camera (free flight mode)
    if (!lockTarget) {
        const speed = flightSpeed * travel;
        const rotSpeed = Cosmos.CONTROLS.ROLL_SPEED * delta;

        if (moveFwd || input.boostCruising) camera.translateZ(-speed);
        if (moveBack && !input.brakingBoost) camera.translateZ(speed);
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
