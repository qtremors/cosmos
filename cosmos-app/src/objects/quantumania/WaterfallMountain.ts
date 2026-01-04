import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * Waterfall Mountain - A mountain with cascading water effects.
 */
export class WaterfallMountain extends FloatingMountain {
    private waterfall: THREE.Mesh;
    private pool: THREE.Mesh;
    private mist: THREE.Sprite;

    constructor(position: THREE.Vector3) {
        super(
            'Cascade Falls',
            position,
            50,
            new THREE.Color(0x5a4a3a), // Brown rocky
            70,
            35
        );

        this.setLabelColor('#66ccff');

        // Add water pool on top
        const poolMat = new THREE.MeshStandardMaterial({
            color: 0x3399cc,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.8,
        });
        this.pool = new THREE.Mesh(
            new THREE.CircleGeometry(20, 16),
            poolMat
        );
        this.pool.rotation.x = -Math.PI / 2;
        this.pool.position.y = 36;
        this.add(this.pool);

        // Add waterfall stream (vertical plane)
        const waterfallMat = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
        });
        this.waterfall = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 60),
            waterfallMat
        );
        this.waterfall.position.set(25, 0, 0);
        this.waterfall.rotation.y = Math.PI / 2;
        this.add(this.waterfall);

        // Mist at the base
        const mistTexture = this.createMistTexture();
        const mistMat = new THREE.SpriteMaterial({
            map: mistTexture,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });
        this.mist = new THREE.Sprite(mistMat);
        this.mist.scale.set(40, 20, 1);
        this.mist.position.set(25, -25, 0);
        this.mist.renderOrder = 200;
        this.add(this.mist);
    }

    private createMistTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,0.8)');
            g.addColorStop(0.5, 'rgba(255,255,255,0.3)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);

        // Animate waterfall shimmer
        (this.waterfall.material as THREE.MeshBasicMaterial).opacity =
            0.5 + Math.sin(time * 3) * 0.15;

        // Pool ripple effect
        this.pool.rotation.z = time * 0.1;

        // Mist pulse
        this.mist.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
    }
}
