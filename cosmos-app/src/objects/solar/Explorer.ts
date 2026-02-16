import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const planetPositions: THREE.Vector3[] = [];

export class Explorer extends THREE.Group {
    private ship: THREE.Group;
    private label: CSS2DObject;
    private velocity: THREE.Vector3;
    private targetPosition: THREE.Vector3;
    private static readonly SPEED = 0.08;
    private static readonly MIN_PLANET_DISTANCE = 15;

    constructor() {
        super();

        this.ship = new THREE.Group();
        this.velocity = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3(50, 0, 50);

        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        this.ship.add(body);

        const cockpitGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMat = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            metalness: 0.3,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.z = -1;
        cockpit.rotation.x = -Math.PI / 2;
        this.ship.add(cockpit);

        const wingGeo = new THREE.BoxGeometry(3, 0.1, 0.8);
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.6,
            roughness: 0.3
        });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.z = 0.3;
        this.ship.add(wings);

        const engineGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
        const engineMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.7
        });
        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.position.z = 1.4;
        engine.rotation.x = -Math.PI / 2;
        this.ship.add(engine);

        const engineLight = new THREE.PointLight(0x00aaff, 5, 20);
        engineLight.position.z = 1.5;
        this.ship.add(engineLight);

        this.ship.scale.setScalar(0.3);
        this.add(this.ship);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Explorer';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 1, 0);
        this.add(this.label);

        this.position.set(50, 5, 0);
    }

    static updatePlanetPositions(positions: THREE.Vector3[]): void {
        planetPositions.length = 0;
        positions.forEach(p => planetPositions.push(p.clone()));
    }

    private pickNewTarget(): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 150;
        const y = (Math.random() - 0.5) * 20;

        this.targetPosition.set(
            Math.cos(angle) * distance,
            y,
            Math.sin(angle) * distance
        );
    }

    private avoidPlanets(): THREE.Vector3 {
        const avoidance = new THREE.Vector3();

        for (const planetPos of planetPositions) {
            const toPlanet = planetPos.clone().sub(this.position);
            const distance = toPlanet.length();

            if (distance < Explorer.MIN_PLANET_DISTANCE && distance > 0.1) {
                const force = (Explorer.MIN_PLANET_DISTANCE - distance) / Explorer.MIN_PLANET_DISTANCE;
                avoidance.sub(toPlanet.normalize().multiplyScalar(force * 2));
            }
        }

        return avoidance;
    }

    update(_time: number, camera: THREE.Camera): void {
        const toTarget = this.targetPosition.clone().sub(this.position);
        if (toTarget.length() < 5) {
            this.pickNewTarget();
        }

        const desired = toTarget.normalize().multiplyScalar(Explorer.SPEED);

        const avoidance = this.avoidPlanets();
        desired.add(avoidance);

        this.velocity.lerp(desired, 0.02);

        if (this.velocity.length() > Explorer.SPEED) {
            this.velocity.normalize().multiplyScalar(Explorer.SPEED);
        }

        this.position.add(this.velocity);

        if (this.velocity.length() > 0.01) {
            const angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.ship.rotation.y = angle;
        }

        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 100 / dist));
    }
}
