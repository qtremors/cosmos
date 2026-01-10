import * as THREE from 'three';
import { SystemManager, SystemId } from '../../core/SystemManager';
import { Heliosphere } from '../common/Heliosphere';
import { Nexus } from './Nexus';
import { Mountains } from './Mountains';
import { Structures } from './Structures';
import { Ships } from './Ships';
import { Inhabitants } from './Inhabitants';
import { GLBEntity } from './GLBEntity';

/**
 * Entity info for radar tracking
 */
export interface QuantumaniaEntity {
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
    public readonly nexus: Nexus;
    public readonly mountains: Mountains;
    public readonly structures: Structures;
    public readonly ships: Ships;
    public readonly inhabitants: Inhabitants;

    public readonly allItems: THREE.Group[] = [];
    private distantBeacon: THREE.Sprite;
    private isExternallyVisible: boolean = true;
    private clock: THREE.Clock;

    private center: THREE.Vector3;

    constructor() {
        super();

        this.center = SystemManager.QUANTUMANIA_CENTER.clone();
        this.clock = new THREE.Clock();

        this.heliosphere = new Heliosphere(
            SystemManager.QUANTUMANIA_RADIUS,
            SystemManager.QUANTUMANIA_COLOR,
            this.center,
            SystemId.QUANTUMANIA
        );
        this.add(this.heliosphere);

        this.nexus = new Nexus(this.center.clone());
        this.add(this.nexus);
        this.allItems.push(this.nexus);

        this.mountains = new Mountains(this.center);
        this.add(this.mountains);

        this.structures = new Structures(this.center);
        this.add(this.structures);

        this.ships = new Ships(this.center);
        this.add(this.ships);

        this.inhabitants = new Inhabitants(this.center);
        this.add(this.inhabitants);

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
        beacon.visible = false;
        return beacon;
    }

    /**
     * Update all mountains with strict visibility rules.
     * System only renders when:
     * 1. Camera is INSIDE the system (within radius)
     * 2. Camera is APPROACHING from outside (within 500 units of boundary)
     */
    update(time: number, camera: THREE.Camera): void {
        const independentTime = this.clock.getElapsedTime();

        if (!this.isExternallyVisible) {
            this.heliosphere.visible = false;

            this.nexus.visible = false;
            this.mountains.visible = false;
            this.structures.visible = false;
            this.ships.visible = false;
            this.inhabitants.visible = false;

            this.distantBeacon.visible = true;
            const pulse = 0.6 + Math.sin(independentTime * 1.5) * 0.3;
            this.distantBeacon.material.opacity = pulse;
            this.distantBeacon.scale.set(400, 400, 1);

            return;
        }

        this.heliosphere.update(time, camera);

        this.nexus.visible = true;
        this.mountains.visible = true;
        this.structures.visible = true;
        this.ships.visible = true;
        this.inhabitants.visible = true;

        this.nexus.update(time, camera, independentTime);

        this.mountains.update(time, camera, independentTime);
        this.structures.update(time, camera, independentTime);
        this.ships.update(time, camera, independentTime);
        this.inhabitants.update(time, camera, independentTime);

        this.distantBeacon.visible = false;
    }

    /**
     * Set external visibility (controlled by App.tsx based on current system).
     * When false, the entire system is hidden regardless of camera distance.
     * When true, triggers sequential model loading if not already loaded.
     */
    setVisible(visible: boolean): void {
        const wasVisible = this.isExternallyVisible;
        this.isExternallyVisible = visible;

        if (visible && !wasVisible) {
            this.loadModelsSequentially();
        }
    }

    /**
     * Load all 3D models sequentially with priority order.
     * Loads center first, then spreads outward.
     */
    private async loadModelsSequentially(): Promise<void> {
        console.log('[Quantumania] Starting sequential model loading...');

        try {
            await this.nexus.loadModel();
            console.log('[Quantumania] Nexus loaded');
        } catch (e) {
            console.error('[Quantumania] Failed to load Nexus:', e);
        }

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (const item of this.mountains.items) {
            await delay(100);
            item.loadModel().catch(e => console.error(`[Quantumania] Failed to load ${item.entityName}:`, e));
        }

        for (const item of this.structures.items) {
            await delay(100);
            item.loadModel().catch(e => console.error(`[Quantumania] Failed to load ${item.entityName}:`, e));
        }

        for (const item of this.ships.items) {
            await delay(100);
            item.loadModel().catch(e => console.error(`[Quantumania] Failed to load ${item.entityName}:`, e));
        }

        for (const item of this.inhabitants.items) {
            await delay(100);
            item.loadModel().catch(e => console.error(`[Quantumania] Failed to load ${item.entityName}:`, e));
        }

        console.log('[Quantumania] All models loaded');
    }

    /**
     * Get entity list for radar.
     */
    getEntities(): QuantumaniaEntity[] {
        const entities: QuantumaniaEntity[] = [];

        entities.push({
            mesh: this.nexus,
            id: 'quantumania-nexus',
            color: '#aa88ff',
            label: 'Nexus',
            radius: this.nexus.radius,
            system: SystemId.QUANTUMANIA,
        });

        const addItems = (items: GLBEntity[], category: string) => {
            items.forEach((item, index) => {
                entities.push({
                    mesh: item,
                    id: `quantumania-${category}-${item.entityName}-${index}`,
                    color: item.entityName === 'MountForest' ? '#4a8c3f' : '#ffffff',
                    label: item.entityName,
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
