import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { JetFlight } from '../core/JetFlight';
import { JET_LENGTH_KM } from '../core/JetConfig';
import { Cosmos } from '../core/SDK';
import { kmToUnits, unitsToKm } from '../core/PhysicalScale';
import { SceneAssets } from '../core/SceneAssets';
import { createInputState, updateInputKey, type InputState } from '../core/InputHandler';

function setup() {
    const camera = new THREE.PerspectiveCamera();
    const jet = new JetFlight();
    jet.enter(camera);
    return { jet, camera };
}
function advance(jet: JetFlight, camera: THREE.PerspectiveCamera, input: InputState, seconds: number, fps = 60, pad: Gamepad | null = null) {
    for (let frame = 0; frame < Math.round(seconds * fps); frame++) jet.update(camera, 1 / fps, input, { x: 0, y: 0 }, { current: 0 }, pad);
}

it('normalizes the hull to 20 m and supplies normals for lighting at physical scale', async () => {
    const { jet, camera } = setup();
    const model = new THREE.Group();
    const geometry = new THREE.BoxGeometry(10, 2, 20);
    geometry.deleteAttribute('normal');
    const material = new THREE.MeshStandardMaterial({ flatShading: true });
    model.add(new THREE.Mesh(geometry, material)); model.position.set(4, 5, 6);
    const assets = new SceneAssets();
    vi.spyOn(assets, 'loadModel').mockResolvedValue({ scene: model } as never);
    await jet.load(assets);
    jet.hull.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(jet.hull.getObjectByName('jet-model')!);
    expect(unitsToKm(box.getSize(new THREE.Vector3()).z)).toBeCloseTo(JET_LENGTH_KM, 8);
    expect(JET_LENGTH_KM).toBeLessThan(10 * 0.5 * 2);
    expect(box.getCenter(new THREE.Vector3()).distanceTo(jet.position)).toBeLessThan(1e-15);
    expect(camera.near).toBeLessThan(camera.position.distanceTo(jet.position) / 100);
    expect(jet.status).toBe('ready');
    expect(geometry.hasAttribute('normal')).toBe(true);
    expect(material.flatShading).toBe(false);
    jet.dispose(); assets.dispose();
});

it('builds thrust gradually, coasts after release and comes to rest under braking', () => {
    const { jet, camera } = setup();
    const input = createInputState(); input.forward = true;
    advance(jet, camera, input, 1.5);
    expect(jet.throttle).toBeCloseTo(0.75);
    expect(jet.speedKmS).toBeGreaterThan(unitsToKm(Cosmos.CONTROLS.FLY_SPEED) * 0.3);
    expect(jet.speedKmS).toBeLessThan(unitsToKm(Cosmos.CONTROLS.FLY_SPEED) * jet.throttle);
    const cruising = jet.position.clone();
    input.forward = false;
    advance(jet, camera, input, 0.5);
    expect(jet.throttle).toBeCloseTo(0.75);
    expect(jet.position.distanceTo(cruising)).toBeGreaterThan(kmToUnits(0.1));
    input.back = true;
    advance(jet, camera, input, 3);
    expect(jet.throttle).toBe(0);
    expect(jet.speedKmS).toBe(0);
    jet.dispose();
});

it('reaches the free camera cruise speed at full throttle and adapts to local clearance', () => {
    const { jet, camera } = setup();
    const input = createInputState(); input.forward = true;
    advance(jet, camera, input, 5);
    const cruiseSpeed = unitsToKm(Cosmos.CONTROLS.FLY_SPEED);
    expect(cruiseSpeed).toBeCloseTo(100);
    expect(jet.speedKmS).toBeGreaterThan(cruiseSpeed * 0.99);
    expect(jet.speedKmS).toBeLessThanOrEqual(cruiseSpeed);
    const before = jet.position.clone();
    input.forward = false;
    advance(jet, camera, input, 1);
    expect(unitsToKm(jet.position.distanceTo(before))).toBeCloseTo(100, 1);
    // SceneController passes this same lower speed to free flight near a surface.
    jet.update(camera, 1 / 60, input, { x: 0, y: 0 }, { current: 0 }, null, kmToUnits(20));
    expect(jet.speedKmS).toBeGreaterThan(19);
    expect(jet.speedKmS).toBeLessThanOrEqual(20);
    jet.dispose();
});

