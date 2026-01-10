import * as THREE from 'three';

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
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        super(geometry, material);
    }
}
