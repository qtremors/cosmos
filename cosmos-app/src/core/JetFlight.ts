import * as THREE from 'three';
import type { SceneAssets } from './SceneAssets';
import { disposeObject3D } from './SceneLifecycle';
import { kmToUnits, unitsToKm } from './PhysicalScale';
import { JET_LENGTH_KM, type JetStatus } from './JetConfig';
import { getProgressiveBoostMultiplier, readFlightInput, type InputState } from './InputHandler';
import { Cosmos } from './SDK';

export interface JetFlightState { throttle: number; boosting: boolean; }

/** Ship dynamics consume Cosmos's input actions; the chase camera follows the ship. */
export class JetFlight {
    readonly scene = new THREE.Scene();
    readonly hull = new THREE.Group();
    readonly position = new THREE.Vector3();
    readonly rotation = new THREE.Quaternion();
    /** Actual ship velocity in km/s. */
    readonly velocity = new THREE.Vector3();
    throttle = 0;
    boosting = false;
    private normalSpeedKmS = unitsToKm(Cosmos.CONTROLS.FLY_SPEED);
    status: JetStatus = 'idle';
    private disposed = false;
    private offset = new THREE.Vector3();
    private cameraRotation = new THREE.Quaternion();
    private courseRotation = new THREE.Quaternion();
    private turn = new THREE.Quaternion();
    private angularVelocity = new THREE.Vector3();
    private forward = new THREE.Vector3();
    private previousVelocity = new THREE.Vector3();
    private desiredVelocity = new THREE.Vector3();
    /** Engine response independent of the navigation speed and local clearance. */
    private engineVelocity = new THREE.Vector3();
    private axisY = new THREE.Vector3(0, 1, 0);
    private axisZ = new THREE.Vector3(0, 0, 1);
    private bank = 0;
    private bankVelocity = 0;
    private originalFov = 50;
    private exhaust = new THREE.Group();
    private cameraFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

    constructor(private onStatus: (status: JetStatus) => void = () => {}) {
        this.scene.visible = false;
        const key = new THREE.DirectionalLight(0xffe6cb, 2.6);
        key.position.set(-2, 3, 4);
        this.scene.add(this.hull, new THREE.HemisphereLight(0xc6e4ff, 0x30394d, 2), key);
        const length = kmToUnits(JET_LENGTH_KM);
        const plume = new THREE.ConeGeometry(length * 0.045, length * 0.4, 8);
        plume.rotateX(-Math.PI / 2); plume.translate(0, 0, -length * 0.2);
        const glow = new THREE.MeshBasicMaterial({ color: 0x69caff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false });
        for (const side of [-1, 1]) {
            const engine = new THREE.Mesh(plume, glow);
            engine.position.set(side * 0.16 * length, -0.025 * length, -0.51 * length);
            this.exhaust.add(engine);
        }
        this.exhaust.visible = false;
        this.hull.add(this.exhaust);
    }

