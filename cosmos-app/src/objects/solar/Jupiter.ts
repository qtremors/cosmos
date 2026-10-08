import * as THREE from 'three';
import { kmToUnits } from '../../core/PhysicalScale';
import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';
import type { Moon } from '../common/Moon';

export class Jupiter extends Planet {
    readonly europa: Moon;
    constructor(assets = new SceneAssets()) {
        super('JUPITER', assets, '/textures/2k_jupiter.jpg', 0.4);
        const ring = new THREE.Mesh(new THREE.RingGeometry(kmToUnits(92000), kmToUnits(129000), 96), new THREE.MeshStandardMaterial({ color: 0x8d8273, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; this.bodyFrame.add(ring);
        this.addMoon({ name: 'Io', color: 0xffca70 });
        this.europa = this.addMoon({ name: 'Europa', color: 0xe0e0e0 });
        this.addMoon({ name: 'Ganymede', color: 0xa9a193 });
        this.addMoon({ name: 'Callisto', color: 0x817969 });
    }
}
