import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Ruins Mountain - An ancient mountain with mysterious ruins.
 */
export class RuinsMountain extends FloatingMountain {
    private ruins: THREE.Group;

    constructor(position: THREE.Vector3) {
        super(
            'Ancient Remnant',
            position,
            50,
            new THREE.Color(0x6a5d4d), // Ancient stone
            60,
            40
        );

        this.setLabelColor('#a89880');

        // Add ruined structures
        this.ruins = new THREE.Group();
        this.createRuins();
        this.add(this.ruins);
    }

    private createRuins(): void {
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x8a7a6a,
            roughness: 1,
            metalness: 0,
            flatShading: true,
        });

        // Broken columns
        const columnPositions = [
            { x: -15, z: 0, h: 20, broken: false },
            { x: 15, z: 0, h: 15, broken: true },
            { x: 0, z: -15, h: 18, broken: false },
            { x: 0, z: 15, h: 12, broken: true },
            { x: -10, z: -10, h: 22, broken: false },
            { x: 10, z: 10, h: 8, broken: true },
        ];

        columnPositions.forEach(col => {
            const column = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2.5, col.h, 8),
                stoneMat
            );
            column.position.set(col.x, 30 + col.h / 2, col.z);

            if (col.broken) {
                column.rotation.x = (Math.random() - 0.5) * 0.3;
                column.rotation.z = (Math.random() - 0.5) * 0.3;
            }
            this.ruins.add(column);

            // Column cap if not broken
            if (!col.broken) {
                const cap = new THREE.Mesh(
                    new THREE.BoxGeometry(5, 2, 5),
                    stoneMat
                );
                cap.position.set(col.x, 30 + col.h + 1, col.z);
                this.ruins.add(cap);
            }
        });

        // Central altar/platform
        const altar = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 10),
            stoneMat
        );
        altar.position.set(0, 32, 0);
        this.ruins.add(altar);

        // Mysterious glowing rune on altar
        const runeMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.6,
        });
        const rune = new THREE.Mesh(
            new THREE.CircleGeometry(3, 6),
            runeMat
        );
        rune.rotation.x = -Math.PI / 2;
        rune.position.set(0, 33.6, 0);
        this.ruins.add(rune);

        // Scattered debris
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 25;

            const debris = new THREE.Mesh(
                new THREE.BoxGeometry(
                    2 + Math.random() * 3,
                    1 + Math.random() * 2,
                    2 + Math.random() * 3
                ),
                stoneMat
            );
            debris.position.set(
                Math.cos(angle) * dist,
                30 + Math.random() * 2,
                Math.sin(angle) * dist
            );
            debris.rotation.set(
                Math.random() * 0.5,
                Math.random() * Math.PI,
                Math.random() * 0.5
            );
            this.ruins.add(debris);
        }
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.ruins.rotation.y = this.mesh.rotation.y;
    }
}
