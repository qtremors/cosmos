import * as THREE from 'three';
import { expect, it } from 'vitest';
import { Moon } from '../objects/common/Moon';
import { kmToUnits } from '../core/PhysicalScale';
import { BODY_DATA } from '../core/BodyData';
import { disposeObject3D } from '../core/SceneLifecycle';

it('keeps moon orbit and telemetry relative to its parent', () => {
    const parent = new THREE.Group(); parent.position.set(1000, 500, -100);
    const moon = new Moon({ name: 'Europa'}); parent.add(moon);
    const camera = new THREE.PerspectiveCamera(); camera.position.z = 100;
    moon.update(0, camera);
    const first = moon.position.clone();
    moon.update(BODY_DATA.Europa.periodDays! * 86400, camera);
    expect(moon.position.distanceTo(first)).toBeLessThan(kmToUnits(1000));
    expect(moon.userData.orbit.parent).toBe('Jupiter');
    expect(moon.userData.orbit.axisKm).toBe(671100);
    expect(moon.position.length()).toBeGreaterThan(kmToUnits(650000));
    expect(moon.getWorldPosition(new THREE.Vector3()).distanceTo(parent.position)).toBeCloseTo(moon.position.length());
    disposeObject3D(parent);
});
