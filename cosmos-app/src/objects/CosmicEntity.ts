import * as THREE from 'three';
import { SceneAssets } from '../core/SceneAssets';
import { disposeObject3D } from '../core/SceneLifecycle';
import { SystemManager, SystemId } from '../core/SystemManager';

export class CosmicEntity extends THREE.Group {
    public head: THREE.Group;
    private alienGroup: THREE.Group;
    private disposed = false;
    private queue: Promise<void> | null = null;
    private loadedModels = new Set<string>();
    private failedModels = new Set<string>();
    private shouldLoad = false;
    private loadingComplete = false;
    private mixer: THREE.AnimationMixer | undefined;

    constructor(private assets = new SceneAssets()) {
        super();
        this.name = 'CosmicEntity';

        this.alienGroup = new THREE.Group();
        this.alienGroup.frustumCulled = false;
        this.frustumCulled = false;
        this.add(this.alienGroup);

        this.head = new THREE.Group();
        this.head.name = 'CameraTargetHead';
        this.alienGroup.add(this.head);
        this.head.position.set(0, 3000, 0);

        this.position.set(0, 0, -20000);


    }

    private loadModel(scale: number): Promise<void> {
        return this.assets.loadModel('/models/Arishem.glb').then(gltf => {
            const model = gltf.scene;
            if (this.disposed) { disposeObject3D(model); return; }
            model.scale.setScalar(scale);

            model.traverse((child) => {
                child.frustumCulled = false;
                child.layers.set(0);

                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const m = child as THREE.Mesh;
                    m.frustumCulled = false;
                    if (m.material) {
                         const materials = Array.isArray(m.material) ? m.material : [m.material];
                         materials.forEach(mat => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.roughness = 0.4;
                                mat.metalness = 0.8;
                                mat.side = THREE.DoubleSide;
                            }
                         });
                    }
                }
            });

            this.alienGroup.add(model);

            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 2.0);
            hemiLight.position.set(0, 1, 0);
            model.add(hemiLight);

            const headLight = new THREE.PointLight(0xffaa00, 2.0, scale * 0.5);
            headLight.position.set(0, 0.45, 0.05);
            model.add(headLight);

            const chestLight = new THREE.PointLight(0x00aaff, 2.0, scale * 0.5);
            chestLight.position.set(0, 0.30, 0.05);
            model.add(chestLight);

            const centralLight = new THREE.PointLight(0xffffff, 1.0, scale * 3);
            centralLight.position.set(0, 0.25, 0);
            model.add(centralLight);

            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(model);
                const action = this.mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            const headBone = model.getObjectByName('Head') ||
                             model.getObjectByName('mixamorigHead') ||
                             model.getObjectByName('v_Head');

            if (headBone) {
                headBone.add(this.head);
                this.head.position.set(0, 0, 0);
            } else {
                this.head.position.set(0, 0.300 * scale, 0);
            }

        });
    }

    public update(_time: number, camera: THREE.Camera, independentTime: number, delta: number): void {
        this.mixer?.update(delta);
        this.alienGroup.position.y = Math.sin(independentTime * 0.5) * 50;
        const currentSys = SystemManager.getInstance().currentSystem;
        this.visible = currentSys === SystemId.INTERSTELLAR;
        this.shouldLoad = camera.position.distanceTo(this.position) < 10000;
        this.startLoading();
    }

    private startLoading(): void {
        if (this.disposed || !this.shouldLoad || this.queue || this.loadingComplete) return;
        this.queue = this.loadModelsSequentially().finally(() => {
            this.queue = null;
            this.loadingComplete = this.loadedModels.size + this.failedModels.size === 7;
        });
    }

    private async loadModelsSequentially(): Promise<void> {
        const tasks = [
            { name: 'Arishem', load: () => this.loadModel(10000) },
            ...['Figure1', 'Figure2', 'Figure3', 'Figure4', 'Figure5'].map((name, index) => ({
                name, load: () => this.loadFigure(name, index, 10000),
            })),
            { name: 'Robot', load: () => this.loadRobot(10000) },
        ];
        for (const task of tasks) {
            if (this.disposed || !this.shouldLoad) return;
            if (this.loadedModels.has(task.name) || this.failedModels.has(task.name)) continue;
            try { await task.load(); this.loadedModels.add(task.name); }
            catch { if (!this.disposed) this.failedModels.add(task.name); }
        }
    }

    retryFailedModels(): void {
        this.failedModels.clear();
        this.loadingComplete = false;
        this.startLoading();
    }

    dispose(): void {
        this.disposed = true;
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
        }
    }

    private loadFigure(name: string, index: number, parentScale: number): Promise<void> {
        const chestY = 0.300 * parentScale;
        const chestZ = 0;
        const radius = 0.05 * parentScale;
        return this.assets.loadModel(`/models/${name}.glb`).then(gltf => {
            const model = gltf.scene;
            if (this.disposed) { disposeObject3D(model); return; }
            model.scale.setScalar(100);

            const angle = (index / 4) * Math.PI - (Math.PI / 2);
            const x = Math.sin(angle) * radius * 0.5;
            const z = Math.cos(angle) * radius * 0.2 + chestZ;

            model.position.set(x, chestY, z);
            model.rotation.y = angle;

            model.traverse((child) => {
                child.frustumCulled = false;
                child.layers.set(0);
                if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    m.castShadow = true;
                    m.receiveShadow = true;
                }
            });

            this.alienGroup.add(model);
        });
    }

    private loadRobot(parentScale: number): Promise<void> {
        const headY = 0.45 * parentScale;

        return this.assets.loadModel('/models/Robot.glb').then(gltf => {
            const model = gltf.scene;
            if (this.disposed) { disposeObject3D(model); return; }
            model.scale.setScalar(120);
            model.position.set(0, headY, 0.040 * parentScale);

            model.traverse((child) => {
                child.frustumCulled = false;
                child.layers.set(0);
                if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    m.castShadow = true;
                    m.receiveShadow = true;
                }
            });

            this.alienGroup.add(model);
        });
    }
}
