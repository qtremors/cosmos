import * as THREE from 'three';

// Artistic destinations beyond the Solar System's navigation and visibility bounds.
export const INTERSTELLAR_PAIR_DISTANCE = 80_000;

export function placeInterstellarPair(alienX: THREE.Object3D, blackHole: THREE.Object3D): THREE.Vector3 {
    const offset = alienX.position.clone().normalize().multiplyScalar(INTERSTELLAR_PAIR_DISTANCE).sub(alienX.position);
    alienX.position.add(offset);
    blackHole.position.add(offset);
    // Arrive in front of Alien X with the black hole directly behind him.
    return alienX.position.clone().sub(blackHole.position).normalize();
}
