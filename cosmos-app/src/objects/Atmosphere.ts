import * as THREE from 'three';

// Import external shaders
import vertexShader from '../shaders/atmosphere/atmosphere.vert.glsl?raw';
import fragmentShader from '../shaders/atmosphere/atmosphere.frag.glsl?raw';

export interface AtmosphereConfig {
    radius: number;
    color: THREE.Color | string | number;
    power?: number;
    intensity?: number;
}

export class Atmosphere extends THREE.Mesh {
    constructor(config: AtmosphereConfig) {
        const geometry = new THREE.SphereGeometry(config.radius, 64, 64);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(config.color) },
                uPower: { value: config.power || 4.0 },
                uIntensity: { value: config.intensity || 1.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide, // BackSide so we see it when inside? Or FrontSide with blending?
            // If we are outside, FrontSide is better.
            // If we want to fly INSIDE, we probably need BackSide or DoubleSide.
            // But standard Fresnel is ViewDir dependent.
            // Let's stick to FrontSide for the "Glow" look from outside.
            // For "Inside" look (fog), we handle that with scene.fog in App.tsx.
            // But user wants "Atmosphere File".
            // Let's enable Transparent/Blending.
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        super(geometry, material);

        // Scale slightly to avoid z-fighting if radius is close to planet
        // The geometry radius handles this, but strict layering helps.
    }
}
