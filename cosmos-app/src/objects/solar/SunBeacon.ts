import * as THREE from 'three';
import { UNITS_PER_AU } from '../../core/PhysicalScale';

/** A steady, unresolved Sun with a small visible glare at distant viewing scales. */
export class SunBeacon extends THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
    constructor() {
        const size = 32;
        const pixels = new Uint8Array(size * size * 4);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const radius = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
                const alpha = radius > 1 ? 0 : Math.min(1, Math.exp(-radius * radius * 60) + 0.3 * Math.exp(-radius * radius * 6));
                pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
            }
        }
        const texture = new THREE.DataTexture(pixels, size, size);
        texture.needsUpdate = true;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
        super(geometry, new THREE.PointsMaterial({
            map: texture, color: 0xfff3d5, size: 24, sizeAttenuation: false,
            transparent: true, opacity: 1, blending: THREE.AdditiveBlending,
            depthWrite: false, depthTest: true, toneMapped: false,
        }));
        this.name = 'DistantSun';
        this.visible = false;
    }

    update(cameraPosition: THREE.Vector3): void {
        // Blend in as the physical Sun becomes too small to resolve on screen.
        this.material.opacity = THREE.MathUtils.clamp((cameraPosition.distanceTo(this.position) / UNITS_PER_AU - 2) / 2, 0, 1);
        this.visible = this.material.opacity > 0;
    }
}
