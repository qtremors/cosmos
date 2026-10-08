import * as THREE from 'three';
import { afterEach, expect, it } from 'vitest';
import { SystemId, SystemManager } from '../core/SystemManager';

afterEach(() => SystemManager.getInstance().updateCurrentSystem(SystemManager.SOLAR_SYSTEM_CENTER));

it('reports changes only when crossing a system boundary', () => {
    const manager = SystemManager.getInstance();
    manager.updateCurrentSystem(SystemManager.SOLAR_SYSTEM_CENTER);
    expect(manager.updateCurrentSystem(new THREE.Vector3(100, 0, 0))).toBe(false);
    expect(manager.updateCurrentSystem(new THREE.Vector3(SystemManager.SOLAR_SYSTEM_RADIUS, 0, 0))).toBe(true);
    expect(manager.currentSystem).toBe(SystemId.INTERSTELLAR);
    expect(manager.updateCurrentSystem(new THREE.Vector3(5000, 0, 0))).toBe(false);
    expect(manager.updateCurrentSystem(SystemManager.QUANTUMANIA_CENTER)).toBe(true);
    expect(manager.currentSystem).toBe(SystemId.QUANTUMANIA);
    expect(manager.getCurrentSystemName()).toBe('Quantumania');
});
