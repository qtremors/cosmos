import { disposeObject3D } from '../../core/SceneLifecycle';
import * as THREE from 'three';
import { SceneAssets } from '../../core/SceneAssets';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class GLBEntity extends THREE.Group {
    private model: THREE.Group | null = null;
    private label: CSS2DObject;
    public readonly entityName: string;
    public readonly radius: number;
    private floatOffset: number;
    public rotationSpeed: number;
    public floating: boolean = true;
    private modelPath: string;
    private modelScale: number;
    private layer: number;
    private placeholder: THREE.Mesh;
    private placeholderMat: THREE.MeshBasicMaterial;
    private isLoaded: boolean = false;
    private generation = 0;
    private loadPromise: Promise<void> | null = null;

    constructor(
        position: THREE.Vector3,
        modelPath: string,
        name: string,
        scale: number = 50,
        radius: number = 50,
        colorHex: string = '#ffffff',
        layer: number = 0,
        private assets = new SceneAssets()
    ) {
        super();
        this.position.copy(position);
        this.entityName = name;
        this.radius = radius;
        this.modelPath = modelPath;
        this.modelScale = scale;
        this.layer = layer;
        this.floatOffset = Math.random() * 100;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        const placeholderGeo = new THREE.BoxGeometry(scale, scale, scale);
        this.placeholderMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), wireframe: true, transparent: true, opacity: 0.3 });
        this.placeholder = new THREE.Mesh(placeholderGeo, this.placeholderMat);
        this.placeholder.layers.set(layer);
        this.add(this.placeholder);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = name;
        div.style.color = colorHex;
        div.style.textShadow = `0 0 10px ${colorHex}44`;
        this.label = new CSS2DObject(div);
        this.label.position.set(0, scale * 1.5, 0);
        this.label.layers.set(layer);
        this.add(this.label);
    }

    loadModel(): Promise<void> {
        if (this.isLoaded) return Promise.resolve();
        if (this.loadPromise) return this.loadPromise;
        const generation = this.generation;
        this.loadPromise = this.assets.loadModel(this.modelPath).then(gltf => {
            if (generation !== this.generation) { disposeObject3D(gltf.scene); return; }
            this.placeholder.visible = false;

            this.model = gltf.scene;
            const finalScale = this.modelScale * 1.5;
            this.model.scale.set(finalScale, finalScale, finalScale);

            this.model.traverse((child) => {
                child.layers.set(this.layer);
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const m = child as THREE.Mesh;
                    if (m.material) {
                        const materials = Array.isArray(m.material) ? m.material : [m.material];
                        materials.forEach(mat => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.roughness = 0.7;
                                mat.metalness = 0.2;
                                mat.emissive = new THREE.Color(0x222222);
                                mat.emissiveIntensity = 0.2;
                            }
                        });
                    }
                }
            });

            this.add(this.model);
            this.isLoaded = true;

        }).catch(error => {
            if (generation !== this.generation) return;
            this.placeholderMat.opacity = 1;
            this.placeholderMat.color.set(0xff0000);
            throw error;
        }).finally(() => { this.loadPromise = null; });
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
        this.placeholder.visible = true;
        this.placeholderMat.opacity = 0.3;
        this.placeholderMat.color.set(0x8888aa);
    }

    get loaded(): boolean {
        return this.isLoaded;
    }

    update(_simTime: number, camera: THREE.Camera, independentTime: number): void {
        if (this.model) {
            if (this.floating) {
                this.model.position.y = Math.sin(independentTime * 0.5 + this.floatOffset) * 10;
            }
            this.model.rotation.y = independentTime * this.rotationSpeed;
        }

        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 400 / dist));
    }
}
