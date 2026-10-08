import * as THREE from 'three';
import { bodyState, orbitPoints } from '../../core/Ephemeris';

/** Instantaneous osculating orbit in the same frame as the body's ephemeris. */
export class OrbitPath extends THREE.LineLoop {
    private month = NaN;
    constructor(private body: string) {
        super(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }));
        this.userData.orbitGuide = true;
    }
    update(time: number): void {
        const month = Math.floor(time / (86400 * 30));
        if (month === this.month) return;
        this.month = month;
        const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints(bodyState(this.body, time)));
        this.geometry.dispose(); this.geometry = geometry;
    }
}
