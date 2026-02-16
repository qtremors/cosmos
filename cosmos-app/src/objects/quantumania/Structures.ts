import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Structures extends THREE.Group {
    public readonly items: GLBEntity[] = [];

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

        const platesDist = 1200;
        const platesAngle = 0;
        const platesX = center.x + Math.cos(platesAngle) * platesDist;
        const platesZ = center.z + Math.sin(platesAngle) * platesDist;
        

        const spawnRadius = 150;

        configs.forEach((item) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spawnRadius;
            const x = platesX + Math.cos(angle) * radius;
            const z = platesZ + Math.sin(angle) * radius;
            const y = (Math.random() * 100) - 50;

            const pos = new THREE.Vector3(x, y, z);
            const colors = ['#aaddff', '#ccaaff', '#88ffff', '#ffffff', '#aaaaff'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const entity = new GLBEntity(pos, item.file, item.name, item.scale, 20, color, 2);
            

            entity.floating = false;
            entity.rotationSpeed = 0;

            this.add(entity);
            this.items.push(entity);
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