it('banks and turns the ship ahead of its chase camera instead of keeping a fixed camera-relative pose', () => {
    const { jet, camera } = setup();
    const relative = camera.quaternion.clone().invert().multiply(jet.hull.quaternion);
    const input = createInputState(); input.forward = input.left = true;
    advance(jet, camera, input, 1);
    const steered = camera.quaternion.clone().invert().multiply(jet.hull.quaternion);
    expect(steered.angleTo(relative)).toBeGreaterThan(0.3);
    expect(jet.velocity.x).toBeLessThan(0);
    const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(jet.rotation);
    expect(nose.angleTo(camera.getWorldDirection(new THREE.Vector3()))).toBeGreaterThan(0.05);
    jet.dispose();
});

function bankAngle(jet: JetFlight) {
    const wing = new THREE.Vector3(1, 0, 0).applyQuaternion(jet.rotation);
    return Math.asin(THREE.MathUtils.clamp(wing.y, -1, 1));
}

it('rolls progressively into a bank before turning and smoothly levels after release', () => {
    const { jet, camera } = setup();
    const input = createInputState(); input.left = true;
    jet.update(camera, 1 / 120, input, { x: 0, y: 0 }, { current: 0 }, null);
    const initialBank = bankAngle(jet);
    expect(Math.abs(initialBank)).toBeLessThan(0.01);
    advance(jet, camera, input, 0.25);
    const partialBank = bankAngle(jet);
    expect(partialBank).toBeLessThan(-0.2);
    expect(partialBank).toBeGreaterThan(-0.7);
    advance(jet, camera, input, 0.75);
    const fullBank = bankAngle(jet);
    expect(fullBank).toBeLessThan(-1);
    // Bank is the ship's attitude, rather than an extra tilt painted on the mesh.
    expect(jet.hull.quaternion.angleTo(jet.rotation)).toBeLessThan(1e-7);
    const course = jet.rotation.clone();
    input.left = false;
    jet.update(camera, 1 / 120, input, { x: 0, y: 0 }, { current: 0 }, null);
    expect(Math.abs(bankAngle(jet) - fullBank)).toBeLessThan(0.01);
    advance(jet, camera, input, 2);
    expect(Math.abs(bankAngle(jet))).toBeLessThan(0.01);
    expect(jet.rotation.angleTo(course)).toBeGreaterThan(0.5);
    jet.dispose();
});

it.each(['arrows', 'mouse', 'gamepad'])('banks into turns when steering with %s', source => {
    const { jet, camera } = setup();
    const input = createInputState(); input.yawLeft = source === 'arrows';
    const pad = source === 'gamepad' ? { axes: [0, 0, -0.6, 0], buttons: [] } as unknown as Gamepad : null;
    for (let frame = 0; frame < 60; frame++) {
        jet.update(camera, 1 / 60, input, { x: source === 'mouse' ? -3 : 0, y: 0 }, { current: 0 }, pad);
    }
    expect(bankAngle(jet)).toBeLessThan(-0.4);
    expect(new THREE.Vector3(0, 0, 1).applyQuaternion(jet.rotation).x).toBeLessThan(-0.1);
    jet.dispose();
});

it('keeps ship position and heading authoritative when the camera is changed externally', () => {
    const { jet, camera } = setup();
    const position = jet.position.clone(), rotation = jet.rotation.clone();
    camera.position.set(100, 200, 300); camera.rotation.set(0.3, 0.9, 1.2);
    jet.update(camera, 0, createInputState(), { x: 0, y: 0 }, { current: 0 }, null);
    expect(jet.position.equals(position)).toBe(true);
    expect(jet.rotation.equals(rotation)).toBe(true);
    expect(camera.position.distanceTo(position)).toBeLessThan(kmToUnits(0.1));
    jet.dispose();
});

