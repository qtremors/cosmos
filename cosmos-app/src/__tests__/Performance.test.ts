import * as THREE from 'three';
import { expect, it } from 'vitest';
import { FrameProfiler, resourceEstimates } from '../core/Performance';
import { disposeObject3D } from '../core/SceneLifecycle';

it('bounds frame samples and resets the window after quality changes', () => {
    const profiler = new FrameProfiler();
    for (let index = 1; index <= 400; index++) profiler.record(index * 20, 3);
    expect(profiler.timings()).toEqual({ samples: 300, frameMsP50: 20, frameMsP95: 20, updateRenderMsP95: 3 });
    profiler.reset();
    expect(profiler.timings().samples).toBe(0);
});

it('counts shared geometry, shader textures and material textures once', () => {
    const root = new THREE.Group();
    const geometry = new THREE.PlaneGeometry();
    const texture = new THREE.Texture({ width: 1024, height: 1024 });
    texture.generateMipmaps = false;
    root.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture })), new THREE.Mesh(geometry, new THREE.ShaderMaterial({ uniforms: { texture: { value: texture } } })));
    expect(resourceEstimates(root).estimatedTextureMiB).toBe(4);
    disposeObject3D(root);
});

it('includes all six faces of a point-light shadow target', () => {
    const root = new THREE.Group(); const light = new THREE.PointLight();
    light.shadow.map = new THREE.WebGLCubeRenderTarget(512); root.add(light);
    expect(resourceEstimates(root).estimatedShadowMiB).toBe(12);
    disposeObject3D(root);
});
