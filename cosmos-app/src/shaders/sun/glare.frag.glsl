varying vec2 vUv;
uniform float uOpacity;

void main() {
    vec2 center = vec2(0.5);
    float d = distance(vUv, center);
    float glow = smoothstep(0.5, 0.0, d);
    glow = pow(glow, 2.5);

    vec3 color = vec3(1.0, 1.0, 0.9);
    gl_FragColor = vec4(color, glow * uOpacity);
}
