import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../materials/Noise';
import { Cosmos } from '../core/SDK';

// =============================================================================
// SHADERS - Ice Giant atmosphere with storms
// =============================================================================

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
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
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  ${noiseFunctions}

  void main() {
    // Dynamic storm bands
    float t = uTime * 0.03;
    float n1 = snoise(vPosition * 1.5 + vec3(t, 0.0, 0.0));
    float n2 = snoise(vPosition * 4.0 + vec3(0.0, t * 0.7, 0.0));
    float n3 = snoise(vPosition * 8.0 - vec3(t * 0.3, t * 0.5, 0.0));
    float bands = n1 * 0.4 + n2 * 0.3 + n3 * 0.1;
    
    // Darker and lighter bands
    vec3 darkBlue = uColor * 0.7;
    vec3 lightBlue = uColor * 1.2;
    vec3 col = mix(darkBlue, lightBlue, smoothstep(-0.3, 0.3, bands));
    
    // Stormy white spots
    float storms = smoothstep(0.5, 0.7, n2 + n3 * 0.5);
    col = mix(col, vec3(0.8, 0.85, 0.95), storms * 0.3);
    
    // Lighting
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Atmosphere rim
    float rim = 1.0 - abs(dot(normal, normalize(cameraPosition - vWorldPosition)));
    rim = pow(rim, 3.0);
    
    vec3 finalColor = col * (diff + 0.06);
    finalColor += uColor * rim * 0.5 * diff;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// =============================================================================
// NEPTUNE CLASS
// =============================================================================

export class Neptune extends THREE.Group {
    public readonly radius: number;

    private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    private label: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const config = Cosmos.PLANETS.NEPTUNE;
        this.radius = config.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // Geometry
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        // Shader Material for storm dynamics
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunPos: { value: new THREE.Vector3(0, 0, 0) },
                uTime: { value: 0 },
                uColor: { value: config.COLOR },
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
        div.textContent = 'Neptune';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        const config = Cosmos.PLANETS.NEPTUNE;

        // Orbit
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            config.SPEED,
            config.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // Rotation
        this.mesh.rotation.y += 0.01;

        // Shader time
        this.mesh.material.uniforms.uTime.value = time;

        // Label
        const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
    }
}
