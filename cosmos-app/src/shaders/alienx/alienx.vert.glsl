varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    // Transform normal to World Space (assuming uniform scale, otherwise use inverse-transpose)
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
