import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Ships extends THREE.Group {
    public readonly items: GLBEntity[] = [];

    constructor(center: THREE.Vector3) {
        super();

        const configs = [
            { file: '/models/Ship.glb', name: 'Ship', scale: 20 },
            { file: '/models/Ship1.glb', name: 'Ship1', scale: 20 },
            { file: '/models/Ship2.glb', name: 'Ship2', scale: 25 },
            { file: '/models/Ship3.glb', name: 'Ship3', scale: 30 },
            { file: '/models/Ship4.glb', name: 'Ship4', scale: 20 },
        ];

        const platesDist = 1200;
        const platesAngle = 0;

        this.userData.platesCenter = new THREE.Vector3(
            center.x + Math.cos(platesAngle) * platesDist,
            0,
            center.z + Math.sin(platesAngle) * platesDist
        );
        

        const minOrbitR = 300;
        const maxOrbitR = 500;

        configs.forEach((item) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = minOrbitR + Math.random() * (maxOrbitR - minOrbitR);
            const x = this.userData.platesCenter.x + Math.cos(angle) * radius;
            const z = this.userData.platesCenter.z + Math.sin(angle) * radius;
            const y = (Math.random() * 200) - 100;

            const pos = new THREE.Vector3(x, y, z);
            const colors = ['#aaddff', '#ccaaff', '#88ffff', '#ffffff', '#aaaaff'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const entity = new GLBEntity(pos, item.file, item.name, item.scale, 20, color, 2);
            

            entity.userData.orbitRadius = radius;
            entity.userData.orbitAngle = angle;
            entity.userData.orbitSpeed = (0.2 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1);
            

            entity.rotationSpeed = 0;

            this.add(entity);
            this.items.push(entity);
        });
    }

    update(time: number, camera: THREE.Camera, independentTime: number): void {
        const platesCenter = this.userData.platesCenter as THREE.Vector3;

        this.items.forEach(item => {
            const dist = camera.position.distanceTo(item.position);
            const isVisible = dist < 4000;
            item.visible = isVisible;

            if (item.visible) {
                item.update(time, camera, independentTime);

                // Orbital Movement
                if (item.userData.orbitSpeed) {
                    item.userData.orbitAngle += item.userData.orbitSpeed * 0.01;
                    item.position.x = platesCenter.x + Math.cos(item.userData.orbitAngle) * item.userData.orbitRadius;
                    item.position.z = platesCenter.z + Math.sin(item.userData.orbitAngle) * item.userData.orbitRadius;
                    


                    const nextAngle = item.userData.orbitAngle + (item.userData.orbitSpeed > 0 ? 0.1 : -0.1);
                    const nextX = platesCenter.x + Math.cos(nextAngle) * item.userData.orbitRadius;
                    const nextZ = platesCenter.z + Math.sin(nextAngle) * item.userData.orbitRadius;
                    
                    item.lookAt(nextX, item.position.y, nextZ);
                }
            }
        });
    }
}
