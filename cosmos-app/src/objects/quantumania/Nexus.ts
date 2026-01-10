import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * The Nexus - Central light source of Quantumania.
 */
export class Nexus extends THREE.Group {
    private model: THREE.Group | null = null;
    private label: CSS2DObject;
    private light: THREE.PointLight;

    public readonly entityName = 'Nexus';
    public readonly radius = 100;
    private isLoaded: boolean = false;
    private isLoading: boolean = false;

    constructor(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
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
        if (this.isLoaded || this.isLoading) {
            return Promise.resolve();
        }

        this.isLoading = true;

        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load('/models/Cube.glb', (gltf) => {
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

                this.model.scale.set(50, 50, 50);
                this.add(this.model);

                this.isLoaded = true;
                this.isLoading = false;
                resolve();
            }, undefined, (error) => {
                console.error('Failed to load Nexus model:', error);
                this.isLoading = false;
                reject(error);
            });
        });
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
