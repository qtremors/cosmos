import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { Sun } from '../objects/solar/Sun';
import { SceneAssets } from '../core/SceneAssets';
import { disposeObject3D } from '../core/SceneLifecycle';

it('sun shaders use the supplied animation time instead of the wall clock', () => {
    const assets = new SceneAssets();
    const texture = new THREE.Texture();
    vi.spyOn(assets, 'loadTexture').mockReturnValue(texture);
    const sun = new Sun(10, assets);
    const camera = new THREE.PerspectiveCamera(); camera.position.z = 100;
    sun.update(100, camera, 4);
    vi.spyOn(performance, 'now').mockReturnValue(900000);
    sun.update(100, camera, 4);
    const times: number[] = [];
    sun.traverse(object => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial && object.material.uniforms.uTime) times.push(object.material.uniforms.uTime.value);
    });
    expect(times).toEqual([4, 4]);
    disposeObject3D(sun); assets.dispose(); vi.restoreAllMocks();
});
