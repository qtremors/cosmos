import * as THREE from 'three';
import { Cosmos } from '../core/SDK';

interface AsteroidData {
    index: number;
    initialAngle: number;
    radius: number;
    speed: number;
    y: number;
    rotationSpeed: THREE.Vector3;
    currentRot: THREE.Euler;
    scale: number;
}

// =============================================================================
// ASTEROID BELT CLASS
// =============================================================================

export class AsteroidBelt extends THREE.Group {
    private mesh: THREE.InstancedMesh;
    private dummy: THREE.Object3D;
    private asteroids: AsteroidData[];

    constructor() {
        super();

        const config = Cosmos.ASTEROIDS;
        const count = config.COUNT;

        // InstancedMesh for performance
        const geometry = new THREE.DodecahedronGeometry(0.8, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.1,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.dummy = new THREE.Object3D();
        this.asteroids = [];

        for (let i = 0; i < count; i++) {
            // Random position within the belt
            const angle = Math.random() * Math.PI * 2;
            const radius = THREE.MathUtils.lerp(config.INNER_RADIUS, config.OUTER_RADIUS, Math.random());

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 10;

            // Random scale
            const scale = 0.5 + Math.random() * 2.0;

            this.dummy.position.set(x, y, z);
            this.dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);

            // Store orbit data for animation
            this.asteroids.push({
                index: i,
                initialAngle: angle,
                radius: radius,
                speed: (1.0 / radius) * 5.0 + (Math.random() * 0.01),
                y: y,
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                currentRot: new THREE.Euler(Math.random(), Math.random(), 0),
                scale: scale,
            });
        }

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);
    }

    update(time: number): void {
        for (let i = 0; i < this.asteroids.length; i++) {
            const data = this.asteroids[i];

            // Orbital motion using SDK approach (time-based for consistency)
            const theta = data.initialAngle + time * data.speed * Cosmos.CONTROLS.ORBIT_SPEED_SCALE * 0.5;
            const x = Math.cos(theta) * data.radius;
            const z = Math.sin(theta) * data.radius;

            this.dummy.position.set(x, data.y, z);

            // Self rotation
            data.currentRot.x += data.rotationSpeed.x * 0.1;
            data.currentRot.y += data.rotationSpeed.y * 0.1;
            data.currentRot.z += data.rotationSpeed.z * 0.1;
            this.dummy.rotation.copy(data.currentRot);

            this.dummy.scale.set(data.scale, data.scale, data.scale);

            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
