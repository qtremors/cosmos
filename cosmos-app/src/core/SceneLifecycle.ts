import * as THREE from 'three';

/** Own exactly one RAF chain, including during React's Strict Mode replay. */
export function startAnimationLoop(update: (delta: number) => void): () => void {
    let stopped = false;
    let previous = performance.now();
    let frameId = 0;
    const frame = (now: number) => {
        if (stopped) return;
        const delta = Math.min(Math.max((now - previous) / 1000, 0), 0.1);
        previous = now;
        if (!document.hidden) update(delta);
        if (!stopped) frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => {
        stopped = true;
        cancelAnimationFrame(frameId);
    };
}

/** Dispose shared GPU resources once, including textures in shader uniforms. */
export function disposeObject3D(root: THREE.Object3D): void {
    const resources = new Set<{ dispose(): void }>();
    const bitmaps = new Set<ImageBitmap>();
    const addTexture = (value: unknown) => {
        if (value instanceof THREE.Texture) {
            resources.add(value);
            const images = Array.isArray(value.image) ? value.image : [value.image];
            for (const image of images) {
                if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) bitmaps.add(image);
            }
        }
    };
    root.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
            if ('geometry' in object) resources.add(object.geometry);
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                resources.add(material);
                Object.values(material).forEach(addTexture);
                if (material instanceof THREE.ShaderMaterial) {
                    Object.values(material.uniforms).forEach(uniform => {
                        if (Array.isArray(uniform.value)) uniform.value.forEach(addTexture);
                        else addTexture(uniform.value);
                    });
                }
            }
        }
        if (object instanceof THREE.SkinnedMesh) resources.add(object.skeleton);
        if (object instanceof THREE.PointLight || object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight) resources.add(object.shadow);
        if ('element' in object && object.element instanceof HTMLElement) object.element.remove();
    });
    resources.forEach(resource => resource.dispose());
    bitmaps.forEach(bitmap => bitmap.close());
}
