import * as THREE from 'three';
import { FloatingMountain } from './FloatingMountain';

/**
 * City Mountain - A mountain with urban structures and glowing windows.
 */
export class CityMountain extends FloatingMountain {
    private buildings: THREE.Group;
    private lights: THREE.PointLight[];

    constructor(position: THREE.Vector3) {
        super(
            'Sky Metropolis',
            position,
            65,
            new THREE.Color(0x3a3a4a), // Dark urban gray
            60,
            50
        );

        this.setLabelColor('#ffaa44');
        this.lights = [];

        // Create buildings on top
        this.buildings = new THREE.Group();
        this.createCityscape();
        this.add(this.buildings);
    }

    private createCityscape(): void {
        const buildingMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a3a,
            roughness: 0.5,
            metalness: 0.6,
        });

        const windowMat = new THREE.MeshBasicMaterial({
            color: 0xffdd88,
            transparent: true,
            opacity: 0.9,
        });

        // Create several buildings of varying heights
        const buildingConfigs = [
            { x: 0, z: 0, w: 12, d: 12, h: 50 },      // Central tower
            { x: 18, z: 5, w: 8, d: 8, h: 35 },
            { x: -15, z: 10, w: 10, d: 8, h: 40 },
            { x: 10, z: -15, w: 6, d: 6, h: 28 },
            { x: -10, z: -12, w: 8, d: 10, h: 32 },
            { x: 5, z: 18, w: 7, d: 7, h: 25 },
            { x: -18, z: -5, w: 9, d: 6, h: 30 },
            { x: 15, z: 15, w: 6, d: 8, h: 22 },
        ];

        buildingConfigs.forEach((cfg, index) => {
            // Building body
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d),
                buildingMat
            );
            building.position.set(cfg.x, 30 + cfg.h / 2, cfg.z);
            this.buildings.add(building);

            // Window strips (glowing lines)
            for (let floor = 0; floor < Math.floor(cfg.h / 6); floor++) {
                const windowStrip = new THREE.Mesh(
                    new THREE.BoxGeometry(cfg.w + 0.1, 1.5, cfg.d + 0.1),
                    windowMat
                );
                windowStrip.position.set(cfg.x, 30 + 5 + floor * 6, cfg.z);
                this.buildings.add(windowStrip);
            }

            // Roof light on taller buildings
            if (cfg.h > 30 && this.lights.length < 3) {
                const light = new THREE.PointLight(0xffaa44, 0.5, 50);
                light.position.set(cfg.x, 30 + cfg.h + 5, cfg.z);
                this.buildings.add(light);
                this.lights.push(light);
            }
        });

        // Add some smaller detail cubes for variety
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 25;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const h = 8 + Math.random() * 15;

            const smallBuilding = new THREE.Mesh(
                new THREE.BoxGeometry(4 + Math.random() * 4, h, 4 + Math.random() * 4),
                buildingMat
            );
            smallBuilding.position.set(x, 30 + h / 2, z);
            this.buildings.add(smallBuilding);
        }
    }

    update(time: number, camera: THREE.Camera): void {
        super.update(time, camera);
        this.buildings.rotation.y = this.mesh.rotation.y;

        // Flickering lights
        this.lights.forEach((light, i) => {
            light.intensity = 0.4 + Math.sin(time * 2 + i) * 0.1;
        });
    }
}
