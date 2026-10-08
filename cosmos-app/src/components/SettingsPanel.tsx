import React from 'react';
import { Cosmos } from '../core/SDK';
import { QUALITY_PRESETS, type QualityLevel } from '../core/Quality';

interface SettingsPanelProps {
    isOpen: boolean;
    timeScale: number;
    onTimeScaleChange: (value: number) => void;
    isPaused: boolean;
    onPauseToggle: () => void;
    currentSystem?: string; // 'Solar System' | 'Quantumania' | 'Interstellar Space'
    quality: QualityLevel;
    onQualityChange: (quality: QualityLevel) => void;
}

const TIME_PRESETS = [
    { label: 'Real-time', value: Cosmos.TIME_PRESETS.REALTIME, description: '1 sec = 1 sec' },
    { label: '1 Min/s', value: Cosmos.TIME_PRESETS.MIN_1, description: '60x speed' },
    { label: '30 Min/s', value: Cosmos.TIME_PRESETS.MIN_30, description: '1800x speed' },
    { label: '1 Hr/s', value: Cosmos.TIME_PRESETS.HOUR_1, description: '3600x speed' },
    { label: '6 Hr/s', value: Cosmos.TIME_PRESETS.HOUR_6, description: '21600x speed' },
    { label: '12 Hr/s', value: Cosmos.TIME_PRESETS.HOUR_12, description: 'Day/Night cycle in 2s' },
    { label: '18 Hr/s', value: Cosmos.TIME_PRESETS.HOUR_18, description: '64800x speed' },
    { label: '1 Day/s', value: Cosmos.TIME_PRESETS.DAY_1, description: '86400x speed' },
    { label: 'Max', value: Cosmos.TIME_PRESETS.MAX_SPEED, description: 'Pluto orbit in 1 min' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    timeScale,
    onTimeScaleChange,
    isPaused,
    onPauseToggle,
    currentSystem = 'Solar System',
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
                {/* Time Controls Section */}
                <section className="settings-section">
                    <h3>Time</h3>

                    {isTimeControlDisabled ? (
                        <div className="settings-row" style={{ opacity: 0.6 }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>
                                ⏱️ Time locked to real-time in Quantumania
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="settings-row">
                                <div className="time-controls-row">
                                    <button
                                        type="button"
                                        className={`pause-button ${isPaused ? 'paused' : ''}`}
                                        aria-pressed={isPaused}
                                        onClick={onPauseToggle}
                                    >
                                        {isPaused ? '▶ Play' : '⏸ Pause'}
                                    </button>
                                </div>
                            </div>

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



                {/* Controls Reference */}
                <section className="settings-section">
                    <h3>Controls</h3>

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

