import { BODY_DATA } from '../core/BodyData';
import type { EntityInfo } from '../core/Entity';

export function ObjectInfo({ entity, onClose }: { entity: EntityInfo; onClose: () => void }) {
    const data = BODY_DATA[entity.label];
    return <section className="object-info" data-ui aria-labelledby="object-info-title">
        <div className="panel-header"><h2 id="object-info-title">{entity.label}</h2><button type="button" className="close-btn" aria-label="Close object information" onClick={onClose}>×</button></div>
        <div className="info-content">
            <p>{data?.fact ?? (entity.isSystemProxy ? 'A navigation destination for exploring this system.' : 'A stylized or fictional object included for exploration. Its appearance and scale are artistic choices.')}</p>
            {data && <dl>
                <dt>Mean diameter</dt><dd>{(data.radiusKm * 2).toLocaleString()} km</dd>
                {data.periodDays && <><dt>Orbit around {data.parent}</dt><dd>{data.periodDays.toLocaleString()} Earth days</dd></>}
                {data.axisKm && <><dt>Orbital semi-major axis</dt><dd>{data.axisKm.toLocaleString()} km</dd></>}
            </dl>}
            <p className="setting-description">Sizes, moon spacing, and planetary distances are adjusted for visibility. Orbits illustrate a two-body model; starting positions are randomized, not a live ephemeris. Flight distances use a visual scale.</p>
            {data && <a href={data.source} target="_blank" rel="noreferrer">Source: NASA Science</a>}
        </div>
    </section>;
}
