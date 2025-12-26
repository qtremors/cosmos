import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { expect, it, vi } from 'vitest';
import { SceneAssets } from '../core/SceneAssets';
import { CosmicEntity } from '../objects/CosmicEntity';
import { disposeObject3D } from '../core/SceneLifecycle';
import { SystemRenderer } from '../core/SystemRenderer';

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
    const camera = new THREE.PerspectiveCamera(); camera.position.copy(cosmic.position);
    cosmic.update(0, camera, 0, 0);
    await vi.waitFor(() => expect(cosmic.residentModelCount).toBe(7));
    const disposed = geometries.map(geometry => vi.spyOn(geometry, 'dispose'));
    camera.position.set(0, 500, 800); cosmic.update(0, camera, 0, 0);
    cosmic.updateResidency(30);
    expect(cosmic.residentModelCount).toBe(0);
    expect(cosmic.head).toBe(target);
    expect(cosmic.head.parent).not.toBeNull();
    disposed.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    camera.position.copy(cosmic.position); cosmic.update(0, camera, 0, 0);
    await vi.waitFor(() => expect(cosmic.residentModelCount).toBe(7));
    expect(load).toHaveBeenCalledTimes(14);
    cosmic.dispose(); assets.dispose(); disposeObject3D(cosmic); vi.restoreAllMocks();
});

it('gives Arishem dedicated shadow-free lighting and keeps it out of the other scene passes', async () => {
    const assets = new SceneAssets();
    const actor = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.3 });
    actor.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
    vi.spyOn(assets, 'loadModel').mockImplementation(async url => ({
        scene: url.endsWith('Arishem.glb') ? actor : new THREE.Group(), animations: [],
    }) as unknown as GLTF);
    const cosmic = new CosmicEntity(assets);
    const camera = new THREE.PerspectiveCamera();
    camera.position.copy(cosmic.position);
    try {
        cosmic.update(0, camera, 0, 0);
        await vi.waitFor(() => expect(cosmic.residentModelCount).toBe(7));
        const key = actor.getObjectByName('ArishemKeyLight') as THREE.DirectionalLight;
        const fill = actor.getObjectByName('ArishemFillLight') as THREE.DirectionalLight;
        const ambient = actor.getObjectByName('ArishemAmbientLight') as THREE.AmbientLight;
        expect(key.intensity).toBeGreaterThan(1);
        expect(fill.intensity).toBeGreaterThan(1);
        expect(ambient.intensity).toBeGreaterThan(0);
        expect(key.castShadow).toBe(false);
        expect(fill.castShadow).toBe(false);
        expect(material.metalness).toBeLessThanOrEqual(0.25);
        expect(material.roughness).toBeGreaterThanOrEqual(0.55);
        const accents: THREE.PointLight[] = [];
        actor.traverse(object => { if (object instanceof THREE.PointLight) accents.push(object); });
        expect(accents).toHaveLength(2);
        accents.forEach(light => {
            expect(light.intensity / 500 ** 2).toBeGreaterThan(0.5);
            expect(light.castShadow).toBe(false);
        });

        const root = new THREE.Scene();
        const passes = new SystemRenderer(root, [], [], [new THREE.Object3D()], [cosmic]);
        expect(passes.cosmic.getObjectByName('ArishemKeyLight')).toBe(key);
        for (const scene of [passes.solar, passes.quantum, passes.interstellar]) {
            expect(scene.getObjectByName('ArishemKeyLight')).toBeUndefined();
            expect(scene.getObjectByName('ArishemAmbientLight')).toBeUndefined();
        }
        const render = vi.fn();
        const renderer = { info: { reset: vi.fn() }, clear: vi.fn(), render } as unknown as THREE.WebGLRenderer;
        cosmic.visible = true;
        passes.render(renderer, camera, false, false);
        expect(render.mock.calls.map(call => call[0])).toEqual([passes.interstellar, passes.cosmic]);
        cosmic.visible = false;
        render.mockClear();
        passes.render(renderer, camera, false, false);
        expect(render.mock.calls.map(call => call[0])).toEqual([passes.interstellar]);
        cosmic.update(0, camera, 1, 0);
        actor.updateWorldMatrix(true, true);
        expect(key.getWorldPosition(new THREE.Vector3()).z).toBeGreaterThan(key.target.getWorldPosition(new THREE.Vector3()).z);
        expect(fill.getWorldPosition(new THREE.Vector3()).z).toBeLessThan(fill.target.getWorldPosition(new THREE.Vector3()).z);
    } finally {
        cosmic.dispose(); assets.dispose(); disposeObject3D(cosmic); vi.restoreAllMocks();
    }
});
