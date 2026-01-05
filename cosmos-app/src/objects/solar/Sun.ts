import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../../materials/Noise';
import { Cosmos } from '../../core/SDK';

// Import external shaders
import surfaceVertexShader from '../../shaders/sun/surface.vert.glsl?raw';
import surfaceFragmentShaderRaw from '../../shaders/sun/surface.frag.glsl?raw';
import coronaVertexShader from '../../shaders/sun/corona.vert.glsl?raw';
import coronaFragmentShaderRaw from '../../shaders/sun/corona.frag.glsl?raw';
import glareVertexShader from '../../shaders/sun/glare.vert.glsl?raw';
import glareFragmentShader from '../../shaders/sun/glare.frag.glsl?raw';

// Inject noise functions into shaders that need them
const surfaceFragmentShader = surfaceFragmentShaderRaw.replace('// NOISE_FUNCTIONS_PLACEHOLDER', noiseFunctions);
const coronaFragmentShader = coronaFragmentShaderRaw.replace('// NOISE_FUNCTIONS_PLACEHOLDER', noiseFunctions);

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
      vertexShader: surfaceVertexShader,
      fragmentShader: surfaceFragmentShader,
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
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
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
      vertexShader: glareVertexShader,
      fragmentShader: glareFragmentShader,
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
