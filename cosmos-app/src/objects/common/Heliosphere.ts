import * as THREE from 'three';
import { SystemId } from '../../core/SystemManager';

/**
 * Heliosphere - A visual boundary bubble around a star system.
 * 
 * Visuals:
 * - Sparse wireframe grid (low poly).
 * - Invisible by default.
 * - Fades in only when camera is close to the boundary.
 */
export class Heliosphere extends THREE.Mesh {
    public readonly systemId: SystemId;
    private center: THREE.Vector3;
    private radius: number;
    private materialRef: THREE.MeshBasicMaterial;

    /**
     * Create a heliosphere boundary bubble.
     * @param radius - Radius of the system boundary
     * @param color - Color of the heliosphere
     * @param center - Center position of the system
     * @param systemId - Identifier for which system this belongs to
     */
    constructor(
        radius: number = 2500,
        color: THREE.Color = new THREE.Color(0x6699ff),
        center: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        systemId: SystemId = SystemId.SOLAR_SYSTEM
    ) {
        // significantly reduced segment count for "sparse" wireframe look
        const geometry = new THREE.SphereGeometry(radius, 24, 16);

        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0, // Start invisible
            side: THREE.BackSide, // Only visible from inside (mostly)
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        super(geometry, material);
        this.materialRef = material;
        this.systemId = systemId;
        this.center = center.clone();
        this.radius = radius;

        // Position the heliosphere at its center
        this.position.copy(center);
        this.renderOrder = 50;
    }

    /**
     * Update the heliosphere each frame.
     * Checks distance to edge and fades in if close.
     */
    update(time: number, camera: THREE.Camera): void {
        const distToCenter = camera.position.distanceTo(this.center);
        const distToEdge = Math.abs(distToCenter - this.radius);

        // Visibility ranges
        const FADE_START_DIST = 1000; // Start fading in 1000 units from edge

        // If we are close to the edge (from inside or outside)
        if (distToEdge < FADE_START_DIST) {
            // Calculate opacity: 0 at FADE_START_DIST, up to MAX_OPACITY at 0 distance
            const t = 1.0 - (distToEdge / FADE_START_DIST);

            // Non-linear fade for smoother feel
            const fade = t * t;

            // Cap max opacity to keep it subtle
            this.materialRef.opacity = Math.min(0.3, fade * 0.3);
            this.visible = true;
        } else {
            this.materialRef.opacity = 0;
            this.visible = false;
        }
    }

    /**
     * Set the bubble color.
     */
    setColor(color: THREE.Color): void {
        this.materialRef.color.copy(color);
    }

    /**
     * Get the system center position.
     */
    getCenter(): THREE.Vector3 {
        return this.center.clone();
    }
}
