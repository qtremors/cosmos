import React from 'react';
import * as THREE from 'three';
import { EntityInfo, EntityCategory } from '../App';
import { SystemId } from '../core/SystemManager';

interface RadarObjectListProps {
    isOpen: boolean;
    entities: EntityInfo[];
    currentSystem: string; // 'Solar System' | 'Quantumania' | 'Interstellar Space'
    lockedEntity?: EntityInfo | null; // Currently locked entity
    onLockConfig: (mesh: THREE.Object3D, radius: number) => void;
    onToggle: () => void;
}

export const RadarObjectList: React.FC<RadarObjectListProps> = ({
    isOpen,
    entities,
    currentSystem,
    lockedEntity,
    onLockConfig,
    onToggle
}) => {
    if (!isOpen) return null;

    // Filter entities by system
    const solarEntities = entities.filter(e => e.system === SystemId.SOLAR_SYSTEM);
    const quantumEntities = entities.filter(e => e.system === SystemId.QUANTUMANIA);

    // Determine which system we're in - with lock exception
    // If locked onto an object, show that object's system
    const lockedSystem = lockedEntity?.system;

    const isSolar = currentSystem === 'Solar System' || lockedSystem === SystemId.SOLAR_SYSTEM;
    const isQuantumania = currentSystem === 'Quantumania' || lockedSystem === SystemId.QUANTUMANIA;
    // Show interstellar navigation when in interstellar space OR when locked onto an interstellar object
    const isInterstellar = currentSystem === 'Interstellar Space' || lockedSystem === SystemId.INTERSTELLAR;

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

                {isSolar && (
                    <div className="object-item system-link" onClick={(e) => {
                        e.stopPropagation();
                        // Find Quantumania proxy
                        const proxy = entities.find(e => e.id === 'quantumania-proxy-blip');
                        if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                    }}>
                        <span className="dot" style={{ backgroundColor: '#aa88ff' }}></span>
                        <span className="name">Quantumania System</span>
                    </div>
                )}
                {isQuantumania && (
                    <div className="object-item system-link" onClick={(e) => {
                        e.stopPropagation();
                        // Find Solar System proxy
                        const proxy = entities.find(e => e.id === 'solar-proxy-blip');
                        if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                    }}>
                        <span className="dot" style={{ backgroundColor: '#fc3' }}></span>
                        <span className="name">Return to Solar System</span>
                    </div>
                )}
                {isInterstellar && (
                    <>
                        <div className="object-item system-link" onClick={(e) => {
                            e.stopPropagation();
                            const proxy = entities.find(e => e.id === 'solar-proxy-blip');
                            if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                        }}>
                            <span className="dot" style={{ backgroundColor: '#fc3' }}></span>
                            <span className="name">Solar System</span>
                        </div>
                        <div className="object-item system-link" onClick={(e) => {
                            e.stopPropagation();
                            const proxy = entities.find(e => e.id === 'quantumania-proxy-blip');
                            if (proxy) onLockConfig(proxy.mesh, proxy.radius);
                        }}>
                            <span className="dot" style={{ backgroundColor: '#aa88ff' }}></span>
                            <span className="name">Quantumania System</span>
                        </div>
                    </>
                )}

                {/* 2. SYSTEM SPECIFIC CONTENT */}
                {isSolar && (
                    <>
                        {/* Planets */}
                        <div className="category-header">Planets</div>
                        <div className="object-grid">
                            {solarEntities
                                .filter(e => e.category === EntityCategory.PLANET)
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
                                .filter(e => e.category === EntityCategory.MOON)
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
                                .filter(e => e.category !== EntityCategory.PLANET && e.category !== EntityCategory.MOON && !e.isSystemProxy)
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

                {isQuantumania && (
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
