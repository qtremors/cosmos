import * as THREE from 'three';
import { disposeObject3D } from './SceneLifecycle';

export interface AssetStatus {
    loading: boolean;
    loaded: number;
    total: number;
    failed: string[];
}

export const EMPTY_ASSET_STATUS: AssetStatus = { loading: false, loaded: 0, total: 0, failed: [] };

/** Assets belong to a scene, so late callbacks cannot revive a disposed scene. */
export class SceneAssets {
    readonly manager = new THREE.LoadingManager();
    private disposed = false;
    private status: AssetStatus = { ...EMPTY_ASSET_STATUS };
    private failures = new Set<string>();
    private textures = new Map<string, THREE.Texture>();
    private pendingNotification = false;
    private retryingTextures = new Set<string>();

    constructor(private onChange: (status: AssetStatus) => void = () => {}) {
        this.manager.onStart = (_url, loaded, total) => this.progress(true, loaded, total);
        this.manager.onProgress = (_url, loaded, total) => this.progress(true, loaded, total);
        this.manager.onLoad = () => this.progress(false, this.status.loaded, this.status.total);
        this.manager.onError = url => {
            if (!this.disposed) { this.failures.add(url); this.notify(); }
        };
    }

    private progress(loading: boolean, loaded: number, total: number): void {
        if (this.disposed) return;
        this.status = { loading, loaded, total, failed: [] };
        this.notify();
    }

    private notify(): void {
        if (this.disposed || this.pendingNotification) return;
        this.pendingNotification = true;
        queueMicrotask(() => {
            this.pendingNotification = false;
            if (!this.disposed) this.onChange({ ...this.status, failed: [...this.failures] });
        });
    }

    loadTexture(url: string, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace): THREE.Texture {
        const existing = this.textures.get(url);
        if (existing) return existing;
        const texture: THREE.Texture = new THREE.TextureLoader(this.manager).load(url, loaded => {
            if (this.disposed) loaded.dispose();
            else { this.failures.delete(url); this.notify(); }
        }, undefined, () => {
            if (this.disposed) return;
            // A small neutral texture keeps geometry visible when a file is unavailable.
            const fallback = document.createElement('canvas');
            fallback.width = fallback.height = 2;
            const context = fallback.getContext('2d');
            if (context) { context.fillStyle = '#888888'; context.fillRect(0, 0, 2, 2); }
            texture.image = fallback;
            texture.needsUpdate = true;
        });
        texture.colorSpace = colorSpace;
        this.textures.set(url, texture);
        return texture;
    }

    retryTextures(): void {
        if (this.disposed) return;
        for (const [url, texture] of this.textures) {
            if (!this.failures.has(url) || this.retryingTextures.has(url)) continue;
            this.retryingTextures.add(url);
            new THREE.TextureLoader(this.manager).load(url, loaded => {
                this.retryingTextures.delete(url);
                if (!this.disposed) {
                    texture.image = loaded.image;
                    texture.needsUpdate = true;
                    this.failures.delete(url);
                    this.notify();
                }
                loaded.dispose();
            }, undefined, () => { this.retryingTextures.delete(url); });
        }
    }

    async loadModel(url: string) {
        if (this.disposed) throw new DOMException('Scene disposed', 'AbortError');
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        if (this.disposed) throw new DOMException('Scene disposed', 'AbortError');
        const gltf = await new GLTFLoader(this.manager).loadAsync(url);
        if (this.disposed) {
            gltf.scenes.forEach(disposeObject3D);
            throw new DOMException('Scene disposed', 'AbortError');
        }
        this.failures.delete(url);
        this.notify();
        return gltf;
    }

    dispose(): void {
        this.disposed = true;
        this.manager.abort();
        this.textures.forEach(texture => texture.dispose());
        this.textures.clear();
    }
}
