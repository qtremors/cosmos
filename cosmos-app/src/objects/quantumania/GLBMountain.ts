import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class GLBMountain extends THREE.Group {
    private model: THREE.Group | null = null;
    private label: CSS2DObject;
    public readonly mountainName: string;
    public readonly radius: number;
    private floatOffset: number;
    private rotationSpeed: number;

    constructor(
        position: THREE.Vector3,
        modelPath: string,
        name: string,
        scale: number = 50,
        radius: number = 50,
        colorHex: string = '#ffffff',
        layer: number = 0
    ) {
        super();
        this.position.copy(position);
        this.mountainName = name;
        this.radius = radius;

        // Randomize floating animation parameters
        this.floatOffset = Math.random() * 100;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Placeholder (Wireframe Box) to see if it's there before loading
        const placeholderGeo = new THREE.BoxGeometry(scale, scale, scale);
        const placeholderMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), wireframe: true, transparent: true, opacity: 0.3 });
        const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
        placeholder.layers.set(layer);
        this.add(placeholder);

        // Load Model
        const loader = new GLTFLoader();
        loader.load(modelPath, (gltf) => {
            // Remove placeholder
            this.remove(placeholder);
            placeholderGeo.dispose();
            placeholderMat.dispose();

            this.model = gltf.scene;

            // Standardize scale (Boosted scale based on user feedback)
            const finalScale = scale * 1.5; // 50% larger
            this.model.scale.set(finalScale, finalScale, finalScale);

            // Enable shadows and Set Layer
            this.model.traverse((child) => {
                child.layers.set(layer); // Set Layer
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Optimization: Standard material if needed
                    const m = child as THREE.Mesh;
                    if (m.material) {
                        const mat = m.material as THREE.MeshStandardMaterial;
                        // Ensure roughness/metalness are reasonable for lighting
                        mat.roughness = 0.7;
                        mat.metalness = 0.2;
                        // Ensure not black
                        mat.emissive = new THREE.Color(0x222222);
                        mat.emissiveIntensity = 0.2;
                    }
                }
            });

            this.add(this.model);
        }, undefined, (error) => {
            console.error(`Failed to load model: ${modelPath}`, error);
            // Keep placeholder if failed
            placeholder.material.opacity = 1.0;
            (placeholder.material as THREE.MeshBasicMaterial).color.set(0xff0000); // Red error box
        });

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = name;
        div.style.color = colorHex;
        div.style.textShadow = `0 0 10px ${colorHex}44`; // Soft glow matching color
        this.label = new CSS2DObject(div);
        this.label.position.set(0, scale * 1.5, 0); // Position label above model
        this.label.layers.set(layer); // CSS2DObjects also respect layers? (Use visible toggle in App.tsx mainly)
        this.add(this.label);
    }

    /**
     * Update using INDEPENDENT time (not simulation time)
     * so it floats smoothly even if sim is fast-forwarding or paused.
     */
    update(_simTime: number, camera: THREE.Camera, independentTime: number): void {
        if (this.model) {
            // Floating
            this.model.position.y = Math.sin(independentTime * 0.5 + this.floatOffset) * 10;

            // Slow Rotation
            this.model.rotation.y = independentTime * this.rotationSpeed;
        }

        // Label Opacity based on distance
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 400 / dist));
    }
}
