import * as THREE from 'three';
import { EntityCategory, type EntityInfo } from './Entity';
import { SystemId } from './SystemId';
import { UNITS_PER_AU } from './PhysicalScale';

export { DEFAULT_DARK_SIDE_FILL } from './Preferences';
const position = new THREE.Vector3();

/** Meter the nearest astronomical body during flight, or the selected body in orbit. */
export function sceneExposure(cameraPosition: THREE.Vector3, entities: EntityInfo[], locked: EntityInfo | null, showSolar: boolean, automatic: boolean): number {
    if (!automatic || !showSolar) return 1;
    if (locked?.system === SystemId.SOLAR_SYSTEM && !locked.isSystemProxy && locked.category !== EntityCategory.EASTER_EGG) {
        locked.mesh.getWorldPosition(position);
        return Math.max(1, position.lengthSq() / UNITS_PER_AU ** 2);
    }
    let nearest = Infinity;
    let distanceSq = UNITS_PER_AU ** 2;
    for (const entity of entities) {
        if (entity.system !== SystemId.SOLAR_SYSTEM || entity.isSystemProxy || entity.category === EntityCategory.EASTER_EGG || !entity.mesh.visible || !('radius' in entity.mesh)) continue;
        entity.mesh.getWorldPosition(position);
        const cameraDistance = cameraPosition.distanceToSquared(position);
        if (cameraDistance < nearest) {
            nearest = cameraDistance;
            distanceSq = position.lengthSq();
        }
    }
    return Math.max(1, distanceSq / UNITS_PER_AU ** 2);
}
