import { unitsToKm } from './PhysicalScale';
export { KM_PER_AU } from './PhysicalScale';

export const VISIBILITY = { SOLAR_RANGE: 35000, QUANTUMANIA_BUFFER: 500 } as const;

export function simulationDistanceToKm(distance: number): number {
    return unitsToKm(distance);
}

/** A fraction tuned at 60 FPS, converted into elapsed-time damping. */
export function dampingFactor(fractionAt60Fps: number, delta: number): number {
    return 1 - Math.pow(1 - fractionAt60Fps, delta * 60);
}
