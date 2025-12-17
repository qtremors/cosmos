import * as THREE from 'three';
import { kmToUnits } from './PhysicalScale';

/** Fraction of a luminous disc visible behind one circular occluder. */
export function visibleDiscFraction(sun: number, occluder: number, separation: number): number {
    if (separation >= sun + occluder) return 1;
    if (separation <= Math.abs(sun - occluder)) return occluder >= sun ? 0 : 1 - (occluder / sun) ** 2;
    const d = separation, a = sun, b = occluder;
    const overlap = a * a * Math.acos((d * d + a * a - b * b) / (2 * d * a))
        + b * b * Math.acos((d * d + b * b - a * a) / (2 * d * b))
        - 0.5 * Math.sqrt(Math.max(0, (-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b)));
    return Math.max(0, 1 - overlap / (Math.PI * a * a));
}

const fragment = `
varying vec3 vSolarLocal;
uniform vec3 uSolarRelative;
uniform vec4 uOccluders[8];
uniform float uSolarRadius;
float discVisibility(float a, float b, float d) {
    if (d >= a + b) return 1.0;
    if (d <= abs(a-b)) return b >= a ? 0.0 : 1.0 - b*b/(a*a);
    float aa=a*a, bb=b*b, dd=d*d;
    float overlap=aa*acos(clamp((dd+aa-bb)/(2.0*d*a),-1.0,1.0))
      +bb*acos(clamp((dd+bb-aa)/(2.0*d*b),-1.0,1.0))
      -0.5*sqrt(max(0.0,(-d+a+b)*(d+a-b)*(d-a+b)*(d+a+b)));
    return clamp(1.0-overlap/(3.141592653589793*aa),0.0,1.0);
}
float solarVisibility() {
    vec3 sun=uSolarRelative-vSolarLocal;
    float sunDistance=length(sun);
    vec3 direction=sun/sunDistance;
    float sunAngle=asin(clamp(uSolarRadius/sunDistance,0.0,1.0));
    float visible=1.0;
    for(int index=0;index<8;index++) {
        if(uOccluders[index].w <= 0.0) continue;
        vec3 occluder=uOccluders[index].xyz-vSolarLocal;
        float distance=length(occluder);
        if(distance >= sunDistance || dot(occluder,direction) <= 0.0) continue;
        vec3 axis=occluder/distance;
        float separation=atan(length(cross(axis,direction)),dot(axis,direction));
        float angle=asin(clamp(uOccluders[index].w/distance,0.0,1.0));
        visible=min(visible,discVisibility(sunAngle,angle,separation));
    }
    return visible;
}`;

export interface Occluder { mesh: THREE.Object3D; radius: number }
/** Analytic penumbra/umbra keeps eclipse resolution independent of vast world distances. */
export function installSolarOcclusion(mesh: THREE.Mesh, occluders: Occluder[]): void {
    const material = mesh.material;
    if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.ShaderMaterial)) return;
    const uniforms = {
        uSolarRelative: { value: new THREE.Vector3() },
        uSolarRadius: { value: kmToUnits(695700) },
        uOccluders: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    };
    const vertex = (source: string) => source.replace('#include <common>', '#include <common>\nvarying vec3 vSolarLocal;').replace('#include <project_vertex>', '#include <project_vertex>\nvSolarLocal = mat3(modelMatrix) * transformed;');
    if (material instanceof THREE.ShaderMaterial) {
        Object.assign(material.uniforms, uniforms);
        material.vertexShader = vertex(material.vertexShader).replace('vUv = uv;', 'vUv = uv;\n    vSolarLocal = mat3(modelMatrix) * position;');
        material.fragmentShader = material.fragmentShader.replace('#include <common>', '#include <common>\n' + fragment).replace('float diff = max(signedLight, 0.0);', 'float diff = max(signedLight, 0.0) * solarVisibility();');
    } else {
        material.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = vertex(shader.vertexShader);
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + fragment).replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nfloat visibility = solarVisibility();\nreflectedLight.directDiffuse *= visibility;\nreflectedLight.directSpecular *= visibility;');
        };
        material.customProgramCacheKey = () => 'cosmos-spherical-solar-occlusion-v1';
    }
    const origin = new THREE.Vector3(), centre = new THREE.Vector3();
    mesh.onBeforeRender = () => {
        mesh.getWorldPosition(origin); uniforms.uSolarRelative.value.copy(origin).negate();
        for (let index = 0; index < 8; index++) {
            const item = occluders[index], uniform = uniforms.uOccluders.value[index];
            if (!item) { uniform.set(0, 0, 0, 0); continue; }
            item.mesh.getWorldPosition(centre).sub(origin); uniform.set(centre.x, centre.y, centre.z, item.radius);
        }
    };
}
