import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noiseFunctions } from '../../materials/Noise';
import { Cosmos } from '../../core/SDK';

import surfaceVertexShader from '../../shaders/sun/surface.vert.glsl?raw';
import surfaceFragmentShaderRaw from '../../shaders/sun/surface.frag.glsl?raw';
import coronaVertexShader from '../../shaders/sun/corona.vert.glsl?raw';
import coronaFragmentShaderRaw from '../../shaders/sun/corona.frag.glsl?raw';
import glareVertexShader from '../../shaders/sun/glare.vert.glsl?raw';
import glareFragmentShader from '../../shaders/sun/glare.frag.glsl?raw';

const surfaceFragmentShader = surfaceFragmentShaderRaw.replace('// NOISE_FUNCTIONS_PLACEHOLDER', noiseFunctions);
const coronaFragmentShader = coronaFragmentShaderRaw.replace('// NOISE_FUNCTIONS_PLACEHOLDER', noiseFunctions);



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

    const loader = new THREE.TextureLoader();
    const sunTexture = loader.load('/textures/2k_sun.jpg');

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
    this.surface.renderOrder = 0;
    this.add(this.surface);

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
    this.corona.renderOrder = 10;
    this.add(this.corona);

    const glareGeo = new THREE.PlaneGeometry(radius * 8, radius * 8);
    this.glareMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: glareVertexShader,
      fragmentShader: glareFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    this.glare = new THREE.Mesh(glareGeo, this.glareMat);
    this.glare.renderOrder = 20;
    this.add(this.glare);

    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Sun';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
    this.add(this.label);
  }

  update(time: number, camera: THREE.Camera): void {
    this.surface.rotation.y = Cosmos.getRealisticRotation(time, Cosmos.ROTATION_PERIODS.SUN);
    this.corona.rotation.y = Cosmos.getRealisticRotation(time, Cosmos.ROTATION_PERIODS.SUN * 1.5);

    const realTime = performance.now() * 0.001;
    this.sunMat.uniforms.uTime.value = realTime;
    this.coronaMat.uniforms.uTime.value = realTime;

    this.glare.lookAt(camera.position);

    const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
    const opacity = Cosmos.getAdaptiveGlareOpacity(dist, this.radius);
    this.glareMat.uniforms.uOpacity.value = opacity;

    const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
    this.label.element.style.opacity = String(labelOpacity);
  }
}
