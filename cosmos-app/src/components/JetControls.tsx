import type { JetStatus } from '../core/JetConfig';
import { useState } from 'react';
import { PanelToggle } from './PanelToggle';

interface Props {
    enabled: boolean; status: JetStatus;
    onToggle: () => void;
}

export function JetControls({ enabled, status, onToggle }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    return <section className="jet-controls" aria-label="Jet flight" data-collapsed={collapsed} data-ui>
        <div className="panel-disclosure-header jet-controls-header">
            <button type="button" className="preset-button" aria-pressed={enabled} onClick={onToggle}>{enabled ? 'Exit jet' : 'Fly jet'}</button>
            {enabled && <PanelToggle name="jet controls" collapsed={collapsed} controls="jet-settings-content" onToggle={() => setCollapsed(value => !value)} />}
        </div>
        {enabled && <div className="jet-controls-content" id="jet-settings-content" hidden={collapsed}>
            <p className="setting-description jet-flight-hint">20 m jet · Shift adds speed · Release holds speed</p>
            <p className="setting-description">W thrust · A/D bank and turn<br />R/F or ↑/↓ pitch · ←/→ yaw · Q/E roll<br />Tap Shift to add speed; hold to keep accelerating.<br />S slows to normal cruise; release and press S again to brake.<br />Drag to steer · Scroll throttle · J or Esc exit<br />Normal cruise is 100 km/s, slower near surfaces.</p>
            {status === 'loading' && <p role="status">Loading jet…</p>}
            {status === 'failed' && <p role="status">Jet unavailable. Use Retry loading to try again.</p>}
        </div>}
    </section>;
}
