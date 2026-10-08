import * as THREE from 'three';

/** Each system has its own render list and light collection. Depth is shared between passes. */
export class SystemRenderer {
    readonly solar = new THREE.Scene();
    readonly quantum = new THREE.Scene();
    readonly interstellar = new THREE.Scene();
    readonly fill = new THREE.AmbientLight(0xffffff, 0);

    constructor(root: THREE.Scene, solarObjects: THREE.Object3D[], quantumObjects: THREE.Object3D[], spaceObjects: THREE.Object3D[]) {
        this.interstellar.background = root.background;
        root.background = null;
        this.solar.add(...solarObjects, this.fill);
        this.quantum.add(...quantumObjects);
        this.interstellar.add(...spaceObjects);
        root.add(this.interstellar, this.solar, this.quantum);
    }

    render(renderer: THREE.WebGLRenderer, camera: THREE.Camera, showSolar: boolean, showQuantum: boolean): void {
        renderer.autoClear = false;
        renderer.info.autoReset = false;
        renderer.info.reset();
        renderer.clear();
        renderer.render(this.interstellar, camera);
        if (showSolar) renderer.render(this.solar, camera);
        // The quantum beacon is rendered even when its model groups are hidden.
        if (showQuantum || this.quantum.children.some(child => child.visible)) renderer.render(this.quantum, camera);
    }
}
