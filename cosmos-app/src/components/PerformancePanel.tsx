import type { PerformanceSnapshot } from '../core/Performance';

export function PerformancePanel({ snapshot, onClose }: { snapshot: PerformanceSnapshot | null; onClose: () => void }) {
    const download = () => {
        const gl = document.querySelector('canvas')?.getContext('webgl2');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        const renderer = debug ? gl?.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
        const url = URL.createObjectURL(new Blob([JSON.stringify({ recordedAt: new Date().toISOString(), renderer, userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight, devicePixelRatio], measurement: 'CPU/wall timing and resource estimates; not total GPU memory', ...snapshot }, null, 2)], { type: 'application/json' }));
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'cosmos-performance.json'; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return <section className="performance-panel" data-ui aria-labelledby="performance-title">
        <div className="panel-header"><h2 id="performance-title">Performance</h2><button type="button" className="close-btn" aria-label="Close performance" onClick={onClose}>×</button></div>
        <div className="info-content">
            {snapshot ? <>
                <p>{snapshot.quality} · {snapshot.system} · {snapshot.samples} samples</p>
                <dl><dt>Frame time p50 / p95</dt><dd>{snapshot.frameMsP50} / {snapshot.frameMsP95} ms</dd>
                    <dt>Update/render p95</dt><dd>{snapshot.updateRenderMsP95} ms</dd>
                    <dt>Draw calls / triangles</dt><dd>{snapshot.drawCalls} / {snapshot.triangles.toLocaleString()}</dd>
                    <dt>Geometry buffers</dt><dd>{snapshot.geometryMiB} MiB</dd>
                    <dt>Texture estimate</dt><dd>{snapshot.estimatedTextureMiB} MiB</dd>
                    <dt>Shadow estimate</dt><dd>{snapshot.estimatedShadowMiB} MiB</dd>
                    <dt>Resident models</dt><dd>{snapshot.residentModels}</dd>
                    <dt>Model parsing total / max</dt><dd>{snapshot.modelParseMs} / {snapshot.modelParseMaxMs} ms</dd>
                    <dt>JS heap</dt><dd>{snapshot.jsHeapMiB === null ? 'Unavailable in this browser' : `${snapshot.jsHeapMiB} MiB`}</dd>
                </dl><button type="button" onClick={download}>Download measurements</button>
                <script type="application/json" data-performance>{JSON.stringify(snapshot)}</script>
            </> : <p>Collecting frame samples…</p>}
            <p className="setting-description">Frame and update/render timings include browser scheduling and driver calls. Memory figures are estimates, excluding driver overhead and render buffers. Compare on the same device, view, and browser.</p>
        </div>
    </section>;
}
