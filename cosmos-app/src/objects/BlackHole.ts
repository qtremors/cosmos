import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';


// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Position (galactic center relative to solar system)
    DISTANCE: 8000,
    HEIGHT: 2000,

    // Visual sizes
    BILLBOARD_SIZE: 600,
    CORE_RADIUS: 65,  // Solid black sphere for event horizon - sized to match shader visual
};

// =============================================================================
// RAYMARCHING SHADER (Dynamic camera synced with Cosmos camera)
// =============================================================================

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform vec3 uCamPos;
    
    varying vec2 vUv;

    #define MAX_DIST 100.0

    float hash(float n) { 
        return fract(sin(n) * 43758.5453123); 
    }

    float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = p.x + p.y * 57.0 + 113.0 * p.z;
        
        return mix(
            mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
            mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    }

    float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        vec3 shift = vec3(100.0);
        for (int i = 0; i < 5; ++i) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        
        vec3 ro = uCamPos;

        vec3 target = vec3(0.0, 0.0, 0.0);
        vec3 zAxis = normalize(target - ro);
        vec3 xAxis = normalize(cross(vec3(0.0, 1.0, 0.0), zAxis));
        if (length(xAxis) < 0.001) {
            xAxis = normalize(cross(vec3(0.0, 0.0, 1.0), zAxis));
        }
        vec3 yAxis = cross(zAxis, xAxis);
        mat3 camRot = mat3(xAxis, yAxis, zAxis);
        vec3 rd = camRot * normalize(vec3(uv, 2.0));

        vec3 col = vec3(0.0);
        float glow = 0.0;
        float totalAccretion = 0.0;

        vec3 p = ro;
        float d = 0.0;

        // Black hole parameters - core is handled by separate mesh
        float accretionMin = 3.0;  // Inner edge closer to core
        float accretionMax = 14.0;
        
        // Boost brightness when viewing from top/bottom (camera Y dominates)
        float camYRatio = abs(ro.y) / length(ro);
        float topViewBoost = 1.0 + camYRatio * 2.5;  // Up to 3.5x brighter from directly above

        for(int i = 0; i < 150; i++) {
            float distToCenter = length(p);
            
            // Skip the core area (handled by solid sphere mesh)
            if (distToCenter < 2.5) {
                break;
            }

            // Gravitational Lensing
            vec3 toCenter = normalize(-p);
            float bendStrength = 0.15 / (distToCenter * distToCenter);
            rd = normalize(rd + toCenter * bendStrength);

            // ENHANCED Accretion Disk
            float planeDist = abs(p.y);
            
            if (distToCenter > accretionMin && distToCenter < accretionMax && planeDist < 0.6) {
                float r = distToCenter;
                float angle = atan(p.z, p.x);
                
                // Keplerian rotation
                float rotSpeed = 3.0 / r;
                float animAngle = angle + uTime * rotSpeed;
                
                // Multi-layer turbulence for detail
                vec3 noisePos1 = vec3(r * 2.0, animAngle * 3.0, uTime * 0.1);
                vec3 noisePos2 = vec3(r * 4.0, animAngle * 6.0, uTime * 0.15);
                float density = fbm(noisePos1) * 0.7 + fbm(noisePos2) * 0.3;
                
                float fade = smoothstep(accretionMax, accretionMax - 3.0, r) * smoothstep(accretionMin, accretionMin + 1.5, r);
                float verticalFade = smoothstep(0.5, 0.0, planeDist);
                
                float intensity = density * fade * verticalFade;

                // Original Doppler colors
                float doppler = dot(normalize(cross(vec3(0.0, 1.0, 0.0), p)), normalize(ro - p));
                vec3 coolColor = vec3(1.0, 0.4, 0.1);   // Orange
                vec3 hotColor = vec3(0.3, 0.6, 1.0);    // Blue
                vec3 diskColor = mix(coolColor, hotColor, smoothstep(-0.5, 0.5, doppler));
                
                // Original accumulation levels with top-view boost
                totalAccretion += intensity * 0.15 * topViewBoost;
                col += diskColor * intensity * 0.2 * topViewBoost * (1.0 - min(glow, 1.0));
            }
            
            // Glow (reduced)
            float glowContrib = 1.0 / (distToCenter * distToCenter * 25.0 * max(abs(p.y), 0.05) + 0.05);
            glow += glowContrib;

            float stepSize = max(0.04, distToCenter * 0.04); 
            p += rd * stepSize;
            d += stepSize;
            
            if(d > MAX_DIST) break;
        }

        // Original glow levels
        col += vec3(1.0, 0.7, 0.4) * glow * 0.05;
        col = 1.0 - exp(-col * 1.8);
        
        // Circular mask
        float distFromCenter = length(uv);
        float circleMask = 1.0 - smoothstep(0.85, 1.0, distFromCenter);
        
        // Alpha based on accretion/glow only (core is separate mesh)
        float alpha = circleMask * max(totalAccretion * 2.0, glow * 0.15);
        alpha = min(alpha, 1.0);
        
        gl_FragColor = vec4(col, alpha);
    }