it('can turn on the spot without counting chase-camera movement as ship travel', () => {
    const { jet, camera } = setup();
    const position = jet.position.clone(), cameraPosition = camera.position.clone();
    const input = createInputState(); input.left = true;
    advance(jet, camera, input, 1);
    expect(jet.position.equals(position)).toBe(true);
    expect(jet.speedKmS).toBe(0);
    expect(camera.position.distanceTo(cameraPosition)).toBeGreaterThan(kmToUnits(0.005));
    jet.dispose();
});

it('starts boost cruise from rest and holds the reached speed while keeping the hull at true size', () => {
    const { jet, camera } = setup();
    const position = jet.position.clone();
    const input = createInputState(); updateInputKey(input, 'ShiftLeft', true);
    advance(jet, camera, input, 1);
    expect(jet.throttle).toBe(1);
    expect(jet.speedKmS).toBeGreaterThan(unitsToKm(Cosmos.CONTROLS.FLY_SPEED));
    expect(jet.position.distanceTo(position)).toBeGreaterThan(Cosmos.CONTROLS.FLY_SPEED);
    expect(jet.hull.scale.toArray()).toEqual([1, 1, 1]);
    expect(camera.position.distanceTo(jet.position) / kmToUnits(JET_LENGTH_KM)).toBeCloseTo(Math.hypot(0.65, 3.2), 5);
    const held = jet.speedKmS;
    updateInputKey(input, 'ShiftLeft', false);
    advance(jet, camera, input, 2);
    expect(jet.speedKmS).toBeCloseTo(held, 6);
    updateInputKey(input, 'ShiftLeft', true);
    advance(jet, camera, input, 1);
    expect(jet.speedKmS).toBeGreaterThan(held);
    jet.leave(camera); expect(jet.scene.visible).toBe(false);
    jet.dispose();
});

it('preserves full manual rolls and does not snap level when halted in a bank', () => {
    const { jet, camera } = setup();
    const initial = jet.rotation.clone();
    const input = createInputState(); input.rollRight = true;
    advance(jet, camera, input, 2);
    expect(jet.rotation.angleTo(initial)).toBeGreaterThan(2);
    jet.enter(new THREE.PerspectiveCamera());
    input.rollRight = false; input.left = true;
    advance(jet, camera, input, 1);
    const banked = jet.rotation.clone();
    jet.halt();
    jet.update(camera, 0, createInputState(), { x: 0, y: 0 }, { current: 0 }, null);
    expect(jet.rotation.angleTo(banked)).toBeLessThan(1e-7);
    expect(jet.hull.quaternion.angleTo(banked)).toBeLessThan(1e-7);
    jet.dispose();
});

it('brakes stored boost to normal cruise, then stops on a second S press', () => {
    const { jet, camera } = setup();
    const input = createInputState(); updateInputKey(input, 'ShiftLeft', true);
    advance(jet, camera, input, 1);
    updateInputKey(input, 'ShiftLeft', false);
    input.back = true;
    const boosted = jet.speedKmS;
    advance(jet, camera, input, 0.2);
    expect(jet.speedKmS).toBeLessThan(boosted);
    advance(jet, camera, input, 5);
    expect(jet.speedKmS).toBeCloseTo(100);
    expect(jet.throttle).toBe(1);
    input.back = false; advance(jet, camera, input, 0.1);
    input.back = true; advance(jet, camera, input, 3);
    expect(jet.speedKmS).toBe(0);
    jet.halt(); expect(jet.speedKmS).toBe(0);
    jet.dispose();
});

