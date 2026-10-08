import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';
import * as THREE from 'three';

export class Mars extends Planet {
    constructor(assets = new SceneAssets()) {
        super('MARS', assets, '/textures/2k_mars.jpg', 0.8);
        this.addMoon({ name: 'Phobos', color: 0xb5b5b0 });
        this.addMoon({ name: 'Deimos', color: 0xb5b5b0 });
        this.add(new THREE.Mesh(new THREE.SphereGeometry(this.radius * 1.02, 48, 32), new THREE.MeshBasicMaterial({ color: 0xc1440e, transparent: true, opacity: 0.2, side: THREE.BackSide, blending: THREE.AdditiveBlending })));
    }
}
