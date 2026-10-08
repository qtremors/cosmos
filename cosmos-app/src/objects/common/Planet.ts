import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';
import { SceneAssets } from '../../core/SceneAssets';
import { BODY_DATA } from '../../core/BodyData';
import { Moon, addMoonOrbit, type MoonOptions } from './Moon';

export type PlanetKey = keyof typeof Cosmos.PLANETS;
export class Planet extends THREE.Group {
    readonly radius: number;
    readonly moons: Moon[] = [];
    protected mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
    private label: CSS2DObject;
    private initialAngle = Math.random() * Math.PI * 2;

    constructor(private key: PlanetKey, assets: SceneAssets, texture: string, roughness = 0.6) {
        super();
        const config = Cosmos.PLANETS[key];
        this.name = key.charAt(0) + key.slice(1).toLowerCase();
        this.radius = config.RADIUS;
        this.userData.orbit = { ...BODY_DATA[this.name], visualAxis: config.DISTANCE };
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 48, 32),
            new THREE.MeshStandardMaterial({ map: assets.loadTexture(texture), roughness, metalness: 0 }));
        this.mesh.castShadow = this.mesh.receiveShadow = true;
        this.add(this.mesh);
        const div = document.createElement('div'); div.className = 'label'; div.textContent = this.name;
        this.label = new CSS2DObject(div); this.label.position.y = this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER;
        this.add(this.label);
    }

    protected addMoon(options: MoonOptions): Moon {
        const moon = new Moon(options); addMoonOrbit(this, moon); this.moons.push(moon); return moon;
    }

    update(time: number, camera: THREE.Camera): void {
        const angle = Cosmos.getRealisticOrbitalAngle(time, Cosmos.ORBITAL_PERIODS[this.key], this.initialAngle, Cosmos.ECCENTRICITY[this.key]);
        const radius = Cosmos.getEllipticalDistance(Cosmos.PLANETS[this.key].DISTANCE, Cosmos.ECCENTRICITY[this.key], angle);
        const inclination = Cosmos.INCLINATION[this.key] * Math.PI / 180;
        this.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * Math.sin(inclination), Math.sin(angle) * radius * Math.cos(inclination));
        this.mesh.rotation.y = Cosmos.getRealisticRotation(time, Cosmos.ROTATION_PERIODS[this.key]);
        this.moons.forEach(moon => moon.update(time, camera));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(camera.position.distanceTo(this.position), this.radius));
    }
}
