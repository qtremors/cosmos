import * as THREE from 'three';
import { GLBEntity } from './GLBEntity';

export class Inhabitants extends THREE.Group {
    public readonly items: GLBEntity[] = [];

    constructor(center: THREE.Vector3) {
        super();



        
        const bridgeX = center.x + Math.cos(Math.PI / 2) * 1500;
        const bridgeZ = center.z + Math.sin(Math.PI / 2) * 1500;
        const bridgeY = 0; // Fixed Y from Mountains.ts

        // 1. AlienXBaby at Center
        const babyPos = new THREE.Vector3(bridgeX, bridgeY + 20, bridgeZ);
        const baby = new GLBEntity(babyPos, '/models/AlienXBaby.glb', 'AlienXBaby', 20, 20, '#ffffff', 2);
        this.add(baby);
        this.items.push(baby);

        // 2. Surrounding Aliens
        const guardians = [
            { file: '/models/AlienX.glb', name: 'AlienX', scale: 25 },
            { file: '/models/AlienX0.glb', name: 'AlienX0', scale: 25 },
            { file: '/models/AlienX1.glb', name: 'AlienX1', scale: 25 },
            { file: '/models/AlienXFemale.glb', name: 'AlienXFemale', scale: 30 },
            // Removed duplicates as per request
        ];

        const circleRadius = 60; // Reduced from 100 to move them closer to baby
        guardians.forEach((guardian, index) => {
            const angle = (index / guardians.length) * Math.PI * 2;
            const gx = bridgeX + Math.cos(angle) * circleRadius;
            const gz = bridgeZ + Math.sin(angle) * circleRadius;
            const gPos = new THREE.Vector3(gx, bridgeY + 5, gz);

            const entity = new GLBEntity(gPos, guardian.file, guardian.name, guardian.scale, 20, '#aaffaa', 2);
            entity.lookAt(babyPos);
            entity.rotationSpeed = 0;
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

                // Rotate AlienXBaby
                if (item.entityName === 'AlienXBaby') {
                    item.rotation.y += 0.01;
                }
            }
        });
    }
}
