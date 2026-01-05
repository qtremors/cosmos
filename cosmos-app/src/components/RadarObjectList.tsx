import React from 'react';
import * as THREE from 'three';
import { EntityInfo } from '../App';
import { SystemId } from '../core/SystemManager';

interface RadarObjectListProps {
    isOpen: boolean;
    entities: EntityInfo[];
    currentSystem: string; // 'Solar System' | 'Quantumania'
    onLockConfig: (mesh: THREE.Object3D, radius: number) => void;
    onToggle: () => void;
}

export const RadarObjectList: React.FC<RadarObjectListProps> = ({
    isOpen,
    entities,
    currentSystem,
    onLockConfig,
    onToggle
}) => {
    // We can add local search state here if needed later

    if (!isOpen) return null;

    // Filter Logic
    const solarEntities = entities.filter(e => e.system === SystemId.SOLAR_SYSTEM);
    const quantumEntities = entities.filter(e => e.system === SystemId.QUANTUMANIA);
    const isSolar = currentSystem === 'Solar System';

    return (
        <div className="radar-panel">
            <div className="panel-header">
                <h3>System Objects</h3>
                <button className="close-btn" onClick={onToggle}>×</button>
            </div>

            <div className="panel-content">
                {/* 1. NAVIGATION & DEEP SPACE (Global Access) */}
                <div className="category-header">Navigation & Deep Space</div>

                {/* Interstellar Objects */}
                <div className="object-list">
                    {entities
                        .filter(e => e.system === SystemId.INTERSTELLAR)
                        .map(ent => (
                            <div
                                key={ent.id}
                                className="object-item"
                                onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}
                            >
                                <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                <span className="name">{ent.label}</span>
                            </div>
                        ))}
                </div>

                {/* System Links */}
                {isSolar ? (
                    <div className="object-item system-link" onClick={(e) => {
                        e.stopPropagation();
                        const proxy = entities.find(e => e.isSystemProxy && e.system === SystemId.QUANTUMANIA);
                        if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                    }}>
                        <span className="dot" style={{ backgroundColor: '#aa88ff' }}></span>
                        <span className="name">Quantumania System</span>
                    </div>
                ) : (
                    <div className="object-item system-link" onClick={(e) => {
                        e.stopPropagation();
                        const proxy = entities.find(e => e.label === 'Sun');
                        if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                    }}>
                        <span className="dot" style={{ backgroundColor: '#fc3' }}></span>
                        <span className="name">Return to Solar System</span>
                    </div>
                )}

                {/* 2. SYSTEM SPECIFIC CONTENT */}
                {isSolar && (
                    <>
                        {/* Planets */}
                        <div className="category-header">Planets</div>
                        <div className="object-grid">
                            {solarEntities
                                .filter(e => ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(e.label))
                                .map(ent => (
                                    <div
                                        key={ent.id}
                                        className="object-item"
                                        onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}
                                    >
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Moons */}
                        <div className="category-header">Moons</div>
                        <div className="object-grid">
                            {solarEntities
                                .filter(e => ['Moon', 'Europa', 'Titan', 'Charon'].includes(e.label))
                                .map(ent => (
                                    <div
                                        key={ent.id}
                                        className="object-item"
                                        onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}
                                    >
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Others */}
                        <div className="category-header">Others</div>
                        <div className="object-list">
                            {solarEntities
                                .filter(e => !['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Moon', 'Europa', 'Titan', 'Charon'].includes(e.label))
                                .map(ent => (
                                    <div
                                        key={ent.id}
                                        className="object-item"
                                        onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}
                                    >
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>
                    </>
                )}

                {!isSolar && (
                    <>
                        <div className="category-header" style={{ color: '#aa88ff' }}>Quantumania</div>

                        {/* Nexus */}
                        {quantumEntities.filter(e => e.label === 'Nexus').map(ent => (
                            <div key={ent.id} className="object-item highlight" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                <span className="name">{ent.label}</span>
                            </div>
                        ))}

                        {/* Mountains & Terrain */}
                        <div className="category-header">Mountains & Terrain</div>
                        <div className="object-grid">
                            {quantumEntities
                                .filter(e =>
                                    (e.label.startsWith('Mount') || e.label.startsWith('Plane') || e.label.startsWith('Plate') || e.label === 'Bridge') &&
                                    e.label !== 'Nexus'
                                )
                                .map(ent => (
                                    <div key={ent.id} className="object-item" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Structures */}
                        <div className="category-header">Structures</div>
                        <div className="object-grid">
                            {quantumEntities
                                .filter(e => e.label.startsWith('Station') || e.label.includes('Ring') || e.label.includes('Portal'))
                                .map(ent => (
                                    <div key={ent.id} className="object-item" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Inhabitants */}
                        <div className="category-header">Inhabitants</div>
                        <div className="object-grid">
                            {quantumEntities
                                .filter(e => e.label.includes('Alien') || e.label.includes('Whale') || e.label.includes('Ray'))
                                .map(ent => (
                                    <div key={ent.id} className="object-item" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Ships */}
                        <div className="category-header">Ships</div>
                        <div className="object-grid">
                            {quantumEntities
                                .filter(e => e.label.includes('Ship') || e.label.includes('Fighter'))
                                .map(ent => (
                                    <div key={ent.id} className="object-item" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                        <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                        <span className="name">{ent.label}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Uncategorized */}
                        {quantumEntities.some(e =>
                            !['Nexus', 'Mount', 'Plane', 'Plate', 'Bridge'].some(p => e.label.startsWith(p)) &&
                            !['Station', 'Ring', 'Portal', 'Alien', 'Whale', 'Ray', 'Ship', 'Fighter', 'Quantumania'].some(k => e.label.includes(k)) &&
                            !e.isSystemProxy
                        ) && (
                                <>
                                    <div className="category-header">Others</div>
                                    <div className="object-grid">
                                        {quantumEntities
                                            .filter(e =>
                                                !['Nexus', 'Mount', 'Plane', 'Plate', 'Bridge'].some(p => e.label.startsWith(p)) &&
                                                !['Station', 'Ring', 'Portal', 'Alien', 'Whale', 'Ray', 'Ship', 'Fighter', 'Quantumania'].some(k => e.label.includes(k)) &&
                                                !e.isSystemProxy
                                            )
                                            .map(ent => (
                                                <div key={ent.id} className="object-item" onClick={(e) => { e.stopPropagation(); onLockConfig(ent.mesh, ent.radius); }}>
                                                    <span className="dot" style={{ backgroundColor: ent.color }}></span>
                                                    <span className="name">{ent.label}</span>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                    </>
                )}
            </div>
        </div>
    );
};
