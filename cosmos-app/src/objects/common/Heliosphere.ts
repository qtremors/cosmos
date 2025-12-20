import * as THREE from 'three';
import { SystemId } from '../../core/SystemManager';


export class Heliosphere extends THREE.Mesh {
    public readonly systemId: SystemId;
    private center: THREE.Vector3;
    private radius: number;
    private materialRef: THREE.MeshBasicMaterial;

    constructor(
        radius: number = 2500,
        color: THREE.Color = new THREE.Color(0x6699ff),
        center: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        systemId: SystemId = SystemId.SOLAR_SYSTEM
    ) {
        const geometry = new THREE.SphereGeometry(radius, 24, 16);

        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0, // Start invisible
            side: THREE.BackSide, // Only visible from inside (mostly)
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        super(geometry, material);
        this.materialRef = material;
        this.systemId = systemId;
        this.center = center.clone();
        this.radius = radius;

        this.position.copy(center);
        this.renderOrder = 50;
    }

    update(_time: number, camera: THREE.Camera): void {
        const distToCenter = camera.position.distanceTo(this.center);
        const distToEdge = Math.abs(distToCenter - this.radius);

        const FADE_START_DIST = 1000;

        if (distToEdge < FADE_START_DIST) {
            const t = 1.0 - (distToEdge / FADE_START_DIST);

            const fade = t * t;

            this.materialRef.opacity = Math.min(0.3, fade * 0.3);
            this.visible = true;
        } else {
            this.materialRef.opacity = 0;
            this.visible = false;
        }
    }

    setColor(color: THREE.Color): void {
        this.materialRef.color.copy(color);
    }

    getCenter(): THREE.Vector3 {
        return this.center.clone();
    }
}
