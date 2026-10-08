import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';
import { BODY_DATA } from '../../core/BodyData';
import { bodyState, bodyOrientation, orbitPoints } from '../../core/Ephemeris';
import { kmToUnits } from '../../core/PhysicalScale';

export interface MoonOptions {
    name: string; color?: number; map?: THREE.Texture;
}
/** Satellites keep physical lengths and a frame independent of their parent's spin. */
export class Moon extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> {
    readonly radius: number;
    readonly distance: number;
    private label: CSS2DObject;
    private worldPosition = new THREE.Vector3();
    private guide: THREE.LineLoop | null = null;
    private guideMonth = NaN;

    constructor(readonly options: MoonOptions) {
        const data = BODY_DATA[options.name];
        const radius = kmToUnits(data.radiusKm);
        super(new THREE.SphereGeometry(radius, 32, 24), new THREE.MeshStandardMaterial({
            color: options.color ?? 0xffffff, map: options.map ?? null, roughness: 0.8, metalness: 0,
        }));
        this.name = options.name;
        this.radius = radius;
        this.distance = kmToUnits(data.axisKm!);
        this.userData.orbit = { ...data, visualAxis: this.distance };
        if (data.shapeKm) this.scale.set(data.shapeKm[0] / data.radiusKm, data.shapeKm[2] / data.radiusKm, data.shapeKm[1] / data.radiusKm);
        this.castShadow = this.receiveShadow = true;
        const div = document.createElement('div');
        div.className = 'label'; div.textContent = options.name; div.style.fontSize = '10px';
        this.label = new CSS2DObject(div);
        this.label.position.y = radius * Cosmos.LABELS.HEIGHT_MULTIPLIER;
        this.add(this.label);
    }

    setGuide(guide: THREE.LineLoop): void { this.guide = guide; }

    update(time: number, camera: THREE.Camera): void {
        const state = bodyState(this.name, time);
        this.position.copy(state.position);
        this.userData.orbit.speedKmS = state.velocity.length();
        if (this.name === 'Moon') this.quaternion.copy(bodyOrientation('Moon', time));
        else {
            const normal = new THREE.Vector3().crossVectors(state.position, state.velocity).normalize();
            const facing = state.position.clone().negate().normalize();
            const tangent = new THREE.Vector3().crossVectors(facing, normal).normalize();
            this.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(facing, normal, tangent));
        }
        const month = Math.floor(time / (86400 * 30));
        if (this.guide && month !== this.guideMonth) {
            this.guideMonth = month;
            const aKm = this.distance / kmToUnits(1);
            const rKm = state.position.length() / kmToUnits(1);
            const mu = state.velocity.lengthSq() / (2 / rKm - 1 / aKm);
            const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints(state, mu, 96));
            this.guide.geometry.dispose(); this.guide.geometry = geometry;
        }
        this.getWorldPosition(this.worldPosition);
        const distance = camera.position.distanceTo(this.worldPosition);
        this.label.element.style.opacity = String(distance < this.distance * 8 ? Cosmos.getLabelOpacity(distance, this.radius) : 0);
    }
}

export function addMoonOrbit(parent: THREE.Object3D, moon: Moon): void {
    const guide = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }));
    guide.userData.orbitGuide = true;
    moon.setGuide(guide); parent.add(moon, guide);
}
