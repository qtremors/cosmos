import { expect, it } from 'vitest';
import * as THREE from 'three';
import { visibleDiscFraction } from '../core/SolarOcclusion';
import { bodyState } from '../core/Ephemeris';
import { kmToUnits } from '../core/PhysicalScale';

it('handles full light, umbra, annular and partial eclipses continuously', () => {
    expect(visibleDiscFraction(1, 2, 4)).toBe(1);
    expect(visibleDiscFraction(1, 2, 0)).toBe(0);
    expect(visibleDiscFraction(2, 1, 0)).toBe(0.75);
    expect(visibleDiscFraction(1, 1, 1)).toBeCloseTo(0.608997781, 8);
    expect(visibleDiscFraction(0.001, 0.001, 0.001)).toBeCloseTo(visibleDiscFraction(1, 1, 1), 10);
    expect(visibleDiscFraction(1, 1, 2 - 1e-6)).toBeCloseTo(1, 6);
});

it('puts the Moon in Earth’s umbra during the observed November 2022 total lunar eclipse', () => {
    const time = Date.parse('2022-11-08T11:00:00Z') / 1000;
    const earth = bodyState('Earth', time).position;
    const moon = bodyState('Moon', time).position;
    const sunDirection = earth.clone().add(moon).negate();
    const earthDirection = moon.clone().negate();
    const sunAngle = Math.asin(kmToUnits(695700) / sunDirection.length());
    const earthAngle = Math.asin(kmToUnits(6378.137) / earthDirection.length());
    expect(visibleDiscFraction(sunAngle, earthAngle, earthDirection.angleTo(sunDirection))).toBe(0);
    const normal = new THREE.Vector3().crossVectors(moon, bodyState('Moon', time).velocity).normalize();
    expect(normal.length()).toBeCloseTo(1);
});
