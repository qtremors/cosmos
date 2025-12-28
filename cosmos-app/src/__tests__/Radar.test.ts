import { expect, it } from 'vitest';
import { projectRadarPoint } from '../core/Radar';

it('keeps near and distant objects inside the circular radar in every direction', () => {
    for (const range of [0.1, 100, 10000]) {
        for (const distance of [0, range / 2, range, range * 1000000]) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
                const point = projectRadarPoint(Math.cos(angle) * distance, Math.sin(angle) * distance, range)!;
                expect(point).not.toBeNull();
                expect(Math.hypot(point.x - 50, point.y - 50)).toBeLessThanOrEqual(41.000001);
                // The same percentage position must fit both compact and full-size radars.
                for (const size of [96, 144, 200, 320]) {
                    const x = point.x / 100 * size;
                    const y = point.y / 100 * size;
                    expect(Math.hypot(x - size / 2, y - size / 2) + 5).toBeLessThan(size / 2);
                }
            }
        }
    }
});

it('preserves bearing when clamping and remains finite at extreme distances', () => {
    const point = projectRadarPoint(3000000, 4000000, 100)!;
    expect((point.x - 50) / (point.y - 50)).toBeCloseTo(3 / 4);
    const extreme = projectRadarPoint(Number.MAX_VALUE / 2, 0, 0.1)!;
    expect(Number.isFinite(extreme.x)).toBe(true);
    expect(Number.isFinite(extreme.y)).toBe(true);
    expect(projectRadarPoint(0, 0, 100)).toEqual({ x: 50, y: 50 });
});

it.each([[NaN, 0, 1], [Infinity, 0, 1], [0, -Infinity, 1], [0, 0, 0], [0, 0, -1], [0, 0, NaN]])('rejects invalid positions or ranges instead of reusing a stale marker position', (x, y, range) => {
    expect(projectRadarPoint(x, y, range)).toBeNull();
});
