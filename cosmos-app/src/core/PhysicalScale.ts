/** One common length scale for every astronomical body and orbit. */
export const KM_PER_AU = 149_597_870.7;
export const UNITS_PER_AU = 200;
export const kmToUnits = (km: number): number => km / KM_PER_AU * UNITS_PER_AU;
export const unitsToKm = (units: number): number => units / UNITS_PER_AU * KM_PER_AU;
