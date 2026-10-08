import * as THREE from 'three';
import { SystemManager, SystemId } from '../../core/SystemManager';
import { Heliosphere } from '../common/Heliosphere';
import { Nexus } from './Nexus';
import { Mountains } from './Mountains';
import { Structures } from './Structures';
import { Ships } from './Ships';
import { Inhabitants } from './Inhabitants';
import { GLBEntity } from './GLBEntity';
import { SceneAssets } from '../../core/SceneAssets';
import { EntityCategory, type EntityInfo } from '../../core/Entity';


export class QuantumaniaSystem extends THREE.Group {
    public readonly heliosphere: Heliosphere;
    public readonly nexus: Nexus;
    public readonly mountains: Mountains;
    public readonly structures: Structures;
    public readonly ships: Ships;
    public readonly inhabitants: Inhabitants;

    private readonly modelItems: (Nexus | GLBEntity)[];
    private loadingComplete = false;
    private distantBeacon: THREE.Sprite;
    private isExternallyVisible: boolean = false;
    private disposed = false;
    private loadQueue: Promise<void> | null = null;
    private failedItems = new Set<Nexus | GLBEntity>();

    private center: THREE.Vector3;

    constructor(assets = new SceneAssets()) {
        super();

        this.center = SystemManager.QUANTUMANIA_CENTER.clone();

        this.heliosphere = new Heliosphere(
            SystemManager.QUANTUMANIA_RADIUS,
            SystemManager.QUANTUMANIA_COLOR,
            this.center,
            SystemId.QUANTUMANIA
        );
        this.add(this.heliosphere);

        this.nexus = new Nexus(this.center.clone(), assets);
        this.add(this.nexus);

        this.mountains = new Mountains(this.center, assets);
        this.add(this.mountains);

        this.structures = new Structures(this.center, assets);
        this.add(this.structures);

        this.ships = new Ships(this.center, assets);
        this.add(this.ships);

        this.inhabitants = new Inhabitants(this.center, assets);
        this.add(this.inhabitants);
        this.modelItems = [this.nexus, ...this.mountains.items, ...this.structures.items, ...this.ships.items, ...this.inhabitants.items];

        this.distantBeacon = this.createDistantBeacon();
        this.add(this.distantBeacon);
    }

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

    update(time: number, camera: THREE.Camera, independentTime: number): void {

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

    setVisible(visible: boolean): void {
        this.isExternallyVisible = visible;
        if (visible && !this.disposed && !this.loadQueue && !this.loadingComplete) {
            this.loadQueue = this.loadModelsSequentially().finally(() => {
                this.loadQueue = null;
                this.loadingComplete = this.modelItems.every(item => item.loaded || this.failedItems.has(item));
            });
        }
    }

    private async loadModelsSequentially(): Promise<void> {
        for (const item of this.modelItems) {
            if (this.disposed || !this.isExternallyVisible) return;
            if (item.loaded || this.failedItems.has(item)) continue;
            try { await item.loadModel(); }
            catch { if (!this.disposed) this.failedItems.add(item); }
        }
    }

    retryFailedModels(): void {
        this.failedItems.clear();
        this.loadingComplete = false;
        this.setVisible(this.isExternallyVisible);
    }

    dispose(): void {
        this.disposed = true;
        this.isExternallyVisible = false;
    }

    getEntities(): EntityInfo[] {
        const entities: EntityInfo[] = [];

        entities.push({
            mesh: this.nexus,
            id: 'quantumania-nexus',
            category: EntityCategory.NEXUS,
            color: '#aa88ff',
            label: 'Nexus',
            radius: this.nexus.radius,
            system: SystemId.QUANTUMANIA,
        });

        const addItems = (items: GLBEntity[], category: EntityCategory) => {
            items.forEach((item, index) => {
                entities.push({
                    mesh: item,
                    category,
                    id: `quantumania-${category}-${item.entityName}-${index}`,
                    color: item.entityName === 'MountForest' ? '#4a8c3f' : '#ffffff',
                    label: item.entityName,
                    radius: item.radius,
                    system: SystemId.QUANTUMANIA,
                });
            });
        };

        addItems(this.mountains.items, EntityCategory.MOUNTAIN);
        addItems(this.structures.items, EntityCategory.STRUCTURE);
        addItems(this.ships.items, EntityCategory.SHIP);
        addItems(this.inhabitants.items, EntityCategory.INHABITANT);

        return entities;
    }
}
