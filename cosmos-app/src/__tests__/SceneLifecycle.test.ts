import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { disposeObject3D, startAnimationLoop } from '../core/SceneLifecycle';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('animation ownership', () => {
    function fakeFrames() {
        const frames = new Map<number, FrameRequestCallback>();
        let id = 0;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
        vi.stubGlobal('cancelAnimationFrame', (frameId: number) => frames.delete(frameId));
        vi.spyOn(performance, 'now').mockReturnValue(0);
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
        return frames;
    }

    it('leaves only the current loop after setup-cleanup-setup and ignores stale callbacks', () => {
        const frames = fakeFrames();
        const update = vi.fn();
        const stopFirst = startAnimationLoop(update);
        const staleFrame = [...frames.values()][0];
        stopFirst();
        const stopSecond = startAnimationLoop(update);
        expect(frames.size).toBe(1);
        staleFrame(16);
        expect(update).not.toHaveBeenCalled();
        expect(frames.size).toBe(1);
        stopSecond();
        expect(frames.size).toBe(0);
    });

    it('bounds long frame gaps and skips updates while hidden', () => {
        const frames = fakeFrames();
        const update = vi.fn();
        const stop = startAnimationLoop(update);
        const run = (now: number) => {
            const [id, callback] = [...frames.entries()][0];
            frames.delete(id);
            callback(now);
        };
        run(5000);
        expect(update).toHaveBeenLastCalledWith(0.1);
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
        run(6000);
        expect(update).toHaveBeenCalledTimes(1);
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
        run(6016);
        expect(update).toHaveBeenLastCalledWith(0.016);
        stop();
    });
});

it('disposes shared geometry, materials, uniform textures, and shadow targets once', () => {
    const root = new THREE.Group();
    const texture = new THREE.Texture();
    const geometry = new THREE.SphereGeometry();
    const material = new THREE.ShaderMaterial({ uniforms: { color: { value: texture }, layers: { value: [texture] } } });
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    const light = new THREE.PointLight();
    light.shadow.map = new THREE.WebGLCubeRenderTarget(16);
    root.add(light);
    const spies = [geometry, material, texture, light.shadow.map].map(resource => vi.spyOn(resource, 'dispose'));
    disposeObject3D(root);
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
});
