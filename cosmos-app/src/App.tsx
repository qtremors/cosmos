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
import { DEFAULT_TIME_SCALE } from './core/TimeConfig';
import type { SceneController, LockedInfo } from './core/SceneController';

export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const radarButtonRef = useRef<HTMLButtonElement>(null);
    const controllerRef = useRef<SceneController | null>(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showUI, setShowUI] = useState(true);
    const [showRadarList, setShowRadarList] = useState(false);
    const [cameraSpeed, setCameraSpeed] = useState(0);
    const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null);
    const [nearestObject, setNearestObject] = useState<{ name: string; distance: number } | null>(null);
    const [timeScale, setTimeScale] = useState(DEFAULT_TIME_SCALE);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSystem, setCurrentSystem] = useState('Solar System');
    const [entities, setEntities] = useState<EntityInfo[]>([]);
    const [quality, setQuality] = useState<QualityLevel>(getSavedQuality);
    const [assetStatus, setAssetStatus] = useState(EMPTY_ASSET_STATUS);
    const [sceneError, setSceneError] = useState<string | null>(null);
    const [lockedEntity, setLockedEntity] = useState<EntityInfo | null>(null);
    const [diagnostics, setDiagnostics] = useState(() => new URLSearchParams(location.search).get('profile') === '1');
    const [performanceSnapshot, setPerformanceSnapshot] = useState<PerformanceSnapshot | null>(null);
    const [showInfo, setShowInfo] = useState(() => !matchMedia('(max-width: 600px)').matches);
    const [darkSideFill, setDarkSideFill] = useState(0);
    const [starting, setStarting] = useState(true);
    const settingsRef = useRef({ quality, showLabels, timeScale, paused: isPaused, darkSideFill, diagnostics });
    const closeRadar = useCallback(() => {
        setShowRadarList(false);
        radarButtonRef.current?.focus();
    }, []);
    const lockOnTarget = useCallback((entity: EntityInfo) => { setShowInfo(!matchMedia('(max-width: 600px)').matches); controllerRef.current?.lock(entity); }, []);
    const resetView = useCallback(() => controllerRef.current?.resetView(), []);
    const touchKey = useCallback((code: string, pressed: boolean) => controllerRef.current?.key(code, pressed), []);

    useEffect(() => {
        const narrow = matchMedia('(max-width: 600px)');
        const collapseInfo = () => { if (narrow.matches) setShowInfo(false); };
        narrow.addEventListener('change', collapseInfo);
        return () => narrow.removeEventListener('change', collapseInfo);
    }, []);

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
                onPerformance: setPerformanceSnapshot,
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
        const settings = { quality, showLabels, timeScale, paused: isPaused, darkSideFill, diagnostics };
        settingsRef.current = settings;
        controllerRef.current?.configure(settings);
        saveQuality(quality);
    }, [quality, showLabels, timeScale, isPaused, darkSideFill, diagnostics]);
    return (
        <div className="container">

            <div ref={mountRef} className="canvas-container" style={{ position: 'relative' }} />

            <div className="overlay" style={{ opacity: showUI ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: 'none' }}>
                Cosmos<br />
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                    [WASD] Move | [R/F] Up/Down<br />
                    [Q/E] Roll | [MOUSE] Look (Drag)<br />
                    [SHIFT] Boost<br />
                    [SCROLL] Smooth Zoom<br />
                    [L] Labels | [H] HUD | [T] Top View<br />
                    [N] Next Object | [ESC] Unlock<br />
                </span>
            </div>

            <div className="hud-layer" hidden={!showUI} data-ui>
                    {/* Floating UI Layer */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

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
                                <span className="radar-center" aria-hidden="true"></span>
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
                                currentSystem={currentSystem}
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

                        {/* Stats HUD */}
                        <div className="stats-hud" style={{ pointerEvents: 'auto' }}>
                            {lockedInfo ? (
                                <>
                                    <div className="stats-hud-title">Locked: {lockedInfo.name}</div>
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
                                    <div className="stats-hud-title">🚀 Free Flight</div>
                                    <div className="stats-hud-row">
                                        <span className="stats-hud-label">Speed (visual):</span>
                                        <span className="stats-hud-value">{cameraSpeed} km/s</span>
                                    </div>
                                    {nearestObject && (
                                        <>
                                            <div className="stats-hud-row">
                                                <span className="stats-hud-label">Nearest:</span>
                                                <span className="stats-hud-value">{nearestObject.name}</span>
                                            </div>
                                            <div className="stats-hud-row">
                                                <span className="stats-hud-label">Distance (visual):</span>
                                                <span className="stats-hud-value">{nearestObject.distance.toLocaleString()} km</span>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
            </div>
            {diagnostics && showUI && <PerformancePanel snapshot={performanceSnapshot} onClose={() => { setDiagnostics(false); radarButtonRef.current?.focus(); }} />}
            {lockedEntity && showUI && <>
                {showInfo ? <ObjectInfo entity={lockedEntity} onClose={() => { setShowInfo(false); radarButtonRef.current?.focus(); }} /> : <button type="button" className="info-toggle" data-ui onClick={() => setShowInfo(true)}>Object information</button>}
            </>}
            <TouchControls onKey={touchKey} hidden={!showUI || showRadarList || Boolean(sceneError) || starting} />
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
