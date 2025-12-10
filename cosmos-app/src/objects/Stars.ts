import * as THREE from 'three';


export class Stars extends THREE.Points {
    constructor(count: number = 2000, radius: number = 800) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            pos[i] = (Math.random() - 0.5) * radius * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.2,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: false,
        });

        super(geo, mat);
    }

    setCount(count: number): void {
        this.geometry.setDrawRange(0, Math.max(0, Math.min(count, this.geometry.getAttribute('position').count)));
    }
}
