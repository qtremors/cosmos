import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, MoonConfig } from '../core/SDK';

// =============================================================================
// EUROPA MOON CLASS
// =============================================================================

class Europa extends THREE.Mesh {
    public readonly config: MoonConfig;
    private initialAngle: number;
    private label: CSS2DObject;

    constructor(config: MoonConfig) {
        const geometry = new THREE.SphereGeometry(config.RADIUS, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.6,
            metalness: 0.1,
        });
        super(geometry, material);

        this.config = config;
        this.initialAngle = Math.random() * Math.PI * 2;

        this.castShadow = true;
        this.receiveShadow = true;

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Europa';
        div.style.fontSize = '10px';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, config.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            this.config.SPEED,
            this.config.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Label opacity
        const worldPos = new THREE.Vector3();
        this.getWorldPosition(worldPos);
        const dist = camera.position.distanceTo(worldPos);
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.config.RADIUS));
    }
}

// =============================================================================
// JUPITER CLASS
// =============================================================================

export class Jupiter extends THREE.Group {
    public readonly radius: number;
    public readonly europa: Europa;

    private mesh: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const config = Cosmos.PLANETS.JUPITER;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material - Procedural Striped Texture
        const texture = this.createTexture();
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        // Moon: Europa
        this.europa = new Europa(config.MOON!);
        this.add(this.europa);

        // Europa Orbit Path
        const europaOrbitCurve = new THREE.EllipseCurve(
            0, 0,
            config.MOON!.DISTANCE, config.MOON!.DISTANCE,
            0, 2 * Math.PI,
            false, 0
        );
        const europaOrbitPoints = europaOrbitCurve.getPoints(64);
        const europaOrbitGeo = new THREE.BufferGeometry().setFromPoints(europaOrbitPoints);
        europaOrbitGeo.rotateX(-Math.PI / 2);
        const europaOrbitMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
        });
        const europaOrbitLine = new THREE.LineLoop(europaOrbitGeo, europaOrbitMat);
        this.add(europaOrbitLine);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Jupiter';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    private createTexture(): THREE.CanvasTexture {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Draw Bands
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0.0, '#a38d77');
        gradient.addColorStop(0.2, '#ceb99e');
        gradient.addColorStop(0.4, '#a38d77');
        gradient.addColorStop(0.5, '#8c7661');
        gradient.addColorStop(0.6, '#ceb99e');
        gradient.addColorStop(0.8, '#a38d77');
        gradient.addColorStop(1.0, '#8c7661');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Add Storms / Turbulence
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 100 + 20;
            const h = Math.random() * 20 + 5;
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
        }

        // Great Red Spot
        ctx.beginPath();
        ctx.ellipse(size * 0.6, size * 0.65, 80, 50, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 50, 20, 0.4)';
        ctx.fill();

        return new THREE.CanvasTexture(canvas);
    }

    update(time: number, camera: THREE.Camera): void {
        const config = Cosmos.PLANETS.JUPITER;

        // Orbit
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            config.SPEED,
            config.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Rotation
        this.mesh.rotation.y += 0.01;

        // Moon Update
        this.europa.update(time, camera);

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
