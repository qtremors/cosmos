import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';
import { SceneAssets } from '../../core/SceneAssets';
import { BODY_DATA } from '../../core/BodyData';
import { bodyState, bodyOrientation } from '../../core/Ephemeris';
import { Moon, addMoonOrbit, type MoonOptions } from './Moon';

export type PlanetKey = keyof typeof Cosmos.PLANETS;
export class Planet extends THREE.Group {
    readonly radius: number;
    readonly moons: Moon[] = [];
    protected mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
    private label: CSS2DObject;
    protected bodyFrame = new THREE.Group();

    constructor(key: PlanetKey, assets: SceneAssets, texture: string, roughness = 0.6) {
        super();
        const config = Cosmos.PLANETS[key];
        this.name = key.charAt(0) + key.slice(1).toLowerCase();
        this.radius = config.RADIUS;
        this.userData.orbit = { ...BODY_DATA[this.name], visualAxis: config.DISTANCE };
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 48, 32),
            new THREE.MeshStandardMaterial({ map: assets.loadTexture(texture), roughness, metalness: 0 }));
        this.mesh.castShadow = this.mesh.receiveShadow = true;
        this.bodyFrame.add(this.mesh); this.add(this.bodyFrame);
        const body = BODY_DATA[this.name];
        this.mesh.scale.y = (body.polarKm ?? body.radiusKm) / (body.equatorialKm ?? body.radiusKm);
        const div = document.createElement('div'); div.className = 'label'; div.textContent = this.name;
        this.label = new CSS2DObject(div); this.label.position.y = this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER;
        this.add(this.label);
    }

    protected addMoon(options: MoonOptions): Moon {
        const moon = new Moon(options); addMoonOrbit(this, moon); this.moons.push(moon); return moon;
    }

    update(time: number, camera: THREE.Camera): void {
        const state = bodyState(this.name, time);
        this.position.copy(state.position);
        this.userData.orbit.speedKmS = state.velocity.length();
        this.bodyFrame.quaternion.copy(bodyOrientation(this.name, time, false));
        this.mesh.quaternion.copy(bodyOrientation(this.name, time));
        this.mesh.quaternion.premultiply(this.bodyFrame.quaternion.clone().invert());
        this.moons.forEach(moon => moon.update(time, camera));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(camera.position.distanceTo(this.position), this.radius));
    }
}