    async load(assets: SceneAssets): Promise<void> {
        if (this.disposed || this.status === 'loading' || this.status === 'ready') return;
        this.onStatus(this.status = 'loading');
        try {
            const gltf = await assets.loadModel(`${import.meta.env.BASE_URL}models/Jet.glb`);
            if (this.disposed) { disposeObject3D(gltf.scene); return; }
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const extent = Math.max(size.x, size.y, size.z);
            if (!Number.isFinite(extent) || extent <= 0) {
                disposeObject3D(gltf.scene);
                throw new Error('Jet has no geometry');
            }
            gltf.scene.position.sub(box.getCenter(new THREE.Vector3()));
            const model = new THREE.Group();
            model.name = 'jet-model';
            model.add(gltf.scene);
            model.scale.setScalar(kmToUnits(JET_LENGTH_KM) / extent);
            gltf.scene.traverse(object => {
                if (!(object instanceof THREE.Mesh)) return;
                // Derivative normals underflow on a metre-scale hull in AU world units.
                // Generate normals in asset space before applying the physical scale.
                const needsNormals = !object.geometry.hasAttribute('normal');
                if (needsNormals) object.geometry.computeVertexNormals();
                for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                    // Stable cabin lighting keeps the hull legible through solar exposure changes.
                    material.toneMapped = false;
                    if (material instanceof THREE.MeshStandardMaterial) {
                        material.metalness = Math.min(0.35, material.metalness);
                        if (needsNormals) material.flatShading = false;
                    }
                }
            });
            this.hull.add(model);
            this.onStatus(this.status = 'ready');
        } catch {
            if (!this.disposed) this.onStatus(this.status = 'failed');
        }
    }

    enter(camera: THREE.PerspectiveCamera): void {
        this.originalFov = camera.fov;
        this.bank = 0;
        this.rotation.copy(camera.quaternion).multiply(this.cameraFlip).normalize();
        this.courseRotation.copy(this.rotation);
        this.cameraRotation.copy(this.rotation);
        const length = kmToUnits(JET_LENGTH_KM);
        this.offset.set(0, 0.65, -3.2).multiplyScalar(length).applyQuaternion(this.rotation);
        this.position.copy(camera.position).sub(this.offset);
        this.halt();
        this.scene.visible = true;
        this.syncView(camera, 0);
    }

    get speedKmS(): number { return this.velocity.length(); }

    halt(): void {
        this.throttle = 0; this.boosting = false;
        this.velocity.set(0, 0, 0); this.engineVelocity.set(0, 0, 0); this.angularVelocity.set(0, 0, 0);
        this.bankVelocity = 0;
    }

    leave(camera: THREE.PerspectiveCamera): void {
        this.scene.visible = false;
        this.halt();
        camera.fov = this.originalFov;
        camera.up.set(0, 1, 0);
        camera.updateProjectionMatrix();
    }

    update(camera: THREE.PerspectiveCamera, delta: number, input: InputState, mouse: { x: number; y: number }, zoom: { current: number }, gamepad: Gamepad | null, flightSpeed = Cosmos.CONTROLS.FLY_SPEED): void {
        const dt = THREE.MathUtils.clamp(delta, 0, 0.1);
        const controls = readFlightInput(input, gamepad);
        // Use the same clearance-aware cruise speed as the free camera.
        this.normalSpeedKmS = unitsToKm(flightSpeed);
        if ((controls.boost || input.boostPresses > 0) && !controls.back) this.throttle = 1;
        getProgressiveBoostMultiplier(input, 0, controls.boost, controls.back > 0);
        // Wheel and touch +/- adjust engine throttle, rather than translating the camera.
        if (controls.zoomIn) zoom.current -= 60 * dt;
        if (controls.zoomOut) zoom.current += 60 * dt;
        if (dt > 0) this.throttle = THREE.MathUtils.clamp(this.throttle - zoom.current * 0.015, 0, 1);
        zoom.current = 0;
        const steer = controls.left - controls.right;
        const pitch = THREE.MathUtils.clamp(controls.pitch + Number(controls.up) - Number(controls.down) - controls.lookY, -1, 1);
        const yaw = THREE.MathUtils.clamp(controls.yaw + steer - controls.lookX, -1, 1);
        const mouseRateX = dt > 0 ? THREE.MathUtils.clamp(mouse.y * 0.003 / dt, -1.5, 1.5) : 0;
        const mouseRateY = dt > 0 ? THREE.MathUtils.clamp(-mouse.x * 0.003 / dt, -1.5, 1.5) : 0;
        const steering = THREE.MathUtils.clamp(yaw + mouseRateY / 0.75, -1, 1);
        mouse.x = mouse.y = 0;
        let remaining = dt;
        while (remaining > 1e-9) {
            const step = Math.min(remaining, 1 / 120);
            remaining -= step;
            const boost = getProgressiveBoostMultiplier(input, step, controls.boost, controls.back > 0);
            const braking = controls.back > 0 && !input.brakingBoost;
            this.throttle = THREE.MathUtils.clamp(this.throttle + (controls.forward * 0.5 - (braking ? controls.back * 0.9 : 0)) * step, 0, 1);
            // Roll has angular momentum. The bank develops before the heading turns,
            // and eases back to level when the steering input is released.
            this.bankVelocity += (-steering * 1.15 - this.bank) * 28 * step - this.bankVelocity * 9 * step;
            this.bank += this.bankVelocity * step;
            const response = 1 - Math.exp(-8 * step);
            this.angularVelocity.x += (-pitch * 0.9 + mouseRateX - this.angularVelocity.x) * response;
            this.angularVelocity.y += (-Math.sin(this.bank) * 0.95 - this.angularVelocity.y) * response;
            this.angularVelocity.z += ((Number(controls.rollRight) - Number(controls.rollLeft)) * 1.2 - this.angularVelocity.z) * response;
            // Pitch around the banked wing axis, so pulling up in a bank curves the turn.
            this.offset.set(Math.cos(this.bank), Math.sin(this.bank), 0);
            this.turn.setFromAxisAngle(this.offset, this.angularVelocity.x * step); this.courseRotation.multiply(this.turn);
            this.turn.setFromAxisAngle(this.axisY, this.angularVelocity.y * step); this.courseRotation.multiply(this.turn);
            this.turn.setFromAxisAngle(this.axisZ, this.angularVelocity.z * step); this.courseRotation.multiply(this.turn).normalize();
            this.turn.setFromAxisAngle(this.axisZ, this.bank);
            this.rotation.copy(this.courseRotation).multiply(this.turn);
            this.forward.set(0, 0, 1).applyQuaternion(this.rotation);
            this.desiredVelocity.copy(this.forward).multiplyScalar(this.throttle);
            this.previousVelocity.copy(this.velocity);
            this.engineVelocity.lerp(this.desiredVelocity, 1 - Math.exp(-(braking ? 6 : 2.2) * step));
            // Stored boost controls speed directly, so release holds the reached speed
            // while heading and turning momentum continue to respond smoothly.
            if (input.boostCruising) this.engineVelocity.setLength(this.throttle);
            if (this.throttle === 0 && this.engineVelocity.lengthSq() < 1e-6) this.engineVelocity.set(0, 0, 0);
            this.velocity.copy(this.engineVelocity).multiplyScalar(this.normalSpeedKmS * boost);
            this.position.addScaledVector(this.previousVelocity.add(this.velocity), kmToUnits(1) * step * 0.5);
            this.cameraRotation.slerp(this.courseRotation, 1 - Math.exp(-3 * step));
        }
        this.boosting = input.boostMultiplier > 1;
        this.syncView(camera, dt);
    }

    private syncView(camera: THREE.PerspectiveCamera, dt: number): void {
        const length = kmToUnits(JET_LENGTH_KM);
        this.hull.position.copy(this.position);
        this.hull.quaternion.copy(this.rotation);
        this.exhaust.visible = this.throttle > 0.01;
        for (const engine of this.exhaust.children) engine.scale.z = 0.25 + this.throttle * (this.boosting ? 2.5 : 0.8);
        const chaseDistance = camera.aspect < 0.8 ? 4 : 3.2;
        this.offset.set(0, 0.65, -chaseDistance).multiplyScalar(length).applyQuaternion(this.cameraRotation);
        camera.position.copy(this.position).add(this.offset);
        camera.up.set(0, 1, 0).applyQuaternion(this.cameraRotation);
        camera.lookAt(this.offset.set(0, -0.15, 2.5).multiplyScalar(length).applyQuaternion(this.cameraRotation).add(this.position));
        camera.near = length * 0.01;
        const fov = this.originalFov + (this.boosting ? 9 : 0);
        camera.fov += (fov - camera.fov) * (1 - Math.exp(-3 * dt));
        camera.updateProjectionMatrix();
    }

    dispose(): void { this.disposed = true; disposeObject3D(this.scene); this.scene.clear(); }
}
