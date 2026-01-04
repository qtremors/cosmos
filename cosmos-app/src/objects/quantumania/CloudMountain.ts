import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Cloud Mountain - A mystical mountain shrouded in clouds.
 */
export class CloudMountain extends FloatingMountain {
    private clouds: THREE.Sprite[];

    constructor(position: THREE.Vector3) {
        super(
            'Nimbus Haven',
            position,
            55,
            new THREE.Color(0x8899aa), // Misty gray-blue
            70,
            35
        );

        this.setLabelColor('#aabbcc');
        this.clouds = [];

        // Add cloud layers
        this.createClouds();
    }

    private createClouds(): void {
        const cloudTexture = this.createCloudTexture();

        // Create multiple cloud layers around the mountain
        for (let i = 0; i < 12; i++) {
            const cloudMat = new THREE.SpriteMaterial({
                map: cloudTexture,
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                depthWrite: false,
                depthTest: false,
            });

            const cloud = new THREE.Sprite(cloudMat);
            const angle = (i / 12) * Math.PI * 2;
            const dist = 30 + Math.random() * 25;
            const height = 20 + Math.random() * 40;

            cloud.position.set(
                Math.cos(angle) * dist,
                height,
                Math.sin(angle) * dist
            );
            cloud.scale.set(30 + Math.random() * 20, 15 + Math.random() * 10, 1);
            cloud.renderOrder = 200;
            this.add(cloud);
            this.clouds.push(cloud);
        }
    }

    private createCloudTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,0.8)');
            g.addColorStop(0.4, 'rgba(255,255,255,0.4)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);

        // Animate clouds drifting
        this.clouds.forEach((cloud, i) => {
            const phase = i * 0.5;
            cloud.position.x += Math.sin(time * 0.2 + phase) * 0.02;
            cloud.position.z += Math.cos(time * 0.15 + phase) * 0.02;
            cloud.material.opacity = 0.3 + Math.sin(time * 0.5 + phase) * 0.1;
        });
    }
}
