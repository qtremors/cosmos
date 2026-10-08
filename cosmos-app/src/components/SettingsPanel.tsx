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
    currentSystem?: string; // 'Solar System' | 'Quantumania' | 'Interstellar Space'
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
    { label: 'Max', value: TIME_VALUES.MAX_SPEED, description: 'Pluto orbit in 1 min' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen, onResetView,
    timeScale,
    onTimeScaleChange,
    isPaused,
    onPauseToggle,
    currentSystem = 'Solar System',
    darkSideFill, onDarkSideFillChange, diagnostics, onDiagnosticsChange,
    quality,
    onQualityChange,
}) => {
    // Time controls are disabled in Quantumania (forced real-time)
    const isTimeControlDisabled = currentSystem === 'Quantumania';
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
                    <h3>Dark-side visibility</h3>
                    <label className="setting-description">Fill light: {Math.round(darkSideFill * 100)}%
                        <input type="range" min="0" max="1" step="0.05" value={darkSideFill} aria-label="Dark-side fill light" onChange={event => onDarkSideFillChange(Number(event.target.value))} />
                    </label>
                </section>
                {/* Time Controls Section */}
                <section className="settings-section">
                    <h3>Time</h3>

                    <p className="setting-description">Pause freezes orbits, rotation, ships, model animation, and visual effects. Camera controls and loading stay available. Speed presets affect Solar System orbits; decorative motion stays at real-time.</p>
                    <button type="button" className={`pause-button ${isPaused ? 'paused' : ''}`} aria-pressed={isPaused} onClick={onPauseToggle}>{isPaused ? '▶ Play' : '⏸ Pause'}</button>
                    {isTimeControlDisabled ? (
                        <div className="settings-row" style={{ opacity: 0.6 }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                                Time presets are unavailable in Quantumania; motion runs at real-time.
                            </span>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
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

