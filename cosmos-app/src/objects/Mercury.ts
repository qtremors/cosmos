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
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  ${noiseFunctions}

  // Simple crater-like noise
  float craterNoise(vec3 p) {
    float n = snoise(p * 3.0) * 0.5 + snoise(p * 12.0) * 0.25;
    return n;
  }

  void main() {
    // 1. Surface Texture
    float n = craterNoise(vPosition * 2.0);
    
    // Base Color
    vec3 col = uColor;
    
    // Add noise variation (Darker valleys)
    col *= (0.8 + 0.4 * n);

    // 2. Lighting (Sun is a Point Light at uSunPos)
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Sharp shadows for space (no ambient air scattering)
    vec3 ambient = vec3(0.02);
    
    vec3 finalColor = col * (diff + ambient);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// =============================================================================
// MERCURY CLASS
// =============================================================================

export class Mercury extends THREE.Group {
    public readonly radius: number;

    private mesh: THREE.Mesh;
    private label: CSS2DObject;
    private data: PlanetConfig;
    private initialAngle: number;

    constructor() {
        super();

        this.data = Cosmos.PLANETS.MERCURY;
        this.radius = this.data.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Material with shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunPos: { value: new THREE.Vector3(0, 0, 0) },
                uColor: { value: this.data.COLOR },
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
        div.textContent = 'Mercury';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        // Orbital Position (using SDK unified calculation)
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            this.data.SPEED,
            this.data.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Rotation
        this.mesh.rotation.y = time * 0.1;

        // Label Opacity
        const dist = camera.position.distanceTo(this.position);
        const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
        this.label.element.style.opacity = String(labelOpacity);
    }
}
