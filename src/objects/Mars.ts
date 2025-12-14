import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../core/SDK';

// =============================================================================
// MARS CLASS
// =============================================================================

export class Mars extends THREE.Group {
    public readonly radius: number;

    private mesh: THREE.Mesh;
    private atmosphere: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const config = Cosmos.PLANETS.MARS;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material - Procedural Texture
        const texture = this.createTexture();
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        // Atmosphere (Thin)
        const atmoGeo = new THREE.SphereGeometry(this.radius * 1.02, 64, 64);
        const atmoMat = new THREE.MeshBasicMaterial({
            color: 0xc1440e,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
        });
        this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        this.add(this.atmosphere);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Mars';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    private createTexture(): THREE.CanvasTexture {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#c1440e';
        ctx.fillRect(0, 0, size, size);

        // Simple noise simulation
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 5 + 1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() > 0.5 ? '#8c3108' : '#e06f3a';
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    update(time: number, camera: THREE.Camera): void {
        const config = Cosmos.PLANETS.MARS;

        // Orbit (unified calculation)
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            config.SPEED,
            config.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Rotation
        this.mesh.rotation.y += 0.005;

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
