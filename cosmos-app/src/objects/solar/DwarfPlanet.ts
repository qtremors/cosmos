import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { BODY_DATA } from '../../core/BodyData';
import { bodyState } from '../../core/Ephemeris';
import { kmToUnits } from '../../core/PhysicalScale';

/** Generic small-body surfaces for worlds without a measured global texture. */
export class DwarfPlanet extends THREE.Group {
    readonly radius: number;
    private mesh: THREE.Mesh;
    constructor(name: string, color: number) {
        super(); this.name = name;
        const data = BODY_DATA[name];
        this.radius = kmToUnits(Math.max(...(data.shapeKm ?? [data.radiusKm])));
        this.userData.orbit = { ...data, visualAxis: kmToUnits(data.axisKm!) };
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(kmToUnits(data.radiusKm), 40, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
        if (data.shapeKm) this.mesh.scale.set(data.shapeKm[0] / data.radiusKm, data.shapeKm[2] / data.radiusKm, data.shapeKm[1] / data.radiusKm);
        this.add(this.mesh);
        const text = document.createElement('div'); text.className = 'label'; text.textContent = name;
        const label = new CSS2DObject(text); label.position.y = this.radius * 2.5; this.add(label);
    }
    update(time: number): void {
        const state = bodyState(this.name, time); this.position.copy(state.position);
        this.userData.orbit.speedKmS = state.velocity.length();
        // Haumea's measured fast spin; pole/prime meridian are an illustration.
        const periodHours = this.name === 'Haumea' ? 3.9155 : this.name === 'Ceres' ? 9.07417 : this.name === 'Makemake' ? 22.8266 : this.name === 'Eris' ? 15.7859 * 24 : 52.8;
        this.mesh.rotation.y = (time % (periodHours * 3600)) / (periodHours * 3600) * Math.PI * 2;
    }
}
