import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SceneOptions } from '../core/SceneController';
import * as THREE from 'three';
import { EntityCategory, type EntityInfo } from '../core/Entity';
import { SystemId } from '../core/SystemId';
import App from '../App';
import { PREFERENCES_KEY, readPreferences, savePreferences } from '../core/Preferences';
import { TIME_PRESETS } from '../core/TimeConfig';

const scene = vi.hoisted(() => ({ settings: null as SceneOptions | null }));

vi.mock('../core/SceneController', () => ({
    createSceneController: (_mount: HTMLElement, options: SceneOptions) => {
        scene.settings = options;
        const earth: EntityInfo = { id: 'earth', label: 'Earth', color: '#08f', radius: 1, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET, mesh: new THREE.Object3D() };
        options.onEntities([earth]);
        return {
            configure: vi.fn(settings => { scene.settings = { ...options, ...settings }; }), dispose: vi.fn(), resetView: vi.fn(), key: vi.fn(),
            lock: (entity: Parameters<SceneOptions['onLock']>[0]) => { options.onLock(entity); options.onCloseRadar(); },
        };
    },
}));

let container: HTMLDivElement;
let root: Root;
let narrow: boolean;

beforeEach(() => {
    localStorage.clear();
    scene.settings = null;
    narrow = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: narrow, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

async function reload() {
    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<App />));
}
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
});

async function click(name: string) {
    const button = [...container.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === name || button.textContent?.trim() === name);
    expect(button, name).toBeDefined();
    await act(async () => button!.click());
}

it('keeps object information with telemetry and hides that column while navigation is open', async () => {
    await act(async () => root.render(<App />));
    await click('Explore objects and settings');
    await click('Earth');
    const column = container.querySelector<HTMLElement>('.context-panels')!;
    expect(column.parentElement).toBe(container.querySelector('.hud-layer'));
    expect(column.querySelector('.stats-hud')).not.toBeNull();
    expect(column.querySelector('.object-info')?.textContent).toContain('Earth');
    expect(column.hidden).toBe(false);
    expect(container.querySelector('.overlay')).toBeNull();
    await click('Explore objects and settings');
    expect(column.hidden).toBe(true);
    expect(container.querySelector<HTMLElement>('.touch-controls')!.hidden).toBe(true);
    await click('Close objects and settings');
    expect(column.hidden).toBe(false);
    expect(column.querySelector('.object-info')).not.toBeNull();
});

it('lets narrow-screen users open and close information without losing flight controls or focus', async () => {
    narrow = true;
    await act(async () => root.render(<App />));
    await click('Explore objects and settings');
    await click('Earth');
    expect(container.querySelector('.object-info')).toBeNull();
    await click('Object information');
    expect(container.querySelector('.object-info')).not.toBeNull();
    expect(container.querySelector<HTMLElement>('.touch-controls')!.hidden).toBe(false);
    await click('Close object information');
    expect(container.querySelector('.object-info')).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('#radar-container'));
});

it('restores changed quality, lighting, fiction, orbit, time, pause and diagnostics controls on reload', async () => {
    await act(async () => root.render(<App />));
    await click('Explore objects and settings');
    for (const label of ['Low', 'Automatic exposure', 'Fictional extras', 'Orbit guides', '6 Hr/s', '⏸ Pause', 'Performance measurements']) await click(label);
    expect(readPreferences()).toMatchObject({ autoExposure: false, fiction: false, showOrbits: false,
        timeScale: TIME_PRESETS.HOUR_6, paused: true, diagnostics: true });
    await reload();
    expect(scene.settings).toMatchObject({ quality: 'low', autoExposure: false, fiction: false,
        showOrbits: false, timeScale: TIME_PRESETS.HOUR_6, paused: true, diagnostics: true });
    await click('Explore objects and settings');
    expect(container.querySelector('button[aria-pressed="true"]')?.textContent).toBe('Low');
    expect(container.textContent).toContain('▶ Play');
});

it('remembers a chosen date but uses the current clock on future loads after Now', async () => {
    const epoch = Date.parse('2001-02-03T04:05:00Z') / 1000;
    savePreferences({ ...readPreferences(), epoch, darkSideFill: 0.7, showLabels: false });
    await act(async () => root.render(<App />));
    expect(scene.settings).toMatchObject({ epoch, darkSideFill: 0.7, showLabels: false });
    await click('Explore objects and settings');
    await click('Now');
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toMatchObject({ epoch: null });
    await reload();
    expect(Math.abs(scene.settings!.epoch - Date.now() / 1000)).toBeLessThan(2);
});

it('keeps the explicit information-panel choice across reloads and target changes', async () => {
    narrow = true;
    await act(async () => root.render(<App />));
    await click('Explore objects and settings'); await click('Earth');
    await click('Object information');
    await reload();
    await click('Explore objects and settings'); await click('Earth');
    expect(container.querySelector('.object-info')).not.toBeNull();
    await click('Close object information');
    await reload();
    await click('Explore objects and settings'); await click('Earth');
    expect(container.querySelector('.object-info')).toBeNull();
});
