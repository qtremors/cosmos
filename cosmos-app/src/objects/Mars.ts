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

        // Load texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/2k_mars.jpg');

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material with texture
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

    update(time: number, camera: THREE.Camera): void {
        // Orbit (realistic period: 687 days, elliptical e=0.093)
        const theta = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.MARS,
            this.initialAngle
        );
        const pos = Cosmos.getEllipticalOrbitalPosition(
            Cosmos.PLANETS.MARS.DISTANCE,
            Cosmos.ECCENTRICITY.MARS,
            Cosmos.INCLINATION.MARS,
            theta
        );
        this.position.set(pos.x, pos.y, pos.z);

        // Rotation (realistic: 24.62 hours - almost same as Earth!)
        this.mesh.rotation.y = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.MARS
        );

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
