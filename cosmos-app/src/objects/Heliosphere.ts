import * as THREE from 'three';

/**
 * Heliosphere - A visual boundary bubble around the Solar System.
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
    uniform float uRadius;
    uniform float uTime;
    uniform vec3 uColor;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
        #include <logdepthbuf_fragment>
        
        // Distance from camera to center of sphere (origin)
        float camDistFromCenter = length(uCameraPos);
        
        // Is camera inside the sphere?
        bool isInside = camDistFromCenter < uRadius;
        
        // Calculate base opacity
        float opacity = 0.0;
        
        if (isInside) {
            // INSIDE: Only show when close to the boundary
            // Distance from camera to nearest point on sphere surface
            float distToEdge = uRadius - camDistFromCenter;
            
            // Fade zone: start fading in when within 15% of radius from the edge
            float fadeZone = uRadius * 0.15;
            
            // Opacity increases as we get closer to the edge
            opacity = 1.0 - smoothstep(0.0, fadeZone, distToEdge);
            opacity *= 0.25; // Max opacity when inside
            
            // Only show the part of the sphere we're looking at (inner surface facing us)
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float facing = dot(vNormal, viewDir);
            // When inside, we see the back faces (normal pointing away from us)
            if (facing > 0.0) {
                opacity = 0.0;
            }
        } else {
            // OUTSIDE: Always visible
            // Fresnel effect - edges glow more
            vec3 viewDir = normalize(uCameraPos - vWorldPosition);
            float fresnel = 1.0 - abs(dot(vNormal, viewDir));
            fresnel = pow(fresnel, 2.0);
            
            // Base visibility + fresnel glow
            opacity = 0.06 + fresnel * 0.2;
            
            // When very far, make it slightly brighter so it's still visible
            float distanceFactor = camDistFromCenter / uRadius;
            if (distanceFactor > 3.0) {
                opacity += 0.08 * smoothstep(3.0, 10.0, distanceFactor);
            }
        }
        
        // Subtle animation - very slow shimmer
        float shimmer = sin(vWorldPosition.x * 0.01 + uTime * 0.5) * 
                        sin(vWorldPosition.z * 0.01 - uTime * 0.3);
        shimmer = shimmer * 0.02 + 1.0;
        
        // Final color with slight blue tint
        vec3 finalColor = uColor * shimmer;
        
        gl_FragColor = vec4(finalColor, opacity);
    }
`;

export class Heliosphere extends THREE.Mesh {
    private shaderMat: THREE.ShaderMaterial;

    /**
     * Create a heliosphere boundary bubble.
     * @param radius - Radius of the solar system boundary (default: ~300 AU equivalent)
     */
    constructor(radius: number = 2500) {
        // Create sphere geometry with high segments for smooth appearance
        const geometry = new THREE.SphereGeometry(radius, 128, 64);

        // Custom shader material
        const shaderMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uCameraPos: { value: new THREE.Vector3() },
                uRadius: { value: radius },
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x4488ff) }, // Soft blue
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending, // Normal blending to avoid affecting other transparent objects
        });

        super(geometry, shaderMat);
        this.shaderMat = shaderMat;

        // Render very late but before the black hole's billboard (99/100)
        // This ensures proper layering with most scene objects
        this.renderOrder = 50;
    }

    /**
     * Update the heliosphere each frame.
     * @param time - Current simulation time
     * @param camera - The camera to track
     */
    update(time: number, camera: THREE.Camera): void {
        // Update camera position uniform
        this.shaderMat.uniforms.uCameraPos.value.copy(camera.position);
        this.shaderMat.uniforms.uTime.value = time;
    }

    /**
     * Set the bubble color.
     */
    setColor(color: THREE.Color): void {
        this.shaderMat.uniforms.uColor.value.copy(color);
    }
}
