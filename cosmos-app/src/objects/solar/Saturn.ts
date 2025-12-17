import { Moon, addMoonOrbit } from '../common/Moon';
import { bodyState, bodyOrientation } from '../../core/Ephemeris';
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
    readonly moons: Moon[] = [];

    constructor(assets = new SceneAssets()) {
        super();

        const config = Cosmos.PLANETS.SATURN;
        this.radius = config.RADIUS;


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
        this.mesh.scale.y = BODY_DATA.Saturn.polarKm! / BODY_DATA.Saturn.equatorialKm!;
        this.add(this.mesh);

        this.rings = this.createRings(config.RING!);
        this.add(this.rings);

        this.titan = new Moon({ name: 'Titan', color: 0xe6d4be });
        this.enceladus = new Moon({ name: 'Enceladus', color: 0xf2f4ff });
        addMoonOrbit(this, this.titan);
        addMoonOrbit(this, this.enceladus);
        this.moons.push(this.titan, this.enceladus);
        for (const name of ['Mimas', 'Tethys', 'Dione', 'Rhea', 'Iapetus']) {
            const moon = new Moon({ name, color: 0xcac8c2 });
            addMoonOrbit(this, moon); this.moons.push(moon);
        }
        this.userData.orbit = { ...BODY_DATA.Saturn, visualAxis: config.DISTANCE };

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Saturn';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);


    }

    private createRings(config: RingConfig): THREE.Mesh {
        const geometry = new THREE.RingGeometry(config.INNER_RADIUS, config.OUTER_RADIUS, 128);

        // D/C/B/A/F ring extents and the Cassini division, in kilometres.
        const size = 1024;
        const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        for (let index = 0; index < size; index++) {
            const radius = 66900 + index / (size - 1) * (140180 - 66900);
            const opacity = radius < 74510 ? 0.06 : radius < 92000 ? 0.28 : radius < 117580 ? 0.9 : radius < 122170 ? 0.025 : radius < 136775 ? 0.65 : radius > 140000 ? 0.45 : 0.01;
            const band = 0.9 + 0.1 * Math.sin(index * 0.9);
            ctx.fillStyle = `rgba(205,190,165,${opacity * band})`; ctx.fillRect(index, 0, 1, 1);
        }
        const uv = geometry.getAttribute('uv'), position = geometry.getAttribute('position');
        for (let index = 0; index < uv.count; index++) {
            const radius = Math.hypot(position.getX(index), position.getY(index));
            uv.setXY(index, (radius - config.INNER_RADIUS) / (config.OUTER_RADIUS - config.INNER_RADIUS), 0.5);
        }

        const tex = new THREE.CanvasTexture(canvas);

        const material = new THREE.MeshStandardMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0,
        });

        const rings = new THREE.Mesh(geometry, material);
        rings.castShadow = true;
        rings.receiveShadow = true;
        rings.rotation.x = -Math.PI / 2;

        return rings;
    }

    update(time: number, camera: THREE.Camera): void {
        const state = bodyState('Saturn', time);
        this.position.copy(state.position);
        this.userData.orbit.speedKmS = state.velocity.length();
        this.mesh.quaternion.copy(bodyOrientation('Saturn', time));
        this.rings.quaternion.copy(bodyOrientation('Saturn', time, false));
        this.rings.rotateX(-Math.PI / 2);
        for (const moon of this.moons) moon.update(time, camera);

        const dist = camera.position.distanceTo(this.getWorldPosition(this.worldPosition));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
