export const QUALITY_PRESETS = {
    low: { label: 'Low', shadowSize: 512, shadows: false, asteroids: 500, stars: 2000, raySteps: 48, pixelRatio: 1 },
    medium: { label: 'Medium', shadowSize: 512, shadows: true, asteroids: 1000, stars: 5000, raySteps: 96, pixelRatio: 1 },
    high: { label: 'High', shadowSize: 1024, shadows: true, asteroids: 2000, stars: 8000, raySteps: 150, pixelRatio: 1.5 },
} as const;

export type QualityLevel = keyof typeof QUALITY_PRESETS;

export function getSavedQuality(): QualityLevel {
    try {
        const saved = localStorage.getItem('cosmos-quality');
        if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch { /* Storage can be unavailable in private/restricted contexts. */ }
    return 'medium';
}

export function saveQuality(quality: QualityLevel): void {
    try { localStorage.setItem('cosmos-quality', quality); } catch { /* Session settings still work. */ }
}
