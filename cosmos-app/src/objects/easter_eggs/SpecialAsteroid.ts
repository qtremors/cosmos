import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

export class SpecialAsteroid extends THREE.Group {
    private mesh: THREE.Mesh;
    private label: CSS2DObject;
    private glow: THREE.Mesh;
    private orbitAngle: number;

    constructor(name: string = 'Quant') {
        super();

        // Unique asteroid shape
        const geometry = new THREE.IcosahedronGeometry(2, 1);

        // Distort vertices for irregular shape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            const noise = 0.7 + Math.random() * 0.6;
            positions.setXYZ(i, x * noise, y * noise, z * noise);
        }
        geometry.computeVertexNormals();

        // Golden/special material
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa33,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x331100,
            emissiveIntensity: 0.3,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);

        // Glow effect
        const glowGeo = new THREE.SphereGeometry(2.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffaa33,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.add(this.glow);

        // Label (no emoji)
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = name;
        div.style.color = '#ffaa33';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 3.5, 0);
        this.add(this.label);

        // Position in asteroid belt
        this.orbitAngle = Math.random() * Math.PI * 2;
        const beltRadius = (Cosmos.ASTEROIDS.INNER_RADIUS + Cosmos.ASTEROIDS.OUTER_RADIUS) / 2;
        this.position.x = Math.cos(this.orbitAngle) * beltRadius;
        this.position.z = Math.sin(this.orbitAngle) * beltRadius;
        this.position.y = 0;
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbit with the belt
        const beltRadius = (Cosmos.ASTEROIDS.INNER_RADIUS + Cosmos.ASTEROIDS.OUTER_RADIUS) / 2;
        const periodYears = Math.pow(beltRadius / Cosmos.PLANETS.EARTH.DISTANCE, 1.5);
        const periodSeconds = periodYears * 365.25 * 86400;
        const theta = this.orbitAngle + (time / periodSeconds) * 2 * Math.PI;

        this.position.x = Math.cos(theta) * beltRadius;
        this.position.z = Math.sin(theta) * beltRadius;

        // Tumble
        this.mesh.rotation.x += 0.005;
        this.mesh.rotation.y += 0.003;

        // Pulsing glow
        const pulse = 0.12 + Math.sin(time * 0.001) * 0.05;
        (this.glow.material as THREE.MeshBasicMaterial).opacity = pulse;

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 80 / dist));
    }
}
