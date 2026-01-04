import * as THREE from 'three';
import { SystemId } from '../core/SystemManager';

/**
 * Heliosphere - A visual boundary bubble around a star system.
 * 
 * Behavior:
 * - From INSIDE (far from edge): Invisible
 * - From INSIDE (near edge): Fades in as you approach
 * - From OUTSIDE: Always visible, semi-transparent
 * - From VERY FAR: Appears as a glowing dot (natural perspective)
 */

const vertexShader = `
    #include <common>
    #include <logdepthbuf_pars_vertex>
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        
        #include <logdepthbuf_vertex>
    }
`;

const fragmentShader = `
    #include <common>
    #include <logdepthbuf_pars_fragment>
    
    uniform vec3 uCameraPos;
    uniform vec3 uCenter;  // System center position
    uniform float uRadius;
    uniform float uTime;
    uniform vec3 uColor;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
        #include <logdepthbuf_fragment>
        
        // Distance from camera to center of sphere
        float camDistFromCenter = length(uCameraPos - uCenter);
        
        // Is camera inside the sphere?
        bool isInside = camDistFromCenter < uRadius;
        
        // Calculate base opacity
        float opacity = 0.0;
        
        if (isInside) {
            // INSIDE: Only show when close to the boundary
            float distToEdge = uRadius - camDistFromCenter;
            
            // Fade zone: start fading in when within 15% of radius from the edge
            float fadeZone = uRadius * 0.15;
            
            // Opacity increases as we get closer to the edge
            opacity = 1.0 - smoothstep(0.0, fadeZone, distToEdge);
            opacity *= 0.25; // Max opacity when inside
            
            // Only show the part of the sphere we're looking at
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float facing = dot(vNormal, viewDir);
            if (facing > 0.0) {
                opacity = 0.0;
            }
        } else {
            // OUTSIDE: Always visible
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float fresnel = 1.0 - abs(dot(vNormal, viewDir));
            fresnel = pow(fresnel, 2.0);
            
            // Base visibility + fresnel glow
            opacity = 0.06 + fresnel * 0.2;
            
            // When very far, make it slightly brighter
            float distanceFactor = camDistFromCenter / uRadius;
            if (distanceFactor > 3.0) {
                opacity += 0.08 * smoothstep(3.0, 10.0, distanceFactor);
            }
        }
        
        // Subtle animation - very slow shimmer
        float shimmer = sin(vWorldPosition.x * 0.01 + uTime * 0.5) * 
                        sin(vWorldPosition.z * 0.01 - uTime * 0.3);
        shimmer = shimmer * 0.02 + 1.0;
        
        vec3 finalColor = uColor * shimmer;
        
        gl_FragColor = vec4(finalColor, opacity);
    }
`;

export class Heliosphere extends THREE.Mesh {
    private shaderMat: THREE.ShaderMaterial;
    public readonly systemId: SystemId;
    private center: THREE.Vector3;

    /**
     * Create a heliosphere boundary bubble.
     * @param radius - Radius of the system boundary
     * @param color - Color of the heliosphere
     * @param center - Center position of the system
     * @param systemId - Identifier for which system this belongs to
     */
    constructor(
        radius: number = 2500,
        color: THREE.Color = new THREE.Color(0x6699ff),
        center: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        systemId: SystemId = SystemId.SOLAR_SYSTEM
    ) {
        const geometry = new THREE.SphereGeometry(radius, 128, 64);

        const shaderMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uCameraPos: { value: new THREE.Vector3() },
                uCenter: { value: center.clone() },
                uRadius: { value: radius },
                uTime: { value: 0 },
                uColor: { value: color.clone() },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
        });

        super(geometry, shaderMat);
        this.shaderMat = shaderMat;
        this.systemId = systemId;
        this.center = center.clone();

        // Position the heliosphere at its center
        this.position.copy(center);

        this.renderOrder = 50;
    }

    /**
     * Update the heliosphere each frame.
     */
    update(time: number, camera: THREE.Camera): void {
        this.shaderMat.uniforms.uCameraPos.value.copy(camera.position);
        this.shaderMat.uniforms.uTime.value = time;
    }

    /**
     * Set the bubble color.
     */
    setColor(color: THREE.Color): void {
        this.shaderMat.uniforms.uColor.value.copy(color);
    }

    /**
     * Get the system center position.
     */
    getCenter(): THREE.Vector3 {
        return this.center.clone();
    }
}
