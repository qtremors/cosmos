import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- Configuration ---
const CONFIG = {
    bgColor: 0x010101, // Pure black void
    eyeColor: 0xccffcc,
    omnitrixColor: 0x55ff55
};

// --- Shader (Restored from "High Fidelity" Version) ---
const celestialVertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        // Transform normal to World Space (assuming uniform scale, otherwise use inverse-transpose)
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const celestialFragmentShader = `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform sampler2D uTexture; // Added texture uniform
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    // Simplex Noise (The "Perfect" Organic Look)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        // View-based mapping (Original "Window to Space" effect)
        // Causes some stretching at grazing angles, but preserves the specific motion user liked.
        vec3 viewDir = normalize(vWorldPosition - cameraPosition);
        
        // Simple planar projection of view direction
        vec2 skyUV = viewDir.xy * 0.9 + vec2(0.5); 

        // Sample the cosmic texture
        vec3 color = texture2D(uTexture, skyUV).rgb;

        // Rim Light is unchanged
        float NdotV = dot(vNormal, -viewDir);
        float rim = 1.0 - max(NdotV, 0.0);
        rim = pow(rim, 3.0); 

        vec3 rimColor = vec3(0.6, 0.8, 1.0) * rim * 0.5; 

        gl_FragColor = vec4(color + rimColor, 1.0);
    }
`;

export class AlienX extends THREE.Group {
    private alienGroup: THREE.Group;
    private label: CSS2DObject;
    private starUniforms: { uTime: { value: number }, uResolution: { value: THREE.Vector2 }, uTexture: { value: THREE.Texture | null } };
    private glowSprite: THREE.Sprite | undefined;

    private clock: THREE.Clock;

    constructor() {
        super();

        this.clock = new THREE.Clock(); // Independent clock
        this.alienGroup = new THREE.Group();
        this.add(this.alienGroup);

        // Load Texture
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/alienx.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        this.starUniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uTexture: { value: texture }
        };



        // Slight offset if desired, but user complained it wasn't looking at sun. 
        // Let's keep it direct for now to be safe, or extremely subtle.
        // this.rotateY(Math.PI / 12); // Just 15 degrees if needed. Removing for now to satisfy "not looking at sun" complaint.

