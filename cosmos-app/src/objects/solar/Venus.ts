import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, PlanetConfig } from '../../core/SDK';

// =============================================================================
// VENUS CLASS
// =============================================================================

export class Venus extends THREE.Group {
  public readonly radius: number;

  private mesh: THREE.Mesh;
  private label: CSS2DObject;
  private data: PlanetConfig;
  private initialAngle: number;

  constructor() {
    super();

    this.data = Cosmos.PLANETS.VENUS;
    this.radius = this.data.RADIUS;
    this.initialAngle = Math.random() * Math.PI * 2;

    // Load texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/textures/2k_venus_atmosphere.jpg');

    // Geometry
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

    // Material with texture (using MeshStandardMaterial for consistent lighting)
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.0,
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
    // Orbital Position (realistic period: 224.7 days, elliptical e=0.007)
    const theta = Cosmos.getRealisticOrbitalAngle(
      time,
      Cosmos.ORBITAL_PERIODS.VENUS,
      this.initialAngle
    );
    const pos = Cosmos.getEllipticalOrbitalPosition(
      this.data.DISTANCE,
      Cosmos.ECCENTRICITY.VENUS,
      Cosmos.INCLINATION.VENUS,
      theta
    );
    this.position.set(pos.x, pos.y, pos.z);

    // Rotation (realistic: 243 days retrograde - spins backwards!)
    this.mesh.rotation.y = Cosmos.getRealisticRotation(
      time,
      Cosmos.ROTATION_PERIODS.VENUS
    );

    // Label Opacity
    const dist = camera.position.distanceTo(this.position);
    const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
    this.label.element.style.opacity = String(labelOpacity);
  }
}