it('uses the shared gamepad actions and steers the ship with mouse input', () => {
    const first = setup(), second = setup();
    const input = createInputState(); input.forward = input.left = input.rollLeft = true;
    const pad = { axes: [-1, -1, 0, 0], buttons: Array.from({ length: 16 }, (_, index) => ({ value: 0, pressed: index === 4 })) } as unknown as Gamepad;
    advance(first.jet, first.camera, input, 1);
    advance(second.jet, second.camera, createInputState(), 1, 60, pad);
    expect(first.jet.rotation.angleTo(second.jet.rotation)).toBeLessThan(1e-7);
    expect(first.jet.position.distanceTo(second.jet.position)).toBeLessThan(1e-15);
    const rotation = first.jet.rotation.clone(), mouse = { x: 80, y: -40 };
    first.jet.update(first.camera, 0.1, createInputState(), mouse, { current: 0 }, null);
    expect(first.jet.rotation.angleTo(rotation)).toBeGreaterThan(0.01);
    expect(mouse).toEqual({ x: 0, y: 0 });
    first.jet.dispose(); second.jet.dispose();
});

it.each([false, true])('keeps thrust, boost and turning consistent at 30, 60 and 120 FPS (boost=%s)', boosting => {
    const flights = [30, 60, 120].map(fps => {
        const flight = setup();
        const input = createInputState(); input.forward = input.left = true;
        input.boost = boosting;
        advance(flight.jet, flight.camera, input, 2, fps);
        return flight;
    });
    for (const flight of flights) {
        expect(flight.jet.rotation.angleTo(flights[1].jet.rotation)).toBeLessThan(1e-6);
        expect(flight.jet.speedKmS).toBeCloseTo(flights[1].jet.speedKmS, 6);
        expect(flight.jet.position.distanceTo(flights[1].jet.position)).toBeLessThan(1e-12);
    }
    flights.forEach(flight => flight.jet.dispose());
});

it('boosts through the shared boost progression and clears momentum when focus is lost', () => {
    const { jet, camera } = setup();
    const input = createInputState(); input.forward = input.boost = true;
    advance(jet, camera, input, 2.5);
    expect(jet.speedKmS).toBeGreaterThan(unitsToKm(Cosmos.CONTROLS.FLY_SPEED) * 5);
    expect(input.boostHoldTime).toBeCloseTo(2.5);
    jet.halt();
    advance(jet, camera, createInputState(), 0.5);
    expect(jet.speedKmS).toBe(0); expect(jet.throttle).toBe(0);
    jet.dispose();
});

it.each(['wheel', 'gamepad'])('adjusts engine throttle through %s zoom actions', source => {
    const { jet, camera } = setup();
    const zoom = { current: source === 'wheel' ? -6 : 0 };
    const pad = source === 'gamepad' ? { axes: [], buttons: Array.from({ length: 16 }, (_, index) => ({ value: 0, pressed: index === 12 })) } as unknown as Gamepad : null;
    jet.update(camera, 0.1, createInputState(), { x: 0, y: 0 }, zoom, pad);
    expect(jet.throttle).toBeCloseTo(0.09);
    expect(jet.speedKmS).toBeGreaterThan(0);
    expect(zoom.current).toBe(0);
    jet.dispose();
});

it('retries a failed load and releases late models when disposed', async () => {
    const assets = new SceneAssets();
    const model = new THREE.Group(), geometry = new THREE.BoxGeometry();
    model.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()));
    const release = vi.spyOn(geometry, 'dispose');
    const load = vi.spyOn(assets, 'loadModel').mockRejectedValueOnce(new Error('Offline'));
    const statuses = vi.fn(), jet = new JetFlight(statuses);
    await jet.load(assets); expect(jet.status).toBe('failed');
    let resolve!: (value: never) => void;
    load.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const pending = jet.load(assets); jet.dispose(); resolve({ scene: model } as never);
    await pending;
    expect(release).toHaveBeenCalledOnce();
    expect(statuses.mock.calls.map(([status]) => status)).toEqual(['loading', 'failed', 'loading']);
    expect(jet.hull.getObjectByName('jet-model')).toBeUndefined();
    assets.dispose();
});
