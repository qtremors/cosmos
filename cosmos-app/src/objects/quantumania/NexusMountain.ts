import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * The Nexus - Central mountain of Quantumania.
 * A flat placeholder that the user will customize later.
 * Acts as the "sun" equivalent for this system.
 */
export class NexusMountain extends THREE.Group {
    private mesh: THREE.Mesh;
    private label: CSS2DObject;
    private glowMesh: THREE.Mesh;

    public readonly mountainName = 'The Nexus';
    public readonly radius = 100;

    constructor(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
        super();

        // Create a large flat platform as placeholder
        const geometry = new THREE.CylinderGeometry(80, 100, 30, 12);

        const material = new THREE.MeshStandardMaterial({
            color: 0x443366,
            roughness: 0.6,
            metalness: 0.4,
            emissive: 0x221133,
            emissiveIntensity: 0.3,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);

        // Subtle outer glow
        const glowGeo = new THREE.SphereGeometry(120, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x6644aa,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
        });
        this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
        this.add(this.glowMesh);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'The Nexus';
        div.style.color = '#aa88ff';
        div.style.textShadow = '0 0 10px #6644aa';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 50, 0);
        this.add(this.label);

        this.position.copy(position);
    }

    update(time: number, camera: THREE.Camera): void {
        // Very slow rotation
        this.mesh.rotation.y += 0.001;

        // Pulsing glow
        const pulse = 0.1 + Math.sin(time * 0.5) * 0.03;
        (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = pulse;

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 200 / dist));
    }
}
