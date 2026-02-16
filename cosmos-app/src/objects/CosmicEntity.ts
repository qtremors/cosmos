import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SystemManager, SystemId } from '../core/SystemManager';

export class CosmicEntity extends THREE.Group {
    public head: THREE.Group;
    private alienGroup: THREE.Group;
    private clock: THREE.Clock;
    private mixer: THREE.AnimationMixer | undefined;

    constructor() {
        super();
        this.name = 'CosmicEntity';
        this.clock = new THREE.Clock();

        this.alienGroup = new THREE.Group();
        this.alienGroup.frustumCulled = false;
        this.frustumCulled = false;
        this.add(this.alienGroup);

        this.head = new THREE.Group();
        this.head.name = 'CameraTargetHead';
        this.alienGroup.add(this.head);

        const SCALE = 10000;
        this.position.set(0, 0, -20000);

        this.loadModel(SCALE);
        this.loadFigures(SCALE);
        this.loadRobot(SCALE);
    }

    private loadModel(scale: number) {
        const loader = new GLTFLoader();
        loader.load('models/Arishem.glb', (gltf) => {
            const model = gltf.scene;
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
            hemiLight.position.set(0, scale, 0);
            model.add(hemiLight);

            const headLight = new THREE.PointLight(0xffaa00, 2.0, scale * 0.5);
            headLight.position.set(0, scale * 0.45, scale * 0.05);
            model.add(headLight);

            const chestLight = new THREE.PointLight(0x00aaff, 2.0, scale * 0.5);
            chestLight.position.set(0, scale * 0.30, scale * 0.05);
            model.add(chestLight);

            const centralLight = new THREE.PointLight(0xffffff, 1.0, scale * 3);
            centralLight.position.set(0, scale * 0.25, 0); 
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

        }, undefined, (error) => {
            console.error('Failed to load Arishem model:', error);
        });
    }

    public update(_time: number, _camera: THREE.Camera): void {
        const delta = this.clock.getDelta(); 
        
        if (this.mixer) {
            this.mixer.update(delta);
        }

        const independentTime = this.clock.getElapsedTime();
        this.alienGroup.position.y = Math.sin(independentTime * 0.5) * 50;

        const systemManager = SystemManager.getInstance();
        const currentSys = systemManager.currentSystem;
        const isHidden = (currentSys === SystemId.SOLAR_SYSTEM || currentSys === SystemId.QUANTUMANIA);
        
        this.visible = !isHidden;
    }

    private loadFigures(parentScale: number) {
        const figures = ['Figure1', 'Figure2', 'Figure3', 'Figure4', 'Figure5'];
        const loader = new GLTFLoader();

        const chestY = 0.300 * parentScale; 
        const chestZ = 0.0 * parentScale; 
        const radius = 0.05 * parentScale; 
        
        figures.forEach((name, index) => {
            loader.load(`models/${name}.glb`, (gltf) => {
                const model = gltf.scene;
                model.scale.setScalar(100);

                const angle = (index / (figures.length - 1)) * Math.PI - (Math.PI / 2);
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
        });
    }

    private loadRobot(parentScale: number) {
        const loader = new GLTFLoader();
        const headY = 0.45 * parentScale;
        
        loader.load('models/Robot.glb', (gltf) => {
            const model = gltf.scene;
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
