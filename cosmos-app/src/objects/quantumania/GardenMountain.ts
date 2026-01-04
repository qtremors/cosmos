import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Garden Mountain - A lush garden paradise with flowers.
 */
export class GardenMountain extends FloatingMountain {
    private garden: THREE.Group;

    constructor(position: THREE.Vector3) {
        super(
            'Bloom Sanctuary',
            position,
            50,
            new THREE.Color(0x4a7a3a), // Rich grass green
            55,
            45
        );

        this.setLabelColor('#88cc66');

        // Make the base more grass-like
        (this.mesh.material as THREE.MeshStandardMaterial).roughness = 1;

        // Add garden elements
        this.garden = new THREE.Group();
        this.createGarden();
        this.add(this.garden);
    }

    private createGarden(): void {
        // Flower colors
        const flowerColors = [0xff6699, 0xffaa33, 0xff4466, 0xaa66ff, 0x66aaff];

        // Create flower clusters
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 35;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // Flower stem
            const stemMat = new THREE.MeshStandardMaterial({
                color: 0x2a5a2a,
                roughness: 1,
            });
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 4 + Math.random() * 3, 4),
                stemMat
            );
            stem.position.set(x, 30, z);
            this.garden.add(stem);

            // Flower head
            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const flowerMat = new THREE.MeshBasicMaterial({ color });
            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(1 + Math.random() * 0.5, 8, 8),
                flowerMat
            );
            flower.position.set(x, 32 + Math.random() * 2, z);
            this.garden.add(flower);
        }

        // Central gazebo/structure
        const gazeboMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.3,
        });

        // Gazebo pillars
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 10, 8),
                gazeboMat
            );
            pillar.position.set(
                Math.cos(angle) * 8,
                33,
                Math.sin(angle) * 8
            );
            this.garden.add(pillar);
        }

        // Gazebo roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(10, 5, 6),
            gazeboMat
        );
        roof.position.set(0, 40, 0);
        this.garden.add(roof);

        // Grass patches
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x5a9a4a,
            roughness: 1,
        });
        const grass = new THREE.Mesh(
            new THREE.CircleGeometry(40, 16),
            grassMat
        );
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 27.5;
        this.garden.add(grass);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.garden.rotation.y = this.mesh.rotation.y;
    }
}
