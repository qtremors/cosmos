import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../../materials/Noise';
import { Cosmos } from '../../core/SDK';

// =============================================================================
// SHADERS
// =============================================================================

const surfaceVertex = `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
    
    #include <logdepthbuf_vertex>
  }
`;

const surfaceFragment = `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  
  uniform float uTime;
  uniform sampler2D uTexture;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseFunctions}

  void main() {
    #include <logdepthbuf_fragment>
    
    // Sample base texture
    vec3 texColor = texture2D(uTexture, vUv).rgb;
    
    float t = uTime * 0.1;
    // Granulation noise overlay
    float n1 = snoise(vPosition * 1.5 + vec3(t));
    float n2 = snoise(vPosition * 6.0 - vec3(t * 2.0));
    float noise = n1 * 0.5 + n2 * 0.2 + 0.5;

    // Blend texture with noise-driven color variation
    vec3 darkVariation = texColor * 0.6;
    vec3 brightVariation = texColor * 1.3;
    
    vec3 color = mix(texColor, darkVariation, smoothstep(0.5, 0.2, noise) * 0.5);
    color = mix(color, brightVariation, smoothstep(0.5, 0.9, noise) * 0.4);

    // Limb Darkening
    vec3 viewDir = normalize(-vViewPosition);
    float ndotv = dot(vNormal, viewDir);
    float limb = smoothstep(0.0, 1.0, ndotv);
    
    color *= (0.3 + 0.7 * limb);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const coronaVertex = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coronaFragment = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  ${noiseFunctions}

  void main() {
    float t = uTime * 0.2;
    float n = snoise(vPosition * 0.8 + vec3(0.0, t, 0.0));
    float rim = 1.0 - abs(dot(vNormal, vec3(0,0,1))); 
    
    float alpha = rim * rim * (0.5 + 0.5 * n);
    vec3 col = vec3(1.0, 0.6, 0.2); 

    if (rim < 0.2) alpha *= 0.1;
    gl_FragColor = vec4(col, alpha * 0.6);
  }
`;

const glareVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glareFragment = `
  varying vec2 vUv;
  uniform float uOpacity;

  void main() {
    vec2 center = vec2(0.5);
    float d = distance(vUv, center);
    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 2.5);

    vec3 color = vec3(1.0, 1.0, 0.9);
    gl_FragColor = vec4(color, glow * uOpacity);
  }
`;

// =============================================================================
// SUN CLASS
// =============================================================================

export class Sun extends THREE.Group {
  public readonly radius: number;

  private surface: THREE.Mesh;
  private corona: THREE.Mesh;
  private glare: THREE.Mesh;
  private label: CSS2DObject;

  private sunMat: THREE.ShaderMaterial;
  private coronaMat: THREE.ShaderMaterial;
  private glareMat: THREE.ShaderMaterial;

  constructor(radius: number = Cosmos.UNITS.SOLAR_RADIUS) {
    super();
    this.radius = radius;

    // Load sun texture
    const loader = new THREE.TextureLoader();
    const sunTexture = loader.load('/textures/2k_sun.jpg');

    // 1. Surface
    const sunGeo = new THREE.SphereGeometry(radius, 64, 64);
    this.sunMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: sunTexture },
      },
      vertexShader: surfaceVertex,
      fragmentShader: surfaceFragment,
      depthWrite: true,
      depthTest: true,
    });
    this.surface = new THREE.Mesh(sunGeo, this.sunMat);
    this.surface.renderOrder = 0; // Render first to write depth
    this.add(this.surface);

    // 2. Corona
    const coronaGeo = new THREE.SphereGeometry(radius * 1.06, 64, 64);
    this.coronaMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: coronaVertex,
      fragmentShader: coronaFragment,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.corona = new THREE.Mesh(coronaGeo, this.coronaMat);
    this.corona.renderOrder = 10; // Render after opaque objects
    this.add(this.corona);

    // 3. Glare
    const glareGeo = new THREE.PlaneGeometry(radius * 8, radius * 8);
    this.glareMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: glareVertex,
      fragmentShader: glareFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,  // Respect depth so it doesn't render on top of objects in front
    });
    this.glare = new THREE.Mesh(glareGeo, this.glareMat);
    this.glare.renderOrder = 20; // Render last
    this.add(this.glare);

    // 4. Label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Sun';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
    this.add(this.label);
  }

  update(time: number, camera: THREE.Camera): void {
    // Rotation (realistic: ~25 days)
    this.surface.rotation.y = Cosmos.getRealisticRotation(time, Cosmos.ROTATION_PERIODS.SUN);
    this.corona.rotation.y = Cosmos.getRealisticRotation(time, Cosmos.ROTATION_PERIODS.SUN * 1.5); // Corona rotates slower/differently

    // Uniforms
    // Use REAL TIME for surface turbulence so it doesn't turn into static at high speeds
    const realTime = performance.now() * 0.001;
    this.sunMat.uniforms.uTime.value = realTime;
    this.coronaMat.uniforms.uTime.value = realTime;

    // Glare Billboarding
    this.glare.lookAt(camera.position);

    // SDK: Adaptive Glare
    const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
    const opacity = Cosmos.getAdaptiveGlareOpacity(dist, this.radius);
    this.glareMat.uniforms.uOpacity.value = opacity;

    // SDK: Label Opacity
    const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
    this.label.element.style.opacity = String(labelOpacity);
  }
}
