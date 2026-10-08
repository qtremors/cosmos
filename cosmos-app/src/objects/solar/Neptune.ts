import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';
import * as THREE from 'three';

export class Neptune extends Planet {
    constructor(assets = new SceneAssets()) {
        super('NEPTUNE', assets, '/textures/2k_neptune.jpg', 0.6);
        this.add(this.createRings());
    }
  private createRings(): THREE.Mesh {
    const innerRadius = this.radius * 1.7;
    const outerRadius = this.radius * 2.5;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const centerX = size / 2;
    const centerY = size / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, size / 5, centerX, centerY, size / 2);
    gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.3, 'rgba(70, 80, 100, 0.15)');
    gradient.addColorStop(0.5, 'rgba(60, 70, 90, 0.1)');
    gradient.addColorStop(0.7, 'rgba(70, 80, 100, 0.2)');
    gradient.addColorStop(0.85, 'rgba(60, 70, 90, 0.1)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const rings = new THREE.Mesh(geometry, material);
    rings.rotation.x = -Math.PI / 2;

    return rings;
  }

}
