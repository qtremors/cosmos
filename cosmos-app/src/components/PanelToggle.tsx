interface Props { name: string; collapsed: boolean; controls: string; onToggle: () => void; }

export function PanelToggle({ name, collapsed, controls, onToggle }: Props) {
    const label = `${collapsed ? 'Expand' : 'Collapse'} ${name}`;
    return <button type="button" className="panel-toggle" aria-label={label} title={label}
        aria-expanded={!collapsed} aria-controls={controls} onClick={onToggle}>
        <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
    </button>;
}
