import * as THREE from 'three';
import { Cosmos } from '../../core/SDK';

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
            const angle = Math.random() * Math.PI * 2;
            const radius = THREE.MathUtils.lerp(config.INNER_RADIUS, config.OUTER_RADIUS, Math.random());

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 10;

            const scale = 0.5 + Math.random() * 2.0;

            this.dummy.position.set(x, y, z);
            this.dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);

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

            const earthDistance = Cosmos.PLANETS.EARTH.DISTANCE;
            const periodYears = Math.pow(data.radius / earthDistance, 1.5);
            const periodSeconds = periodYears * 365.25 * 86400;

            const theta = data.initialAngle + (time / periodSeconds) * 2 * Math.PI;

            const x = Math.cos(theta) * data.radius;
            const z = Math.sin(theta) * data.radius;

            this.dummy.position.set(x, data.y, z);

            this.dummy.rotation.set(
                data.rotationSpeed.x * time * 0.5,
                data.rotationSpeed.y * time * 0.5,
                data.rotationSpeed.z * time * 0.5
            );

            this.dummy.scale.set(data.scale, data.scale, data.scale);

            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
