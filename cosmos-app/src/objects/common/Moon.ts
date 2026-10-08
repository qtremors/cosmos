import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';
import { BODY_DATA } from '../../core/BodyData';
import { trueAnomaly } from '../../core/OrbitalMechanics';

export interface MoonOptions {
    name: string; radius: number; distance: number; color?: number; map?: THREE.Texture;
}
/** All satellites share orbit, label, material and synchronous rotation behavior. */
export class Moon extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
    readonly radius: number;
    private initialAngle = Math.random() * Math.PI * 2;
    private label: CSS2DObject;
    private worldPosition = new THREE.Vector3();
    private data;

    constructor(readonly options: MoonOptions) {
        super(new THREE.SphereGeometry(options.radius, 24, 16), new THREE.MeshStandardMaterial({
            color: options.color ?? 0xffffff, map: options.map, roughness: 0.8, metalness: 0,
        }));
        this.name = options.name;
        this.radius = options.radius;
        this.data = BODY_DATA[options.name];
        this.userData.orbit = { ...this.data, visualAxis: options.distance };
        this.castShadow = this.receiveShadow = true;
        const div = document.createElement('div');
        div.className = 'label'; div.textContent = options.name; div.style.fontSize = '10px';
        this.label = new CSS2DObject(div);
        this.label.position.y = options.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER;
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        const mean = this.initialAngle + time / (this.data.periodDays! * 86400) * Math.PI * 2;
        const angle = trueAnomaly(mean, this.data.eccentricity ?? 0);
        const r = Cosmos.getEllipticalDistance(this.options.distance, this.data.eccentricity ?? 0, angle);
        this.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        this.rotation.y = -angle;
        this.getWorldPosition(this.worldPosition);
        const distance = camera.position.distanceTo(this.worldPosition);
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(distance, this.radius));
    }
}

export function addMoonOrbit(parent: THREE.Object3D, moon: Moon): void {
    const eccentricity = BODY_DATA[moon.name].eccentricity ?? 0;
    const positions = new Float32Array(129 * 3);
    for (let index = 0; index <= 128; index++) {
        const angle = index / 128 * Math.PI * 2;
        const r = Cosmos.getEllipticalDistance(moon.options.distance, eccentricity, angle);
        positions[index * 3] = Math.cos(angle) * r;
        positions[index * 3 + 2] = Math.sin(angle) * r;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    parent.add(moon, new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false })));
}
