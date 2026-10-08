import * as THREE from 'three';
import { kmToUnits } from '../../core/PhysicalScale';
import { Cosmos } from '../../core/SDK';

interface AsteroidData {
    initialAngle: number;
    radius: number;
    orbitRate: number;
    inclination: number;
    rotationSpeed: THREE.Vector3;
    currentRot: THREE.Euler;
    scale: number;
}



export class AsteroidBelt extends THREE.Group {
    private mesh: THREE.InstancedMesh;
    private dummy: THREE.Object3D;
    private asteroids: AsteroidData[];
    private previousTime = NaN;

    constructor(inner = Cosmos.ASTEROIDS.INNER_RADIUS, outer = Cosmos.ASTEROIDS.OUTER_RADIUS, count = Cosmos.ASTEROIDS.COUNT, sizeKm = 10) {
        super();

        // Repeatable representative population, not a catalogue of observed objects.
        let seed = 91821;
        const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };

        const geometry = new THREE.DodecahedronGeometry(kmToUnits(sizeKm), 0);
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
            const angle = random() * Math.PI * 2;
            const radius = THREE.MathUtils.lerp(inner, outer, random());

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const inclination = (random() - 0.5) * 0.3;
            const y = Math.sin(angle) * radius * Math.sin(inclination);

            const scale = 0.5 + random() * 2.0;

            this.dummy.position.set(x, y, z);
            this.dummy.rotation.set(random() * Math.PI, random() * Math.PI, 0);
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);

            this.asteroids.push({
                initialAngle: angle,
                radius: radius,
                orbitRate: 2 * Math.PI / (Math.pow(radius / Cosmos.PLANETS.EARTH.DISTANCE, 1.5) * 365.25 * 86400),
                inclination,
                rotationSpeed: new THREE.Vector3(
                    (random() - 0.5) * (2 * Math.PI / 18000),
                    (random() - 0.5) * (2 * Math.PI / 18000),
                    (random() - 0.5) * (2 * Math.PI / 18000)
                ),
                currentRot: new THREE.Euler(random(), random(), 0),
                scale: scale,
            });
        }

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);
    }

    setCount(count: number): void {
        this.mesh.count = Math.max(0, Math.min(this.asteroids.length, count));
        this.previousTime = NaN;
    }

    update(time: number): void {
        if (time === this.previousTime) return;
        this.previousTime = time;
        for (let i = 0; i < this.mesh.count; i++) {
            const data = this.asteroids[i];

            const theta = data.initialAngle + time * data.orbitRate;

            const x = Math.cos(theta) * data.radius;
            const z = Math.sin(theta) * data.radius * Math.cos(data.inclination);

            this.dummy.position.set(x, Math.sin(theta) * data.radius * Math.sin(data.inclination), z);

            this.dummy.rotation.set(
                data.currentRot.x + data.rotationSpeed.x * time,
                data.currentRot.y + data.rotationSpeed.y * time,
                data.currentRot.z + data.rotationSpeed.z * time
            );

            this.dummy.scale.set(data.scale, data.scale, data.scale);

            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }
}
