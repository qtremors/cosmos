#include <common>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;

    vec3 viewNormal = normalize(normalMatrix * normal);
    vNormal = vec3(dot(viewMatrix[0].xyz, viewNormal), dot(viewMatrix[1].xyz, viewNormal), dot(viewMatrix[2].xyz, viewNormal));
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    #include <logdepthbuf_vertex>
}
