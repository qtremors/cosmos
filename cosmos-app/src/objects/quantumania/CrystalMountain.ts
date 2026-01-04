import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Crystal Mountain - A mountain covered in glowing crystals.
 */
export class CrystalMountain extends FloatingMountain {
    private crystals: THREE.Group;
    private glowLight: THREE.PointLight;

    constructor(position: THREE.Vector3) {
        super(
            'Crystal Spire',
            position,
            45,
            new THREE.Color(0x664488), // Purple base
            75,
            30
        );

        this.setLabelColor('#cc88ff');

        // Add crystals
        this.crystals = new THREE.Group();
        this.createCrystals();
        this.add(this.crystals);

        // Central glow
        this.glowLight = new THREE.PointLight(0xaa66ff, 0.8, 100);
        this.glowLight.position.set(0, 50, 0);
        this.add(this.glowLight);
    }

    private createCrystals(): void {
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0xaa77ff,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7,
            emissive: 0x442266,
            emissiveIntensity: 0.3,
        });

        // Large central crystal cluster
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const tilt = 0.2 + Math.random() * 0.3;

            const crystal = new THREE.Mesh(
                new THREE.ConeGeometry(4 + Math.random() * 3, 25 + Math.random() * 15, 5),
                crystalMat
            );
            crystal.position.set(
                Math.cos(angle) * 8,
                45 + Math.random() * 10,
                Math.sin(angle) * 8
            );
            crystal.rotation.x = Math.cos(angle) * tilt;
            crystal.rotation.z = Math.sin(angle) * tilt;
            this.crystals.add(crystal);
        }

        // Central tall crystal
        const mainCrystal = new THREE.Mesh(
            new THREE.ConeGeometry(6, 40, 6),
            crystalMat
        );
        mainCrystal.position.set(0, 55, 0);
        this.crystals.add(mainCrystal);

        // Scattered smaller crystals
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 15;

            const smallCrystal = new THREE.Mesh(
                new THREE.ConeGeometry(2 + Math.random() * 2, 10 + Math.random() * 10, 4),
                crystalMat
            );
            smallCrystal.position.set(
                Math.cos(angle) * dist,
                40 + Math.random() * 5,
                Math.sin(angle) * dist
            );
            smallCrystal.rotation.x = (Math.random() - 0.5) * 0.4;
            smallCrystal.rotation.z = (Math.random() - 0.5) * 0.4;
            this.crystals.add(smallCrystal);
        }
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.crystals.rotation.y = this.mesh.rotation.y;

        // Pulsing glow
        this.glowLight.intensity = 0.6 + Math.sin(time * 1.5) * 0.3;
    }
}
