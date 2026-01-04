import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Volcanic Mountain - A fiery mountain with lava effects.
 */
export class VolcanicMountain extends FloatingMountain {
    private lavaPool: THREE.Mesh;
    private glowLight: THREE.PointLight;

    constructor(position: THREE.Vector3) {
        super(
            'Ember Peak',
            position,
            50,
            new THREE.Color(0x3a2a2a), // Dark volcanic rock
            85,
            25
        );

        this.setLabelColor('#ff6633');

        // Make it look like volcanic rock
        (this.mesh.material as THREE.MeshStandardMaterial).roughness = 1;

        // Lava crater on top
        const lavaMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.9,
        });
        this.lavaPool = new THREE.Mesh(
            new THREE.CircleGeometry(15, 16),
            lavaMat
        );
        this.lavaPool.rotation.x = -Math.PI / 2;
        this.lavaPool.position.y = 43;
        this.add(this.lavaPool);

        // Crater rim
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 1,
            metalness: 0,
        });
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(18, 4, 8, 16),
            rimMat
        );
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 42;
        this.add(rim);

        // Glow light from lava
        this.glowLight = new THREE.PointLight(0xff4400, 1, 100);
        this.glowLight.position.set(0, 50, 0);
        this.add(this.glowLight);

        // Smoke/steam particles (simplified as sprites)
        this.createSmoke();
    }

    private createSmoke(): void {
        const smokeMat = new THREE.SpriteMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            depthTest: false,
        });

        for (let i = 0; i < 5; i++) {
            const smoke = new THREE.Sprite(smokeMat.clone());
            smoke.scale.set(15, 15, 1);
            smoke.position.set(
                (Math.random() - 0.5) * 10,
                50 + i * 10,
                (Math.random() - 0.5) * 10
            );
            smoke.renderOrder = 200;
            this.add(smoke);
        }
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);

        // Pulsing lava
        (this.lavaPool.material as THREE.MeshBasicMaterial).opacity =
            0.7 + Math.sin(time * 2) * 0.2;

        // Flickering light
        this.glowLight.intensity = 0.8 + Math.sin(time * 5) * 0.3 + Math.random() * 0.1;
    }
}
