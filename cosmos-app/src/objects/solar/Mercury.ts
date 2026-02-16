import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos, PlanetConfig } from '../../core/SDK';



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

    const loader = new THREE.TextureLoader();
    const texture = loader.load('/textures/2k_mercury.jpg');

    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.add(this.mesh);

    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Mercury';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
    this.add(this.label);
  }

  update(time: number, camera: THREE.Camera): void {
    const theta = Cosmos.getRealisticOrbitalAngle(
      time,
      Cosmos.ORBITAL_PERIODS.MERCURY,
      this.initialAngle
    );
    const pos = Cosmos.getEllipticalOrbitalPosition(
      this.data.DISTANCE,
      Cosmos.ECCENTRICITY.MERCURY,
      Cosmos.INCLINATION.MERCURY,
      theta
    );
    this.position.set(pos.x, pos.y, pos.z);

    this.mesh.rotation.y = Cosmos.getRealisticRotation(
      time,
      Cosmos.ROTATION_PERIODS.MERCURY
    );

    const dist = camera.position.distanceTo(this.position);
    const labelOpacity = Cosmos.getLabelOpacity(dist, this.radius);
    this.label.element.style.opacity = String(labelOpacity);
  }
}
