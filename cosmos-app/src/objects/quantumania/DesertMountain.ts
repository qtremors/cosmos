import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Desert Mountain - A sandy, arid mountain with rock formations.
 */
export class DesertMountain extends FloatingMountain {
    private rocks: THREE.Group;

    constructor(position: THREE.Vector3) {
        super(
            'Dune Summit',
            position,
            55,
            new THREE.Color(0xc4a35a), // Sandy gold
            65,
            40
        );

        this.setLabelColor('#e8d4a0');

        // Add rock formations
        this.rocks = new THREE.Group();
        this.createRocks();
        this.add(this.rocks);
    }

    private createRocks(): void {
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 1,
            metalness: 0,
            flatShading: true,
        });

        // Scattered rock formations
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 15 + Math.random() * 20;

            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(4 + Math.random() * 4, 0),
                rockMat
            );
            rock.position.set(
                Math.cos(angle) * dist,
                33 + Math.random() * 5,
                Math.sin(angle) * dist
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.scale.y = 0.5 + Math.random() * 0.5;
            this.rocks.add(rock);
        }

        // Central mesa formation
        const mesa = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 12, 15, 6),
            rockMat
        );
        mesa.position.set(0, 40, 0);
        this.rocks.add(mesa);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.rocks.rotation.y = this.mesh.rotation.y;
    }
}
