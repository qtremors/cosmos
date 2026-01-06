import * as THREE from 'three';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createSceneController, type SceneOptions } from '../core/SceneController';
import { SceneAssets } from '../core/SceneAssets';
import { SystemManager, SystemId } from '../core/SystemManager';

const probe = vi.hoisted(() => ({ camera: null as THREE.PerspectiveCamera | null, frame: null as FrameRequestCallback | null, now: 1000, disposed: false }));
vi.mock('three', async importOriginal => {
    const real = await importOriginal<typeof import('three')>();
    class Renderer {
        domElement = document.createElement('canvas');
        shadowMap = { enabled: false, type: 0 };
        info = { autoReset: true, reset() {}, render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 }, programs: [] };
        setSize() {}
        setPixelRatio() {}
        clear() {}
        render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); probe.camera = camera; }
        dispose() { probe.disposed = true; }
    }
    return { ...real, WebGLRenderer: Renderer };
});

let mount: HTMLDivElement;
let controller: ReturnType<typeof createSceneController> | undefined;
let options: SceneOptions;
beforeEach(() => {
    probe.now = 1000; probe.disposed = false; probe.camera = null; probe.frame = null;
    vi.spyOn(performance, 'now').mockImplementation(() => probe.now);
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => { probe.frame = frame; return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(SceneAssets.prototype, 'loadTexture').mockImplementation(() => new THREE.Texture());
    vi.spyOn(SceneAssets.prototype, 'loadModel').mockImplementation(async () => ({ scene: new THREE.Group(), scenes: [], animations: [] }) as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect() {}, fillRect() {}, createRadialGradient: () => ({ addColorStop() {} }) } as never);
    mount = document.createElement('div'); document.body.append(mount);
    options = {
        quality: 'low', showLabels: true, timeScale: 1, paused: false, darkSideFill: 0.15, diagnostics: false,
        epoch: Date.parse('2026-10-20') / 1000, showOrbits: true, fiction: true, autoExposure: true, radarButton: null,
        onDate: vi.fn(), onAssets: vi.fn(), onError: vi.fn(), onEntities: vi.fn(), onSpeed: vi.fn(), onLockedInfo: vi.fn(),
        onNearest: vi.fn(), onSystem: vi.fn(), onLock: vi.fn(), onCloseRadar: vi.fn(), onToggleLabels: vi.fn(), onToggleHUD: vi.fn(), onPerformance: vi.fn(),
    };
});
afterEach(() => { controller?.dispose(); controller = undefined; mount.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function step() { probe.now += 16; probe.frame!(probe.now); }

it('excludes hidden destinations from next-object navigation in astronomy-only mode', () => {
    controller = createSceneController(mount, options); step();
    controller.configure({ ...options, fiction: false }); step();
    probe.camera!.position.copy(SystemManager.QUANTUMANIA_CENTER); step();
    expect(SystemManager.getInstance().currentSystem).toBe(SystemId.QUANTUMANIA);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', key: 'n' }));
    expect(options.onLock).not.toHaveBeenCalled();
    controller.resetView(); step();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', key: 'n' }));
    const calls = vi.mocked(options.onLock).mock.calls;
    const selected = calls[calls.length - 1][0]!;
    expect(selected.system).toBe(SystemId.SOLAR_SYSTEM);
});

it('releases listeners, scene resources, renderer and mounted elements after a construction failure', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const add = vi.spyOn(window, 'addEventListener'), remove = vi.spyOn(window, 'removeEventListener');
    const assetsDispose = vi.spyOn(SceneAssets.prototype, 'dispose');
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const docRemove = vi.spyOn(document, 'removeEventListener');
    expect(() => createSceneController(mount, options)).toThrow();
    const handlers = add.mock.calls.filter(([name]) => ['keydown', 'keyup', 'blur', 'wheel'].includes(name));
    expect(handlers).toHaveLength(4);
    handlers.forEach(([name, listener]) => expect(remove).toHaveBeenCalledWith(name, listener));
    expect(docRemove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(probe.disposed).toBe(true);
    expect(assetsDispose).toHaveBeenCalledOnce();
    expect(geometryDispose).toHaveBeenCalled();
    expect(mount.childElementCount).toBe(0);
    expect(probe.frame).toBeNull();
});

it('suppresses queued updates and clears mounted resources when setup fails after world creation', async () => {
    vi.stubGlobal('requestAnimationFrame', () => { throw new Error('RAF unavailable'); });
    expect(() => createSceneController(mount, options)).toThrow('RAF unavailable');
    await Promise.resolve();
    expect(options.onEntities).not.toHaveBeenCalled();
    expect(probe.disposed).toBe(true);
    expect(mount.childElementCount).toBe(0);
});
