import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, MoonConfig } from '../../core/SDK';

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
        // Europa orbit around Jupiter (realistic: 3.55 days)
        const angle = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.EUROPA,
            this.initialAngle
        );
        const distance = this.config.DISTANCE; // Use original sim distance
        this.position.x = Math.cos(angle) * distance;
        this.position.z = Math.sin(angle) * distance;

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

        // Load texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/2k_jupiter.jpg');

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material with texture
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

    update(time: number, camera: THREE.Camera): void {
        // Orbit (realistic period: 4333 days = ~12 years, elliptical e=0.048)
        const theta = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.JUPITER,
            this.initialAngle
        );
        const pos = Cosmos.getEllipticalOrbitalPosition(
            Cosmos.PLANETS.JUPITER.DISTANCE,
            Cosmos.ECCENTRICITY.JUPITER,
            Cosmos.INCLINATION.JUPITER,
            theta
        );
        this.position.set(pos.x, pos.y, pos.z);

        // Rotation (realistic: 9.93 hours - fastest planet!)
        this.mesh.rotation.y = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.JUPITER
        );

        // Moon Update
        this.europa.update(time, camera);

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
