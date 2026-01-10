import * as THREE from 'three';
import { Cosmos } from '../../core/SDK';

export class OrbitPath extends THREE.LineLoop {
    constructor(
        semiMajorAxis: number,        // Average distance (a)
        color: THREE.Color | string | number = 0xffffff,
        eccentricity: number = 0,     // Orbital eccentricity (0 = circle)
        inclination: number = 0       // Inclination in degrees
    ) {
        const points: THREE.Vector3[] = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;

            const pos = Cosmos.getEllipticalOrbitalPosition(
                semiMajorAxis,
                eccentricity,
                inclination,
                angle
            );

            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            depthWrite: false,
        });

        super(geometry, material);
    }
}
