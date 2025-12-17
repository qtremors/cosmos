import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { AsteroidBelt } from '../objects/solar/AsteroidBelt';
import { kmToUnits } from '../core/PhysicalScale';
import { disposeObject3D } from '../core/SceneLifecycle';

it.each([[420, 660, 10], [6000, 10000, 50]])('keeps physical rocks and visible markers aligned in the %s–%s belt', (inner, outer, sizeKm) => {
    const belt = new AsteroidBelt(inner, outer, 24, sizeKm);
    const rocks = belt.children.find(child => child instanceof THREE.InstancedMesh)!;
    const markers = belt.getObjectByName('belt-markers') as THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    expect((rocks.geometry as THREE.DodecahedronGeometry).parameters.radius).toBe(kmToUnits(sizeKm));
    expect(markers.material.sizeAttenuation).toBe(false);
    expect(markers.material.size).toBeGreaterThanOrEqual(1);
    expect(markers.material.depthWrite).toBe(false);

    for (const time of [0, 1791417600]) {
        belt.update(time);
        const positions = markers.geometry.getAttribute('position');
        const matrix = new THREE.Matrix4();
        for (let index = 0; index < rocks.count; index++) {
            rocks.getMatrixAt(index, matrix);
            const position = new THREE.Vector3().fromBufferAttribute(positions, index);
            expect(position.toArray()).toEqual(new THREE.Vector3().setFromMatrixPosition(matrix).toArray());
            expect(position.length()).toBeGreaterThanOrEqual(inner - 0.001);
            expect(position.length()).toBeLessThanOrEqual(outer + 0.001);
            expect(markers.geometry.boundingSphere!.containsPoint(position)).toBe(true);
        }
    }
    disposeObject3D(belt);
});

it('applies quality counts to markers and rocks, refreshes restored particles while paused, and disposes both', () => {
    const belt = new AsteroidBelt(420, 660, 12);
    const rocks = belt.children.find(child => child instanceof THREE.InstancedMesh)!;
    const markers = belt.getObjectByName('belt-markers') as THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    belt.setCount(3);
    belt.update(1000);
    belt.setCount(0);
    belt.update(2000);
    expect(markers.geometry.drawRange.count).toBe(0);
    belt.setCount(100);
    belt.update(2000);
    expect(rocks.count).toBe(12);
    expect(markers.geometry.drawRange.count).toBe(12);
    const matrix = new THREE.Matrix4();
    rocks.getMatrixAt(11, matrix);
    expect(new THREE.Vector3().fromBufferAttribute(markers.geometry.getAttribute('position'), 11).toArray())
        .toEqual(new THREE.Vector3().setFromMatrixPosition(matrix).toArray());
    const geometry = vi.spyOn(markers.geometry, 'dispose');
    const material = vi.spyOn(markers.material, 'dispose');
    disposeObject3D(belt);
    expect(geometry).toHaveBeenCalledOnce();
    expect(material).toHaveBeenCalledOnce();
});
