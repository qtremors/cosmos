import * as THREE from 'three';
import { GLBMountain } from './GLBMountain';

export class Structures extends THREE.Group {
    public readonly items: GLBMountain[] = [];

    constructor(center: THREE.Vector3) {
        super();

        const configs = [
            { file: '/models/Station.glb', name: 'Station', scale: 50 },
            { file: '/models/Station1.glb', name: 'Station1', scale: 40 },
            { file: '/models/Station2.glb', name: 'Station2', scale: 55 },
            { file: '/models/Station3.glb', name: 'Station3', scale: 45 },
            { file: '/models/Station4.glb', name: 'Station4', scale: 50 },
            { file: '/models/Station5.glb', name: 'Station5', scale: 60 },
        ];

        // Ring 3: Radius 1600-2000
        const minR = 1600;
        const maxR = 2000;
        const heightVar = 800;

        configs.forEach((item) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = minR + Math.random() * (maxR - minR);
            const x = center.x + Math.cos(angle) * radius;
            const z = center.z + Math.sin(angle) * radius;
            const y = (Math.random() * heightVar) - (heightVar / 2);

            const pos = new THREE.Vector3(x, y, z);
            const colors = ['#aaddff', '#ccaaff', '#88ffff', '#ffffff', '#aaaaff'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const entity = new GLBMountain(pos, item.file, item.name, item.scale, 20, color, 2);
            this.add(entity);
            this.items.push(entity);
        });
    }

    update(time: number, camera: THREE.Camera, independentTime: number): void {
        this.items.forEach(item => {
            const dist = camera.position.distanceTo(item.position);
            const isVisible = dist < 4000;
            item.visible = isVisible;

            if (item.visible) {
                item.update(time, camera, independentTime);
            }
        });
    }
}
