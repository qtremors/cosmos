import * as THREE from 'three';
import { SystemManager, SystemId } from '../../core/SystemManager';
import { Heliosphere } from '../Heliosphere';
import { NexusMountain } from './NexusMountain';
import { ForestMountain } from './ForestMountain';
import { IceMountain } from './IceMountain';
import { WaterfallMountain } from './WaterfallMountain';
import { CityMountain } from './CityMountain';
import { CrystalMountain } from './CrystalMountain';
import { DesertMountain } from './DesertMountain';
import { VolcanicMountain } from './VolcanicMountain';
import { CloudMountain } from './CloudMountain';
import { RuinsMountain } from './RuinsMountain';
import { GardenMountain } from './GardenMountain';

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
    public readonly mountains: THREE.Group[];
    private distantBeacon: THREE.Sprite;
    private isExternallyVisible: boolean = true; // Controlled by App.tsx

    private center: THREE.Vector3;

    constructor() {
        super();

        this.center = SystemManager.QUANTUMANIA_CENTER.clone();
        this.mountains = [];

        // Create Quantumania heliosphere (light purple)
        this.heliosphere = new Heliosphere(
            SystemManager.QUANTUMANIA_RADIUS,
            SystemManager.QUANTUMANIA_COLOR,
            this.center,
            SystemId.QUANTUMANIA
        );
        this.add(this.heliosphere);

        // Create The Nexus at center
        const nexus = new NexusMountain(this.center.clone());
        this.add(nexus);
        this.mountains.push(nexus);

        // Create other mountains at various positions around the center
        const mountainConfigs: { type: string; angle: number; distance: number; height: number }[] = [
            { type: 'forest', angle: 0, distance: 400, height: 20 },
            { type: 'ice', angle: Math.PI / 3, distance: 550, height: -30 },
            { type: 'waterfall', angle: 2 * Math.PI / 3, distance: 450, height: 40 },
            { type: 'city', angle: Math.PI, distance: 600, height: 10 },
            { type: 'crystal', angle: 4 * Math.PI / 3, distance: 350, height: 60 },
            { type: 'desert', angle: 5 * Math.PI / 3, distance: 500, height: -20 },
            { type: 'volcanic', angle: Math.PI / 6, distance: 650, height: 30 },
            { type: 'cloud', angle: Math.PI / 2, distance: 700, height: 80 },
            { type: 'ruins', angle: 7 * Math.PI / 6, distance: 580, height: -10 },
            { type: 'garden', angle: 11 * Math.PI / 6, distance: 480, height: 50 },
        ];

        mountainConfigs.forEach(cfg => {
            const pos = new THREE.Vector3(
                this.center.x + Math.cos(cfg.angle) * cfg.distance,
                cfg.height,
                this.center.z + Math.sin(cfg.angle) * cfg.distance
            );

            let mountain: THREE.Group;
            switch (cfg.type) {
                case 'forest':
                    mountain = new ForestMountain(pos);
                    break;
                case 'ice':
                    mountain = new IceMountain(pos);
                    break;
                case 'waterfall':
                    mountain = new WaterfallMountain(pos);
                    break;
                case 'city':
                    mountain = new CityMountain(pos);
                    break;
                case 'crystal':
                    mountain = new CrystalMountain(pos);
                    break;
                case 'desert':
                    mountain = new DesertMountain(pos);
                    break;
                case 'volcanic':
                    mountain = new VolcanicMountain(pos);
                    break;
                case 'cloud':
                    mountain = new CloudMountain(pos);
                    break;
                case 'ruins':
                    mountain = new RuinsMountain(pos);
                    break;
                case 'garden':
                    mountain = new GardenMountain(pos);
                    break;
                default:
                    return;
            }

            this.add(mountain);
            this.mountains.push(mountain);
        });

        // Create distant beacon (visible when far away)
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
        // If externally hidden (camera is in another system), SHOW beacon as distant light
        if (!this.isExternallyVisible) {
            this.mountains.forEach(m => m.visible = false);
            this.heliosphere.visible = false;

            // Show pulsing beacon as distant light
            this.distantBeacon.visible = true;
            const pulse = 0.6 + Math.sin(time * 1.5) * 0.3;
            this.distantBeacon.material.opacity = pulse;
            this.distantBeacon.scale.set(400, 400, 1);
            return;
        }

        this.heliosphere.update(time, camera);

        // Toggle mountain visibility and update (no bobbing when visible to avoid vibration)
        this.mountains.forEach(mountain => {
            mountain.visible = true;
            if ('update' in mountain && typeof mountain.update === 'function') {
                (mountain as any).update(time, camera);
            }
        });

        // Heliosphere always visible when externally visible
        this.heliosphere.visible = true;

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
        return this.mountains.map((mountain, index) => {
            const name = (mountain as any).mountainName || `Mountain ${index}`;
            const radius = (mountain as any).radius || 50;

            return {
                mesh: mountain,
                id: `quantumania-${name.toLowerCase().replace(/\s/g, '-')}`,
                color: this.getMountainColor(name),
                label: name,
                radius: radius,
                system: SystemId.QUANTUMANIA,
            };
        });
    }

    private getMountainColor(name: string): string {
        const colors: Record<string, string> = {
            'The Nexus': '#aa88ff',
            'Forest Peak': '#4a8c3f',
            'Frost Summit': '#aaddff',
            'Cascade Falls': '#66ccff',
            'Sky Metropolis': '#ffaa44',
            'Crystal Spire': '#cc88ff',
            'Dune Summit': '#e8d4a0',
            'Ember Peak': '#ff6633',
            'Nimbus Haven': '#aabbcc',
            'Ancient Remnant': '#a89880',
            'Bloom Sanctuary': '#88cc66',
        };
        return colors[name] || '#ffffff';
    }
}
