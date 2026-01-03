import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

// =============================================================================
// SHADER CODE - Alien/Exotic Planet
// =============================================================================

const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    // Noise function
    float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
    }
    
    float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for(int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = p * 2.0;
            a *= 0.5;
        }
        return v;
    }
    
    void main() {
        // Animated surface patterns
        float t = uTime * 0.1;
        
        // Multi-layer noise for alien terrain
        vec3 noisePos = vPosition * 2.0 + vec3(t * 0.2, 0.0, t * 0.15);
        float n1 = fbm(noisePos);
        float n2 = fbm(noisePos * 3.0 + 100.0);
        float n3 = fbm(noisePos * 0.5 - 50.0);
        
        // Exotic color palette - deep purple, cyan, magenta swirls
        vec3 color1 = vec3(0.6, 0.1, 0.8);   // Deep purple
        vec3 color2 = vec3(0.1, 0.8, 0.9);   // Cyan
        vec3 color3 = vec3(1.0, 0.3, 0.6);   // Hot pink
        vec3 color4 = vec3(0.2, 0.0, 0.4);   // Dark violet
        
        // Blend colors based on noise
        vec3 color = mix(color1, color2, smoothstep(0.3, 0.6, n1));
        color = mix(color, color3, smoothstep(0.4, 0.7, n2) * 0.5);
        color = mix(color, color4, smoothstep(0.5, 0.8, n3) * 0.3);
        
        // Pulsing energy veins
        float veins = pow(abs(sin(n1 * 20.0 + t * 2.0)), 4.0) * 0.3;
        color += vec3(0.8, 0.4, 1.0) * veins;
        
        // Atmospheric glow at edges
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
        color += vec3(0.5, 0.2, 1.0) * fresnel * 0.6;
        
        // Subtle shimmer
        float shimmer = noise(vPosition * 10.0 + t * 5.0) * 0.1;
        color += shimmer;
        
        // Emissive glow
        color *= 1.2;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

const ringFragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
        // Distance from center of ring
        float dist = length(vUv - 0.5) * 2.0;
        
        // Multiple ring bands
        float ring1 = smoothstep(0.3, 0.35, dist) * (1.0 - smoothstep(0.55, 0.6, dist));
        float ring2 = smoothstep(0.65, 0.7, dist) * (1.0 - smoothstep(0.85, 0.9, dist));
        float ring3 = smoothstep(0.45, 0.48, dist) * (1.0 - smoothstep(0.52, 0.55, dist));
        
        float rings = ring1 + ring2 * 0.7 + ring3 * 0.5;
        
        // Animated sparkle
        float sparkle = sin(vUv.x * 50.0 + uTime * 3.0) * sin(vUv.y * 50.0 - uTime * 2.0);
        sparkle = pow(abs(sparkle), 3.0) * 0.3;
        
        // Color gradient
        vec3 color1 = vec3(0.8, 0.3, 1.0);  // Purple
        vec3 color2 = vec3(0.3, 0.8, 1.0);  // Cyan
        vec3 color = mix(color1, color2, vUv.x + sin(uTime) * 0.2);
        
        color += sparkle;
        
        float alpha = rings * 0.7;
        
        gl_FragColor = vec4(color, alpha);
    }
`;

// =============================================================================
// TREMORS PLANET CLASS
// =============================================================================

export class EasterEggPlanet extends THREE.Group {
    private mesh: THREE.Mesh;
    private ring: THREE.Mesh;
    private glow: THREE.Mesh;
    private label: CSS2DObject;
    private initialAngle: number;
    private planetMat: THREE.ShaderMaterial;
    private ringMat: THREE.ShaderMaterial;
    private clock: THREE.Clock;

    constructor() {
        super();

        this.clock = new THREE.Clock();

        // Create exotic shader planet
        const geometry = new THREE.SphereGeometry(6, 64, 64);

        this.planetMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
            },
            toneMapped: false,
        });

        this.mesh = new THREE.Mesh(geometry, this.planetMat);
        this.add(this.mesh);

        // Shader ring
        const ringGeo = new THREE.RingGeometry(8, 14, 64);
        this.ringMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: ringFragmentShader,
            uniforms: {
                uTime: { value: 0 },
            },
            transparent: true,
            side: THREE.DoubleSide,
            toneMapped: false,
            depthWrite: false,
        });
        this.ring = new THREE.Mesh(ringGeo, this.ringMat);
        this.ring.rotation.x = Math.PI / 2.2;
        this.add(this.ring);

        // Outer glow sprite
        const glowGeo = new THREE.SphereGeometry(10, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x8844ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.add(this.glow);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Tremors';
        div.style.color = '#cc66ff';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 10, 0);
        this.add(this.label);

        // Hidden location - way out past Pluto
        this.initialAngle = Math.random() * Math.PI * 2;
        const distance = 250;
        this.position.x = Math.cos(this.initialAngle) * distance;
        this.position.z = Math.sin(this.initialAngle) * distance;
        this.position.y = 30;
    }

    update(time: number, camera: THREE.Camera): void {
        const independentTime = this.clock.getElapsedTime();

        // Update shader uniforms
        this.planetMat.uniforms.uTime.value = independentTime;
        this.ringMat.uniforms.uTime.value = independentTime;

        // Very slow orbit
        const theta = this.initialAngle + time * 0.000001;
        const distance = 250;
        this.position.x = Math.cos(theta) * distance;
        this.position.z = Math.sin(theta) * distance;

        // Rotation
        this.mesh.rotation.y = independentTime * 0.1;
        this.ring.rotation.z = independentTime * 0.05;

        // Label opacity
        const dist = camera.position.distanceTo(this.position);
        const opacity = Cosmos.getLabelOpacity(dist, 6);
        this.label.element.style.opacity = String(opacity);
    }
}
