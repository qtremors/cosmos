import * as THREE from 'three';

export interface PerformanceSnapshot {
    quality: string;
    system: string;
    samples: number;
    frameMsP50: number;
    frameMsP95: number;
    updateRenderMsP95: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    programs: number;
    geometryMiB: number;
    estimatedTextureMiB: number;
    estimatedShadowMiB: number;
    jsHeapMiB: number | null;
    modelLoads: number;
    modelParseMs: number;
    modelParseMaxMs: number;
    modelBytes: number;
    residentModels: number;
    cameraPosition: number[];
    simulationTime: number;
    dateUTC: string;
    cameraNear: number;
    lockedTargetPosition: number[] | null;
}

/** A bounded sample window; these are CPU/wall timings, not GPU timer-query measurements. */
export class FrameProfiler {
    private wall = new Float64Array(300);
    private cpu = new Float64Array(300);
    private index = 0;
    private count = 0;
    private previous = 0;

    record(start: number, duration: number): void {
        if (this.previous) {
            this.wall[this.index] = start - this.previous;
            this.cpu[this.index] = duration;
            this.index = (this.index + 1) % this.wall.length;
            this.count = Math.min(this.count + 1, this.wall.length);
        }
        this.previous = start;
    }

    reset(): void { this.count = this.index = this.previous = 0; }

    timings() {
        const wall = Array.from(this.wall.slice(0, this.count)).sort((a, b) => a - b);
        const cpu = Array.from(this.cpu.slice(0, this.count)).sort((a, b) => a - b);
        const percentile = (values: number[], fraction: number) => Math.round((values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0) * 100) / 100;
        return { samples: this.count, frameMsP50: percentile(wall, 0.5), frameMsP95: percentile(wall, 0.95), updateRenderMsP95: percentile(cpu, 0.95) };
    }
}

/** Counts unique owned resources. Texture estimates assume decoded RGBA plus mipmaps. */
export function resourceEstimates(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const textures = new Set<THREE.Texture>();
    let shadowBytes = 0;
    const addTexture = (value: unknown) => { if (value instanceof THREE.Texture) textures.add(value); };
    root.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
            if ('geometry' in object) geometries.add(object.geometry);
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                Object.values(material).forEach(addTexture);
                if (material instanceof THREE.ShaderMaterial) Object.values(material.uniforms).forEach(uniform => {
                    if (Array.isArray(uniform.value)) uniform.value.forEach(addTexture); else addTexture(uniform.value);
                });
            }
        }
        if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight || object instanceof THREE.DirectionalLight) {
            const map = object.shadow.map;
            // Colour texture plus an estimated 32-bit depth buffer, excluding driver overhead.
            if (map) shadowBytes += map.width * map.height * 8 * (map instanceof THREE.WebGLCubeRenderTarget ? 6 : 1);
        }
    });
    const arrays = new Set<ArrayBufferView>();
    for (const geometry of geometries) {
        if (geometry.index) arrays.add(geometry.index.array);
        Object.values(geometry.attributes).forEach(attribute => arrays.add(attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array));
        Object.values(geometry.morphAttributes).forEach(attributes => attributes?.forEach(attribute => arrays.add(attribute.array)));
    }
    let textureBytes = 0;
    for (const texture of textures) {
        const images = Array.isArray(texture.image) ? texture.image : [texture.image];
        for (const image of images) {
            const width = image?.naturalWidth ?? image?.width ?? 0;
            const height = image?.naturalHeight ?? image?.height ?? 0;
            textureBytes += width * height * 4 * (texture.generateMipmaps ? 4 / 3 : 1);
        }
    }
    const mib = (bytes: number) => Math.round(bytes / 1048576 * 100) / 100;
    return {
        geometryMiB: mib([...arrays].reduce((total, array) => total + array.byteLength, 0)),
        estimatedTextureMiB: mib(textureBytes), estimatedShadowMiB: mib(shadowBytes),
    };
}
