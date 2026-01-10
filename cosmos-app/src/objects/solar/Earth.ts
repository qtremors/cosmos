import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

import vertexShader from '../../shaders/earth/earth.vert.glsl?raw';
import fragmentShader from '../../shaders/earth/earth.frag.glsl?raw';

// =============================================================================
// EARTH CLASS
// =============================================================================

export class Earth extends THREE.Group {
    public readonly radius: number;
    public readonly moon: THREE.Mesh;

    private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    private clouds: THREE.Mesh;
    private label: CSS2DObject;
    private moonLabel: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const data = Cosmos.PLANETS.EARTH;
        this.radius = data.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        const loader = new THREE.TextureLoader();
        const dayTexture = loader.load('/textures/2k_earth_daymap.jpg');
        const nightTexture = loader.load('/textures/2k_earth_nightmap.jpg');
        const cloudsTexture = loader.load('/textures/2k_earth_clouds.jpg');
        const moonTexture = loader.load('/textures/2k_moon.jpg');

        const geometry = new THREE.SphereGeometry(data.RADIUS, 64, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
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
        this.add(this.mesh);

        const cloudsGeo = new THREE.SphereGeometry(data.RADIUS * 1.01, 64, 64);
        const cloudsMat = new THREE.MeshStandardMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
        this.add(this.clouds);

        const moonGeo = new THREE.SphereGeometry(data.MOON.RADIUS * 1.5, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.8,
            metalness: 0.0,
        });
        this.moon = new THREE.Mesh(moonGeo, moonMat);
        this.moon.castShadow = true;
        this.moon.receiveShadow = true;
        this.add(this.moon);

        const moonLight = new THREE.PointLight(Cosmos.LIGHTING.MOON_COLOR, 0.5, 30);
        this.moon.add(moonLight);

        const moonDiv = document.createElement('div');
        moonDiv.className = 'label';
        moonDiv.textContent = 'Moon';
        moonDiv.style.fontSize = '10px';
        this.moonLabel = new CSS2DObject(moonDiv);
        this.moonLabel.position.set(0, data.MOON.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.moon.add(this.moonLabel);

        const moonOrbitCurve = new THREE.EllipseCurve(
            0, 0,
            data.MOON.DISTANCE, data.MOON.DISTANCE,
            0, 2 * Math.PI,
            false, 0
        );
        const moonOrbitPoints = moonOrbitCurve.getPoints(64);
        const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
        moonOrbitGeo.rotateX(-Math.PI / 2);
        const moonOrbitMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
        });
        const moonOrbitLine = new THREE.LineLoop(moonOrbitGeo, moonOrbitMat);
        this.add(moonOrbitLine);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Earth';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, data.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        // 1. Orbit Sun (realistic period: 365.25 days, elliptical e=0.017)
        const theta = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.EARTH,
            this.initialAngle
        );
        const pos = Cosmos.getEllipticalOrbitalPosition(
            Cosmos.PLANETS.EARTH.DISTANCE,
            Cosmos.ECCENTRICITY.EARTH,
            Cosmos.INCLINATION.EARTH,
            theta
        );
        this.position.set(pos.x, pos.y, pos.z);

        // 2. Planet Rotation (realistic: 23.93 hours)
        const rotation = Cosmos.getRealisticRotation(
            time,
            Cosmos.ROTATION_PERIODS.EARTH
        );
        this.mesh.rotation.y = rotation;
        this.clouds.rotation.y = rotation * 1.05; // Clouds rotate slightly faster

        // 3. Moon Orbit (realistic period: 27.32 days, original sim distance)
        const moonAngle = Cosmos.getRealisticOrbitalAngle(
            time,
            Cosmos.ORBITAL_PERIODS.MOON
        );
        const moonDistance = Cosmos.PLANETS.EARTH.MOON.DISTANCE; // Use original sim distance
        this.moon.position.x = Math.cos(moonAngle) * moonDistance;
        this.moon.position.z = Math.sin(moonAngle) * moonDistance;

        // 4. Labels
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));

        const moonWorldPos = new THREE.Vector3();
        this.moon.getWorldPosition(moonWorldPos);
        const moonDist = camera.position.distanceTo(moonWorldPos);
        this.moonLabel.element.style.opacity = String(Cosmos.getLabelOpacity(moonDist, Cosmos.PLANETS.EARTH.MOON.RADIUS));
    }
}
