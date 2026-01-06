import { DEFAULT_TIME_SCALE, MIN_DATE, MAX_DATE, TIME_PRESETS } from './TimeConfig';

export const DEFAULT_DARK_SIDE_FILL = 0.15;
export const PREFERENCES_KEY = 'cosmos-preferences';
export interface Preferences {
    showLabels: boolean; showUI: boolean; showOrbits: boolean; autoExposure: boolean;
    fiction: boolean; paused: boolean; diagnostics: boolean; timeScale: number; darkSideFill: number;
    showInfo: boolean | null; epoch: number | null;
}
const defaults: Preferences = {
    showLabels: true, showUI: true, showOrbits: true, autoExposure: true, fiction: true,
    paused: false, diagnostics: false, timeScale: DEFAULT_TIME_SCALE, darkSideFill: DEFAULT_DARK_SIDE_FILL,
    showInfo: null, epoch: null,
};

/** Validate browser data before passing it to the simulation or interface. */
export function readPreferences(): Preferences {
    const preferences = { ...defaults };
    try {
        const saved: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? 'null');
        if (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1) return preferences;
        const values = saved as Record<string, unknown>;
        for (const key of ['showLabels', 'showUI', 'showOrbits', 'autoExposure', 'fiction', 'paused', 'diagnostics'] as const) {
            if (typeof values[key] === 'boolean') preferences[key] = values[key];
        }
        if (typeof values.timeScale === 'number' && Object.values(TIME_PRESETS).includes(values.timeScale)) preferences.timeScale = values.timeScale;
        if (typeof values.darkSideFill === 'number' && Number.isFinite(values.darkSideFill) && values.darkSideFill >= 0 && values.darkSideFill <= 1) preferences.darkSideFill = values.darkSideFill;
        if (typeof values.showInfo === 'boolean') preferences.showInfo = values.showInfo;
        if (typeof values.epoch === 'number' && Number.isFinite(values.epoch) && values.epoch >= Date.parse(MIN_DATE) / 1000 && values.epoch <= Date.parse(MAX_DATE) / 1000) preferences.epoch = values.epoch;
    } catch { /* Storage may be blocked, full, or contain invalid JSON. */ }
    return preferences;
}

export function savePreferences(preferences: Preferences): void {
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ version: 1, ...preferences })); }
    catch { /* The current session still works without persistent storage. */ }
}
