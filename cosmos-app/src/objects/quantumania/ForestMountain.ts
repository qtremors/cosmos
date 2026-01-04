import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Forest Mountain - A lush green mountain with tree-like structures.
 */
export class ForestMountain extends FloatingMountain {
    private trees: THREE.Group;

    constructor(position: THREE.Vector3) {
        super(
            'Forest Peak',
            position,
            60,
            new THREE.Color(0x2d5a27), // Dark forest green
            80,
            40
        );

        this.setLabelColor('#4a8c3f');

        // Add tree-like structures on top
        this.trees = new THREE.Group();
        this.createTrees();
        this.add(this.trees);
    }

    private createTrees(): void {
        const treeMat = new THREE.MeshStandardMaterial({
            color: 0x1a4d1a,
            roughness: 0.9,
            metalness: 0,
        });

        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 1,
            metalness: 0,
        });

        // Create several trees on the plateau
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 15 + Math.random() * 15;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // Tree trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1.5, 8, 6),
                trunkMat
            );
            trunk.position.set(x, 44, z);
            this.trees.add(trunk);

            // Tree foliage (cone)
            const foliage = new THREE.Mesh(
                new THREE.ConeGeometry(6 + Math.random() * 3, 15 + Math.random() * 5, 6),
                treeMat
            );
            foliage.position.set(x, 55, z);
            this.trees.add(foliage);
        }

        // Central larger tree
        const bigTrunk = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 3, 12, 8),
            trunkMat
        );
        bigTrunk.position.set(0, 46, 0);
        this.trees.add(bigTrunk);

        const bigFoliage = new THREE.Mesh(
            new THREE.ConeGeometry(12, 25, 8),
            treeMat
        );
        bigFoliage.position.set(0, 65, 0);
        this.trees.add(bigFoliage);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        // Trees follow mountain rotation
        this.trees.rotation.y = this.mesh.rotation.y;
    }
}
