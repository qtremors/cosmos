import * as THREE from 'three';
import { expect, it } from 'vitest';
import { EntityCategory, type EntityInfo } from '../core/Entity';
import { sceneExposure } from '../core/Lighting';
import { UNITS_PER_AU } from '../core/PhysicalScale';
import { SystemId } from '../core/SystemId';
import { SunBeacon } from '../objects/solar/SunBeacon';

function body(au: number): EntityInfo {
    const mesh = Object.assign(new THREE.Group(), { radius: 1 });
    mesh.position.x = au * UNITS_PER_AU;
    return { mesh, id: String(au), label: 'Planet', color: '#fff', radius: 1, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET };
}

it('meters free flight near outer planets like locked close-ups, without darkening inner planets', () => {
    const earth = body(1), neptune = body(30), mercury = body(0.4);
    const bodies = [earth, neptune, mercury];
    const camera = neptune.mesh.position.clone().addScalar(0.01);
    expect(sceneExposure(camera, bodies, null, true, true)).toBe(900);
    expect(sceneExposure(camera, bodies, neptune, true, true)).toBe(900);
    expect(sceneExposure(earth.mesh.position, bodies, null, true, true)).toBe(1);
    expect(sceneExposure(mercury.mesh.position, bodies, mercury, true, true)).toBe(1);
});

it('uses heliocentric world coordinates for moons and prioritizes the locked target', () => {
    const planet = body(30), moon = body(0.01), earth = body(1);
    planet.mesh.add(moon.mesh);
    const expected = 30.01 ** 2;
    expect(sceneExposure(earth.mesh.position, [earth, moon], moon, true, true)).toBeCloseTo(expected);
    expect(sceneExposure(new THREE.Vector3(30.01 * UNITS_PER_AU, 1, 0), [earth, moon], null, true, true)).toBeCloseTo(expected);
});

it('excludes hidden, fictional, proxy and nonphysical targets from flight metering', () => {
    const earth = body(1);
    const ignored = Array.from({ length: 5 }, () => body(30));
    ignored[0].mesh.visible = false;
    ignored[1].category = EntityCategory.EASTER_EGG;
    ignored[2].isSystemProxy = true;
    ignored[3].system = SystemId.INTERSTELLAR;
    ignored[4].mesh = new THREE.Group();
    ignored[4].mesh.position.x = 30 * UNITS_PER_AU;
    expect(sceneExposure(ignored[0].mesh.position, [earth, ...ignored], null, true, true)).toBe(1);
});

it('leaves exposure neutral outside the Solar pass or when disabled', () => {
    const planet = body(30);
    expect(sceneExposure(planet.mesh.position, [planet], planet, false, true)).toBe(1);
    expect(sceneExposure(planet.mesh.position, [planet], planet, true, false)).toBe(1);
    expect(sceneExposure(planet.mesh.position, [], null, true, true)).toBe(1);
});

it('keeps the Sun visible at distant destinations without pulsing or distance shrinkage', () => {
    const sun = new SunBeacon();
    sun.update(new THREE.Vector3(UNITS_PER_AU, 0, 0));
    expect(sun.visible).toBe(false);
    sun.update(new THREE.Vector3(3 * UNITS_PER_AU, 0, 0));
    expect(sun.material.opacity).toBe(0.5);
    for (const distance of [4 * UNITS_PER_AU, 35000, 80000, 100000]) {
        sun.update(new THREE.Vector3(distance, 0, 0));
        expect(sun.visible).toBe(true);
        expect(sun.material.opacity).toBe(1);
    }
    expect(sun.material.sizeAttenuation).toBe(false);
    expect(sun.material.toneMapped).toBe(false);
    expect(sun.material.depthTest).toBe(true);
    expect(sun.geometry.getAttribute('position').count).toBe(1);
    const texture = sun.material.map as THREE.DataTexture;
    const pixels = texture.image.data!;
    expect(pixels[(16 * 32 + 16) * 4 + 3]).toBeGreaterThan(200);
    expect(pixels[3]).toBe(0);
    texture.dispose(); sun.material.dispose(); sun.geometry.dispose();
});
