uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;

// NOISE_FUNCTIONS_PLACEHOLDER

void main() {
    float t = uTime * 0.2;
    float n = snoise(vPosition * 0.8 + vec3(0.0, t, 0.0));
    float rim = 1.0 - abs(dot(vNormal, vec3(0,0,1))); 
    
    float alpha = rim * rim * (0.5 + 0.5 * n);
    vec3 col = vec3(1.0, 0.6, 0.2); 

    if (rim < 0.2) alpha *= 0.1;
    gl_FragColor = vec4(col, alpha * 0.6);
}
