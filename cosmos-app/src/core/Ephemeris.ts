import { Body, Vector, MakeTime, HelioState, GeoMoonState, JupiterMoons, RotationAxis, Rotation_EQJ_ECL, RotateState, RotateVector, type AstroTime, type StateVector } from 'astronomy-engine';
import * as THREE from 'three';
import elements from './SmallBodyElements.json';
import { eccentricAnomaly } from './OrbitalMechanics';
import { UNITS_PER_AU, KM_PER_AU, kmToUnits } from './PhysicalScale';

export const MIN_DATE = '1900-01-01';
export const MAX_DATE = '2100-01-01';
export interface PhysicalState { position: THREE.Vector3; velocity: THREE.Vector3 }
const rotation = Rotation_EQJ_ECL();
const radians = Math.PI / 180;
let cachedTime = NaN;
let date: AstroTime;
const states = new Map<string, PhysicalState>();
let jovian: ReturnType<typeof JupiterMoons> | null = null;

function at(time: number): AstroTime {
    if (time !== cachedTime) {
        cachedTime = time; date = MakeTime(new Date(time * 1000)); states.clear(); jovian = null;
    }
    return date;
}

/** Right-handed render axes: X=ecliptic X, Y=ecliptic north, Z=-ecliptic Y. */
function renderVector(x: number, y: number, z: number, scale: number): THREE.Vector3 {
    return new THREE.Vector3(x * scale, z * scale, -y * scale);
}
function fromEquatorial(state: StateVector): PhysicalState {
    const ecl = RotateState(rotation, state);
    return { position: renderVector(ecl.x, ecl.y, ecl.z, UNITS_PER_AU), velocity: renderVector(ecl.vx, ecl.vy, ecl.vz, KM_PER_AU / 86400) };
}

export function bodyState(name: string, time: number): PhysicalState {
    const t = at(time);
    const cached = states.get(name);
    if (cached) return cached;
    let state: PhysicalState;
    if (name === 'Moon') state = fromEquatorial(GeoMoonState(t));
    else if (['Io', 'Europa', 'Ganymede', 'Callisto'].includes(name)) {
        jovian ??= JupiterMoons(t);
        state = fromEquatorial(jovian[name.toLowerCase() as keyof typeof jovian]);
    } else if (name in elements.bodies) {
        state = keplerState(elements.bodies[name as keyof typeof elements.bodies], (t.tt - (elements.epoch - 2451545)) * 86400);
    } else state = fromEquatorial(HelioState(name as Body, t));
    states.set(name, state);
    return state;
}

export interface Elements { a: number; e: number; i: number; node: number; peri: number; mean: number; n: number }
/** Sourced osculating elements propagated as an unperturbed two-body orbit. */
export function keplerState(orbit: Elements, seconds: number): PhysicalState {
    const E = eccentricAnomaly((orbit.mean + orbit.n * seconds) * radians, orbit.e);
    const b = Math.sqrt(1 - orbit.e ** 2);
    const rate = orbit.n * radians / (1 - orbit.e * Math.cos(E));
    const orientation = new THREE.Matrix4()
        .makeRotationY(orbit.node * radians)
        .multiply(new THREE.Matrix4().makeRotationX(orbit.i * radians))
        .multiply(new THREE.Matrix4().makeRotationY(orbit.peri * radians));
    return {
        position: new THREE.Vector3(orbit.a * (Math.cos(E) - orbit.e), 0, -orbit.a * b * Math.sin(E)).applyMatrix4(orientation).multiplyScalar(kmToUnits(1)),
        velocity: new THREE.Vector3(-orbit.a * Math.sin(E) * rate, 0, -orbit.a * b * Math.cos(E) * rate).applyMatrix4(orientation),
    };
}

/** IAU pole and prime-meridian frame, independent of the orbital plane. */
export function bodyOrientation(name: string, time: number, includeSpin = true): THREE.Quaternion {
    const axis = RotationAxis(name as Body, at(time));
    const north = RotateVector(rotation, axis.north);
    const pole = renderVector(north.x, north.y, north.z, 1).normalize();
    const ra = axis.ra * 15 * radians;
    // Ascending node of the body's equator on the J2000 equator.
    const reference = axis.north;
    const node = RotateVector(rotation, new Vector(-Math.sin(ra), Math.cos(ra), 0, reference.t));
    const x = renderVector(node.x, node.y, node.z, 1);
    if (includeSpin) x.applyAxisAngle(pole, ((axis.spin % 360) * radians));
    const z = new THREE.Vector3().crossVectors(x, pole).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, pole, z));
}

/** An instantaneous osculating ellipse; a guide, not a predicted perturbed trajectory. */
export function orbitPoints(state: PhysicalState, mu = 132712440041.9394, segments = 192): THREE.Vector3[] {
    const r = state.position.clone().multiplyScalar(KM_PER_AU / UNITS_PER_AU);
    const v = state.velocity;
    const h = new THREE.Vector3().crossVectors(r, v);
    const eccentric = new THREE.Vector3().crossVectors(v, h).divideScalar(mu).sub(r.clone().normalize());
    const e = eccentric.length();
    const a = 1 / (2 / r.length() - v.lengthSq() / mu);
    const x = e > 1e-7 ? eccentric.normalize() : r.clone().normalize();
    const y = new THREE.Vector3().crossVectors(h.clone().normalize(), x);
    return Array.from({ length: segments }, (_, i) => {
        const angle = i / segments * Math.PI * 2;
        return x.clone().multiplyScalar(a * (Math.cos(angle) - e)).addScaledVector(y, a * Math.sqrt(1 - e * e) * Math.sin(angle)).multiplyScalar(kmToUnits(1));
    });
}
