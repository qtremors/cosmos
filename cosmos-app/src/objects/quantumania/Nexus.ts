import { disposeObject3D } from '../../core/SceneLifecycle';
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SceneAssets } from '../../core/SceneAssets';


export class Nexus extends THREE.Group {
    private model: THREE.Group | null = null;
    private label: CSS2DObject;
    private light: THREE.PointLight;

    public readonly entityName = 'Nexus';
    public readonly radius = 100;
    private isLoaded: boolean = false;
    private generation = 0;
    private loadPromise: Promise<void> | null = null;

    constructor(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0), private assets = new SceneAssets()) {
        super();
        this.position.copy(position);

        this.light = new THREE.PointLight(0x00aaff, 2000000, 4000);
        this.light.castShadow = true;
        this.light.shadow.bias = -0.0001;
        this.light.layers.set(2);
        this.add(this.light);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'The Nexus';
        div.style.color = '#00ffff';
        div.style.textShadow = '0 0 10px #00aaaa';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 100, 0);
        this.add(this.label);
    }

    loadModel(): Promise<void> {
        if (this.isLoaded) return Promise.resolve();
        if (this.loadPromise) return this.loadPromise;
        const generation = this.generation;
        this.loadPromise = this.assets.loadModel('/models/Cube.glb').then(gltf => {
            if (generation !== this.generation) { disposeObject3D(gltf.scene); return; }
            this.model = gltf.scene;

            this.model.traverse((child) => {
                child.layers.set(2);
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = false;
                    child.receiveShadow = false;

                    const m = child as THREE.Mesh;
                    if (m.material) {
                        const materials = Array.isArray(m.material) ? m.material : [m.material];
                        materials.forEach(mat => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.emissiveMap = mat.map;
                                mat.emissive = new THREE.Color(0xffffff);
                                mat.emissiveIntensity = 2.0;
                                mat.transparent = false;
                                mat.opacity = 1.0;
                            }
                        });
                    }
                }
            });

            this.model.scale.set(300, 300, 300);
            this.add(this.model);

            this.isLoaded = true;

        }).catch(error => { if (generation === this.generation) throw error; }).finally(() => { this.loadPromise = null; });
        return this.loadPromise;
    }

    unloadModel(): void {
        this.generation++;
        if (this.model) {
            this.remove(this.model);
            disposeObject3D(this.model);
            this.model = null;
        }
        this.isLoaded = false;
        this.light.shadow.map?.dispose();
        this.light.shadow.map = null;
    }

    get loaded(): boolean {
        return this.isLoaded;
    }

    update(_time: number, camera: THREE.Camera, independentTime: number): void {
        if (this.model) {
            this.model.rotation.x = independentTime * 0.02;
            this.model.rotation.y = independentTime * 0.03;
            this.model.rotation.z = independentTime * 0.01;
        }

        const pulse = 1 + Math.sin(independentTime * 2) * 0.1;
        this.light.intensity = 2000000 * pulse;

        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 400 / dist));
    }
}
