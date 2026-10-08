import { Cosmos } from './SDK';

export const KM_PER_AU = 149_597_870.7;
export const VISIBILITY = { SOLAR_RANGE: 4500, QUANTUMANIA_BUFFER: 500 } as const;

export function simulationDistanceToKm(distance: number): number {
    return distance / Cosmos.UNITS.AU * KM_PER_AU;
}

/** A fraction tuned at 60 FPS, converted into elapsed-time damping. */
export function dampingFactor(fractionAt60Fps: number, delta: number): number {
    return 1 - Math.pow(1 - fractionAt60Fps, delta * 60);
}
