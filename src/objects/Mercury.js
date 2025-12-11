import * as THREE from 'three';
import { noiseFunctions } from '../materials/Noise.js';
import { Cosmos } from '../core/SDK.js';

// --- MERCURY SHADER ---
// A rocky, cratered surface shader

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
  uniform vec3 uSunPos; // Usually (0,0,0)
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  ${noiseFunctions}

  // Simple crater-like noise
  float craterNoise(vec3 p) {
    // Basic fractal noise
    float n = snoise(p * 3.0) * 0.5 + snoise(p * 12.0) * 0.25;
    
    // Invert ridges?
    // A simplified approach: Use Voronoi-ish cells or just high freq noise for roughness
    // Let's stick to "Rocky Noise" which is high frequency
    return n;
  }

  void main() {
    // 1. Surface Texture
    float n = craterNoise(vPosition * 2.0); // Object space noise
    
    // Base Color
    vec3 col = uColor;
    
    // Add noise variation (Darker valleys)
    col *= (0.8 + 0.4 * n);

    // 2. Lighting (Sun is a Point Light at uSunPos)
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    
    // Perturb normal with noise (Proprietary bump mapping logic simplified)
    // We'll just fake it by darkening 'n' shadows
    
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Sharp shadows for space (no ambient air scattering)
    // But maybe a tiny bit of ambient from stars
    vec3 ambient = vec3(0.02);
    
    vec3 finalColor = col * (diff + ambient);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class Mercury extends THREE.Mesh {
  constructor() {
    const data = Cosmos.PLANETS.MERCURY;
    const geometry = new THREE.SphereGeometry(data.RADIUS, 64, 64);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uSunPos: { value: new THREE.Vector3(0, 0, 0) },
        uColor: { value: data.COLOR },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    super(geometry, material);

    this.data = data;
    this.angle = Math.random() * Math.PI * 2;

    // LABEL
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Mercury';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, data.RADIUS * 3.0, 0); // Higher clearance
    this.add(this.label);
  }

  update(time, camera) {
    // Orbital Physics
    // x = r * cos(theta), z = r * sin(theta)
    const speed = this.data.SPEED * 0.2; // visual scaler
    const theta = this.angle + time * speed;

    const r = this.data.DISTANCE;
    this.position.x = Math.cos(theta) * r;
    this.position.z = Math.sin(theta) * r;

    // Rotation (Day/Night cycle)
    this.rotation.y = time * 0.1;

    // LABEL LOGIC
    if (camera) {
      const dist = camera.position.distanceTo(this.position);
      // Fade out if closer than 5 radius units
      const labelOpacity = smoothstep(this.data.RADIUS * 5.0, this.data.RADIUS * 20.0, dist);
      this.label.element.style.opacity = labelOpacity;
    }
  }
}

function smoothstep(min, max, value) {
  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
