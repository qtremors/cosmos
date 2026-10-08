import { describe, expect, it } from 'vitest';
import { eccentricAnomaly, trueAnomaly, orbitalSpeedKmS, KM_PER_AU } from '../core/OrbitalMechanics';
import { Cosmos } from '../core/SDK';

describe('Kepler timing and physical telemetry', () => {
    it.each([0, 0.017, 0.248, 0.9, 0.999999])('solves equal-area orbital timing at eccentricity %s', eccentricity => {
        for (const mean of [0, 1e-6, 0.5, Math.PI, 5.8, -0.5, 100]) {
            const eccentric = eccentricAnomaly(mean, eccentricity);
            const normalized = ((mean % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            expect(eccentric - eccentricity * Math.sin(eccentric)).toBeCloseTo(normalized, 9);
        }
    });
    it('moves faster near perihelion and completes each period', () => {
        const eccentricity = 0.248;
        expect(trueAnomaly(Math.PI / 2, eccentricity)).toBeGreaterThan(Math.PI / 2);
        expect(Cosmos.getRealisticOrbitalAngle(90560 * 86400, 90560, 0, eccentricity)).toBeCloseTo(2 * Math.PI, 9);
        const perihelion = orbitalSpeedKmS(KM_PER_AU, 365.25, KM_PER_AU * 0.8);
        const aphelion = orbitalSpeedKmS(KM_PER_AU, 365.25, KM_PER_AU * 1.2);
        expect(perihelion / aphelion).toBeCloseTo(1.5, 9);
        expect(orbitalSpeedKmS(KM_PER_AU, 365.25, KM_PER_AU)).toBeCloseTo(29.785, 2);
    });
    it('rejects unbound eccentricity values', () => {
        expect(() => eccentricAnomaly(0, 1)).toThrow(RangeError);
        expect(() => eccentricAnomaly(Infinity, 0.2)).toThrow(RangeError);
    });
});
