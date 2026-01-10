import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * The Nexus - Central mountain of Quantumania.
 * Now represented by the "Tesseract" (Cube.glb).
 * Acts as the light source for the system.
 */
export class NexusMountain extends THREE.Group {
    private model: THREE.Group | null = null;
    private label: CSS2DObject;
    private light: THREE.PointLight;

    public readonly mountainName = 'Nexus';
    public readonly radius = 100;

    // Lazy loading state
    private isLoaded: boolean = false;
    private isLoading: boolean = false;

    constructor(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
        super();
        this.position.copy(position);

        // 1. Light Source (The Cube lights up the system) - always present
        // Intensity needs to be high to reach 600+ units with decay=2
        // Target: ~5.0 intensity at 600 units -> 5 * 600^2 = 1,800,000
        this.light = new THREE.PointLight(0x00aaff, 2000000, 4000); // 2M intensity, 4000 range
        this.light.castShadow = true;
        this.light.shadow.bias = -0.0001;
        this.light.layers.set(2); // Layer 2: Quantumania Only
        this.add(this.light);

        // 2. Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'The Nexus';
        div.style.color = '#00ffff';
        div.style.textShadow = '0 0 10px #00aaaa';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 100, 0);
        this.add(this.label);

        // NOTE: Model is NOT loaded here anymore - call loadModel() to load
    }

    /**
     * Load the 3D model. Call this when the system becomes visible.
     * Returns a promise that resolves when loading is complete.
     */
    loadModel(): Promise<void> {
        // Prevent duplicate loads
        if (this.isLoaded || this.isLoading) {
            return Promise.resolve();
        }

        this.isLoading = true;

        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load('/models/Cube.glb', (gltf) => {
                this.model = gltf.scene;

                // Apply texture & material properties
                this.model.traverse((child) => {
                    child.layers.set(2); // Layer 2: Quantumania Only
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = false; // Cube itself glows, shouldn't cast shadow on inside
                        child.receiveShadow = false;

                        const m = child as THREE.Mesh;
                        // Ensure texture is used as map AND emissive map
                        if (m.material) {
                            const mat = m.material as THREE.MeshStandardMaterial;
                            // Make it GLOW using its own texture
                            mat.emissiveMap = mat.map;
                            mat.emissive = new THREE.Color(0xffffff);
                            mat.emissiveIntensity = 2.0;
                            mat.transparent = false; // Solid cube
                            mat.opacity = 1.0;
                        }
                    }
                });

                // Scale to be significant (radius ~100)
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

    /**
     * Check if the model has been loaded.
     */
    get loaded(): boolean {
        return this.isLoaded;
    }

    update(_time: number, camera: THREE.Camera, independentTime: number): void {
        if (this.model) {
            // Very Slow mysterious rotation (reduced speed)
            this.model.rotation.x = independentTime * 0.02;
            this.model.rotation.y = independentTime * 0.03;
            this.model.rotation.z = independentTime * 0.01;
        }

        // Pulsing light
        const pulse = 1 + Math.sin(independentTime * 2) * 0.1;
        this.light.intensity = 2000000 * pulse;

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 400 / dist));
    }
}
