import * as THREE from 'three';
import { SceneAssets } from '../../core/SceneAssets';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';



export class Mars extends THREE.Group {
    private worldPosition = new THREE.Vector3();
    public readonly radius: number;

    private mesh: THREE.Mesh;
    private atmosphere: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor(assets = new SceneAssets()) {
        super();

        const config = Cosmos.PLANETS.MARS;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        const loader = assets;
        const texture = loader.loadTexture('/textures/2k_mars.jpg');

        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

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

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Mars';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
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

        this.mesh.rotation.y = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.MARS
        );

        const dist = camera.position.distanceTo(this.getWorldPosition(this.worldPosition));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
