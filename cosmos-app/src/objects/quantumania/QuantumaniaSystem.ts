import * as THREE from 'three';
import { SystemManager, SystemId } from '../../core/SystemManager';
import { Heliosphere } from '../common/Heliosphere';
import { NexusMountain } from './NexusMountain';
import { Mountains } from './Mountains';
import { Structures } from './Structures';
import { Ships } from './Ships';
import { Inhabitants } from './Inhabitants';
import { GLBMountain } from './GLBMountain';

/**
 * Entity info for radar tracking
 */
export interface MountainEntity {
    mesh: THREE.Object3D;
    id: string;
    color: string;
    label: string;
    radius: number;
    system: SystemId;
}

/**
 * QuantumaniaSystem - Container for the floating mountains system.
 * Creates the heliosphere and all mountains.
 */
export class QuantumaniaSystem extends THREE.Group {
    public readonly heliosphere: Heliosphere;
    public readonly nexus: NexusMountain;
    public readonly mountains: Mountains;
    public readonly structures: Structures;
    public readonly ships: Ships;
    public readonly inhabitants: Inhabitants;

    // For direct access if needed, but categories are cleaner
    public readonly allItems: THREE.Group[] = [];

    private distantBeacon: THREE.Sprite;
    private isExternallyVisible: boolean = true; // Controlled by App.tsx
    private clock: THREE.Clock;

    private center: THREE.Vector3;

    constructor() {
        super();

        this.center = SystemManager.QUANTUMANIA_CENTER.clone();
        this.clock = new THREE.Clock();

        // Create Quantumania heliosphere (light purple)
        this.heliosphere = new Heliosphere(
            SystemManager.QUANTUMANIA_RADIUS,
            SystemManager.QUANTUMANIA_COLOR,
            this.center,
            SystemId.QUANTUMANIA
        );
        this.add(this.heliosphere);

        // 1. NEUXS (Center)
        this.nexus = new NexusMountain(this.center.clone());
        this.add(this.nexus);
        this.allItems.push(this.nexus);

        // 2. MOUNTAINS (Floating Islands)
        this.mountains = new Mountains(this.center);
        this.add(this.mountains);

        // 3. STRUCTURES (Stations)
        this.structures = new Structures(this.center);
        this.add(this.structures);

        // 4. SHIPS (Defense Net)
        this.ships = new Ships(this.center);
        this.add(this.ships);

        // 5. INHABITANTS (Creatures)
        this.inhabitants = new Inhabitants(this.center);
        this.add(this.inhabitants);

        // 6. DISTANT BEACON
        this.distantBeacon = this.createDistantBeacon();
        this.add(this.distantBeacon);
    }

    /**
     * Create a glowing beacon visible from far distances.
     */
    private createDistantBeacon(): THREE.Sprite {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(187, 136, 255, 1)');
            g.addColorStop(0.3, 'rgba(187, 136, 255, 0.6)');
            g.addColorStop(1, 'rgba(187, 136, 255, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            color: 0xbb88ff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });
        const beacon = new THREE.Sprite(material);
        beacon.position.copy(this.center);
        beacon.scale.set(300, 300, 1);
        beacon.renderOrder = 200;
        beacon.visible = false; // Initially hidden
        return beacon;
    }

    /**
     * Update all mountains with strict visibility rules.
     * System only renders when:
     * 1. Camera is INSIDE the system (within radius)
     * 2. Camera is APPROACHING from outside (within 500 units of boundary)
     */
    update(time: number, camera: THREE.Camera): void {
        // Independent time for this system's animations (Realtime)
        // so it floats calmly even if the solar system is zooming.
        const independentTime = this.clock.getElapsedTime();

        // If externally hidden (camera is in another system), SHOW beacon as distant light
        if (!this.isExternallyVisible) {
            this.heliosphere.visible = false;

            // Hide all categories
            this.nexus.visible = false;
            this.mountains.visible = false;
            this.structures.visible = false;
            this.ships.visible = false;
            this.inhabitants.visible = false;

            // Show pulsing beacon as distant light
            this.distantBeacon.visible = true;
            const pulse = 0.6 + Math.sin(independentTime * 1.5) * 0.3;
            this.distantBeacon.material.opacity = pulse;
            this.distantBeacon.scale.set(400, 400, 1);

            // Also stop their internal updates if needed, but visibility check handles part of it
            return;
        }

        this.heliosphere.update(time, camera);

        // Show categories
        this.nexus.visible = true;
        this.mountains.visible = true;
        this.structures.visible = true;
        this.ships.visible = true;
        this.inhabitants.visible = true;

        // Update Nexus (always visible if system is visible)
        this.nexus.update(time, camera, independentTime);

        // Update Categories (they handle their own LOD/Visibility)
        this.mountains.update(time, camera, independentTime);
        this.structures.update(time, camera, independentTime);
        this.ships.update(time, camera, independentTime);
        this.inhabitants.update(time, camera, independentTime);

        // Beacon hidden when inside the system
        this.distantBeacon.visible = false;
    }

    /**
     * Set external visibility (controlled by App.tsx based on current system).
     * When false, the entire system is hidden regardless of camera distance.
     */
    setVisible(visible: boolean): void {
        this.isExternallyVisible = visible;
    }

    /**
     * Get entity list for radar.
     */
    getEntities(): MountainEntity[] {
        const entities: MountainEntity[] = [];

        // Nexus
        entities.push({
            mesh: this.nexus,
            id: 'quantumania-nexus',
            color: '#aa88ff',
            label: 'Nexus',
            radius: this.nexus.radius,
            system: SystemId.QUANTUMANIA,
        });

        // Helper to add items
        const addItems = (items: GLBMountain[], category: string) => {
            items.forEach((item, index) => {
                entities.push({
                    mesh: item,
                    id: `quantumania-${category}-${item.mountainName}-${index}`,
                    color: item.mountainName === 'MountForest' ? '#4a8c3f' : '#ffffff', // Simplified color logic or we can store color on GLBMountain
                    label: item.mountainName,
                    radius: item.radius,
                    system: SystemId.QUANTUMANIA,
                });
            });
        };

        addItems(this.mountains.items, 'mountain');
        addItems(this.structures.items, 'structure');
        addItems(this.ships.items, 'ship');
        addItems(this.inhabitants.items, 'inhabitant');

        return entities;
    }
}
