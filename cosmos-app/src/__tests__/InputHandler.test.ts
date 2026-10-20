import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyInputToCamera, createInputState, getProgressiveBoostMultiplier, pollGamepad, updateInputKey, type LockTarget } from '../core/InputHandler';
import { Cosmos } from '../core/SDK';
import { simulationDistanceToKm, KM_PER_AU } from '../core/Simulation';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function simulate(fps: number, mode: 'flight' | 'lock' | 'zoom') {
    const camera = new THREE.PerspectiveCamera();
    const input = createInputState();
    input.forward = mode === 'flight';
    const zoom = { current: mode === 'zoom' ? 5 : 0 };
    let lock: LockTarget | null = null;
    if (mode === 'lock') {
        camera.position.set(0, 0, 50);
        lock = { mesh: new THREE.Mesh(new THREE.SphereGeometry(1)), distance: 10, theta: 0, phi: 0, isTop: false };
    }
    for (let frame = 0; frame < fps; frame++) applyInputToCamera(camera, input, 1 / fps, { x: 0, y: 0 }, zoom, lock, null);
    return camera.position.z;
}

describe('elapsed-time camera controls', () => {
    it.each(['flight', 'lock', 'zoom'] as const)('%s behaves consistently at 30, 60, and 120 FPS', mode => {
        const baseline = simulate(60, mode);
        expect(simulate(30, mode)).toBeCloseTo(baseline, 6);
        expect(simulate(120, mode)).toBeCloseTo(baseline, 6);
    });

    it('keeps boost held when one of two Shift keys is released', () => {
        const input = createInputState();
        updateInputKey(input, 'ShiftLeft', true);
        updateInputKey(input, 'ShiftRight', true);
        updateInputKey(input, 'ShiftLeft', false);
        expect(input.boost).toBe(true);
        updateInputKey(input, 'ShiftRight', false);
        expect(input.boost).toBe(false);
    });

    it('does not share boost acceleration between input states', () => {
        const first = createInputState();
        first.boost = first.forward = true;
        applyInputToCamera(new THREE.PerspectiveCamera(), first, 8, { x: 0, y: 0 }, { current: 0 }, null, null);
        const second = createInputState();
        second.boost = second.forward = true;
        const camera = new THREE.PerspectiveCamera();
        applyInputToCamera(camera, second, 0.1, { x: 0, y: 0 }, { current: 0 }, null, null);
        expect(second.boostMultiplier).toBeLessThan(first.boostMultiplier);
        const held = second.boostMultiplier;
        second.boost = second.forward = false;
        const before = camera.position.z;
        applyInputToCamera(camera, second, 1, { x: 0, y: 0 }, { current: 0 }, null, null);
        expect(second.boostMultiplier).toBe(held);
        expect(before - camera.position.z).toBeCloseTo(Cosmos.CONTROLS.FLY_SPEED * held, 8);
    });

    it('finds a connected standard gamepad in a nonzero slot', () => {
        const pad = { connected: true, mapping: 'standard' } as Gamepad;
        vi.stubGlobal('navigator', { getGamepads: () => [null, pad] });
        expect(pollGamepad()).toBe(pad);
    });
});

it('counts five quick Shift taps, ignores key repeat and keeps the reached speed', () => {
    const input = createInputState();
    for (let tap = 0; tap < 5; tap++) {
        updateInputKey(input, 'ShiftLeft', true);
        updateInputKey(input, 'ShiftLeft', true);
        updateInputKey(input, 'ShiftLeft', false);
    }
    const multiplier = getProgressiveBoostMultiplier(input, 1, false);
    expect(multiplier * simulationDistanceToKm(Cosmos.CONTROLS.FLY_SPEED)).toBeCloseTo(5100);
    expect(getProgressiveBoostMultiplier(input, 10, false)).toBe(multiplier);
});

it('accelerates beyond the old 100x ceiling and resumes from stored speed', () => {
    const input = createInputState();
    const accelerated = getProgressiveBoostMultiplier(input, 10, true);
    expect(accelerated).toBeGreaterThan(100);
    expect(getProgressiveBoostMultiplier(input, 2, false)).toBe(accelerated);
    expect(getProgressiveBoostMultiplier(input, 1, true)).toBeGreaterThan(accelerated);
});

it('slows the camera toward normal forward cruise before S can reverse it', () => {
    const input = createInputState(), camera = new THREE.PerspectiveCamera();
    const step = (dt: number) => applyInputToCamera(camera, input, dt, { x: 0, y: 0 }, { current: 0 }, null, null);
    updateInputKey(input, 'ShiftLeft', true); step(1);
    updateInputKey(input, 'ShiftLeft', false);
    const boosted = input.boostMultiplier;
    updateInputKey(input, 'KeyS', true); step(0.1);
    expect(input.boostMultiplier).toBeLessThan(boosted);
    const before = camera.position.z;
    step(5);
    expect(input.boostMultiplier).toBe(1);
    expect(camera.position.z).toBeLessThan(before);
    updateInputKey(input, 'KeyS', false); step(0.1);
    const cruise = camera.position.z;
    step(1);
    expect(cruise - camera.position.z).toBeCloseTo(Cosmos.CONTROLS.FLY_SPEED, 8);
    updateInputKey(input, 'KeyS', true); step(1);
    expect(camera.position.z).toBeCloseTo(cruise, 8);
});

it('keeps boost acceleration and travel consistent across frame rates', () => {
    const flights = [30, 60, 120].map(fps => {
        const input = createInputState(), camera = new THREE.PerspectiveCamera();
        updateInputKey(input, 'ShiftLeft', true);
        for (let frame = 0; frame < fps * 2; frame++) applyInputToCamera(camera, input, 1 / fps, { x: 0, y: 0 }, { current: 0 }, null, null);
        return { input, camera };
    });
    for (const flight of flights) {
        expect(flight.input.boostMultiplier).toBeCloseTo(flights[0].input.boostMultiplier, 8);
        expect(flight.camera.position.z).toBeCloseTo(flights[0].camera.position.z, 10);
    }
});

it('converts simulation distances to kilometres without a thousands-of-km error', () => {
    expect(simulationDistanceToKm(Cosmos.UNITS.AU)).toBe(KM_PER_AU);
    expect(simulationDistanceToKm(0)).toBe(0);
});
