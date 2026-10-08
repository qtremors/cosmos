import type * as THREE from 'three';
import type { SystemId } from './SystemManager';

export enum EntityCategory {
    STAR = 'star',
    PLANET = 'planet',
    DWARF_PLANET = 'dwarf_planet',
    COMET = 'comet',
    MOON = 'moon',
    ASTEROID = 'asteroid',
    EASTER_EGG = 'easter_egg',
    PROXY = 'proxy',
    NEXUS = 'nexus',
    MOUNTAIN = 'mountain',
    STRUCTURE = 'structure',
    SHIP = 'ship',
    INHABITANT = 'inhabitant',
}

export interface EntityInfo {
    mesh: THREE.Object3D;
    id: string;
    color: string;
    label: string;
    radius: number;
    system: SystemId;
    isSystemProxy?: boolean;
    category: EntityCategory;
}
