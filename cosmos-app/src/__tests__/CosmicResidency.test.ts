import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { expect, it, vi } from 'vitest';
import { SceneAssets } from '../core/SceneAssets';
import { CosmicEntity } from '../objects/CosmicEntity';
import { disposeObject3D } from '../core/SceneLifecycle';

it('evicts cosmic models, preserves the head target, and reloads without duplicate models', async () => {
    const assets = new SceneAssets();
    const geometries: THREE.BoxGeometry[] = [];
    const load = vi.spyOn(assets, 'loadModel').mockImplementation(async url => {
        const scene = new THREE.Group(); const geometry = new THREE.BoxGeometry(); geometries.push(geometry);
        scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
        if (url.endsWith('Arishem.glb')) { const head = new THREE.Group(); head.name = 'Head'; scene.add(head); }
        return { scene, animations: [] } as unknown as GLTF;
    });
    const cosmic = new CosmicEntity(assets), target = cosmic.head;
    const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 0, -20000);
    cosmic.update(0, camera, 0, 0);
    await vi.waitFor(() => expect(cosmic.residentModelCount).toBe(7));
    const disposed = geometries.map(geometry => vi.spyOn(geometry, 'dispose'));
    camera.position.set(0, 500, 800); cosmic.update(0, camera, 0, 0);
    cosmic.updateResidency(30);
    expect(cosmic.residentModelCount).toBe(0);
    expect(cosmic.head).toBe(target);
    expect(cosmic.head.parent).not.toBeNull();
    disposed.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    camera.position.set(0, 0, -20000); cosmic.update(0, camera, 0, 0);
    await vi.waitFor(() => expect(cosmic.residentModelCount).toBe(7));
    expect(load).toHaveBeenCalledTimes(14);
    cosmic.dispose(); assets.dispose(); disposeObject3D(cosmic); vi.restoreAllMocks();
});
