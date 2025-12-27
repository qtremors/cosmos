export interface RadarPoint { x: number; y: number; }

/** Percentage coordinates stay inside the radar at every CSS size and zoom level. */
export function projectRadarPoint(x: number, y: number, range: number): RadarPoint | null {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(range) || range <= 0) return null;
    const distance = Math.hypot(x, y);
    if (!Number.isFinite(distance)) return null;
    if (distance === 0) return { x: 50, y: 50 };
    const radius = Math.min(distance / range, 0.82) * 50;
    return { x: 50 + x / distance * radius, y: 50 + y / distance * radius };
}
