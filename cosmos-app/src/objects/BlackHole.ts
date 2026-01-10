import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import vertexShader from '../shaders/blackhole/blackhole.vert.glsl?raw';
import fragmentShader from '../shaders/blackhole/blackhole.frag.glsl?raw';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    DISTANCE: 8000,
    HEIGHT: 2000,
    BILLBOARD_SIZE: 600,
    CORE_RADIUS: 65,
};

// =============================================================================
// BLACK HOLE CLASS
// =============================================================================

export class BlackHole extends THREE.Group {
    public readonly radius: number = CONFIG.BILLBOARD_SIZE / 2;

    private billboard: THREE.Mesh;
    private core: THREE.Mesh;
    private label: CSS2DObject;
    private material: THREE.ShaderMaterial;
    private clock: THREE.Clock;

    // Reusable vectors to avoid per-frame allocations
    private tmpBlackHoleWorldPos = new THREE.Vector3();
    private tmpCamWorldPos = new THREE.Vector3();
    private tmpRelativePos = new THREE.Vector3();

    constructor() {
        super();

        this.clock = new THREE.Clock();

        const angle = Math.PI * 0.75;
        this.position.set(
            Math.cos(angle) * CONFIG.DISTANCE,
            CONFIG.HEIGHT,
            Math.sin(angle) * CONFIG.DISTANCE
        );

        const coreGeometry = new THREE.SphereGeometry(CONFIG.CORE_RADIUS, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            toneMapped: false,
            depthTest: true,   // Respect accretion disk depth
            depthWrite: true,  // Write to depth buffer
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.core.renderOrder = 101;  // Render after billboard (100) to cover distant glares
        this.add(this.core);

        const geometry = new THREE.PlaneGeometry(CONFIG.BILLBOARD_SIZE, CONFIG.BILLBOARD_SIZE);

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uCamPos: { value: new THREE.Vector3(0, 5, 18) },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            blending: THREE.AdditiveBlending,
        });

        this.billboard = new THREE.Mesh(geometry, this.material);
        this.billboard.renderOrder = 102;  // Render after core (101)
        this.add(this.billboard);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Black Hole';
        div.style.color = '#ff8844';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, CONFIG.BILLBOARD_SIZE / 2 + 30, 0);
        this.add(this.label);
    }

    update(_time: number, camera: THREE.Camera): void {
        const independentTime = this.clock.getElapsedTime();

        this.material.uniforms.uTime.value = independentTime;

        this.billboard.lookAt(camera.position);

        this.getWorldPosition(this.tmpBlackHoleWorldPos);
        camera.getWorldPosition(this.tmpCamWorldPos);
        this.tmpRelativePos.subVectors(this.tmpCamWorldPos, this.tmpBlackHoleWorldPos);
        const distance = this.tmpRelativePos.length();

        const shaderRadius = Math.max(14, Math.min(30, distance / 20));

        const dir = this.tmpRelativePos.normalize();

        this.material.uniforms.uCamPos.value.set(
            dir.x * shaderRadius,
            dir.y * shaderRadius,
            dir.z * shaderRadius
        );

        const baseDistance = 600;
        const billboardScale = Math.max(1, baseDistance / Math.max(distance, 100));
        this.billboard.scale.setScalar(billboardScale);

        this.core.scale.setScalar(billboardScale);
        const corePushBack = 10 * billboardScale;
        this.core.position.set(
            -dir.x * corePushBack,
            -dir.y * corePushBack,
            -dir.z * corePushBack
        );

        const safeDist = Math.max(distance, 1e-6);
        const labelOpacity = Math.min(1, 800 / safeDist);
        this.label.element.style.opacity = String(labelOpacity);
    }
}
