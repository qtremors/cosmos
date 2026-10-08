import { BODY_DATA } from '../core/BodyData';
import type { EntityInfo } from '../core/Entity';

export function ObjectInfo({ entity, onClose }: { entity: EntityInfo; onClose: () => void }) {
    const data = BODY_DATA[entity.label];
    const precise = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Moon', 'Io', 'Europa', 'Ganymede', 'Callisto'].includes(entity.label);
    return <section className="object-info" data-ui aria-labelledby="object-info-title">
        <div className="panel-header"><h2 id="object-info-title">{entity.label}</h2><button type="button" className="close-btn" aria-label="Close object information" onClick={onClose}>×</button></div>
        <div className="info-content">
            <p>{data?.fact ?? (entity.isSystemProxy ? 'A navigation destination for exploring this system.' : 'A stylized or fictional object included for exploration. Its appearance and scale are artistic choices.')}</p>
            {entity.label.includes('Belt') && <p className="setting-description">A sparse, repeatable representative population at physical sizes and orbital distances. These rocks are not individually catalogued asteroids. Ceres and the named dwarf planets use sourced orbital elements.</p>}
            {data && <dl>
                <dt>Mean diameter</dt><dd>{(data.radiusKm * 2).toLocaleString()} km</dd>
                {data.periodDays && <><dt>Orbit around {data.parent}</dt><dd>{data.periodDays.toLocaleString()} Earth days</dd></>}
                {data.axisKm && <><dt>Orbital semi-major axis</dt><dd>{data.axisKm.toLocaleString()} km</dd></>}
            </dl>}
            {data && <p className="setting-description">True physical scale. {precise ? 'Dated geometric positions from Astronomy Engine. Planet and lunar poles and spin use IAU models.' : 'Two-body orbit from JPL Horizons elements at 8 Oct 2026 TDB. Positions become less accurate away from that epoch as precession and perturbations accumulate.'} Orbit lines show instantaneous osculating ellipses.</p>}
            {['Ceres', 'Eris', 'Haumea', 'Makemake', 'Halley'].includes(entity.label) && <p className="setting-description">Surface appearance is illustrative. Small-body shape and rotation periods are approximate; pole orientation and texture meridians are illustrative.</p>}
            {data && <p className="setting-description">Textures are static illustrations, not current weather or an authoritative map of the prime meridian. Stars are a decorative background.</p>}
            {data && <p><a href={precise ? 'https://github.com/cosinekitty/astronomy' : 'https://ssd.jpl.nasa.gov/horizons/'} target="_blank" rel="noreferrer">Orbit model: {precise ? 'Astronomy Engine' : 'JPL Horizons elements'}</a></p>}
            {data && <a href={data.source} target="_blank" rel="noreferrer">Source: NASA Science</a>}
        </div>
    </section>;
}
