import * as THREE from 'three';

/**
 * Cosmos SDK
 * The Core Physics & Visuals Engine for the Virtual Cosmos.
 * 
 * DESIGN PHILOSOPHY:
 * - Scale Agnostic: We use "Sim Units". 
 * - Standardized Visuals: Glare, LOD, and Fade logic is centralized.
 * - Type-Safe: Full TypeScript support for extensibility.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface MoonConfig {
    RADIUS: number;
    DISTANCE: number;
    SPEED: number;
}

export interface RingConfig {
    INNER_RADIUS: number;
    OUTER_RADIUS: number;
}

export interface PlanetConfig {
    RADIUS: number;
    DISTANCE: number;
    SPEED: number;
    COLOR: THREE.Color;
    MOON?: MoonConfig;
    RING?: RingConfig;
}

export interface PlanetsConfig {
    MERCURY: PlanetConfig;
    VENUS: PlanetConfig;
    EARTH: PlanetConfig & { MOON: MoonConfig };
    MARS: PlanetConfig;
    JUPITER: PlanetConfig & { MOON: MoonConfig };
    SATURN: PlanetConfig & { MOON: MoonConfig; RING: RingConfig };
    URANUS: PlanetConfig;
    NEPTUNE: PlanetConfig;
    PLUTO: PlanetConfig & { MOON: MoonConfig };  // Dwarf planet with Charon
}

export interface UnitsConfig {
    SOLAR_RADIUS: number;
    AU: number;
    LIGHT_SPEED: number;
}

export interface AsteroidsConfig {
    COUNT: number;
    INNER_RADIUS: number;
    OUTER_RADIUS: number;
}

export interface ControlsConfig {
    FLY_SPEED: number;
    BOOST_MULTIPLIER: number;
    ROLL_SPEED: number;
    FOV_DEFAULT: number;
    FOV_MIN: number;
    FOV_MAX: number;
    ORBIT_SPEED_SCALE: number;
}

export interface RadarColors {
    SUN: string;
    MERCURY: string;
    VENUS: string;
    EARTH: string;
    MOON: string;
    MARS: string;
    JUPITER: string;
    SATURN: string;
    URANUS: string;
    NEPTUNE: string;
    PLUTO: string;
}

export interface RadarConfig {
    RANGE: number;
    RADIUS: number;
    COLORS: RadarColors;
}

export interface LightingConfig {
    SUN_COLOR: number;
    SUN_INTENSITY: number;
    AMBIENT_COLOR: number;
    AMBIENT_INTENSITY: number;
    MOON_COLOR: number;
}

export interface CameraConfig {
    LOCK_DISTANCE_MULTIPLIER: number;
    CHASE_OFFSET: { X: number; Y: number; Z: number };
    LERP_FACTOR: number;
}

export interface LabelConfig {
    HEIGHT_MULTIPLIER: number;
    FADE_START_MULTIPLIER: number;
    FADE_END_MULTIPLIER: number;
}

// =============================================================================
// CACHED COLOR INSTANCES (created once, reused)
// =============================================================================

const PLANET_COLORS = {
    MERCURY: new THREE.Color(0xA5A5A5),
    VENUS: new THREE.Color(0xE3BC79),
    EARTH: new THREE.Color(0x2233ff),
    MARS: new THREE.Color(0xc1440e),
    JUPITER: new THREE.Color(0xd8ca9d),
    SATURN: new THREE.Color(0xeead6b),
    URANUS: new THREE.Color(0x73d7ee),
    NEPTUNE: new THREE.Color(0x3e54e8),
    PLUTO: new THREE.Color(0xc2b8a3),
} as const;

// =============================================================================
// COSMOS SDK CLASS
// =============================================================================

export class Cosmos {

    // -------------------------------------------------------------------------
    // UNITS & SCALE
    // -------------------------------------------------------------------------

    static readonly UNITS: UnitsConfig = {
        SOLAR_RADIUS: 10.0,
        AU: 200.0,
        LIGHT_SPEED: 1.0,
    };

    // -------------------------------------------------------------------------
    // REAL ASTRONOMICAL DATA (NASA values)
    // -------------------------------------------------------------------------

    /** Orbital periods in Earth days */
    static readonly ORBITAL_PERIODS = {
        MERCURY: 87.97,
        VENUS: 224.7,
        EARTH: 365.25,
        MARS: 687.0,
        JUPITER: 4333.0,
        SATURN: 10759.0,
        URANUS: 30687.0,
        NEPTUNE: 60190.0,
        PLUTO: 90560.0,
        // Moons (orbital period around parent)
        MOON: 27.32,       // Earth's Moon
        EUROPA: 3.55,      // Jupiter
        TITAN: 15.95,      // Saturn
        CHARON: 6.39,      // Pluto (tidally locked)
    };

    /** Rotation periods in Earth hours (negative = retrograde) */
    static readonly ROTATION_PERIODS = {
        SUN: 609.12,       // 25.38 days at equator
        MERCURY: 1407.6,   // 58.65 days
        VENUS: -5832.5,    // 243.02 days retrograde
        EARTH: 23.93,      // 23h 56m (sidereal)
        MARS: 24.62,
        JUPITER: 9.93,     // Fastest rotating planet
        SATURN: 10.66,
        URANUS: -17.24,    // Retrograde, tilted 98°
        NEPTUNE: 16.11,
        PLUTO: -153.29,    // 6.39 days retrograde
        MOON: 655.7,       // Tidally locked (same as orbital)
    };

    /** Real distances in AU (1 AU = Earth-Sun distance) */
    static readonly DISTANCES_AU = {
        MERCURY: 0.387,
        VENUS: 0.723,
        EARTH: 1.0,
        MARS: 1.524,
        JUPITER: 5.203,
        SATURN: 9.537,
        URANUS: 19.19,
        NEPTUNE: 30.07,
        PLUTO: 39.48,
        // Moon distances from parent (in AU)
        MOON: 0.00257,     // 384,400 km
        EUROPA: 0.00449,   // 671,000 km from Jupiter
        TITAN: 0.00816,    // 1.22M km from Saturn
        CHARON: 0.000131,  // 19,570 km from Pluto
    };

    /** Orbital eccentricity (0 = circle, 1 = parabola) - NASA values */
    static readonly ECCENTRICITY = {
        MERCURY: 0.206,    // Most eccentric planet
        VENUS: 0.007,      // Nearly circular
        EARTH: 0.017,      // Nearly circular
        MARS: 0.093,
        JUPITER: 0.048,
        SATURN: 0.054,
        URANUS: 0.047,
        NEPTUNE: 0.009,    // Nearly circular
        PLUTO: 0.248,      // Very eccentric - crosses Neptune's orbit!
    };

    /** Orbital inclination in degrees (relative to ecliptic) */
    static readonly INCLINATION = {
        MERCURY: 7.0,
        VENUS: 3.4,
        EARTH: 0.0,        // Reference plane
        MARS: 1.9,
        JUPITER: 1.3,
        SATURN: 2.5,
        URANUS: 0.8,
        NEPTUNE: 1.8,
        PLUTO: 17.2,       // Highly inclined
    };
    static readonly RADII_EARTH = {
        SUN: 109.2,
        MERCURY: 0.383,
        VENUS: 0.949,
        EARTH: 1.0,
        MARS: 0.532,
        JUPITER: 11.21,
        SATURN: 9.45,
        URANUS: 4.01,
        NEPTUNE: 3.88,
        PLUTO: 0.186,
        MOON: 0.273,
        EUROPA: 0.245,
        TITAN: 0.404,
        CHARON: 0.095,
    };

    /** Time scale presets (seconds of simulation per real second) */
    static readonly TIME_PRESETS = {
        REALTIME: 1,
        MIN_1: 60,
        MIN_30: 1800,
        HOUR_1: 3600,
        HOUR_6: 21600,
        HOUR_12: 43200,
        HOUR_18: 64800,
        DAY_1: 86400,
        MAX_SPEED: 130406400, // Pluto (slowest) completes orbit in 1 min
    };

    /** Default time scale */
    static readonly DEFAULT_TIME_SCALE = 86400; // 1 Day per second

    // -------------------------------------------------------------------------
    // PLANET CONFIGURATIONS (using cached colors)
    // -------------------------------------------------------------------------

    static readonly PLANETS: PlanetsConfig = {
        MERCURY: {
            RADIUS: 0.8,
            DISTANCE: 60.0,
            SPEED: 0.5,
            COLOR: PLANET_COLORS.MERCURY,
        },
        VENUS: {
            RADIUS: 1.9,
            DISTANCE: 110.0,
            SPEED: 0.35,
            COLOR: PLANET_COLORS.VENUS,
        },
        EARTH: {
            RADIUS: 2.0,
            DISTANCE: 150.0,
            SPEED: 0.3,
            COLOR: PLANET_COLORS.EARTH,
            MOON: {
                RADIUS: 0.5,
                DISTANCE: 12.0,
                SPEED: 2.0,
            }
        },
        MARS: {
            RADIUS: 1.1,
            DISTANCE: 220.0,
            SPEED: 0.24,
            COLOR: PLANET_COLORS.MARS,
        },
        JUPITER: {
            RADIUS: 11.0,
            DISTANCE: 500.0,
            SPEED: 0.13,
            COLOR: PLANET_COLORS.JUPITER,
            MOON: { // Europa
                RADIUS: 1.5,
                DISTANCE: 30.0,
                SPEED: 1.5,
            }
        },
        SATURN: {
            RADIUS: 9.0,
            DISTANCE: 800.0,
            SPEED: 0.09,
            COLOR: PLANET_COLORS.SATURN,
            RING: {
                INNER_RADIUS: 12.0,
                OUTER_RADIUS: 22.0,
            },
            MOON: { // Titan
                RADIUS: 2.0,
                DISTANCE: 40.0,
                SPEED: 1.0,
            }
        },
        URANUS: {
            RADIUS: 4.0,
            DISTANCE: 1200.0,
            SPEED: 0.06,
            COLOR: PLANET_COLORS.URANUS,
        },
        NEPTUNE: {
            RADIUS: 3.9,
            DISTANCE: 1600.0,
            SPEED: 0.05,
            COLOR: PLANET_COLORS.NEPTUNE,
        },
        PLUTO: {
            RADIUS: 0.6,
            DISTANCE: 2000.0,
            SPEED: 0.04,
            COLOR: PLANET_COLORS.PLUTO,
            MOON: {  // Charon
                RADIUS: 0.4,
                DISTANCE: 8.0,
                SPEED: 3.0,
            }
        }
    };

    // -------------------------------------------------------------------------
    // ASTEROIDS
    // -------------------------------------------------------------------------

    static readonly ASTEROIDS: AsteroidsConfig = {
        COUNT: 2000,
        INNER_RADIUS: 300,
        OUTER_RADIUS: 450,
    };

    // -------------------------------------------------------------------------
    // CONTROLS
    // -------------------------------------------------------------------------

    static readonly CONTROLS: ControlsConfig = {
        FLY_SPEED: 20.0,
        BOOST_MULTIPLIER: 10.0,
        ROLL_SPEED: Math.PI / 3,
        FOV_DEFAULT: 50,
        FOV_MIN: 20,
        FOV_MAX: 70,
        ORBIT_SPEED_SCALE: 0.2, // Unified orbit speed multiplier
    };

    // -------------------------------------------------------------------------
    // RADAR
    // -------------------------------------------------------------------------

    static readonly RADAR: RadarConfig = {
        RANGE: 2000,
        RADIUS: 100,
        COLORS: {
            SUN: '#ffaa00',
            MERCURY: '#aaaaaa',
            VENUS: '#e3bc79',
            EARTH: '#2233ff',
            MOON: '#ffffff',
            MARS: '#c1440e',
            JUPITER: '#d8ca9d',
            SATURN: '#eead6b',
            URANUS: '#73d7ee',
            NEPTUNE: '#3e54e8',
            PLUTO: '#c2b8a3',
        }
    };

    // -------------------------------------------------------------------------
    // LIGHTING
    // -------------------------------------------------------------------------

    static readonly LIGHTING: LightingConfig = {
        SUN_COLOR: 0xffffff,
        SUN_INTENSITY: 5.0,
        AMBIENT_COLOR: 0x404040,
        AMBIENT_INTENSITY: 1.5,
        MOON_COLOR: 0xccddee,
    };

    // -------------------------------------------------------------------------
    // CAMERA
    // -------------------------------------------------------------------------

    static readonly CAMERA: CameraConfig = {
        LOCK_DISTANCE_MULTIPLIER: 3.0,
        CHASE_OFFSET: { X: 0.7, Y: 0.3, Z: 0.7 },
        LERP_FACTOR: 0.1,
    };

    // -------------------------------------------------------------------------
    // LABELS
    // -------------------------------------------------------------------------

    static readonly LABELS: LabelConfig = {
        HEIGHT_MULTIPLIER: 2.5,
        FADE_START_MULTIPLIER: 5.0,
        FADE_END_MULTIPLIER: 20.0,
    };

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Performs smooth Hermite interpolation between 0 and 1.
     * 
     * @param min - Lower edge of the interpolation range
     * @param max - Upper edge of the interpolation range  
     * @param value - The input value to interpolate
     * @returns Smoothly interpolated value between 0 and 1
     */
    static smoothstep(min: number, max: number, value: number): number {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    /**
     * Calculates the opacity of a "Glare" sprite based on camera distance.
     * The glare should be visible when FAR, and invisible when NEAR (to see surface).
     * 
     * @param distance - Current distance from object center
     * @param radius - Object radius (to know when we are "close")
     * @returns Opacity (0.0 to 1.0)
     */
    static getAdaptiveGlareOpacity(distance: number, radius: number): number {
        const fadeStart = radius * 12.0;
        const fadeEnd = radius * 4.0;
        const t = (distance - fadeEnd) / (fadeStart - fadeEnd);
        return Math.max(0.0, Math.min(1.0, t));
    }

    /**
     * Calculates label opacity based on camera distance.
     * Labels fade in when far, fade out when close.
     * 
     * @param distance - Current distance from object
     * @param radius - Object radius
     * @returns Opacity (0.0 to 1.0)
     */
    static getLabelOpacity(distance: number, radius: number): number {
        return this.smoothstep(
            radius * this.LABELS.FADE_START_MULTIPLIER,
            radius * this.LABELS.FADE_END_MULTIPLIER,
            distance
        );
    }

    /**
     * Calculates orbital position at a given time.
     * Uses time-based calculation for deterministic results.
     * 
     * @param initialAngle - Starting angle offset (radians)
     * @param time - Current simulation time
     * @param speed - Orbit speed from planet config
     * @param distance - Orbit distance from planet config
     * @returns Position object with x and z coordinates
     */
    static getOrbitalPosition(
        initialAngle: number,
        time: number,
        speed: number,
        distance: number
    ): { x: number; z: number } {
        const theta = initialAngle + time * speed * this.CONTROLS.ORBIT_SPEED_SCALE;
        return {
            x: Math.cos(theta) * distance,
            z: Math.sin(theta) * distance,
        };
    }

    /**
     * Gets the radius of a mesh, handling both Mesh and Group objects.
     * 
     * @param object - THREE.Object3D to get radius from
     * @param fallback - Fallback value if radius cannot be determined
     * @returns The radius of the object
     */
    static getObjectRadius(object: THREE.Object3D, fallback: number = 5): number {
        // If it's a mesh with sphere geometry
        if (object instanceof THREE.Mesh) {
            const geo = object.geometry as THREE.SphereGeometry;
            if (geo.parameters?.radius) {
                return geo.parameters.radius;
            }
        }

        // If it's a group, check first child
        if (object instanceof THREE.Group && object.children.length > 0) {
            const firstChild = object.children[0];
            if (firstChild instanceof THREE.Mesh) {
                const geo = firstChild.geometry as THREE.SphereGeometry;
                if (geo.parameters?.radius) {
                    return geo.parameters.radius;
                }
            }
        }

        // Check for custom radius property
        if ('radius' in object && typeof object.radius === 'number') {
            return object.radius;
        }

        return fallback;
    }

    /**
     * Colorizes a Blackbody temperature.
     * 
     * @param kelvin - Temperature in Kelvin
     * @returns RGB tuple [r, g, b] where each value is 0-1
     */
    static getKelvinColor(kelvin: number): [number, number, number] {
        if (kelvin < 4000) return [1.0, 0.4, 0.0]; // Red/Orange
        if (kelvin < 6000) return [1.0, 0.9, 0.7]; // Sun-like
        if (kelvin < 10000) return [0.8, 0.9, 1.0]; // Blue-white
        return [0.5, 0.5, 1.0]; // Blue
    }

    // =========================================================================
    // REALISTIC ORBITAL MECHANICS
    // =========================================================================

    /** Seconds per Earth day */
    static readonly SECONDS_PER_DAY = 86400;

    /** Seconds per Earth hour */
    static readonly SECONDS_PER_HOUR = 3600;

    /**
     * Calculate orbital angle based on real orbital period.
     * 
     * @param simTime - Simulation time in seconds (already scaled)
     * @param orbitalPeriodDays - Real orbital period in Earth days
     * @param initialAngle - Starting angle offset (radians)
     * @returns Angle in radians
     */
    static getRealisticOrbitalAngle(
        simTime: number,
        orbitalPeriodDays: number,
        initialAngle: number = 0
    ): number {
        const periodSeconds = orbitalPeriodDays * this.SECONDS_PER_DAY;
        return initialAngle + (simTime / periodSeconds) * 2 * Math.PI;
    }

    /**
     * Calculate rotation angle based on real rotation period.
     * 
     * @param simTime - Simulation time in seconds (already scaled)
     * @param rotationPeriodHours - Real rotation period in hours (negative = retrograde)
     * @returns Rotation angle in radians
     */
    static getRealisticRotation(
        simTime: number,
        rotationPeriodHours: number
    ): number {
        const periodSeconds = Math.abs(rotationPeriodHours) * this.SECONDS_PER_HOUR;
        const direction = rotationPeriodHours < 0 ? -1 : 1;
        return direction * (simTime / periodSeconds) * 2 * Math.PI;
    }

    /**
     * Calculate realistic orbital position.
     * 
     * @param simTime - Simulation time in seconds
     * @param orbitalPeriodDays - Real orbital period in Earth days
     * @param distanceAU - Distance from parent in AU
     * @param initialAngle - Starting angle offset
     * @returns Position {x, z} in simulation units
     */
    static getRealisticOrbitalPosition(
        simTime: number,
        orbitalPeriodDays: number,
        distanceAU: number,
        initialAngle: number = 0
    ): { x: number; z: number } {
        const theta = this.getRealisticOrbitalAngle(simTime, orbitalPeriodDays, initialAngle);
        const simDistance = distanceAU * this.UNITS.AU;
        return {
            x: Math.cos(theta) * simDistance,
            z: Math.sin(theta) * simDistance,
        };
    }

    /**
     * Calculate distance from Sun on an elliptical orbit.
     * Uses the polar equation of an ellipse: r = a(1-e²) / (1 + e*cos(θ))
     * 
     * @param semiMajorAxis - Semi-major axis (average distance)
     * @param eccentricity - Orbital eccentricity (0-1)
     * @param trueAnomaly - Angle from perihelion in radians
     * @returns Distance from Sun
     */
    static getEllipticalDistance(
        semiMajorAxis: number,
        eccentricity: number,
        trueAnomaly: number
    ): number {
        return semiMajorAxis * (1 - eccentricity * eccentricity) /
            (1 + eccentricity * Math.cos(trueAnomaly));
    }

    /**
     * Calculate 3D position on an elliptical, inclined orbit.
     * 
     * @param semiMajorAxis - Semi-major axis (sim units)
     * @param eccentricity - Orbital eccentricity (0-1)
     * @param inclination - Orbital inclination in degrees
     * @param trueAnomaly - Current angle from perihelion (radians)
     * @returns Position {x, y, z} in simulation units
     */
    static getEllipticalOrbitalPosition(
        semiMajorAxis: number,
        eccentricity: number,
        inclination: number,
        trueAnomaly: number
    ): { x: number; y: number; z: number } {
        const r = this.getEllipticalDistance(semiMajorAxis, eccentricity, trueAnomaly);
        const incRad = inclination * Math.PI / 180;

        return {
            x: Math.cos(trueAnomaly) * r,
            z: Math.sin(trueAnomaly) * r * Math.cos(incRad),
            y: Math.sin(trueAnomaly) * r * Math.sin(incRad),
        };
    }

    /**
     * Convert Earth-relative radius to simulation units.
     * 
     * @param radiusEarth - Radius relative to Earth (Earth = 1.0)
     * @returns Radius in simulation units
     */
    static getSimRadius(radiusEarth: number): number {
        // Earth radius in sim units = 2.0 (from original config)
        return radiusEarth * 2.0;
    }
}
