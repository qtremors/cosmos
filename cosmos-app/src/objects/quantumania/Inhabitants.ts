import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Inhabitants extends THREE.Group {
    public readonly items: GLBEntity[] = [];

    constructor(center: THREE.Vector3) {
        super();

        const configs = [
            { file: '/models/AlienMonster.glb', name: 'AlienMonster', scale: 30 },
            { file: '/models/AlienX.glb', name: 'AlienX', scale: 20 },
            { file: '/models/AlienX0.glb', name: 'AlienX0', scale: 20 },
            { file: '/models/AlienX1.glb', name: 'AlienX1', scale: 20 },
            { file: '/models/AlienXBaby.glb', name: 'AlienXBaby', scale: 10 },
            { file: '/models/AlienXFemale.glb', name: 'AlienXFemale', scale: 25 },
            { file: '/models/Figure1.glb', name: 'Figure1', scale: 15 },
            { file: '/models/Figure2.glb', name: 'Figure2', scale: 15 },
            { file: '/models/Figure3.glb', name: 'Figure3', scale: 15 },
            { file: '/models/Figure4.glb', name: 'Figure4', scale: 15 },
            { file: '/models/Figure5.glb', name: 'Figure5', scale: 15 },
            { file: '/models/BlackholeSkeleton.glb', name: 'BlackholeSkeleton', scale: 40 },
        ];

        const minR = 800;
        const maxR = 1200;
        const heightVar = 400;

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
