import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Ships extends THREE.Group {
    public readonly items: GLBEntity[] = [];

    constructor(center: THREE.Vector3) {
        super();

        const configs = [
            { file: '/models/Drone.glb', name: 'Drone', scale: 10 },
            { file: '/models/Drone1.glb', name: 'Drone1', scale: 10 },
            { file: '/models/Drone2.glb', name: 'Drone2', scale: 10 },
            { file: '/models/Robot.glb', name: 'Robot', scale: 15 },
            { file: '/models/Ship.glb', name: 'Ship', scale: 20 },
            { file: '/models/Ship1.glb', name: 'Ship1', scale: 20 },
            { file: '/models/Ship2.glb', name: 'Ship2', scale: 25 },
            { file: '/models/Ship3.glb', name: 'Ship3', scale: 30 },
            { file: '/models/Ship4.glb', name: 'Ship4', scale: 20 },
            { file: '/models/Jet.glb', name: 'Jet', scale: 15 },
        ];

        const minR = 1200;
        const maxR = 1500;
        const heightVar = 600;

        configs.forEach((item) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = minR + Math.random() * (maxR - minR);
            const x = center.x + Math.cos(angle) * radius;
            const z = center.z + Math.sin(angle) * radius;
            const y = (Math.random() * heightVar) - (heightVar / 2);

            const pos = new THREE.Vector3(x, y, z);
            const colors = ['#aaddff', '#ccaaff', '#88ffff', '#ffffff', '#aaaaff'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const entity = new GLBEntity(pos, item.file, item.name, item.scale, 20, color, 2);
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
