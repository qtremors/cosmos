import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, expect, it, vi } from 'vitest';
import { SceneAssets } from '../core/SceneAssets';

afterEach(() => vi.restoreAllMocks());

it('disposes a model that arrives after its scene has been torn down', async () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial();
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(geometry, material));
    const geometryDisposed = vi.spyOn(geometry, 'dispose');
    const materialDisposed = vi.spyOn(material, 'dispose');
    let resolve!: (gltf: GLTF) => void;
    const pending = new Promise<GLTF>(yes => { resolve = yes; });
    const load = vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockReturnValue(pending);
    const assets = new SceneAssets();
    const request = assets.loadModel('/late.glb');
    const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    assets.dispose();
    resolve({ scene, scenes: [scene] } as GLTF);
    await rejected;
    expect(geometryDisposed).toHaveBeenCalledTimes(1);
    expect(materialDisposed).toHaveBeenCalledTimes(1);
});

it('reports load failures and does not notify React after disposal', async () => {
    const onChange = vi.fn();
    const assets = new SceneAssets(onChange);
    assets.manager.itemStart('/texture.jpg');
    assets.manager.itemError('/texture.jpg');
    assets.manager.itemEnd('/texture.jpg');
    await Promise.resolve();
    expect(onChange).toHaveBeenLastCalledWith({ loading: false, loaded: 1, total: 1, failed: ['/texture.jpg'] });
    onChange.mockClear();
    assets.manager.itemStart('/late.jpg');
    assets.dispose();
    await Promise.resolve();
    expect(onChange).not.toHaveBeenCalled();
});
