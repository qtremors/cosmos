import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class SpaceStation extends THREE.Group {
    private station: THREE.Group;
    private label: CSS2DObject;
    private orbitAngle: number = 0;
    private earthRef: THREE.Object3D | null = null;

    constructor() {
        super();

        this.station = new THREE.Group();

        // Main truss (backbone)
        const trussGeo = new THREE.BoxGeometry(8, 0.3, 0.3);
        const trussMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.7,
            roughness: 0.3
        });
        const truss = new THREE.Mesh(trussGeo, trussMat);
        this.station.add(truss);

        // Solar panels (4 pairs)
        const panelGeo = new THREE.BoxGeometry(0.1, 2, 0.8);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            metalness: 0.4,
            roughness: 0.6
        });

        for (let i = -3; i <= 3; i += 2) {
            const panelTop = new THREE.Mesh(panelGeo, panelMat);
            panelTop.position.set(i, 1.2, 0);
            this.station.add(panelTop);

            const panelBottom = new THREE.Mesh(panelGeo, panelMat);
            panelBottom.position.set(i, -1.2, 0);
            this.station.add(panelBottom);
        }

        // Modules (habitation)
        const moduleGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
        const moduleMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.5,
            roughness: 0.4
        });

        const module1 = new THREE.Mesh(moduleGeo, moduleMat);
        module1.rotation.z = Math.PI / 2;
        module1.position.set(0, 0, 0.5);
        this.station.add(module1);

        const module2 = new THREE.Mesh(moduleGeo, moduleMat);
        module2.rotation.z = Math.PI / 2;
        module2.position.set(0, 0, -0.5);
        this.station.add(module2);

        // Scale - realistic compared to planets
        this.station.scale.setScalar(0.1);
        this.add(this.station);

        // Label (no emoji)
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'ISS';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 1, 0);
        this.add(this.label);
    }

    setEarthReference(earth: THREE.Object3D): void {
        this.earthRef = earth;
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbit around Earth
        this.orbitAngle = time * 0.0001;
        const orbitRadius = 5;

        if (this.earthRef) {
            const earthPos = this.earthRef.position;
            this.position.x = earthPos.x + Math.cos(this.orbitAngle) * orbitRadius;
            this.position.z = earthPos.z + Math.sin(this.orbitAngle) * orbitRadius;
            this.position.y = earthPos.y + Math.sin(this.orbitAngle * 0.5) * 0.5;
        }

        // Slow rotation
        this.station.rotation.y += 0.001;

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 50 / dist));
    }
}
