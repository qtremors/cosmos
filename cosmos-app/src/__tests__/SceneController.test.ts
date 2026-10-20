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

it('keeps nearest distance available while locked on an object', async () => {
    controller = createSceneController(mount, options);
    await Promise.resolve();
    for (let i = 0; i < 20; i++) step();
    const earth = vi.mocked(options.onEntities).mock.lastCall![0].find(entity => entity.label === 'Earth')!;
    controller.lock(earth);
    for (let i = 0; i < 20; i++) step();
    expect(options.onLockedInfo).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Earth' }));
    expect(options.onNearest).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Earth', distance: expect.any(Number) }));
});

it('holds distance steady with paused objects and a stopped turning jet, but updates it as objects orbit', () => {
    controller = createSceneController(mount, { ...options, paused: true, jetEnabled: true });
    for (let i = 0; i < 20; i++) step();
    const initial = vi.mocked(options.onNearest).mock.lastCall![0];
    controller.key('KeyA', true);
    for (let i = 0; i < 120; i++) step();
    controller.key('KeyA', false);
    expect(options.onSpeed).toHaveBeenLastCalledWith(0);
    expect(options.onNearest).toHaveBeenLastCalledWith(initial);
    controller.configure({ ...options, paused: false, jetEnabled: true });
    for (let i = 0; i < 240; i++) step();
    expect(options.onSpeed).toHaveBeenLastCalledWith(0);
    expect(vi.mocked(options.onNearest).mock.lastCall![0]).not.toEqual(initial);
});

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

it('enters jet mode without loading other models, releases controls on blur and exits for object navigation', async () => {
    options.onJetEnabled = vi.fn();
    options.onJetStatus = vi.fn();
    controller = createSceneController(mount, options); step();
    await Promise.resolve();
    expect(SceneAssets.prototype.loadModel).not.toHaveBeenCalled();
    controller.configure({ ...options, jetEnabled: true });
    step();
    expect(options.onJetEnabled).toHaveBeenLastCalledWith(true);
    expect(SceneAssets.prototype.loadModel).toHaveBeenCalledWith('/models/Jet.glb');
    expect(document.activeElement).toBe(mount.querySelector('canvas'));
    controller.key('ShiftLeft', true);
    controller.key('KeyW', true);
    for (let i = 0; i < 40; i++) step();
    expect(vi.mocked(options.onSpeed).mock.lastCall![0]).toBeGreaterThan(0.3);
    window.dispatchEvent(new Event('blur'));
    for (let i = 0; i < 24; i++) step();
    expect(options.onSpeed).toHaveBeenLastCalledWith(0);
    const earth = vi.mocked(options.onEntities).mock.lastCall![0].find(entity => entity.label === 'Earth')!;
    controller.lock(earth); step();
    expect(options.onJetEnabled).toHaveBeenLastCalledWith(false);
    expect(options.onLock).toHaveBeenLastCalledWith(earth);
});

it('keeps existing movement, roll, boost and spawn shortcuts active after panel-button clicks', () => {
    options.onJetEnabled = vi.fn();
    controller = createSceneController(mount, options); step();
    controller.configure({ ...options, jetEnabled: true }); step();
    const panel = document.createElement('div'); panel.dataset.ui = '';
    const button = document.createElement('button'); panel.append(button); mount.append(panel); button.focus();
    const key = (type: string, code: string, target: HTMLElement = button) => {
        const event = new KeyboardEvent(type, { code, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event;
    };
    const start = probe.camera!.quaternion.clone();
    key('keydown', 'ShiftLeft');
    expect(document.activeElement).toBe(button);
    key('keyup', 'ShiftLeft');
    expect(key('keydown', 'KeyQ').defaultPrevented).toBe(true);
    key('keydown', 'KeyW');
    key('keydown', 'ShiftLeft');
    for (let i = 0; i < 40; i++) step();
    expect(probe.camera!.quaternion.angleTo(start)).toBeGreaterThan(0.1);
    expect(vi.mocked(options.onSpeed).mock.lastCall![0]).toBeGreaterThan(0.3);
    key('keyup', 'KeyQ'); key('keyup', 'ShiftLeft'); key('keyup', 'KeyW');
    for (let i = 0; i < 15; i++) step();
    expect(vi.mocked(options.onSpeed).mock.lastCall![0]).toBeGreaterThan(0);
    key('keydown', 'KeyS');
    for (let i = 0; i < 180; i++) step();
    key('keyup', 'KeyS');
    expect(options.onSpeed).toHaveBeenLastCalledWith(100);
    step(); key('keydown', 'KeyS');
    for (let i = 0; i < 180; i++) step();
    key('keyup', 'KeyS');
    expect(options.onSpeed).toHaveBeenLastCalledWith(0);
    // Space and Enter keep their native button behavior.
    expect(key('keydown', 'Space').defaultPrevented).toBe(false);
    expect(key('keydown', 'Enter').defaultPrevented).toBe(false);
    key('keydown', 'KeyJ');
    expect(options.onJetEnabled).toHaveBeenLastCalledWith(false);
});

it('allows flight letters from settings sliders while preserving slider arrows and text editing', () => {
    controller = createSceneController(mount, options); step();
    controller.configure({ ...options, jetEnabled: true }); step();
    const range = document.createElement('input'); range.type = 'range'; mount.append(range); range.focus();
    const steer = new KeyboardEvent('keydown', { code: 'KeyD', bubbles: true, cancelable: true });
    range.dispatchEvent(steer);
    expect(steer.defaultPrevented).toBe(true);
    range.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', bubbles: true }));
    const arrow = new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true, cancelable: true });
    range.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
    const text = document.createElement('input'); mount.append(text); text.focus();
    const typing = new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true, cancelable: true });
    text.dispatchEvent(typing);
    expect(typing.defaultPrevented).toBe(false);
    const forward = probe.camera!.quaternion.clone();
    for (let i = 0; i < 15; i++) step();
    expect(probe.camera!.quaternion.angleTo(forward)).toBeLessThan(1e-6);
});

it('holds boost cruise after Shift release and clears it when the window loses focus', () => {
    options.onJetFlight = vi.fn();
    controller = createSceneController(mount, options); step();
    controller.configure({ ...options, jetEnabled: true }); step();
    controller.key('ShiftLeft', true);
    for (let i = 0; i < 60; i++) step();
    controller.key('ShiftLeft', false);
    for (let i = 0; i < 12; i++) step();
    const held = vi.mocked(options.onSpeed).mock.lastCall![0];
    expect(held).toBeGreaterThan(1000);
    for (let i = 0; i < 60; i++) step();
    expect(options.onSpeed).toHaveBeenLastCalledWith(held);
    expect(options.onJetFlight).toHaveBeenLastCalledWith(expect.objectContaining({ boosting: true, throttle: 1 }));
    window.dispatchEvent(new Event('blur'));
    for (let i = 0; i < 12; i++) step();
    expect(options.onSpeed).toHaveBeenLastCalledWith(0);
});
