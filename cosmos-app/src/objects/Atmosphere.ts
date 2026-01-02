import * as THREE from 'three';

const vertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform vec3 uColor;
uniform float uPower;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
  rim = pow(rim, uPower);
  
  // Soft fade out at edges
  float alpha = rim * uIntensity;
  
  gl_FragColor = vec4(uColor, alpha);
}
`;

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
