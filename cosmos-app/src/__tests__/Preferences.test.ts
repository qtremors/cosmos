import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PREFERENCES_KEY, readPreferences, savePreferences } from '../core/Preferences';
import { getSavedQuality, saveQuality } from '../core/Quality';
import { TIME_PRESETS } from '../core/TimeConfig';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

it('restores preferences and the existing graphics-quality choice across sessions', () => {
    const chosen = { showLabels: false, showUI: false, showOrbits: false, autoExposure: false,
        fiction: false, paused: true, diagnostics: true, timeScale: TIME_PRESETS.HOUR_6,
        darkSideFill: 0.7, showInfo: true, epoch: Date.parse('2001-02-03T04:05:00Z') / 1000 };
    savePreferences(chosen);
    saveQuality('low');
    expect(readPreferences()).toEqual(chosen);
    expect(getSavedQuality()).toBe('low');
    savePreferences({ ...chosen, epoch: null, showInfo: null });
    expect(readPreferences()).toMatchObject({ epoch: null, showInfo: null });
});

it.each(['broken JSON', 'null', '{"version":2,"fiction":false}', '[]'])('ignores corrupt or unsupported storage: %s', raw => {
    const defaults = readPreferences();
    localStorage.setItem(PREFERENCES_KEY, raw);
    expect(readPreferences()).toEqual(defaults);
});

it('keeps valid fields while rejecting unsafe simulation values and incorrect types', () => {
    const defaults = readPreferences();
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ version: 1, fiction: false, showLabels: 'false',
        showUI: 0, timeScale: -100, darkSideFill: 2, epoch: 1e99, showInfo: 'true' }));
    expect(readPreferences()).toEqual({ ...defaults, fiction: false });
    localStorage.setItem(PREFERENCES_KEY, '{"version":1,"timeScale":1e999,"darkSideFill":1e999,"epoch":1e999}');
    expect(readPreferences()).toEqual(defaults);
});

it('works with restricted storage and full storage', () => {
    const defaults = readPreferences();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(readPreferences()).toEqual(defaults);
    expect(getSavedQuality()).toBe('medium');
    expect(() => { savePreferences(defaults); saveQuality('high'); }).not.toThrow();
});
