import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import celestialVertexShader from '../shaders/alienx/alienx.vert.glsl?raw';
import celestialFragmentShader from '../shaders/alienx/alienx.frag.glsl?raw';

const CONFIG = {
    bgColor: 0x010101,
    eyeColor: 0xccffcc,
    omnitrixColor: 0x55ff55
};

export class AlienX extends THREE.Group {
    private alienGroup: THREE.Group;
    private label: CSS2DObject;
    private starUniforms: { uTime: { value: number }, uResolution: { value: THREE.Vector2 }, uTexture: { value: THREE.Texture | null } };
    private glowSprite: THREE.Sprite | undefined;

    private clock: THREE.Clock;

    constructor() {
        super();

        this.clock = new THREE.Clock();
        this.alienGroup = new THREE.Group();
        this.add(this.alienGroup);

        const loader = new THREE.TextureLoader();
        const texture = loader.load('/textures/alienx.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        this.starUniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uTexture: { value: texture }
        };

        const cosmicMat = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: celestialVertexShader,
            fragmentShader: celestialFragmentShader,
            toneMapped: false,
            side: THREE.DoubleSide
        });

        const headGrp = new THREE.Group();
        headGrp.position.y = 1.55;

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.24, 64, 64), cosmicMat);
        skull.scale.set(0.95, 1.2, 1.05);
        headGrp.add(skull);

        const chin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), cosmicMat);
        chin.position.set(0, -0.25, 0.06);
        chin.scale.set(1, 1.2, 1);
        headGrp.add(chin);

        const jawL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), cosmicMat);
        jawL.position.set(0.12, -0.15, 0.02);
        headGrp.add(jawL);
        const jawR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), cosmicMat);
        jawR.position.set(-0.12, -0.15, 0.02);
        headGrp.add(jawR);

        const hornC = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.55, 32), cosmicMat);
        hornC.position.set(0, 0.4, 0.05);
        hornC.rotation.x = -0.2;
        headGrp.add(hornC);

        const createHorn = (sign: number) => {
            const h = new THREE.Group();
            h.position.set(sign * 0.15, 0.35, -0.05);
            h.rotation.z = sign * -0.5;
            h.rotation.x = -0.2;

            const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25, 16), cosmicMat);
            seg1.position.y = 0.125;
            h.add(seg1);

            const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 16), cosmicMat);
            seg2.position.set(sign * 0.05, 0.35, 0);
            seg2.rotation.z = sign * 0.3;
            h.add(seg2);
            return h;
        };
        headGrp.add(createHorn(1));
        headGrp.add(createHorn(-1));

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

        const glowTexture = this.createGlowTexture();
        const spriteMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: CONFIG.eyeColor,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            toneMapped: false
        });
        const glowL = new THREE.Sprite(spriteMat); glowL.scale.set(0.5, 0.5, 1); glowL.renderOrder = 200; eyeL.add(glowL);
        const glowR = new THREE.Sprite(spriteMat); glowR.scale.set(0.5, 0.5, 1); glowR.renderOrder = 200; eyeR.add(glowR);

        this.alienGroup.add(headGrp);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 32), cosmicMat);
        neck.position.y = 1.35;
        this.alienGroup.add(neck);

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

        const upperBack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.6, 32), cosmicMat);
        upperBack.position.set(0, 1.1, -0.1);
        upperBack.scale.x = 1.2;
        this.alienGroup.add(upperBack);

        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.8, 32), cosmicMat);
        core.position.y = 0.6;
        core.scale.z = 0.8;
        this.alienGroup.add(core);

        const hips = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), cosmicMat);
        hips.position.y = 0.1;
        hips.scale.y = 0.8;
        this.alienGroup.add(hips);

        const armL = this.createLimb(1, cosmicMat);
        const armR = this.createLimb(-1, cosmicMat);
        this.alienGroup.add(armL);
        this.alienGroup.add(armR);

        const legL = this.createLeg(1, cosmicMat);
        const legR = this.createLeg(-1, cosmicMat);
        this.alienGroup.add(legL);
        this.alienGroup.add(legR);

        const badge = this.createOmnitrix();
        badge.position.set(0, 1.15, 0.45);
        badge.rotation.x = -0.15;
        this.alienGroup.add(badge);
        this.glowSprite = badge.userData.glow;

        this.alienGroup.scale.setScalar(3);

        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Alien X';
        div.style.color = '#55ff55';
        this.label = new CSS2DObject(div);
        this.label.position.set(0, 7, 0);
        this.add(this.label);

        const positionAngle = Math.PI * 0.75;
        const positionDistance = 4000;
        this.position.set(
            Math.cos(positionAngle) * positionDistance,
            1000,
            Math.sin(positionAngle) * positionDistance
        );

        this.alienGroup.lookAt(new THREE.Vector3(0, 0, 0));
    }

    private createLimb(sign: number, mat: THREE.Material): THREE.Group {
        const grp = new THREE.Group();
        grp.position.set(sign * 0.65, 1.25, 0);

        const delt = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), mat);
        grp.add(delt);

        const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.6, 24), mat);
        bicep.position.y = -0.4;
        grp.add(bicep);

        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), mat);
        elbow.position.y = -0.75;
        grp.add(elbow);

        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.7, 24), mat);
        fore.position.y = -1.15;
        grp.add(fore);

        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.15), mat);
        hand.position.y = -1.6;
        grp.add(hand);

        grp.rotation.z = sign * 0.25;
        return grp;
    }

    private createLeg(sign: number, mat: THREE.Material): THREE.Group {
        const grp = new THREE.Group();
        grp.position.set(sign * 0.25, 0.0, 0);

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 1.0, 24), mat);
        thigh.position.y = -0.5;
        grp.add(thigh);

        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 24), mat);
        knee.position.y = -1.05;
        grp.add(knee);

        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.9, 24), mat);
        calf.position.y = -1.55;
        grp.add(calf);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), mat);
        foot.position.y = -2.1;
        foot.position.z = 0.1;
        grp.add(foot);

        grp.rotation.z = sign * 0.08;
        return grp;
    }

    private createOmnitrix(): THREE.Group {
        const group = new THREE.Group();
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
            ctx.clearRect(0, 0, 64, 64);

            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.3, 'rgba(255,255,255,0.5)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }

    update(_time: number, camera: THREE.Camera): void {
        const independentTime = this.clock.getElapsedTime();
        this.starUniforms.uTime.value = independentTime;
        this.starUniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

        this.alienGroup.position.y = Math.sin(independentTime * 0.5) * 0.15;

        this.alienGroup.lookAt(0, this.position.y, 0);

        const power = 1 + Math.sin(independentTime * 3) * 0.01;
        this.alienGroup.scale.set(3 * power, 3 * power, 3 * power);

        if (this.glowSprite) {
            this.glowSprite.material.opacity = 0.8 + Math.sin(independentTime * 4) * 0.2;
        }

        const dist = camera.position.distanceTo(this.position);
        this.label.element.style.opacity = String(Math.min(1, 100 / dist));
    }
}
