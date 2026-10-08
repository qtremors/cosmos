import { useEffect, useRef, useState } from 'react';
import { EntityCategory, type EntityInfo } from '../core/Entity';
import { SystemId } from '../core/SystemManager';

interface RadarObjectListProps {
    isOpen: boolean;
    entities: EntityInfo[];
    currentSystem: string;
    lockedEntity?: EntityInfo | null;
    onLockConfig: (entity: EntityInfo) => void;
    onToggle: () => void;
}

const GROUPS = [
    { category: EntityCategory.STAR, label: 'Stars' },
    { category: EntityCategory.PLANET, label: 'Planets' },
    { category: EntityCategory.MOON, label: 'Moons' },
    { category: EntityCategory.ASTEROID, label: 'Asteroid Belt' },
    { category: EntityCategory.NEXUS, label: 'Nexus' },
    { category: EntityCategory.MOUNTAIN, label: 'Mountains & Terrain' },
    { category: EntityCategory.STRUCTURE, label: 'Structures' },
    { category: EntityCategory.INHABITANT, label: 'Inhabitants' },
    { category: EntityCategory.SHIP, label: 'Ships' },
    { category: EntityCategory.EASTER_EGG, label: 'Other Objects' },
];

export function RadarObjectList({ isOpen, entities, currentSystem, lockedEntity, onLockConfig, onToggle }: RadarObjectListProps) {
    const panelRef = useRef<HTMLElement>(null);
    const [query, setQuery] = useState('');
    useEffect(() => {
        if (isOpen) panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }, [isOpen]);
    if (!isOpen) return null;

    const system = lockedEntity?.system ?? (currentSystem === 'Solar System' ? SystemId.SOLAR_SYSTEM : currentSystem === 'Quantumania' ? SystemId.QUANTUMANIA : SystemId.INTERSTELLAR);
    const matches = (entity: EntityInfo) => entity.label.toLowerCase().includes(query.trim().toLowerCase());
    const destinations = entities.filter(entity => entity.isSystemProxy || entity.system === SystemId.INTERSTELLAR);
    const objects = entities.filter(entity => !entity.isSystemProxy && entity.system === system && matches(entity));

    const renderObject = (entity: EntityInfo) => (
        <button type="button" key={entity.id} className={`object-item ${entity.isSystemProxy ? 'system-link' : ''}`}
            aria-pressed={lockedEntity?.id === entity.id} onClick={() => onLockConfig(entity)}>
            <span className="dot" style={{ backgroundColor: entity.color }} aria-hidden="true" />
            <span className="name">{entity.label}</span>
        </button>
    );

    return (
        <section className="radar-panel" ref={panelRef} aria-labelledby="objects-title" data-ui>
            <div className="panel-header">
                <h2 id="objects-title">Explore Objects</h2>
                <button type="button" className="close-btn" onClick={onToggle} aria-label="Close objects and settings">×</button>
            </div>
            <label className="object-search">
                <span className="sr-only">Find an object</span>
                <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an object…" />
            </label>
            <div className="panel-content">
                <div className="category-header">Navigation & Deep Space</div>
                <div className="object-list">{destinations.filter(matches).map(renderObject)}</div>
                {GROUPS.map(group => {
                    const items = objects.filter(entity => entity.category === group.category && entity.system !== SystemId.INTERSTELLAR);
                    return items.length > 0 && (
                        <div key={group.category}>
                            <div className="category-header">{group.label}</div>
                            <div className="object-grid">{items.map(renderObject)}</div>
                        </div>
                    );
                })}
                {query && objects.length === 0 && !destinations.some(matches) && <p className="empty-state">No objects match “{query}”.</p>}
            </div>
        </section>
    );
}
