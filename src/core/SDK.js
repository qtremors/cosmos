import * as THREE from 'three';

/**
 * Cosmos SDK
 * The Core Physics & Visuals Engine for the Virtual Cosmos.
 * 
 * DESIGN PHILOSOPHY:
 * - Scale Agnostic: We use "Sim Units". 
 * - Standardized Visuals: Glare, LOD, and Fade logic is centralized.
 */
export class Cosmos {

    /**
     * CONSTANTS
     */
    static get UNITS() {
        return {
            SOLAR_RADIUS: 10.0,  // Increased size for better visual presence
            AU: 200.0,          // Distance scale
            LIGHT_SPEED: 1.0,
        };
    }

    static get PLANETS() {
        return {
            MERCURY: {
                RADIUS: 0.8, // Visual scale (not 1:1, but looks good next to Sun 10)
                DISTANCE: 60.0, // Closer than AU=200 to be easily visible
                SPEED: 0.5, // Orbital speed
                COLOR: new THREE.Color(0xA5A5A5),
            }
        };
    };

    static get CONTROLS() {
        return {
            FLY_SPEED: 25.0,
            ROLL_SPEED: Math.PI / 12, // 15 degrees per frame approx
            FOV_MIN: 10,
            FOV_MAX: 100,
        };
    }

    /**
     * VISUAL HELPERS
     */

    /**
     * Calculates the opacity of a "Glare" sprite based on camera distance.
     * The glare should be visible when FAR, and invisible when NEAR (to see surface).
     * 
     * @param {number} distance Current distance from object center
     * @param {number} radius Object radius (to know when we are "close")
     * @returns {number} Opacity (0.0 to 1.0)
     */
    static getAdaptiveGlareOpacity(distance, radius) {
        // Start fading out when we get closer than 10x radius
        // Completely transparent when we are at 3x radius (close up)
        const fadeStart = radius * 12.0;
        const fadeEnd = radius * 4.0;

        // Smoothstep interpolation
        // distance > fadeStart => 1.0
        // distance < fadeEnd => 0.0

        // We map [fadeEnd, fadeStart] -> [0, 1]
        const t = (distance - fadeEnd) / (fadeStart - fadeEnd);
        const clamped = Math.max(0.0, Math.min(1.0, t));

        return clamped; // Linear falloff, or use Math.pow for non-linear
    }

    /**
     * Colorizes a Blackbody temperature.
     * Simple approx for now.
     * @param {number} kelvin 
     */
    static getKelvinColor(kelvin) {
        if (kelvin < 4000) return [1.0, 0.4, 0.0]; // Red/Orange
        if (kelvin < 6000) return [1.0, 0.9, 0.7]; // Sun-like
        if (kelvin < 10000) return [0.8, 0.9, 1.0]; // Blue-white
        return [0.5, 0.5, 1.0]; // Blue
    }
}
