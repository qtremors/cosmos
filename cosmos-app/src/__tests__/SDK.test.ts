import { describe, it, expect } from 'vitest';
import { Cosmos } from '../core/SDK';

describe('Cosmos SDK', () => {
    describe('smoothstep', () => {
        it('returns 0 when value is at or below min', () => {
            expect(Cosmos.smoothstep(0, 1, 0)).toBe(0);
            expect(Cosmos.smoothstep(0, 1, -1)).toBe(0);
        });

        it('returns 1 when value is at or above max', () => {
            expect(Cosmos.smoothstep(0, 1, 1)).toBe(1);
            expect(Cosmos.smoothstep(0, 1, 2)).toBe(1);
        });

        it('returns smooth interpolated value in range', () => {
            const mid = Cosmos.smoothstep(0, 1, 0.5);
            expect(mid).toBeCloseTo(0.5, 1); // At midpoint, smoothstep(0.5) = 0.5
        });
    });

    describe('getRealisticOrbitalAngle', () => {
        it('returns initial angle when simTime is 0', () => {
            const angle = Cosmos.getRealisticOrbitalAngle(0, 365.25, Math.PI);
            expect(angle).toBeCloseTo(Math.PI, 5);
        });

        it('completes full orbit after one period', () => {
            const periodSeconds = 365.25 * Cosmos.SECONDS_PER_DAY;
            const angle = Cosmos.getRealisticOrbitalAngle(periodSeconds, 365.25, 0);
            expect(angle).toBeCloseTo(2 * Math.PI, 5);
        });
    });

    describe('getEllipticalDistance', () => {
        it('returns semi-major axis for circular orbit', () => {
            const distance = Cosmos.getEllipticalDistance(100, 0, 0);
            expect(distance).toBe(100);
        });

        it('returns perihelion distance at theta=0', () => {
            // r = a(1-e²)/(1+e) = a(1-e)(1+e)/(1+e) = a(1-e)
            const a = 100;
            const e = 0.5;
            const perihelion = Cosmos.getEllipticalDistance(a, e, 0);
            expect(perihelion).toBeCloseTo(a * (1 - e * e) / (1 + e), 5);
        });

        it('returns aphelion distance at theta=PI', () => {
            // r = a(1-e²)/(1-e) = a(1+e)
            const a = 100;
            const e = 0.5;
            const aphelion = Cosmos.getEllipticalDistance(a, e, Math.PI);
            expect(aphelion).toBeCloseTo(a * (1 - e * e) / (1 - e), 5);
        });
    });

    describe('getAdaptiveGlareOpacity', () => {
        it('returns 0 when very close', () => {
            const opacity = Cosmos.getAdaptiveGlareOpacity(5, 10);
            expect(opacity).toBe(0);
        });

        it('returns 1 when far away', () => {
            const opacity = Cosmos.getAdaptiveGlareOpacity(1000, 10);
            expect(opacity).toBe(1);
        });
    });

    describe('Constants', () => {
        it('has valid orbital periods', () => {
            expect(Cosmos.ORBITAL_PERIODS.EARTH).toBe(365.25);
            expect(Cosmos.ORBITAL_PERIODS.MERCURY).toBeLessThan(Cosmos.ORBITAL_PERIODS.EARTH);
            expect(Cosmos.ORBITAL_PERIODS.PLUTO).toBeGreaterThan(Cosmos.ORBITAL_PERIODS.NEPTUNE);
        });

        it('has valid eccentricities (0-1 range)', () => {
            Object.values(Cosmos.ECCENTRICITY).forEach(e => {
                expect(e).toBeGreaterThanOrEqual(0);
                expect(e).toBeLessThan(1);
            });
        });
    });
});
