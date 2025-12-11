import * as THREE from 'three';

export class Stars extends THREE.Points {
    constructor(count = 2000, radius = 800) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            pos[i] = (Math.random() - 0.5) * radius * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true // Stars get smaller when far away
        });

        super(geo, mat);
    }
}
