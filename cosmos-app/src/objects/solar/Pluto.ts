import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, MoonConfig } from '../../core/SDK';

// =============================================================================
// CHARON MOON CLASS
// =============================================================================

class Charon extends THREE.Mesh {
    public readonly config: MoonConfig;
    private initialAngle: number;
    private label: CSS2DObject;

    constructor(config: MoonConfig) {
        const geometry = new THREE.SphereGeometry(config.RADIUS, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8a8a8a,
            roughness: 0.8,
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
        div.textContent = 'Charon';
        div.style.fontSize = '10px';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, config.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        // Charon orbit around Pluto (realistic: 6.39 days, tidally locked)
        const angle = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.CHARON,
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
// PLUTO CLASS
// =============================================================================

export class Pluto extends THREE.Group {
    public readonly radius: number;
    public readonly charon: Charon;

    private mesh: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const config = Cosmos.PLANETS.PLUTO;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Load texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/Pluto.jpg');

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        // Material with texture
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        // Moon: Charon
        this.charon = new Charon(config.MOON!);
        this.add(this.charon);

        // Charon Orbit Path
        const charonOrbitCurve = new THREE.EllipseCurve(
            0, 0,
            config.MOON!.DISTANCE, config.MOON!.DISTANCE,
            0, 2 * Math.PI,
            false, 0
        );
        const charonOrbitPoints = charonOrbitCurve.getPoints(64);
        const charonOrbitGeo = new THREE.BufferGeometry().setFromPoints(charonOrbitPoints);
        charonOrbitGeo.rotateX(-Math.PI / 2);
        const charonOrbitMat = new THREE.LineBasicMaterial({
            color: 0x8a8a8a,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
        });
        const charonOrbitLine = new THREE.LineLoop(charonOrbitGeo, charonOrbitMat);
        this.add(charonOrbitLine);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Pluto';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbit (realistic period: 90560 days = ~248 years, elliptical with e=0.248)
        const orbitalAngle = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.PLUTO,
            this.initialAngle
        );

        // Use elliptical orbit with eccentricity and inclination
        const pos = Cosmos.getEllipticalOrbitalPosition(
            Cosmos.PLANETS.PLUTO.DISTANCE,
            Cosmos.ECCENTRICITY.PLUTO,
            Cosmos.INCLINATION.PLUTO,
            orbitalAngle
        );
        this.position.set(pos.x, pos.y, pos.z);

        // Rotation (realistic: 153.29 hours = 6.39 days, retrograde)
        this.mesh.rotation.y = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.PLUTO
        );

        // Moon
        this.charon.update(time, camera);

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
