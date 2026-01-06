import * as THREE from 'three';
import { expect, it } from 'vitest';
import { BlackHole } from '../objects/BlackHole';
import { QUALITY_PRESETS } from '../core/Quality';
import { disposeObject3D } from '../core/SceneLifecycle';

// CPU reference of the shader's geometric integration, without shading or WebGL.
// Count rays that actually reach the emitting disk rather than just its halo.
function diskHits(origin: THREE.Vector3, steps: number, scale: number): number {
    const z = origin.clone().negate().normalize();
    const x = new THREE.Vector3(0, 1, 0).cross(z);
    if (x.length() < 0.001) x.set(0, 0, 1).cross(z);
    x.normalize();
    const y = z.clone().cross(x);
    let hits = 0;
    for (let u = -7; u <= 7; u++) for (let v = -7; v <= 7; v++) {
        const direction = x.clone().multiplyScalar(u / 10).addScaledVector(y, v / 10).addScaledVector(z, 2).normalize();
        const p = origin.clone();
        let distance = 0;
        for (let i = 0; i < steps; i++) {
            const radius = p.length();
            if (radius < 2.5) break;
            direction.addScaledVector(p.clone().negate().normalize(), 0.15 / radius ** 2 * scale).normalize();
            if (radius > 3 && radius < 14 && Math.abs(p.y) < 0.5) { hits++; break; }
            const step = Math.max(0.04, radius * 0.04) * scale;
            p.addScaledVector(direction, step);
            distance += step;
            if (distance > 100) break;
        }
    }
    return hits;
}

it.each([14, 15, 30])('keeps emitting disk samples at Low quality from camera radius %s', radius => {
    const hole = new BlackHole();
    const billboard = hole.children.find(child => child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    hole.setRaySteps(QUALITY_PRESETS.low.raySteps);
    const { uSteps, uStepScale } = billboard.material.uniforms;
    for (const origin of [new THREE.Vector3(0, radius, 0), new THREE.Vector3(0, radius, radius).setLength(radius)]) {
        expect(diskHits(origin, uSteps.value, uStepScale.value)).toBeGreaterThan(50);
    }
    // The previous Low path misses the disk except for a few peripheral rays.
    expect(diskHits(new THREE.Vector3(0, radius, 0), 48, 1)).toBeLessThanOrEqual(12);
    for (const quality of [QUALITY_PRESETS.medium, QUALITY_PRESETS.high]) {
        hole.setRaySteps(quality.raySteps);
        expect(uStepScale.value).toBe(1);
        expect(uSteps.value).toBe(quality.raySteps);
    }
    disposeObject3D(hole);
});
