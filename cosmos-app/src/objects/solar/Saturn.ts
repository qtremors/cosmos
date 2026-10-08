import { Moon, addMoonOrbit } from '../common/Moon';
import { BODY_DATA } from '../../core/BodyData';
import * as THREE from 'three';
import { SceneAssets } from '../../core/SceneAssets';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, RingConfig } from '../../core/SDK';



export class Saturn extends THREE.Group {
    private worldPosition = new THREE.Vector3();
    public readonly radius: number;
    public readonly titan: Moon;
    public readonly enceladus: Moon;

    private mesh: THREE.Mesh;
    private rings: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor(assets = new SceneAssets()) {
        super();

        const config = Cosmos.PLANETS.SATURN;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        const loader = assets;
        const texture = loader.loadTexture('/textures/2k_saturn.jpg');

        const geometry = new THREE.SphereGeometry(this.radius, 48, 32);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        this.rings = this.createRings(config.RING!);
        this.add(this.rings);

        this.titan = new Moon({ name: 'Titan', radius: config.MOON.RADIUS, distance: config.MOON.DISTANCE, color: 0xe6d4be });
        this.enceladus = new Moon({ name: 'Enceladus', radius: 0.5, distance: 26, color: 0xf2f4ff });
        addMoonOrbit(this, this.titan);
        addMoonOrbit(this, this.enceladus);
        this.userData.orbit = { ...BODY_DATA.Saturn, visualAxis: config.DISTANCE };

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Saturn';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);

        this.mesh.rotation.x = Math.PI * 0.15;
        this.rings.rotation.x = Math.PI * 0.15;
        this.rotation.z = Math.PI * 0.15;
    }

    private createRings(config: RingConfig): THREE.Mesh {
        const geometry = new THREE.RingGeometry(config.INNER_RADIUS, config.OUTER_RADIUS, 128);

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
        const theta = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.SATURN,
            this.initialAngle,
            Cosmos.ECCENTRICITY.SATURN
        );
        const pos = Cosmos.getEllipticalOrbitalPosition(
            Cosmos.PLANETS.SATURN.DISTANCE,
            Cosmos.ECCENTRICITY.SATURN,
            Cosmos.INCLINATION.SATURN,
            theta
        );
        this.position.set(pos.x, pos.y, pos.z);

        this.mesh.rotation.y = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.SATURN
        );

        this.titan.update(time, camera);
        this.enceladus.update(time, camera);

        const dist = camera.position.distanceTo(this.getWorldPosition(this.worldPosition));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
