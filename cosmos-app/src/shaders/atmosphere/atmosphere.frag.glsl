uniform vec3 uColor;
uniform float uPower;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
    rim = pow(rim, uPower);
    

    float alpha = rim * uIntensity;
    
    gl_FragColor = vec4(uColor, alpha);
}
