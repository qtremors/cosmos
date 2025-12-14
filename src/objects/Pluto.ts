import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, MoonConfig } from '../core/SDK';

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

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);

        // Material - Brownish-gray dwarf planet
        const material = new THREE.MeshStandardMaterial({
            color: config.COLOR,
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
        const config = Cosmos.PLANETS.PLUTO;

        // Orbit - slightly inclined orbit (17 degrees)
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            config.SPEED,
            config.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;
        this.position.y = Math.sin(this.initialAngle + time * config.SPEED * Cosmos.CONTROLS.ORBIT_SPEED_SCALE) * 100; // Inclined orbit

        // Rotation
        this.mesh.rotation.y += 0.002;

        // Moon
        this.charon.update(time, camera);

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
