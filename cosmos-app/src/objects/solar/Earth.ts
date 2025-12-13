import { Moon, addMoonOrbit } from '../common/Moon';
import { bodyState, bodyOrientation } from '../../core/Ephemeris';
import { BODY_DATA } from '../../core/BodyData';
import * as THREE from 'three';
import { SceneAssets } from '../../core/SceneAssets';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

import vertexShader from '../../shaders/earth/earth.vert.glsl?raw';
import fragmentShader from '../../shaders/earth/earth.frag.glsl?raw';



export class Earth extends THREE.Group {
    public readonly radius: number;
    public readonly moon: Moon;

    private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    private clouds: THREE.Mesh;
    private label: CSS2DObject;


    constructor(assets = new SceneAssets()) {
        super();

        const data = Cosmos.PLANETS.EARTH;
        this.radius = data.RADIUS;


        const loader = assets;
        const dayTexture = loader.loadTexture('/textures/2k_earth_daymap.jpg');
        const nightTexture = loader.loadTexture('/textures/2k_earth_nightmap.jpg');
        const cloudsTexture = loader.loadTexture('/textures/2k_earth_clouds.jpg', THREE.NoColorSpace);
        const moonTexture = loader.loadTexture('/textures/2k_moon.jpg');

        const geometry = new THREE.SphereGeometry(data.RADIUS, 48, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uFill: { value: 0 },
                uSunPos: { value: new THREE.Vector3(0, 0, 0) },
                uDayTexture: { value: dayTexture },
                uNightTexture: { value: nightTexture },
            },
            vertexShader,
            fragmentShader,
            depthWrite: true,
            depthTest: true,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.scale.y = BODY_DATA.Earth.polarKm! / BODY_DATA.Earth.equatorialKm!;
        this.add(this.mesh);

        const cloudsGeo = new THREE.SphereGeometry(data.RADIUS * 1.01, 48, 32);
        const cloudsMat = new THREE.MeshStandardMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
        this.add(this.clouds);

        this.moon = new Moon({ name: 'Moon', map: moonTexture });
        addMoonOrbit(this, this.moon);
        this.userData.orbit = { ...BODY_DATA.Earth, visualAxis: data.DISTANCE };

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Earth';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, data.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    setDarkSideFill(fill: number): void { this.mesh.material.uniforms.uFill.value = fill; }

    update(time: number, camera: THREE.Camera): void {
        const state = bodyState('Earth', time);
        this.position.copy(state.position);
        this.userData.orbit.speedKmS = state.velocity.length();
        this.mesh.quaternion.copy(bodyOrientation('Earth', time));
        this.clouds.quaternion.copy(this.mesh.quaternion);
        this.clouds.scale.y = this.mesh.scale.y;
        this.moon.update(time, camera);

        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));

    }
}
