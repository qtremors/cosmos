import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Cosmos } from '../../core/SDK';

// =============================================================================
// URANUS CLASS
// =============================================================================

export class Uranus extends THREE.Group {
  public readonly radius: number;

  private mesh: THREE.Mesh;
  private rings: THREE.Mesh;
  private label: CSS2DObject;
  private initialAngle: number;

  constructor() {
    super();

    const config = Cosmos.PLANETS.URANUS;
    this.radius = config.RADIUS;
    this.initialAngle = Math.random() * Math.PI * 2;

    // Load texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/textures/2k_uranus.jpg');

    // Geometry
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

    // Material with texture
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.add(this.mesh);

    // Rings (Uranus has narrow, dark rings)
    this.rings = this.createRings();
    this.add(this.rings);

    // Label
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Uranus';
    this.label = new CSS2DObject(div);
    this.label.position.set(0, this.radius * Cosmos.LABELS.HEIGHT_MULTIPLIER, 0);
    this.add(this.label);

    // Tilt (Uranus rolls on its side - 98°)
    this.rotation.z = Math.PI / 2;
  }

  private createRings(): THREE.Mesh {
    // Uranus rings are narrow and dark
    const innerRadius = this.radius * 1.6;
    const outerRadius = this.radius * 2.0;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

    // Dark, subtle ring texture
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const centerX = size / 2;
    const centerY = size / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, size / 5, centerX, centerY, size / 2);
    gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.3, 'rgba(80, 80, 90, 0.3)');
    gradient.addColorStop(0.5, 'rgba(60, 60, 70, 0.2)');
    gradient.addColorStop(0.7, 'rgba(80, 80, 90, 0.4)');
    gradient.addColorStop(0.9, 'rgba(60, 60, 70, 0.2)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    const rings = new THREE.Mesh(geometry, material);
    rings.rotation.x = -Math.PI / 2;

    return rings;
  }

  update(time: number, camera: THREE.Camera): void {
    // Orbit (realistic period: 30687 days = ~84 years, elliptical e=0.047)
    const theta = Cosmos.getRealisticOrbitalAngle(
      time,
      Cosmos.ORBITAL_PERIODS.URANUS,
      this.initialAngle
    );
    const pos = Cosmos.getEllipticalOrbitalPosition(
      Cosmos.PLANETS.URANUS.DISTANCE,
      Cosmos.ECCENTRICITY.URANUS,
      Cosmos.INCLINATION.URANUS,
      theta
    );
    this.position.set(pos.x, pos.y, pos.z);

    // Rotation (realistic: 17.24 hours retrograde, tilted 98° - rotates on its side!)
    this.mesh.rotation.x = Cosmos.getRealisticRotation(
      time,
      Cosmos.ROTATION_PERIODS.URANUS
    );

    // Label
    const dist = camera.position.distanceTo(this.getWorldPosition(new THREE.Vector3()));
    this.label.element.style.opacity = String(Cosmos.getLabelOpacity(dist, this.radius));
  }
}
