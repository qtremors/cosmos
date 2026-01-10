import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Mountains extends THREE.Group {
    public readonly items: GLBEntity[] = [];

    constructor(center: THREE.Vector3) {
        super();

        const configs = [
            { name: 'MountForest', file: '/models/MountForest.glb', angle: 0, distance: 400, color: '#4a8c3f', scale: 60 },
            { name: 'MountFrost', file: '/models/MountFrost.glb', angle: Math.PI / 3, distance: 550, color: '#aaddff', scale: 70 },
            { name: 'MountLake', file: '/models/MountLake.glb', angle: 2 * Math.PI / 3, distance: 450, color: '#66ccff', scale: 80 },
            { name: 'MountMonument', file: '/models/MountMonument.glb', angle: Math.PI, distance: 600, color: '#ffaa44', scale: 60 },
            { name: 'PlaneCrystal', file: '/models/PlaneCrystal.glb', angle: 4 * Math.PI / 3, distance: 350, color: '#cc88ff', scale: 50 },
            { name: 'MountRust', file: '/models/MountRust.glb', angle: 5 * Math.PI / 3, distance: 500, color: '#e8d4a0', scale: 65 },
            { name: 'Bridge', file: '/models/Bridge.glb', angle: Math.PI / 2, distance: 700, color: '#aabbcc', scale: 100 },
            { name: 'PlaneDom', file: '/models/PlaneDom.glb', angle: 7 * Math.PI / 6, distance: 580, color: '#a89880', scale: 55 },
            { name: 'Plates', file: '/models/Plates.glb', angle: 11 * Math.PI / 6, distance: 480, color: '#88cc66', scale: 60 },
        ];

        configs.forEach(cfg => {
            const pos = new THREE.Vector3(
                center.x + Math.cos(cfg.angle) * cfg.distance,
                (Math.random() * 100) - 50, // Initial random height
                center.z + Math.sin(cfg.angle) * cfg.distance
            );

            const mountain = new GLBEntity(pos, cfg.file, cfg.name, cfg.scale, 50, cfg.color, 2);
            this.add(mountain);
            this.items.push(mountain);
        });
    }

    update(time: number, camera: THREE.Camera, independentTime: number): void {
        this.items.forEach(item => {
            const dist = camera.position.distanceTo(item.position);
            item.visible = dist < 4000;

            if (item.visible) {
                item.update(time, camera, independentTime);
            }
        });
    }
}
