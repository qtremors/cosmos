import * as THREE from 'three';
import { Cosmos } from '../core/SDK';

export class OrbitPath extends THREE.LineLoop {
    constructor(distance: number, color: THREE.Color | string | number = 0xffffff) {
        // Create an ellipse curve for the orbit
        // 0, 0 is the center (Sun)
        // xRadius = distance, yRadius = distance (circular orbit for now)
        const curve = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            distance, distance, // xRadius, yRadius
            0, 2 * Math.PI,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );

        const points = curve.getPoints(128); // 128 segments for smoothness
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Rotate geometry to lie on XZ plane
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15, // Subtle
            depthWrite: false, // Don't block other objects
        });

        super(geometry, material);
    }
}
