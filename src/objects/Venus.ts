import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../materials/Noise';
import { Cosmos, PlanetConfig } from '../core/SDK';

// =============================================================================
// SHADERS
// =============================================================================

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 uSunPos; 
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  ${noiseFunctions}

  void main() {
    // 1. Cloud Noise (Swirling)
    float t = uTime * 0.1;
    // Layer 1: Base flow
    float n1 = snoise(vPosition * 1.5 + vec3(t * 0.5, t, 0.0));
    // Layer 2: Detail
    float n2 = snoise(vPosition * 4.0 - vec3(0.0, t * 0.8, 0.0));
    
    float clouds = n1 * 0.6 + n2 * 0.4;
    
    // 2. Color Palette (Venusian Atmosphere)
    vec3 cDark = vec3(0.65, 0.45, 0.2);
    vec3 cMid = vec3(0.89, 0.74, 0.47);
    vec3 cBright = vec3(0.95, 0.9, 0.7);
    
    vec3 col = mix(cDark, cMid, smoothstep(-0.4, 0.2, clouds));
    col = mix(col, cBright, smoothstep(0.0, 0.8, clouds));

    // 3. Lighting
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // 4. Atmosphere Scattering (Fresnel / Rim)
    float rim = 1.0 - abs(dot(normal, normalize(cameraPosition - vWorldPosition)));
    rim = pow(rim, 3.0);
    
    // Combine
    vec3 finalColor = col * (diff + 0.05);
    finalColor += cBright * rim * 0.3 * diff;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// =============================================================================
// VENUS CLASS
// =============================================================================

export class Venus extends THREE.Group {
    public readonly radius: number;

    private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    private label: CSS2DObject;
    private data: PlanetConfig;
    private initialAngle: number;

    constructor() {
        super();

        this.data = Cosmos.PLANETS.VENUS;
        this.radius = this.data.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material with shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunPos: { value: new THREE.Vector3(0, 0, 0) },
                uTime: { value: 0 },
            },
            vertexShader,
            fragmentShader,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Venus';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbital Position
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            this.data.SPEED,
            this.data.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Rotation (Retrograde - very slow, backwards)
        this.mesh.rotation.y = -time * 0.01;

        // Shader Uniforms
        this.mesh.material.uniforms.uTime.value = time;

        // Label Opacity
        const dist = camera.position.distanceTo(this.position);
        const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
        this.label.element.style.opacity = String(labelOpacity);
    }
}
