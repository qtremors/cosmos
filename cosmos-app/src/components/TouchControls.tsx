import { useEffect, useRef } from 'react';

interface Props { onKey: (code: string, pressed: boolean) => void; hidden: boolean; }
const BUTTONS = [
    ['KeyW', '↑', 'Fly forward'], ['KeyS', '↓', 'Fly backward'], ['KeyA', '←', 'Fly left'], ['KeyD', '→', 'Fly right'],
    ['KeyR', 'Up', 'Fly up'], ['KeyF', 'Down', 'Fly down'], ['KeyQ', '↶', 'Roll left'], ['KeyE', '↷', 'Roll right'],
    ['ShiftLeft', 'Boost', 'Boost flight'], ['ZoomIn', '+', 'Zoom in'], ['ZoomOut', '−', 'Zoom out'],
];

function HoldButton({ code, label, name, onKey }: { code: string; label: string; name: string; onKey: Props['onKey'] }) {
    const pointers = useRef(new Set<number>());
    useEffect(() => () => { onKey(code, false); }, [code, onKey]);
    return <button type="button" aria-label={name} title={`Hold to ${name.toLowerCase()}`}
        onPointerDown={event => {
            event.preventDefault(); pointers.current.add(event.pointerId);
            event.currentTarget.setPointerCapture(event.pointerId); onKey(code, true);
        }}
        onPointerUp={event => { pointers.current.delete(event.pointerId); if (!pointers.current.size) onKey(code, false); }}
        onPointerCancel={event => { pointers.current.delete(event.pointerId); if (!pointers.current.size) onKey(code, false); }}
        onLostPointerCapture={event => { pointers.current.delete(event.pointerId); if (!pointers.current.size) onKey(code, false); }}
        onKeyDown={event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); onKey(code, true); } }}
        onKeyUp={event => { if ([' ', 'Enter'].includes(event.key)) onKey(code, false); }}
        onBlur={() => { pointers.current.clear(); onKey(code, false); }}>
        {label}
    </button>;
}

export function TouchControls({ onKey, hidden }: Props) {
    useEffect(() => { if (hidden) BUTTONS.forEach(([code]) => onKey(code, false)); }, [hidden, onKey]);
    return <div className="touch-controls" data-ui hidden={hidden} role="group" aria-label="Touch flight controls">
        {BUTTONS.map(([code, label, name]) => <HoldButton key={code} code={code} label={label} name={name} onKey={onKey} />)}
        <span>Hold to fly · drag the view to look</span>
    </div>;
}
