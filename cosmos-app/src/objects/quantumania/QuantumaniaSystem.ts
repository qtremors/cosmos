import * as THREE from 'three';
import { SystemManager, SystemId } from '../../core/SystemManager';
import { Heliosphere } from '../Heliosphere';
import { NexusMountain } from './NexusMountain';
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
    public readonly mountains: THREE.Group[];
    private distantBeacon: THREE.Sprite;
    private isExternallyVisible: boolean = true; // Controlled by App.tsx
    private clock: THREE.Clock;

    private center: THREE.Vector3;

    constructor() {
        super();

        this.center = SystemManager.QUANTUMANIA_CENTER.clone();
        this.mountains = [];
        this.clock = new THREE.Clock();

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

        // Map categories to GLB files (from 'list_dir' output)
        const mountainConfigs = [
            { name: 'Forest Peak', file: '/models/MountForest.glb', angle: 0, distance: 400, color: '#4a8c3f', scale: 60 },
            { name: 'Frost Summit', file: '/models/MountFrost.glb', angle: Math.PI / 3, distance: 550, color: '#aaddff', scale: 70 },
            { name: 'Cascade Falls', file: '/models/MountLake.glb', angle: 2 * Math.PI / 3, distance: 450, color: '#66ccff', scale: 80 },
            { name: 'Sky Metropolis', file: '/models/MountMonument.glb', angle: Math.PI, distance: 600, color: '#ffaa44', scale: 60 },
            { name: 'Crystal Spire', file: '/models/PlaneCrystal.glb', angle: 4 * Math.PI / 3, distance: 350, color: '#cc88ff', scale: 50 },
            { name: 'Dune Summit', file: '/models/MountRust.glb', angle: 5 * Math.PI / 3, distance: 500, color: '#e8d4a0', scale: 65 },
            //{ name: 'Volcanic Ridge', file: '/models/Kyln.glb', angle: Math.PI / 6, distance: 650, color: '#ff6633', scale: 90 }, // Removed (Error)
            { name: 'Nimbus Haven', file: '/models/Bridge.glb', angle: Math.PI / 2, distance: 700, color: '#aabbcc', scale: 100 }, // Large structure
            { name: 'Ancient Remnant', file: '/models/PlaneDom.glb', angle: 7 * Math.PI / 6, distance: 580, color: '#a89880', scale: 55 },
            { name: 'Bloom Sanctuary', file: '/models/Plates.glb', angle: 11 * Math.PI / 6, distance: 480, color: '#88cc66', scale: 60 },
        ];

        mountainConfigs.forEach(cfg => {
            const pos = new THREE.Vector3(
                this.center.x + Math.cos(cfg.angle) * cfg.distance,
                (Math.random() * 100) - 50, // Initial random height
                this.center.z + Math.sin(cfg.angle) * cfg.distance
            );

            const mountain = new GLBMountain(pos, cfg.file, cfg.name, cfg.scale, 50, cfg.color, 2);
            this.add(mountain);
            this.mountains.push(mountain);
        });

        // ---------------------------------------------------------------------
        // CHAOS FIELD - POPULATE WITH ALL REMAINING MODELS
        // ---------------------------------------------------------------------

        // Ring 1: Inhabitants (Creatures & Figures) - Radius 800-1200
        const inhabitants = [
            { file: '/models/AlienMonster.glb', name: 'AlienMonster', scale: 30 },
            { file: '/models/AlienX.glb', name: 'AlienX', scale: 20 },
            { file: '/models/AlienX0.glb', name: 'AlienX0', scale: 20 },
            { file: '/models/AlienX1.glb', name: 'AlienX1', scale: 20 },
            { file: '/models/AlienXBaby.glb', name: 'AlienXBaby', scale: 10 },
            { file: '/models/AlienXFemale.glb', name: 'AlienXFemale', scale: 25 },
            { file: '/models/Figure1.glb', name: 'Figure1', scale: 15 },
            { file: '/models/Figure2.glb', name: 'Figure2', scale: 15 },
            { file: '/models/Figure3.glb', name: 'Figure3', scale: 15 },
            { file: '/models/Figure4.glb', name: 'Figure4', scale: 15 },
            { file: '/models/Figure5.glb', name: 'Figure5', scale: 15 },
            { file: '/models/BlackholeSkeleton.glb', name: 'BlackholeSkeleton', scale: 40 },
        ];

        // Ring 2: Defense Grid (Ships & Drones) - Radius 1200-1600
        const defenseNet = [
            { file: '/models/Drone.glb', name: 'Drone', scale: 10 },
            { file: '/models/Drone1.glb', name: 'Drone1', scale: 10 },
            { file: '/models/Drone2.glb', name: 'Drone2', scale: 10 },
            { file: '/models/Robot.glb', name: 'Robot', scale: 15 },
            { file: '/models/Ship.glb', name: 'Ship', scale: 20 },
            { file: '/models/Ship1.glb', name: 'Ship1', scale: 20 },
            { file: '/models/Ship2.glb', name: 'Ship2', scale: 25 },
            { file: '/models/Ship3.glb', name: 'Ship3', scale: 30 },
            { file: '/models/Ship4.glb', name: 'Ship4', scale: 20 },
            { file: '/models/Jet.glb', name: 'Jet', scale: 15 },
        ];

        // Ring 3: Artifacts & Structures (Stations) - Radius 1600-2000
        const structures = [
            { file: '/models/Station.glb', name: 'Station', scale: 50 },
            { file: '/models/Station1.glb', name: 'Station1', scale: 40 },
            { file: '/models/Station2.glb', name: 'Station2', scale: 55 },
            { file: '/models/Station3.glb', name: 'Station3', scale: 45 },
            { file: '/models/Station4.glb', name: 'Station4', scale: 50 },
            { file: '/models/Station5.glb', name: 'Station5', scale: 60 },
        ];

        // Helper to place ring
        const addToRing = (items: typeof inhabitants, minR: number, maxR: number, heightVar: number) => {
            items.forEach((item) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = minR + Math.random() * (maxR - minR);
                const x = this.center.x + Math.cos(angle) * radius;
                const z = this.center.z + Math.sin(angle) * radius;
                const y = (Math.random() * heightVar) - (heightVar / 2);

                const pos = new THREE.Vector3(x, y, z);
                // Use a random generic color tint or white
                const colors = ['#aaddff', '#ccaaff', '#88ffff', '#ffffff', '#aaaaff'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                // Reusing GLBMountain class as it's a generic "Floating GLB Loader"
                const artifact = new GLBMountain(pos, item.file, item.name, item.scale, 20, color, 2);
                this.add(artifact);
                this.mountains.push(artifact);
            });
        };

        addToRing(inhabitants, 800, 1200, 400); // Creatures close
        addToRing(defenseNet, 1200, 1500, 600); // Ships patrolling
        addToRing(structures, 1500, 1900, 800); // Stations far out

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
        // Independent time for this system's animations (Realtime)
        // so it floats calmly even if the solar system is zooming.
        const independentTime = this.clock.getElapsedTime();

        // If externally hidden (camera is in another system), SHOW beacon as distant light
        if (!this.isExternallyVisible) {
            this.mountains.forEach(m => m.visible = false);
            this.heliosphere.visible = false;

            // Show pulsing beacon as distant light
            this.distantBeacon.visible = true;
            const pulse = 0.6 + Math.sin(independentTime * 1.5) * 0.3;
            this.distantBeacon.material.opacity = pulse;
            this.distantBeacon.scale.set(400, 400, 1);
            return;
        }

        this.heliosphere.update(time, camera);

        // Toggle mountain visibility and update (no bobbing when visible to avoid vibration)
        this.mountains.forEach(mountain => {
            // LOD: Only show if within reasonable distance to prevent massive shader compilation spike
            // when teleporting from far away.
            // 4000 units is enough to see the "cloud" as we approach, but small enough that
            // at 18000 units (Solar System) they are hidden.
            const dist = camera.position.distanceTo(mountain.position);
            const isVisible = dist < 4000;

            // Special case: Nexus (center mountain) should always be visible if system is active
            // usually it's the first one or named 'The Nexus'
            const isNexus = (mountain as any).mountainName === 'The Nexus';

            mountain.visible = isVisible || isNexus;

            // Pass BOTH simTime (for consistency) and independentTime (for smooth animation)
            if (mountain.visible && 'update' in mountain && typeof (mountain as any).update === 'function') {
                (mountain as any).update(time, camera, independentTime);
            }
        });

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
