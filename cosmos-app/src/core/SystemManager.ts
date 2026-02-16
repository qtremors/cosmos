import * as THREE from 'three';

/**
 * System identifiers for the multi-system architecture.
 */
export enum SystemId {
    SOLAR_SYSTEM = 'solar_system',
    QUANTUMANIA = 'quantumania',
    INTERSTELLAR = 'interstellar',
}

/**
 * Configuration for each star system.
 */
export interface SystemConfig {
    id: SystemId;
    name: string;
    center: THREE.Vector3;
    radius: number;
    color: THREE.Color;
}

/**
 * SystemManager - Tracks camera position across multiple star systems.
 */
export class SystemManager {
    private static instance: SystemManager;

    public readonly systems: Map<SystemId, SystemConfig> = new Map();
    public currentSystem: SystemId = SystemId.SOLAR_SYSTEM;

    // System positions and configurations
    public static readonly SOLAR_SYSTEM_CENTER = new THREE.Vector3(0, 0, 0);
    public static readonly SOLAR_SYSTEM_RADIUS = 2500;

    public static readonly QUANTUMANIA_CENTER = new THREE.Vector3(18000, 0, 0);
    public static readonly QUANTUMANIA_RADIUS = 2000;

    // Colors
    public static readonly SOLAR_SYSTEM_COLOR = new THREE.Color(0x6699ff);
    public static readonly QUANTUMANIA_COLOR = new THREE.Color(0xbb88ff);

    private constructor() {
        // Initialize Solar System
        this.systems.set(SystemId.SOLAR_SYSTEM, {
            id: SystemId.SOLAR_SYSTEM,
            name: 'Solar System',
            center: SystemManager.SOLAR_SYSTEM_CENTER.clone(),
            radius: SystemManager.SOLAR_SYSTEM_RADIUS,
            color: SystemManager.SOLAR_SYSTEM_COLOR.clone(),
        });

        // Initialize Quantumania
        this.systems.set(SystemId.QUANTUMANIA, {
            id: SystemId.QUANTUMANIA,
            name: 'Quantumania',
            center: SystemManager.QUANTUMANIA_CENTER.clone(),
            radius: SystemManager.QUANTUMANIA_RADIUS,
            color: SystemManager.QUANTUMANIA_COLOR.clone(),
        });
    }

    /**
     * Get the singleton instance.
     */
    public static getInstance(): SystemManager {
        if (!SystemManager.instance) {
            SystemManager.instance = new SystemManager();
        }
        return SystemManager.instance;
    }

    /**
     * Update the current system based on camera position.
     * @returns true if the system changed
     */
    public updateCurrentSystem(cameraPosition: THREE.Vector3): boolean {
        const previousSystem = this.currentSystem;

        // Check each system
        for (const [id, config] of this.systems) {
            const distance = cameraPosition.distanceTo(config.center);
            if (distance < config.radius) {
                this.currentSystem = id;
                return previousSystem !== this.currentSystem;
            }
        }

        // Outside all systems = interstellar
        this.currentSystem = SystemId.INTERSTELLAR;
        return previousSystem !== this.currentSystem;
    }

    /**
     * Get the current system's display name.
     */
    public getCurrentSystemName(): string {
        const config = this.systems.get(this.currentSystem);
        return config?.name || 'Interstellar Space';
    }

    /**
     * Get the config for a specific system.
     */
    public getSystem(id: SystemId): SystemConfig | undefined {
        return this.systems.get(id);
    }

    /**
     * Check if camera is in a specific system.
     */
    public isInSystem(id: SystemId): boolean {
        return this.currentSystem === id;
    }

    /**
     * Get distance from camera to the nearest system boundary.
     */
    public getDistanceToNearestSystem(cameraPosition: THREE.Vector3): { system: SystemId; distance: number } {
        let nearest: { system: SystemId; distance: number } = {
            system: SystemId.SOLAR_SYSTEM,
            distance: Infinity,
        };

        for (const [id, config] of this.systems) {
            const distToCenter = cameraPosition.distanceTo(config.center);
            const distToBoundary = Math.abs(distToCenter - config.radius);

            if (distToBoundary < nearest.distance) {
                nearest = { system: id, distance: distToBoundary };
            }
        }

        return nearest;
    }
}
