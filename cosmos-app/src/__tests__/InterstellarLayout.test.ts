import * as THREE from 'three';
import { expect, it } from 'vitest';
import { placeInterstellarPair, INTERSTELLAR_PAIR_DISTANCE } from '../core/InterstellarLayout';
import { SystemManager } from '../core/SystemManager';
import { VISIBILITY } from '../core/Simulation';
import { disposeObject3D } from '../core/SceneLifecycle';
import { BlackHole } from '../objects/BlackHole';

it('moves the pair beyond the Solar region without changing their spacing, sizes, or black-hole rendering state', () => {
    const blackHole = new BlackHole();
    const alienX = new THREE.Object3D();
    // The ag-dev placement put Alien X halfway from the origin to the black hole.
    alienX.position.copy(blackHole.position).multiplyScalar(0.5);
    const separation = blackHole.position.clone().sub(alienX.position);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.001, 300000);
    camera.position.copy(alienX.position).addScaledVector(separation.clone().normalize(), -30);
    blackHole.update(0, camera, 4);
    const billboard = blackHole.children.find(child => child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    const core = blackHole.children.find(child => child instanceof THREE.Mesh && child !== billboard)!;
    const shaderCamera = billboard.material.uniforms.uCamPos.value.clone();
    const coreOffset = core.position.clone();
    const billboardRotation = billboard.quaternion.clone();
    const oldPosition = alienX.position.clone();

    const viewDirection = placeInterstellarPair(alienX, blackHole);
    expect(alienX.position.length()).toBeCloseTo(INTERSTELLAR_PAIR_DISTANCE, 8);
    for (const object of [alienX, blackHole]) {
        expect(object.position.length()).toBeGreaterThan(SystemManager.SOLAR_SYSTEM_RADIUS);
        expect(object.position.length()).toBeGreaterThan(VISIBILITY.SOLAR_RANGE);
        expect(object.scale.toArray()).toEqual([1, 1, 1]);
    }
    expect(blackHole.position.clone().sub(alienX.position).distanceTo(separation)).toBeLessThan(1e-9);
    camera.position.add(alienX.position.clone().sub(oldPosition));
    blackHole.update(0, camera, 4);
    expect(billboard.material.uniforms.uCamPos.value.distanceTo(shaderCamera)).toBeLessThan(1e-9);
    expect(core.position.distanceTo(coreOffset)).toBeLessThan(1e-9);
    expect(billboard.quaternion.angleTo(billboardRotation)).toBeLessThan(1e-6);
    expect(billboard.geometry.parameters.width).toBe(600);

    camera.position.copy(alienX.position).addScaledVector(viewDirection, 30);
    camera.lookAt(alienX.position);
    camera.updateMatrixWorld(true);
    const backdrop = blackHole.position.clone().project(camera);
    expect(Math.abs(backdrop.x)).toBeLessThan(1e-9);
    expect(Math.abs(backdrop.y)).toBeLessThan(1e-9);
    expect(backdrop.z).toBeGreaterThan(0);
    expect(backdrop.z).toBeLessThan(1);
    expect(camera.position.distanceTo(blackHole.position)).toBeGreaterThan(camera.position.distanceTo(alienX.position));
    disposeObject3D(blackHole);
});
