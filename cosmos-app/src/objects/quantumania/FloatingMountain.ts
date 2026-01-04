import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * Base class for floating mountains in the Quantumania system.
 * Mountains gently bob and rotate, creating a dreamlike atmosphere.
 */
export class FloatingMountain extends THREE.Group {
    protected mesh: THREE.Mesh;
    protected label: CSS2DObject;
    protected baseY: number;
    protected bobSpeed: number;
    protected bobAmount: number;
    protected rotationSpeed: number;
    protected initialPhase: number;

    public readonly mountainName: string;
    public readonly radius: number;

    /**
     * Create a floating mountain.
     * @param name - Display name for the mountain
     * @param position - Position relative to system center
     * @param radius - Approximate radius for radar/interaction
     * @param color - Base color of the mountain
     * @param height - Height of the mountain
     * @param plateauRadius - Radius of the flat top
     */
    constructor(
        name: string,
        position: THREE.Vector3,
        radius: number = 50,
        color: THREE.Color = new THREE.Color(0x666666),
        height: number = 100,
        plateauRadius: number = 30
    ) {
        super();

        this.mountainName = name;
        this.radius = radius;
        this.baseY = position.y;

        // Randomize animation parameters (slow and gentle to avoid vibration)
        this.bobSpeed = 0.1 + Math.random() * 0.1; // Much slower
        this.bobAmount = 2 + Math.random() * 3;    // Subtle movement
        this.rotationSpeed = 0.01 + Math.random() * 0.01; // Slower rotation
        this.initialPhase = Math.random() * Math.PI * 2;

        // Create mountain geometry (cone with flat top)
        const geometry = this.createMountainGeometry(height, radius, plateauRadius);

        // Create material
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true, // Gives a low-poly stylized look
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);

        // Create label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = name;
        div.style.color = '#ffffff';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, height * 0.6, 0);
        this.add(this.label);

        // Set position
        this.position.copy(position);
    }

    /**
     * Create mountain geometry with a flat plateau on top.
     */
    protected createMountainGeometry(
        height: number,
        baseRadius: number,
        plateauRadius: number
    ): THREE.BufferGeometry {
        // Create a truncated cone (cylinder with different radii)
        const geometry = new THREE.CylinderGeometry(
            plateauRadius,  // Top radius (plateau)
            baseRadius,     // Bottom radius
            height,         // Height
            8,              // Radial segments (low for stylized look)
            4,              // Height segments
            false           // Open ended = false (has caps)
        );

        // Add some randomness to vertices for organic feel
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            // Don't distort top cap too much (keep it relatively flat)
            if (y < height / 2 - 5) {
                const noise = (Math.random() - 0.5) * baseRadius * 0.15;
                positions.setX(i, x + noise);
                positions.setZ(i, z + noise);
            }
        }

        geometry.computeVertexNormals();
        return geometry;
    }

    /**
     * Update the mountain (no bobbing to avoid vibration).
     */
    update(time: number, camera: THREE.Camera): void {
        // Very slow rotation only (no bobbing)
        this.mesh.rotation.y += this.rotationSpeed * 0.005;

        // Update label opacity based on distance
        const dist = camera.position.distanceTo(this.position);
        const opacity = Math.min(1, 150 / dist);
        this.label.element.style.opacity = String(opacity);
    }

    /**
     * Set the label color.
     */
    setLabelColor(color: string): void {
        this.label.element.style.color = color;
    }
}
