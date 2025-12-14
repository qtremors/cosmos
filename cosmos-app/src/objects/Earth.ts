import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../materials/Noise';
import { Cosmos } from '../core/SDK';

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
    // 1. Geography Noise
    float n1 = snoise(vPosition * 1.5); 
    float n2 = snoise(vPosition * 6.0);
    float h = n1 + n2 * 0.5;
    
    // 2. Classify Terrain
    bool isOcean = h < 0.1;
    
    // 3. Colors
    vec3 cOceanDeep = vec3(0.0, 0.05, 0.2);
    vec3 cOceanShallow = vec3(0.0, 0.2, 0.5);
    vec3 cLandLow = vec3(0.1, 0.4, 0.1);
    vec3 cLandHigh = vec3(0.4, 0.35, 0.3);
    vec3 cSnow = vec3(0.9, 0.9, 0.95);
    
    vec3 col;
    
    if (isOcean) {
        float depth = smoothstep(-1.0, 0.1, h);
        col = mix(cOceanDeep, cOceanShallow, depth);
    } else {
        float height = smoothstep(0.1, 1.0, h);
        col = mix(cLandLow, cLandHigh, height);
        if (abs(vPosition.y) > 1.5) col = mix(col, cSnow, 0.8);
        if (h > 0.8) col = mix(col, cSnow, 0.5);
    }

    // 4. Clouds
    float t = uTime * 0.05;
    float c1 = snoise(vPosition * 2.5 + vec3(t));
    float c2 = snoise(vPosition * 5.0 + vec3(t*1.2, 0.0, 0.0));
    float cloudNoise = c1 + c2 * 0.5;
    float cloudCover = smoothstep(0.4, 0.8, cloudNoise);
    
    vec3 cCloud = vec3(0.95);
    col = mix(col, cCloud, cloudCover * 0.8);
    
    // 5. Lighting
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Specular (Ocean only)
    float spec = 0.0;
    if (isOcean && cloudCover < 0.1) {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    }
    
    // Atmosphere Rim
    float rim = 1.0 - dot(normal, normalize(cameraPosition - vWorldPosition));
    rim = clamp(pow(rim, 4.0), 0.0, 1.0);
    vec3 cAtmo = vec3(0.2, 0.4, 0.8);
    
    col = col * (diff + 0.05) + vec3(spec);
    col += cAtmo * rim * 0.5 * diff;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// =============================================================================
// EARTH CLASS
// =============================================================================

export class Earth extends THREE.Group {
    public readonly radius: number;
    public readonly moon: THREE.Mesh;

    private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
    private label: CSS2DObject;
    private moonLabel: CSS2DObject;
    private initialAngle: number;

    constructor() {
        super();

        const data = Cosmos.PLANETS.EARTH;
        this.radius = data.RADIUS;
        this.initialAngle = Math.random() * Math.PI * 2;

        // --- PLANET ---
        const geometry = new THREE.SphereGeometry(data.RADIUS, 64, 64);
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

        // --- MOON ---
        const moonGeo = new THREE.SphereGeometry(data.MOON.RADIUS * 1.5, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.8,
            metalness: 0.0,
        });
        this.moon = new THREE.Mesh(moonGeo, moonMat);
        this.moon.castShadow = true;
        this.moon.receiveShadow = true;
        this.add(this.moon);

        // Moonlight
        const moonLight = new THREE.PointLight(Cosmos.LIGHTING.MOON_COLOR, 0.5, 30);
        this.moon.add(moonLight);

        // Moon Label
        const moonDiv = document.createElement('div');
        moonDiv.className = 'label';
        moonDiv.textContent = 'Moon';
        moonDiv.style.fontSize = '10px';
        this.moonLabel = new CSS2DObject(moonDiv);
        this.moonLabel.position.set(0, data.MOON.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.moon.add(this.moonLabel);

        // --- MOON ORBIT PATH ---
        const moonOrbitCurve = new THREE.EllipseCurve(
            0, 0,
            data.MOON.DISTANCE, data.MOON.DISTANCE,
            0, 2 * Math.PI,
            false, 0
        );
        const moonOrbitPoints = moonOrbitCurve.getPoints(64);
        const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
        moonOrbitGeo.rotateX(-Math.PI / 2);
        const moonOrbitMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
        });
        const moonOrbitLine = new THREE.LineLoop(moonOrbitGeo, moonOrbitMat);
        this.add(moonOrbitLine);

        // --- EARTH LABEL ---
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Earth';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, data.RADIUS * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
        this.add(this.label);
    }

    update(time: number, camera: THREE.Camera): void {
        const data = Cosmos.PLANETS.EARTH;

        // 1. Orbit Sun
        const pos = Cosmos.getOrbitalPosition(
            this.initialAngle,
            time,
            data.SPEED,
            data.DISTANCE
        );
        this.position.x = pos.x;
        this.position.z = pos.z;

        // 2. Planet Rotation
        this.mesh.rotation.y = time * 0.1;

        // 3. Moon Orbit
        const moonPos = Cosmos.getOrbitalPosition(
            0,
            time,
            data.MOON.SPEED,
            data.MOON.DISTANCE
        );
        this.moon.position.x = moonPos.x;
        this.moon.position.z = moonPos.z;

        // 4. Shader
        this.mesh.material.uniforms.uTime.value = time;

        // 5. Labels
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));

        const moonWorldPos = new THREE.Vector3();
        this.moon.getWorldPosition(moonWorldPos);
        const moonDist = camera.position.distanceTo(moonWorldPos);
        this.moonLabel.element.style.opacity = String(Cosmos.getLabelOpacity(moonDist, data.MOON.RADIUS));
    }
}
