import React from 'react';
import { TIME_PRESETS as TIME_VALUES } from '../core/TimeConfig';
import { QUALITY_PRESETS, type QualityLevel } from '../core/Quality';

interface SettingsPanelProps {
    isOpen: boolean;
    onResetView: () => void;
    timeScale: number;
    onTimeScaleChange: (value: number) => void;
    isPaused: boolean;
    onPauseToggle: () => void;
    autoExposure: boolean; onAutoExposureChange: (value: boolean) => void;
    epoch: number; onEpochChange: (value: number) => void;
    showOrbits: boolean; onOrbitsChange: (value: boolean) => void;
    fiction: boolean; onFictionChange: (value: boolean) => void;
    diagnostics: boolean;
    onDiagnosticsChange: (value: boolean) => void;
    darkSideFill: number;
    onDarkSideFillChange: (value: number) => void;
    quality: QualityLevel;
    onQualityChange: (quality: QualityLevel) => void;
}

const TIME_PRESETS = [
    { label: 'Real-time', value: TIME_VALUES.REALTIME, description: '1 sec = 1 sec' },
    { label: '1 Min/s', value: TIME_VALUES.MIN_1, description: '60x speed' },
    { label: '30 Min/s', value: TIME_VALUES.MIN_30, description: '1800x speed' },
    { label: '1 Hr/s', value: TIME_VALUES.HOUR_1, description: '3600x speed' },
    { label: '6 Hr/s', value: TIME_VALUES.HOUR_6, description: '21600x speed' },
    { label: '12 Hr/s', value: TIME_VALUES.HOUR_12, description: 'Day/Night cycle in 2s' },
    { label: '18 Hr/s', value: TIME_VALUES.HOUR_18, description: '64800x speed' },
    { label: '1 Day/s', value: TIME_VALUES.DAY_1, description: '86400x speed' },
    { label: 'Max', value: TIME_VALUES.MAX_SPEED, description: 'About 4 years per second (model range 1900–2100)' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen, onResetView,
    timeScale,
    onTimeScaleChange,
    isPaused,
    onPauseToggle,
    autoExposure, onAutoExposureChange, epoch, onEpochChange, showOrbits, onOrbitsChange, fiction, onFictionChange,
    darkSideFill, onDarkSideFillChange, diagnostics, onDiagnosticsChange,
    quality,
    onQualityChange,
}) => {

    if (!isOpen) return null;

    const getActivePreset = () => {
        return TIME_PRESETS.find(p => p.value === timeScale)?.label || 'Custom';
    };

    return (
        <section className="settings-panel-inline" aria-labelledby="settings-title" data-ui>
            <div className="settings-header">
                <h2 id="settings-title">Settings</h2>
            </div>

            <div className="settings-content">
                <section className="settings-section">
                    <h3>Graphics</h3>
                    <p className="setting-description">Use Low for smoother exploration on slower devices.</p>
                    <div className="preset-buttons" aria-label="Graphics quality">
                        {(Object.keys(QUALITY_PRESETS) as QualityLevel[]).map(level => (
                            <button type="button" key={level} className={`preset-button ${quality === level ? 'active' : ''}`}
                                aria-pressed={quality === level} onClick={() => onQualityChange(level)}>
                                {QUALITY_PRESETS[level].label}
                            </button>
                        ))}
                    </div>
                </section>
                <section className="settings-section">
                    <h3>Lighting</h3>
                    <button type="button" className="preset-button" aria-pressed={autoExposure} onClick={() => onAutoExposureChange(!autoExposure)}>Automatic exposure</button>
                    <p className="setting-description">Sunlight falls with distance squared. Automatic exposure brightens close-up views of distant worlds; fill light is an optional viewing aid.</p>
                    <label className="setting-description">Fill light: {Math.round(darkSideFill * 100)}%
                        <input type="range" min="0" max="1" step="0.05" value={darkSideFill} aria-label="Dark-side fill light" onChange={event => onDarkSideFillChange(Number(event.target.value))} />
                    </label>
                </section>
                <section className="settings-section">
                    <h3>Scientific view</h3>
                    <p className="setting-description">Bodies and distances share one scale. Use the object list for close-ups. Orbits and labels are viewing aids; camera travel is unconstrained exploration.</p>
                    <button type="button" className="preset-button" aria-pressed={showOrbits} onClick={() => onOrbitsChange(!showOrbits)}>Orbit guides</button>
                    <button type="button" className="preset-button" aria-pressed={fiction} onClick={() => onFictionChange(!fiction)}>Fictional extras</button>
                    <p className="setting-description">Enabled by default: Quantumania and its models, Arishem, Explorer, The Kyln, Alien X and the Black Hole. Switch this off for an astronomy-only view; real bodies retain their physical scale.</p>
                </section>
                <section className="settings-section">
                    <h3>Time</h3>
                    <p className="setting-description">Supported dates: 1900–2100. The clock stops at the date limit. Simpler moon and small-body orbits are most accurate near their 2026 reference epoch.</p>
                    <label className="setting-description">Date and time (UTC)
                        <input type="datetime-local" aria-label="Simulation date UTC" min="1900-01-01T00:00" max="2100-01-01T00:00" value={new Date(epoch * 1000).toISOString().slice(0, 16)} onChange={event => {
                            const value = Date.parse(event.target.value + 'Z') / 1000;
                            if (Number.isFinite(value) && value >= Date.parse('1900-01-01') / 1000 && value <= Date.parse('2100-01-01') / 1000) onEpochChange(value);
                        }} />
                    </label>
                    <button type="button" className="preset-button" onClick={() => onEpochChange(Date.now() / 1000)}>Now</button>

                    <p className="setting-description">Pause freezes orbits, rotation, ships, model animation, and visual effects. Camera controls and loading stay available. Speed presets advance the dated astronomical model everywhere; decorative motion stays at real-time.</p>
                    <button type="button" className={`pause-button ${isPaused ? 'paused' : ''}`} aria-pressed={isPaused} onClick={onPauseToggle}>{isPaused ? '▶ Play' : '⏸ Pause'}</button>
                            <div className="settings-row">
                                <label>Speed: <span className="preset-label">{getActivePreset()}</span></label>
                                <div className="preset-buttons">
                                    {TIME_PRESETS.map(preset => (
                                        <button
                                            type="button"
                                            key={preset.label}
                                            className={`preset-button ${timeScale === preset.value ? 'active' : ''}`}
                                            onClick={() => onTimeScaleChange(preset.value)}
                                            title={preset.description}
                                            aria-pressed={timeScale === preset.value}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                </section>



                <section className="settings-section">
                    <h3>Measurements</h3>
                    <button type="button" className="preset-button" aria-pressed={diagnostics} onClick={() => onDiagnosticsChange(!diagnostics)}>Performance measurements</button>
                    <p className="setting-description">Collect frame timings and resource estimates for this device. You can download a report.</p>
                </section>
                {/* Controls Reference */}
                <section className="settings-section">
                    <h3>Controls</h3>
                    <button type="button" className="preset-button" onClick={onResetView}>Reset view</button>
                    <p className="setting-description">Home returns to the Solar System overview. On touch screens, hold the flight buttons and drag the view to look.</p>

                    <div className="controls-grid">
                        <div className="control-group">
                            <h4>Movement</h4>
                            <div className="control-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div>
                            <div className="control-item"><kbd>R</kbd> Up | <kbd>F</kbd> Down</div>
                            <div className="control-item"><kbd>Shift</kbd> Boost (hold longer = faster)</div>
                        </div>

                        <div className="control-group">
                            <h4>Camera</h4>
                            <div className="control-item"><kbd>Q</kbd><kbd>E</kbd> Roll</div>
                            <div className="control-item"><kbd>Mouse</kbd> Look</div>
                            <div className="control-item"><kbd>Scroll</kbd> Zoom</div>
                        </div>

                        <div className="control-group">
                            <h4>Interface</h4>
                            <div className="control-item"><kbd>L</kbd> Labels | <kbd>H</kbd> HUD</div>
                            <div className="control-item"><kbd>T</kbd> Top View | <kbd>Esc</kbd> Unlock</div>
                            <div className="control-item"><kbd>N</kbd> Next object | <kbd>Tab</kbd> Navigate interface</div>
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
};

