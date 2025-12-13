import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyInputToCamera, createInputState, pollGamepad, updateInputKey, type LockTarget } from '../core/InputHandler';
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
        expect(camera.position.z).toBeCloseTo(-Cosmos.CONTROLS.FLY_SPEED * Cosmos.CONTROLS.BOOST_MULTIPLIER * 0.1);
    });

    it('finds a connected standard gamepad in a nonzero slot', () => {
        const pad = { connected: true, mapping: 'standard' } as Gamepad;
        vi.stubGlobal('navigator', { getGamepads: () => [null, pad] });
        expect(pollGamepad()).toBe(pad);
    });
});

it('converts simulation distances to kilometres without a thousands-of-km error', () => {
    expect(simulationDistanceToKm(Cosmos.UNITS.AU)).toBe(KM_PER_AU);
    expect(simulationDistanceToKm(0)).toBe(0);
});
