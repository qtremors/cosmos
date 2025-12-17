import { expect, it } from 'vitest';
import * as THREE from 'three';
import { AstroTime } from 'astronomy-engine';
import { bodyState, bodyOrientation, orbitPoints } from '../core/Ephemeris';
import { kmToUnits, unitsToKm } from '../core/PhysicalScale';
import { Cosmos } from '../core/SDK';
import fixture from './fixtures/horizons-2026.json';

const time = AstroTime.FromTerrestrialTime(fixture.epochTdbJd - 2451545).date.getTime() / 1000;
// Independent NASA/JPL vectors, not values produced by the implementation.
it.each(Object.entries(fixture.bodies))('matches the JPL reference for %s within its stated model precision', (name, reference) => {
    const state = bodyState(name, time);
    const [x, y, z] = reference.position;
    const expected = new THREE.Vector3(x, z, -y);
    const actual = state.position.clone().multiplyScalar(unitsToKm(1));
    const exactElements = ['Triton', 'Charon', 'Haumea'].includes(name);
    const toleranceKm = exactElements ? 0.02 : name === 'Moon' ? 200 : name === 'Io' ? 1500 : expected.length() * Math.PI / (180 * 60);
    expect(actual.distanceTo(expected), `${name} error in km`).toBeLessThan(toleranceKm);
    if (!exactElements) expect(actual.angleTo(expected)).toBeLessThan(Math.PI / (180 * 60));
    expect(state.velocity.length()).toBeCloseTo(new THREE.Vector3(...reference.velocity).length(), name === 'Moon' ? 2 : 1);
});

it('uses one length scale for Sun, Earth and Earth–Moon separation', () => {
    expect(Cosmos.UNITS.SOLAR_RADIUS / Cosmos.PLANETS.EARTH.RADIUS).toBeCloseTo(695700 / 6378.137, 10);
    expect(Cosmos.PLANETS.EARTH.DISTANCE / Cosmos.PLANETS.EARTH.RADIUS).toBeCloseTo(149597870.7 / 6378.137, 8);
    expect(Cosmos.PLANETS.EARTH.MOON.DISTANCE).toBe(kmToUnits(384400));
    expect(Cosmos.PLANETS.EARTH.MOON.RADIUS).toBe(kmToUnits(1737.4));
});

it('keeps Earth’s pole at the measured obliquity, independent of its daily spin', () => {
    const north = new THREE.Vector3(0, 1, 0).applyQuaternion(bodyOrientation('Earth', time));
    expect(THREE.MathUtils.radToDeg(north.angleTo(new THREE.Vector3(0, 1, 0)))).toBeCloseTo(23.44, 1);
    const next = new THREE.Vector3(0, 1, 0).applyQuaternion(bodyOrientation('Earth', time + 21600));
    expect(next.angleTo(north)).toBeLessThan(0.0001);
    expect(bodyOrientation('Earth', time).angleTo(bodyOrientation('Earth', time + 86164.09))).toBeLessThan(0.001);
});

it('uses dated positions that repeat on reload and move at physical orbital speeds', () => {
    const first = bodyState('Earth', time).position.clone();
    const next = bodyState('Earth', time + 10).position.clone();
    expect(unitsToKm(next.distanceTo(first)) / 10).toBeCloseTo(29.81, 1);
    expect(bodyState('Earth', time).position.distanceTo(first)).toBe(0);
});

it('places orbit guides in the same orbital plane and at true perihelion/aphelion scales', () => {
    const state = bodyState('Earth', time);
    const points = orbitPoints(state);
    const normal = new THREE.Vector3().crossVectors(state.position, state.velocity).normalize();
    points.forEach(point => expect(Math.abs(point.dot(normal))).toBeLessThan(1e-8));
    const lengths = points.map(point => unitsToKm(point.length()));
    expect(Math.min(...lengths)).toBeGreaterThan(146000000);
    expect(Math.min(...lengths)).toBeLessThan(148000000);
    expect(Math.max(...lengths)).toBeGreaterThan(151000000);
    expect(Math.max(...lengths)).toBeLessThan(153000000);
});
