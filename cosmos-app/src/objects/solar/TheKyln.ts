import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

/**
 * The Kyln - A massive space prison featured in Guardians of the Galaxy.
 * Located in the asteroid belt, it's a towering industrial structure
 * with multiple spires, docking bays, and an ominous glow.
 */
export class TheKyln extends THREE.Group {
    private structure: THREE.Group;
    private label: CSS2DObject;
    private glowLights: THREE.PointLight[];
    private orbitAngle: number;

    constructor(name: string = 'The Kyln') {
        super();

        this.structure = new THREE.Group();
        this.glowLights = [];

        // Main body - massive cylindrical core with industrial feel
        const mainBodyGeo = new THREE.CylinderGeometry(3, 4, 12, 8);
        const industrialMat = new THREE.MeshStandardMaterial({
            color: 0x2a3a4a,
            metalness: 0.8,
            roughness: 0.4,
            emissive: 0x0a1520,
            emissiveIntensity: 0.2,
        });
        const mainBody = new THREE.Mesh(mainBodyGeo, industrialMat);
        this.structure.add(mainBody);

        // Central tower spires (like in the movie)
        const spireMat = new THREE.MeshStandardMaterial({
            color: 0x1a2a3a,
            metalness: 0.9,
            roughness: 0.3,
            emissive: 0x0a1520,
            emissiveIntensity: 0.1,
        });

        // Main central spire
        const centralSpireGeo = new THREE.ConeGeometry(1.5, 8, 6);
        const centralSpire = new THREE.Mesh(centralSpireGeo, spireMat);
        centralSpire.position.y = 10;
        this.structure.add(centralSpire);

        // Secondary spires around the top
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const spireGeo = new THREE.ConeGeometry(0.8, 5, 6);
            const spire = new THREE.Mesh(spireGeo, spireMat);
            spire.position.set(
                Math.cos(angle) * 2.5,
                8,
                Math.sin(angle) * 2.5
            );
            this.structure.add(spire);
        }

        // Industrial platforms/rings
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x3a4a5a,
            metalness: 0.7,
            roughness: 0.5,
        });

        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(4 + i * 0.3, 0.3, 8, 16);
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = -2 + i * 3;
            ring.rotation.x = Math.PI / 2;
            this.structure.add(ring);
        }

        // Docking bay extensions
        const dockMat = new THREE.MeshStandardMaterial({
            color: 0x4a5a6a,
            metalness: 0.6,
            roughness: 0.5,
        });

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dockGeo = new THREE.BoxGeometry(1.5, 2, 4);
            const dock = new THREE.Mesh(dockGeo, dockMat);
            dock.position.set(
                Math.cos(angle) * 5,
                -1,
                Math.sin(angle) * 5
            );
            dock.rotation.y = -angle + Math.PI / 2;
            this.structure.add(dock);
        }

        // Red warning lights on top (like the reference image)
        const redLightMat = new THREE.MeshBasicMaterial({
            color: 0xff2200,
            transparent: true,
            opacity: 0.9,
        });

        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
            const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const light = new THREE.Mesh(lightGeo, redLightMat);
            light.position.set(
                Math.cos(angle) * 1.2,
                14,
                Math.sin(angle) * 1.2
            );
            this.structure.add(light);

            // Red point lights
            const pointLight = new THREE.PointLight(0xff2200, 0.5, 10);
            pointLight.position.copy(light.position);
            this.structure.add(pointLight);
        }

        // Blue/cyan docking lights (like the reference image)
        const blueLightMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8,
        });

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
            const light = new THREE.Mesh(lightGeo, blueLightMat);
            light.position.set(
                Math.cos(angle) * 5.5,
                -1,
                Math.sin(angle) * 5.5
            );
            this.structure.add(light);

            // Blue point lights
            const pointLight = new THREE.PointLight(0x00aaff, 0.3, 8);
            pointLight.position.copy(light.position);
            this.structure.add(pointLight);
            this.glowLights.push(pointLight);
        }

        // Lower base structure
        const baseGeo = new THREE.CylinderGeometry(5, 3, 4, 8);
        const base = new THREE.Mesh(baseGeo, industrialMat);
        base.position.y = -8;
        this.structure.add(base);

        // Bottom engines/thrusters
        const thrusterMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.6,
        });

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const thrusterGeo = new THREE.ConeGeometry(0.8, 2, 8);
            const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
            thruster.position.set(
                Math.cos(angle) * 2,
                -11,
                Math.sin(angle) * 2
            );
            thruster.rotation.x = Math.PI;
            this.structure.add(thruster);
        }

        // Outer atmospheric glow
        const glowGeo = new THREE.SphereGeometry(18, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x2244aa,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        this.structure.add(glow);

        this.add(this.structure);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = name;
        div.style.color = '#4488cc';
        div.style.textShadow = '0 0 8px #00aaff';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 18, 0);
        this.add(this.label);

        // Position in asteroid belt
        this.orbitAngle = Math.random() * Math.PI * 2;
        const beltRadius = (Cosmos.ASTEROIDS.INNER_RADIUS + Cosmos.ASTEROIDS.OUTER_RADIUS) / 2;
        this.position.x = Math.cos(this.orbitAngle) * beltRadius;
        this.position.z = Math.sin(this.orbitAngle) * beltRadius;
        this.position.y = 5; // Slightly above the belt plane
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbit with the belt (Kepler's third law)
        const beltRadius = (Cosmos.ASTEROIDS.INNER_RADIUS + Cosmos.ASTEROIDS.OUTER_RADIUS) / 2;
        const periodYears = Math.pow(beltRadius / Cosmos.PLANETS.EARTH.DISTANCE, 1.5);
        const periodSeconds = periodYears * 365.25 * 86400;
        const theta = this.orbitAngle + (time / periodSeconds) * 2 * Math.PI;

        this.position.x = Math.cos(theta) * beltRadius;
        this.position.z = Math.sin(theta) * beltRadius;

        // Very slow rotation - massive structures rotate slowly
        this.structure.rotation.y += 0.0005;

        // Pulsing dock lights
        const pulse = 0.3 + Math.sin(time * 0.002) * 0.15;
        this.glowLights.forEach(light => {
            light.intensity = pulse;
        });

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 100 / dist));
    }
}
