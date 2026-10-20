import { PerformancePanel } from './components/PerformancePanel';
import type { PerformanceSnapshot } from './core/Performance';
import { TouchControls } from './components/TouchControls';
import { ObjectInfo } from './components/ObjectInfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { RadarObjectList } from './components/RadarObjectList';
import type { EntityInfo } from './core/Entity';
import { EMPTY_ASSET_STATUS } from './core/AssetStatus';
import { getSavedQuality, saveQuality, type QualityLevel } from './core/Quality';
import { readPreferences, savePreferences } from './core/Preferences';
import type { SceneController, LockedInfo } from './core/SceneController';
import { JetControls } from './components/JetControls';
import type { JetStatus } from './core/JetConfig';
import { PanelToggle } from './components/PanelToggle';
import type { JetFlightState } from './core/JetFlight';

export default function App() {
    const [saved] = useState(readPreferences);
    const mountRef = useRef<HTMLDivElement>(null);
    const radarButtonRef = useRef<HTMLButtonElement>(null);
    const controllerRef = useRef<SceneController | null>(null);
    const [showLabels, setShowLabels] = useState(saved.showLabels);
    const [showUI, setShowUI] = useState(saved.showUI);
    const [telemetryCollapsed, setTelemetryCollapsed] = useState(false);
    const [showRadarList, setShowRadarList] = useState(false);
    const [cameraSpeed, setCameraSpeed] = useState(0);
    const [jetEnabled, setJetEnabled] = useState(false);
    const [jetStatus, setJetStatus] = useState<JetStatus>('idle');
    const [jetFlight, setJetFlight] = useState<JetFlightState>({ throttle: 0, boosting: false });
    const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null);
    const [nearestObject, setNearestObject] = useState<{ name: string; distance: number } | null>(null);
    const [customEpoch, setCustomEpoch] = useState(saved.epoch);
    const [epoch, setEpoch] = useState(() => saved.epoch ?? Date.now() / 1000);
    const [simulationDate, setSimulationDate] = useState(() => new Date(epoch * 1000).toISOString());
    const [showOrbits, setShowOrbits] = useState(saved.showOrbits);
    const [autoExposure, setAutoExposure] = useState(saved.autoExposure);
    const [fiction, setFiction] = useState(saved.fiction);
    const [timeScale, setTimeScale] = useState(saved.timeScale);
    const [isPaused, setIsPaused] = useState(saved.paused);
    const [currentSystem, setCurrentSystem] = useState('Solar System');
    const [entities, setEntities] = useState<EntityInfo[]>([]);
    const [quality, setQuality] = useState<QualityLevel>(getSavedQuality);
    const [assetStatus, setAssetStatus] = useState(EMPTY_ASSET_STATUS);
    const [sceneError, setSceneError] = useState<string | null>(null);
    const [lockedEntity, setLockedEntity] = useState<EntityInfo | null>(null);
    const [diagnostics, setDiagnostics] = useState(() => new URLSearchParams(location.search).get('profile') === '1' || saved.diagnostics);
    const [performanceSnapshot, setPerformanceSnapshot] = useState<PerformanceSnapshot | null>(null);
    const [infoPreference, setInfoPreference] = useState(saved.showInfo);
    const [showInfo, setShowInfo] = useState(() => saved.showInfo ?? !matchMedia('(max-width: 600px)').matches);
    const [darkSideFill, setDarkSideFill] = useState(saved.darkSideFill);
    const [starting, setStarting] = useState(true);
    const settingsRef = useRef({ quality, showLabels, timeScale, paused: isPaused, darkSideFill, diagnostics, epoch, showOrbits, fiction, autoExposure, jetEnabled });
    const closeRadar = useCallback(() => {
        setShowRadarList(false);
        radarButtonRef.current?.focus();
    }, []);
    const lockOnTarget = useCallback((entity: EntityInfo) => {
        if (infoPreference === null) setShowInfo(!matchMedia('(max-width: 600px)').matches);
        controllerRef.current?.lock(entity);
    }, [infoPreference]);
    const changeInfo = (visible: boolean) => { setInfoPreference(visible); setShowInfo(visible); };
    const changeEpoch = (value: number) => { setCustomEpoch(value); setEpoch(value); };
    const useCurrentDate = () => { setCustomEpoch(null); setEpoch(Date.now() / 1000); };
    const resetView = useCallback(() => controllerRef.current?.resetView(), []);
    const touchKey = useCallback((code: string, pressed: boolean) => controllerRef.current?.key(code, pressed), []);

    useEffect(() => {
        const narrow = matchMedia('(max-width: 600px)');
        const collapseInfo = () => { if (infoPreference === null) setShowInfo(!narrow.matches); };
        narrow.addEventListener('change', collapseInfo);
        return () => narrow.removeEventListener('change', collapseInfo);
    }, [infoPreference]);

    useEffect(() => {
        let cancelled = false;
        import('./core/SceneController').then(({ createSceneController }) => {
            if (cancelled || !mountRef.current) return;
            controllerRef.current = createSceneController(mountRef.current, {
                ...settingsRef.current,
                radarButton: radarButtonRef.current,
                onAssets: setAssetStatus, onError: setSceneError, onEntities: setEntities,
                onSpeed: setCameraSpeed, onLockedInfo: setLockedInfo, onNearest: setNearestObject,
                onSystem: setCurrentSystem, onLock: setLockedEntity, onCloseRadar: closeRadar,
                onToggleLabels: () => setShowLabels(value => !value),
                onToggleHUD: () => setShowUI(value => !value),
                onPerformance: setPerformanceSnapshot, onDate: setSimulationDate,
                onJetEnabled: setJetEnabled, onJetStatus: setJetStatus,
                onJetFlight: setJetFlight,
            });
            setStarting(false);
        }).catch(() => { if (!cancelled) setSceneError('The exploration view could not start. Reload to try again.'); });
        return () => {
            cancelled = true;
            controllerRef.current?.dispose();
            controllerRef.current = null;
        };
    }, [closeRadar]);
    useEffect(() => {
        const settings = { quality, showLabels, timeScale, paused: isPaused, darkSideFill, diagnostics, epoch, showOrbits, fiction, autoExposure, jetEnabled };
        settingsRef.current = settings;
        controllerRef.current?.configure(settings);
        saveQuality(quality);
    }, [quality, showLabels, timeScale, isPaused, darkSideFill, diagnostics, epoch, showOrbits, fiction, autoExposure, jetEnabled]);
    useEffect(() => {
        savePreferences({ showLabels, showUI, showOrbits, autoExposure, fiction, timeScale,
            paused: isPaused, darkSideFill, diagnostics, showInfo: infoPreference, epoch: customEpoch });
    }, [showLabels, showUI, showOrbits, autoExposure, fiction, timeScale, isPaused, darkSideFill, diagnostics, infoPreference, customEpoch]);
    return (
        <div className="container">

            <div ref={mountRef} className="canvas-container" style={{ position: 'relative' }} />

            <div className={`hud-layer${jetEnabled ? ' jet-active' : ''}`} hidden={!showUI} data-ui>
                        {/* Main UI Container */}
                        <div className="ui-panels-container">
                            {/* Visual Radar Circle */}
                            <button
                                type="button"
                                ref={radarButtonRef}
                                aria-label="Explore objects and settings"
                                aria-expanded={showRadarList}
                                aria-controls="navigation-panels"
                                id="radar-container"
                                className="radar-visual-container"
                                style={{
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    visibility: showUI ? 'visible' : 'hidden'
                                }}
                                onClick={() => setShowRadarList(prev => !prev)}
                                title="Click to Open/Close Object List"
                            >
                                <span className="radar-viewport" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', clipPath: 'circle(50%)' }}>
                                    <span className="radar-center"></span>
                                </span>
                            </button>

                            <div id="navigation-panels" className="navigation-panels" hidden={!showRadarList}>

                            {/* Radar Object List Panel */}
                            <RadarObjectList
                                isOpen={showRadarList}
                                entities={entities}
                                currentSystem={currentSystem}
                                lockedEntity={lockedEntity}
                                onLockConfig={lockOnTarget}
                                onToggle={closeRadar}
                            />

                            {/* Settings Panel */}
                            <SettingsPanel
                                isOpen={showRadarList}
                                timeScale={timeScale}
                                onTimeScaleChange={setTimeScale}
                                isPaused={isPaused}
                                onPauseToggle={() => setIsPaused(p => !p)}
                                autoExposure={autoExposure} onAutoExposureChange={setAutoExposure}
                                epoch={epoch} onEpochChange={changeEpoch} onNow={useCurrentDate}
                                showOrbits={showOrbits} onOrbitsChange={setShowOrbits}
                                fiction={fiction} onFictionChange={setFiction}
                                quality={quality}
                                onQualityChange={setQuality}
                                onResetView={resetView}
                                darkSideFill={darkSideFill}
                                onDarkSideFillChange={setDarkSideFill}
                                diagnostics={diagnostics}
                                onDiagnosticsChange={setDiagnostics}
                            />
                            </div>
                        </div>

                        <aside className="context-panels" aria-label="Exploration information" hidden={showRadarList}>
                        <div className="stats-hud">
                            <div className="panel-disclosure-header">
                                <span>Telemetry</span>
                                <PanelToggle name="telemetry" collapsed={telemetryCollapsed} controls="telemetry-content" onToggle={() => setTelemetryCollapsed(value => !value)} />
                            </div>
                            <div id="telemetry-content" hidden={telemetryCollapsed}>
                            <time className="simulation-date" dateTime={simulationDate}>{simulationDate.slice(0, 19).replace('T', ' ')} UTC</time>
                            <div className="setting-description">True scale · {isPaused ? 'Paused' : `${timeScale.toLocaleString()}× time`}</div>
                            {lockedInfo ? (
                                <>
                                    <div className="stats-hud-title">Locked: {lockedInfo.name}</div>
                                    <div className="stats-hud-row"><span className="stats-hud-label">Camera distance:</span><span className="stats-hud-value">{Math.round(lockedInfo.viewDistanceKm).toLocaleString()} km</span></div>
                                    {lockedInfo.showOrbitalSpeed && (
                                        <div className="stats-hud-row">
                                            <span className="stats-hud-label">Orbital Speed:</span>
                                            <span className="stats-hud-value">{lockedInfo.orbitalSpeed} km/s</span>
                                        </div>
                                    )}
                                    <div className="stats-hud-row">
                                        <span className="stats-hud-label">From {lockedInfo.refName}:</span>
                                        <span className="stats-hud-value">{lockedInfo.refDist}M km</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="stats-hud-title">{jetEnabled ? 'Jet flight' : '🚀 Free Flight'}</div>
                                    <div className="stats-hud-row flight-speed">
                                        <span className="stats-hud-label">{jetEnabled ? 'Jet speed:' : 'Camera speed:'}</span>
                                        <span className="stats-hud-value">{cameraSpeed} km/s</span>
                                    </div>
                                    {jetEnabled && <div className="stats-hud-row flight-throttle">
                                        <span className="stats-hud-label">Throttle{jetFlight.boosting ? ' · Boost cruise' : ''}:</span>
                                        <span className="stats-hud-value">{Math.round(jetFlight.throttle * 100)}%</span>
                                    </div>}
                                </>
                            )}
                            {nearestObject && <>
                                <div className="stats-hud-row nearest-object">
                                    <span className="stats-hud-label">Nearest object:</span>
                                    <span className="stats-hud-value">{nearestObject.name}</span>
                                </div>
                                <div className="stats-hud-row nearest-distance" title={`Distance from the ${jetEnabled ? 'jet' : 'camera'} to the nearest object's centre. Orbiting objects keep moving when you stop.`}>
                                    <span className="stats-hud-label">Distance to nearest:</span>
                                    <span className="stats-hud-value">{nearestObject.distance.toLocaleString()} km</span>
                                </div>
                                <p className="setting-description nearest-distance-hint">Live distance · orbiting objects keep moving.</p>
                            </>}
                            </div>
                        </div>
                        <JetControls enabled={jetEnabled} status={jetStatus}
                            onToggle={() => setJetEnabled(value => !value)} />
                        {lockedEntity && (showInfo
                            ? <ObjectInfo entity={lockedEntity} onClose={() => { changeInfo(false); radarButtonRef.current?.focus(); }} />
                            : <button type="button" className="info-toggle" data-ui onClick={() => changeInfo(true)}>Object information</button>)}
                        {diagnostics && <PerformancePanel snapshot={performanceSnapshot} onClose={() => { setDiagnostics(false); radarButtonRef.current?.focus(); }} />}
                        </aside>
            </div>
            <TouchControls onKey={touchKey} jet={jetEnabled} hidden={!showUI || showRadarList || Boolean(sceneError) || starting} />
            {starting && !sceneError && <div className="asset-status" role="status">Starting exploration…</div>}
            {(assetStatus.loading || assetStatus.failed.length > 0) && (
                <div className="asset-status" role="status" data-ui>
                    {assetStatus.loading ? `Loading scenery… ${assetStatus.loaded}/${assetStatus.total}` : 'Some scenery could not load.'}
                    {assetStatus.failed.length > 0 && <button type="button" onClick={() => controllerRef.current?.retry()}>Retry loading</button>}
                </div>
            )}
            {sceneError && (
                <div className="scene-error" role="alert" data-ui>
                    <h1>Unable to display the cosmos</h1>
                    <p>{sceneError}</p>
                    <button type="button" onClick={() => window.location.reload()}>Reload</button>
                </div>
            )}
        </div>
    );
}