`;

// =============================================================================
// SAGITTARIUS A* CLASS
// =============================================================================

export class BlackHole extends THREE.Group {
    public readonly radius: number = CONFIG.BILLBOARD_SIZE / 2;

    private billboard: THREE.Mesh;
    private core: THREE.Mesh;  // Solid black sphere
    private label: CSS2DObject;
    private material: THREE.ShaderMaterial;
    private clock: THREE.Clock;

    constructor() {
        super();

        this.clock = new THREE.Clock();

        // Position at galactic center
        const angle = Math.PI * 0.75;
        this.position.set(
            Math.cos(angle) * CONFIG.DISTANCE,
            CONFIG.HEIGHT,
            Math.sin(angle) * CONFIG.DISTANCE
        );

        // 1. SOLID BLACK CORE (Event Horizon) - renders first
        const coreGeometry = new THREE.SphereGeometry(CONFIG.CORE_RADIUS, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            toneMapped: false,
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.core.renderOrder = 99;  // Render before billboard
        this.add(this.core);

        // 2. ACCRETION DISK BILLBOARD - renders after core
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
        this.billboard.renderOrder = 100;  // Render after core
        this.add(this.billboard);

        // 3. Label
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

        // Billboard always faces camera
        this.billboard.lookAt(camera.position);

        // Calculate camera position relative to black hole
        const blackHoleWorldPos = this.getWorldPosition(new THREE.Vector3());
        const relativePos = new THREE.Vector3().subVectors(camera.position, blackHoleWorldPos);
        const distance = relativePos.length();

        // Map world distance to shader space with MINIMUM distance to prevent distortion
        const shaderRadius = Math.max(14, Math.min(30, distance / 20));

        const dir = relativePos.normalize();

        this.material.uniforms.uCamPos.value.set(
            dir.x * shaderRadius,
            dir.y * shaderRadius,
            dir.z * shaderRadius
        );

        // Scale billboard larger when closer so the full effect stays visible
        // At distance 600, scale = 1. At distance 300, scale = 2, etc.
        const baseDistance = 600;
        const billboardScale = Math.max(1, baseDistance / Math.max(distance, 100));
        this.billboard.scale.setScalar(billboardScale);

        // Scale core proportionally and position it slightly behind the billboard
        // so it always stays inside the disk effect at all viewing angles
        this.core.scale.setScalar(billboardScale);
        const corePushBack = 10 * billboardScale;  // Push core away from camera
        this.core.position.set(
            -dir.x * corePushBack,
            -dir.y * corePushBack,
            -dir.z * corePushBack
        );

        // Label opacity
        const labelOpacity = Math.min(1, 800 / distance);
        this.label.element.style.opacity = String(labelOpacity);
    }
}
