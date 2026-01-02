import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, MoonConfig, RingConfig } from '../core/SDK';

// =============================================================================
// TITAN MOON CLASS
// =============================================================================

class Titan extends THREE.Mesh {
    public readonly config: MoonConfig;
    private initialAngle: number;
    private label: CSS2DObject;

    constructor(config: MoonConfig) {
        const geometry = new THREE.SphereGeometry(config.RADIUS, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe6d4be,
            roughness: 0.7,
            metalness: 0.0,
        });
        super(geometry, material);

        this.config = config;
        this.initialAngle = Math.random() * Math.PI * 2;

        this.castShadow = true;
        this.receiveShadow = true;

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Titan';
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
// SATURN CLASS
// =============================================================================

export class Saturn extends THREE.Group {
    public readonly radius: number;
    public readonly titan: Titan;

    private mesh: THREE.Mesh;
    private rings: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const config = Cosmos.PLANETS.SATURN;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material
        const texture = this.createTexture();
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        // Rings
        this.rings = this.createRings(config.RING!);
        this.add(this.rings);

        // Moon: Titan
        this.titan = new Titan(config.MOON!);
        this.add(this.titan);

        // Titan Orbit Path
        const titanOrbitCurve = new THREE.EllipseCurve(
            0, 0,
            config.MOON!.DISTANCE, config.MOON!.DISTANCE,
            0, 2 * Math.PI,
            false, 0
        );
        const titanOrbitPoints = titanOrbitCurve.getPoints(64);
        const titanOrbitGeo = new THREE.BufferGeometry().setFromPoints(titanOrbitPoints);
        titanOrbitGeo.rotateX(-Math.PI / 2);
        const titanOrbitMat = new THREE.LineBasicMaterial({
            color: 0xe6d4be,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
        });
        const titanOrbitLine = new THREE.LineLoop(titanOrbitGeo, titanOrbitMat);
        this.add(titanOrbitLine);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Saturn';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);

        // Tilt Saturn
        this.mesh.rotation.x = Math.PI * 0.15;
        this.rings.rotation.x = Math.PI * 0.15;
        this.rotation.z = Math.PI * 0.15;
    }

    private createTexture(): THREE.CanvasTexture {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0.0, '#e0cda7');
        gradient.addColorStop(0.5, '#c9b086');
        gradient.addColorStop(1.0, '#decba5');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(canvas);
    }

    private createRings(config: RingConfig): THREE.Mesh {
        const geometry = new THREE.RingGeometry(config.INNER_RADIUS, config.OUTER_RADIUS, 128);

        // Procedural Ring Texture
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        const centerX = size / 2;
        const centerY = size / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, size / 6, centerX, centerY, size / 2);
        gradient.addColorStop(0.3, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.4, 'rgba(200, 180, 150, 0.8)');
        gradient.addColorStop(0.5, 'rgba(200, 180, 150, 0.4)');
        gradient.addColorStop(0.6, 'rgba(200, 180, 150, 0.9)');
        gradient.addColorStop(0.7, 'rgba(200, 180, 150, 0.1)');
        gradient.addColorStop(0.8, 'rgba(200, 180, 150, 0.5)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(canvas);

        const material = new THREE.MeshStandardMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
        });

        const rings = new THREE.Mesh(geometry, material);
        rings.castShadow = true;
        rings.receiveShadow = true;
        rings.rotation.x = -Math.PI / 2;

        return rings;
    }

    update(time: number, camera: THREE.Camera): void {
        const config = Cosmos.PLANETS.SATURN;

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

        // Moon
        this.titan.update(time, camera);

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
