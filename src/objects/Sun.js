import * as THREE from 'three';
import { noiseFunctions } from '../materials/Noise.js';
import { Cosmos } from '../core/SDK.js'; // IMPORT SDK

// --- SHADERS ---

const surfaceVertex = `
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
  }
`;

const surfaceFragment = `
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseFunctions}

  void main() {
    float t = uTime * 0.1;
    // Granulation
    float n1 = snoise(vPosition * 1.5 + vec3(t));
    float n2 = snoise(vPosition * 6.0 - vec3(t * 2.0));
    float noise = n1 * 0.5 + n2 * 0.2 + 0.5;

    // 6000K Colors
    vec3 sunBlack = vec3(0.4, 0.1, 0.05); 
    vec3 sunSurf = vec3(1.0, 0.6, 0.1);   
    vec3 sunHot = vec3(1.0, 0.95, 0.8);   

    vec3 color = mix(sunSurf, sunBlack, smoothstep(0.4, 0.1, noise));
    color = mix(color, sunHot, smoothstep(0.5, 0.9, noise));

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
  uniform float uOpacity; // CONTROLLED BY SDK

  void main() {
    vec2 center = vec2(0.5);
    float d = distance(vUv, center);
    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 2.5);

    vec3 color = vec3(1.0, 1.0, 0.9);
    gl_FragColor = vec4(color, glow * uOpacity);
  }
`;


import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class Sun extends THREE.Group {
  constructor(radius = Cosmos.UNITS.SOLAR_RADIUS) { // USE SDK CONSTANT
    super();
    this.radius = radius;

    // 1. Surface
    const sunGeo = new THREE.SphereGeometry(radius, 64, 64);
    this.sunMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: surfaceVertex,
      fragmentShader: surfaceFragment,
    });
    this.surface = new THREE.Mesh(sunGeo, this.sunMat);
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
    this.add(this.corona);

    // 3. Glare
    const glareGeo = new THREE.PlaneGeometry(radius * 8, radius * 8);
    this.glareMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } }, // SDK controls this
      vertexShader: glareVertex,
      fragmentShader: glareFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
    this.glare = new THREE.Mesh(glareGeo, this.glareMat);
    this.add(this.glare);

    // 4. Label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Sun';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, radius * 2.5, 0); // Much higher
    this.add(this.label);
  }

  update(time, camera) {
    // Rotation
    this.surface.rotation.y = time * 0.05;
    this.corona.rotation.y = time * 0.02;

    // Uniforms
    this.sunMat.uniforms.uTime.value = time;
    this.coronaMat.uniforms.uTime.value = time;

    // Glare Billboarding
    this.glare.lookAt(camera.position);

    // SDK LOGIC: ADAPTIVE GLARE
    const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
    const opacity = Cosmos.getAdaptiveGlareOpacity(dist, this.radius);
    this.glareMat.uniforms.uOpacity.value = opacity;

    // LABEL LOGIC
    // Hide when too close (so we can see surface)
    // Show when far
    const labelOpacity = smoothstep(this.radius * 3.0, this.radius * 10.0, dist);
    this.label.element.style.opacity = labelOpacity;
  }
}

function smoothstep(min, max, value) {
  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
