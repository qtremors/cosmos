import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SceneAssets } from '../core/SceneAssets';
import { GLBEntity } from '../objects/quantumania/GLBEntity';
import { Nexus } from '../objects/quantumania/Nexus';
import { QuantumaniaSystem } from '../objects/quantumania/QuantumaniaSystem';
import { disposeObject3D } from '../core/SceneLifecycle';

beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null));
afterEach(() => vi.restoreAllMocks());

function deferredModel() {
    let resolve!: (gltf: GLTF) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<GLTF>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve: () => resolve({ scene: new THREE.Group() } as GLTF), reject };
}

describe('model loading contracts', () => {
    it.each(['entity', 'nexus'])('%s callers share the real in-flight completion promise', async kind => {
        const assets = new SceneAssets();
        const pending = deferredModel();
        const load = vi.spyOn(assets, 'loadModel').mockReturnValue(pending.promise);
        const entity = kind === 'entity' ? new GLBEntity(new THREE.Vector3(), '/model.glb', 'Test', 1, 1, '#fff', 2, assets) : new Nexus(new THREE.Vector3(), assets);
        const first = entity.loadModel();
        expect(entity.loadModel()).toBe(first);
        expect(entity.loaded).toBe(false);
        expect(load).toHaveBeenCalledTimes(1);
        pending.resolve();
        await first;
        expect(entity.loaded).toBe(true);
        await entity.loadModel();
        expect(load).toHaveBeenCalledTimes(1);
        disposeObject3D(entity);
        assets.dispose();
    });

    it('permits retry after a failed load', async () => {
        const assets = new SceneAssets();
        const load = vi.spyOn(assets, 'loadModel').mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ scene: new THREE.Group() } as GLTF);
        const entity = new GLBEntity(new THREE.Vector3(), '/model.glb', 'Test', 1, 1, '#fff', 2, assets);
        await expect(entity.loadModel()).rejects.toThrow('offline');
        await entity.loadModel();
        expect(load).toHaveBeenCalledTimes(2);
        expect(entity.loaded).toBe(true);
        disposeObject3D(entity);
        assets.dispose();
    });

    it('does not start another model while one is in flight, and stops the queue on leaving', async () => {
        const assets = new SceneAssets();
        const pending = deferredModel();
        const load = vi.spyOn(assets, 'loadModel').mockReturnValue(pending.promise);
        const system = new QuantumaniaSystem(assets);
        system.setVisible(true);
        system.setVisible(false);
        system.setVisible(true);
        expect(load).toHaveBeenCalledTimes(1);
        system.setVisible(false);
        pending.resolve();
        await vi.waitFor(() => expect(system.nexus.loaded).toBe(true));
        expect(load).toHaveBeenCalledTimes(1);
        const next = deferredModel();
        load.mockReturnValue(next.promise);
        system.setVisible(true);
        expect(load).toHaveBeenCalledTimes(2);
        system.dispose();
        assets.dispose();
        next.reject(new DOMException('Scene disposed', 'AbortError'));
        await Promise.resolve();
        disposeObject3D(system);
    });

    it('retries failed models without reloading successful models or looping on failures', async () => {
        const assets = new SceneAssets();
        const load = vi.spyOn(assets, 'loadModel').mockRejectedValueOnce(new Error('offline'))
            .mockImplementation(async () => ({ scene: new THREE.Group() } as GLTF));
        const system = new QuantumaniaSystem(assets);
        system.setVisible(true);
        await vi.waitFor(() => expect(system.inhabitants.items.every(item => item.loaded)).toBe(true));
        const firstPassCount = load.mock.calls.length;
        expect(system.nexus.loaded).toBe(false);
        system.setVisible(true);
        await Promise.resolve();
        expect(load).toHaveBeenCalledTimes(firstPassCount);
        system.retryFailedModels();
        await vi.waitFor(() => expect(system.nexus.loaded).toBe(true));
        expect(load).toHaveBeenCalledTimes(firstPassCount + 1);
        system.dispose();
        assets.dispose();
        disposeObject3D(system);
    });
});