        const cosmicMat = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: celestialVertexShader,
            fragmentShader: celestialFragmentShader,
            toneMapped: false, // Independent of global tone mapping
            side: THREE.DoubleSide // Ensure no gaps
        });

        // --- IMPROVED ANATOMY ---

        // 1. Head (More Iconic Shape)
        const headGrp = new THREE.Group();
        headGrp.position.y = 1.55;

        // Main Cranium (Smoother)
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 64, 64), cosmicMat);
        skull.scale.set(0.95, 1.2, 1.05);
        headGrp.add(skull);

        // Chin (Better integration)
        const chin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), cosmicMat);
        chin.position.set(0, -0.25, 0.06);
        chin.scale.set(1, 1.2, 1);
        headGrp.add(chin);

        // Jawline Fillers (To hide the seam between skull and chin)
        const jawL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), cosmicMat);
        jawL.position.set(0.12, -0.15, 0.02);
        headGrp.add(jawL);
        const jawR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), cosmicMat);
        jawR.position.set(-0.12, -0.15, 0.02);
        headGrp.add(jawR);

        // Center Horn (Fin-like)
        const hornC = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.55, 32), cosmicMat);
        hornC.position.set(0, 0.4, 0.05);
        hornC.rotation.x = -0.2;
        headGrp.add(hornC);

        // Side Horns (Better Curve approximation)
        const createHorn = (sign: number) => {
            const h = new THREE.Group();
            h.position.set(sign * 0.15, 0.35, -0.05);
            h.rotation.z = sign * -0.5; // Base angle
            h.rotation.x = -0.2;

            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25, 16), cosmicMat);
            seg1.position.y = 0.125;
            h.add(seg1);

            const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 16), cosmicMat);
            seg2.position.set(sign * 0.05, 0.35, 0);
            seg2.rotation.z = sign * 0.3; // Curve inward
            h.add(seg2);
            return h;
        };
        headGrp.add(createHorn(1));
        headGrp.add(createHorn(-1));

        // Eyes (Glowing Sprites preserved)
        const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.11, 0.05, 0.21);
        eyeL.scale.set(1.2, 0.5, 0.5);
        eyeL.rotation.z = 0.15;
        headGrp.add(eyeL);

        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(-0.11, 0.05, 0.21);
        eyeR.scale.set(1.2, 0.5, 0.5);
        eyeR.rotation.z = -0.15;
        headGrp.add(eyeR);

        // Glows
        const glowTexture = this.createGlowTexture();
        const spriteMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: CONFIG.eyeColor,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false, // Don't test depth - always render on top of what's behind
            toneMapped: false
        });
        const glowL = new THREE.Sprite(spriteMat); glowL.scale.set(0.5, 0.5, 1); glowL.renderOrder = 200; eyeL.add(glowL);
        const glowR = new THREE.Sprite(spriteMat); glowR.scale.set(0.5, 0.5, 1); glowR.renderOrder = 200; eyeR.add(glowR);

        this.alienGroup.add(headGrp);

        // 2. Muscular Torso (V-Taper)
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 32), cosmicMat);
        neck.position.y = 1.35;
        this.alienGroup.add(neck);

        // Pecs (Massive)
        const pecGeo = new THREE.SphereGeometry(0.45, 32, 32);
        pecGeo.scale(1, 0.8, 0.5);
        const pecL = new THREE.Mesh(pecGeo, cosmicMat);
        pecL.position.set(0.24, 1.15, 0.15);
        pecL.rotation.z = -0.15;
        this.alienGroup.add(pecL);
        const pecR = new THREE.Mesh(pecGeo, cosmicMat);
        pecR.position.set(-0.24, 1.15, 0.15);
        pecR.rotation.z = 0.15;
        this.alienGroup.add(pecR);

        // Upper Back/Traps filler
        const upperBack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.6, 32), cosmicMat);
        upperBack.position.set(0, 1.1, -0.1);
        upperBack.scale.x = 1.2;
        this.alienGroup.add(upperBack);

        // Core/Abs (Tapered Cylinder)
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.8, 32), cosmicMat);
        core.position.y = 0.6;
        core.scale.z = 0.8;
        this.alienGroup.add(core);

        // Hips
        const hips = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), cosmicMat);
        hips.position.y = 0.1;
        hips.scale.y = 0.8;
        this.alienGroup.add(hips);

        // 3. Limbs (Arms)
        const armL = this.createLimb(1, cosmicMat);
        const armR = this.createLimb(-1, cosmicMat);
        this.alienGroup.add(armL);
        this.alienGroup.add(armR);

        // 4. Limbs (Legs)
        const legL = this.createLeg(1, cosmicMat);
        const legR = this.createLeg(-1, cosmicMat);
        this.alienGroup.add(legL);
        this.alienGroup.add(legR);

        // 5. Omnitrix (Center Chest)
        const badge = this.createOmnitrix();
        badge.position.set(0, 1.15, 0.45);
        badge.rotation.x = -0.15;
        this.alienGroup.add(badge);
        this.glowSprite = badge.userData.glow;

        // Scale up to match the world scale (The provided code was small scale, Cosmos is large scale)
        // Original AlienX is scaled 0.8. This model seems to be around 2-4 units tall.
        // I'll scale it similarly.
        this.alienGroup.scale.setScalar(3);

        // Label
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Alien X';
        div.style.color = '#55ff55';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 7, 0); // Above head (scaled)
        this.add(this.label);

        // Position: Between Sun and Sagittarius A* (black hole is at angle PI * 0.75, distance 8000)
        // AlienX is at the same angle but closer (4000 units)
        const positionAngle = Math.PI * 0.75;  // Same angle as black hole
        const positionDistance = 4000;          // Halfway to black hole
        this.position.set(
            Math.cos(positionAngle) * positionDistance,
            100,  // Slight elevation
            Math.sin(positionAngle) * positionDistance
        );

        // Face the Sun (origin)
        this.alienGroup.lookAt(new THREE.Vector3(0, 0, 0));
    }

    private createLimb(sign: number, mat: THREE.Material): THREE.Group {
        const grp = new THREE.Group();
        grp.position.set(sign * 0.65, 1.25, 0);

        // Deltoid (Shoulder Cap)
        const delt = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), mat);
        grp.add(delt);

        // Bicep/Tricep
        const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.6, 24), mat);
        bicep.position.y = -0.4;
        grp.add(bicep);

        // Elbow Joint
        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), mat);
        elbow.position.y = -0.75;
        grp.add(elbow);

        // Forearm
        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.7, 24), mat);
        fore.position.y = -1.15;
        grp.add(fore);

        // Hand
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.15), mat);
        hand.position.y = -1.6;
        grp.add(hand);

        grp.rotation.z = sign * 0.25;
        return grp;
    }

    private createLeg(sign: number, mat: THREE.Material): THREE.Group {
        const grp = new THREE.Group();
        grp.position.set(sign * 0.25, 0.0, 0); // Connected to hips

        // Thigh (Quad)
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 1.0, 24), mat);
        thigh.position.y = -0.5;
        grp.add(thigh);

        // Knee Joint
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 24), mat);
        knee.position.y = -1.05;
        grp.add(knee);

        // Calf
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.9, 24), mat);
        calf.position.y = -1.55;
        grp.add(calf);

        // Foot
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), mat);
        foot.position.y = -2.1;
        foot.position.z = 0.1;
        grp.add(foot);

        grp.rotation.z = sign * 0.08;
        return grp;
    }

    private createOmnitrix(): THREE.Group {
        const group = new THREE.Group();
        // Use BasicMaterial instead of Standard to be independent of scene lighting
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 16, 32), new THREE.MeshBasicMaterial({ color: 0xcccccc, toneMapped: false }));
        group.add(ring);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), new THREE.MeshBasicMaterial({ color: CONFIG.omnitrixColor, toneMapped: false }));
        group.add(face);
        const triShape = new THREE.Shape();
        triShape.moveTo(-0.1, 0.1); triShape.lineTo(0.1, 0.1); triShape.lineTo(0, 0); triShape.lineTo(-0.1, 0.1);
        const triGeo = new THREE.ShapeGeometry(triShape);
        const triMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
        const t1 = new THREE.Mesh(triGeo, triMat); t1.position.z = 0.01;
        const t2 = new THREE.Mesh(triGeo, triMat); t2.position.z = 0.01; t2.rotation.z = Math.PI;
        group.add(t1); group.add(t2);

        const glowTexture = this.createGlowTexture();
        const spriteMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: CONFIG.omnitrixColor,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            toneMapped: false
        });
        const glow = new THREE.Sprite(spriteMat);
        glow.scale.set(0.6, 0.6, 1.0);
        glow.renderOrder = 200;
        group.add(glow);
        group.userData = { glow };
        return group;
    }

    private createGlowTexture(): THREE.Texture {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Clear canvas to fully transparent first
            ctx.clearRect(0, 0, 64, 64);

            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.3, 'rgba(255,255,255,0.5)');
            g.addColorStop(1, 'rgba(255,255,255,0)'); // Use white with 0 alpha, not black
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }

    update(_time: number, camera: THREE.Camera): void {
        const independentTime = this.clock.getElapsedTime();
        this.starUniforms.uTime.value = independentTime;
        // Keep resolution updated for aspect ratio correction
        this.starUniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

        // Subtle floating animation
        this.alienGroup.position.y = Math.sin(independentTime * 0.5) * 0.15;

        // Face the Sun (Origin) - AlienX back is towards Black Hole
        this.alienGroup.lookAt(0, 0, 0);

        // Power pulsing
        const power = 1 + Math.sin(independentTime * 3) * 0.01;
        // Apply power to the base scale (3)
        this.alienGroup.scale.set(3 * power, 3 * power, 3 * power);

        // Glow pulsing
        if (this.glowSprite) {
            this.glowSprite.material.opacity = 0.8 + Math.sin(independentTime * 4) * 0.2;
        }

        // Label opacity based on distance
        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 100 / dist));
    }
}
