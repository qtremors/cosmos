import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Ice Mountain - A frozen crystalline mountain with icy blue tones.
 */
export class IceMountain extends FloatingMountain {
    private icicles: THREE.Group;

    constructor(position: THREE.Vector3) {
        super(
            'Frost Summit',
            position,
            55,
            new THREE.Color(0x88bbdd), // Icy blue
            90,
            35
        );

        this.setLabelColor('#aaddff');

        // Make the main mountain more translucent
        (this.mesh.material as THREE.MeshStandardMaterial).transparent = true;
        (this.mesh.material as THREE.MeshStandardMaterial).opacity = 0.85;
        (this.mesh.material as THREE.MeshStandardMaterial).metalness = 0.3;

        // Add icicle formations
        this.icicles = new THREE.Group();
        this.createIcicles();
        this.add(this.icicles);
    }

    private createIcicles(): void {
        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xaaeeff,
            roughness: 0.2,
            metalness: 0.5,
            transparent: true,
            opacity: 0.7,
        });

        // Crystal spires on top
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 15 + Math.random() * 10;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const crystal = new THREE.Mesh(
                new THREE.ConeGeometry(3 + Math.random() * 2, 20 + Math.random() * 15, 4),
                iceMat
            );
            crystal.position.set(x, 50 + Math.random() * 10, z);
            crystal.rotation.x = (Math.random() - 0.5) * 0.2;
            crystal.rotation.z = (Math.random() - 0.5) * 0.2;
            this.icicles.add(crystal);
        }

        // Central ice formation
        const centerCrystal = new THREE.Mesh(
            new THREE.ConeGeometry(5, 30, 5),
            iceMat
        );
        centerCrystal.position.set(0, 55, 0);
        this.icicles.add(centerCrystal);

        // Snow cap (flat disk on top)
        const snowCap = new THREE.Mesh(
            new THREE.CircleGeometry(35, 8),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
        );
        snowCap.rotation.x = -Math.PI / 2;
        snowCap.position.y = 45;
        this.icicles.add(snowCap);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.icicles.rotation.y = this.mesh.rotation.y;
    }
}
