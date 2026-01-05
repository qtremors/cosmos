#include <common>
#include <logdepthbuf_pars_fragment>

uniform float uTime;
uniform sampler2D uTexture;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

// NOISE_FUNCTIONS_PLACEHOLDER

void main() {
    #include <logdepthbuf_fragment>
    
    // Sample base texture
    vec3 texColor = texture2D(uTexture, vUv).rgb;
    
    float t = uTime * 0.1;
    // Granulation noise overlay
    float n1 = snoise(vPosition * 1.5 + vec3(t));
    float n2 = snoise(vPosition * 6.0 - vec3(t * 2.0));
    float noise = n1 * 0.5 + n2 * 0.2 + 0.5;

    // Blend texture with noise-driven color variation
    vec3 darkVariation = texColor * 0.6;
    vec3 brightVariation = texColor * 1.3;
    
    vec3 color = mix(texColor, darkVariation, smoothstep(0.5, 0.2, noise) * 0.5);
    color = mix(color, brightVariation, smoothstep(0.5, 0.9, noise) * 0.4);

    // Limb Darkening
    vec3 viewDir = normalize(-vViewPosition);
    float ndotv = dot(vNormal, viewDir);
    float limb = smoothstep(0.0, 1.0, ndotv);
    
    color *= (0.3 + 0.7 * limb);

    gl_FragColor = vec4(color, 1.0);
}
