const TAU = Math.PI * 2;
export const KM_PER_AU = 149_597_870.7;

/** Solve M = E - e sin(E) for a bound ellipse. */
export function eccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
    if (!Number.isFinite(meanAnomaly) || !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) throw new RangeError('Expected a finite anomaly and 0 <= eccentricity < 1');
    const mean = ((meanAnomaly % TAU) + TAU) % TAU;
    let eccentric = eccentricity < 0.8 ? mean : Math.PI;
    for (let iteration = 0; iteration < 20; iteration++) {
        const correction = (eccentric - eccentricity * Math.sin(eccentric) - mean) / (1 - eccentricity * Math.cos(eccentric));
        eccentric -= correction;
        if (Math.abs(correction) < 1e-12) return eccentric;
    }
    // Bisection also converges for near-parabolic ellipses.
    let low = 0, high = TAU;
    for (let iteration = 0; iteration < 60; iteration++) {
        eccentric = (low + high) / 2;
        if (eccentric - eccentricity * Math.sin(eccentric) < mean) low = eccentric;
        else high = eccentric;
    }
    return eccentric;
}

export function trueAnomaly(meanAnomaly: number, eccentricity: number): number {
    if (eccentricity === 0) return meanAnomaly;
    const eccentric = eccentricAnomaly(meanAnomaly, eccentricity);
    const angle = Math.atan2(Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentric), Math.cos(eccentric) - eccentricity);
    return ((angle % TAU) + TAU) % TAU + Math.floor(meanAnomaly / TAU) * TAU;
}

/** Vis-viva, with the gravitational parameter inferred from the stated period and axis. */
export function orbitalSpeedKmS(semiMajorAxisKm: number, periodDays: number, radiusKm: number): number {
    if (semiMajorAxisKm <= 0 || periodDays <= 0 || radiusKm <= 0) return 0;
    const mu = TAU * TAU * semiMajorAxisKm ** 3 / (periodDays * 86400) ** 2;
    return Math.sqrt(Math.max(0, mu * (2 / radiusKm - 1 / semiMajorAxisKm)));
}
