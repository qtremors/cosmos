#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 uSunPos;
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    #include <logdepthbuf_fragment>
    
    // Sample textures
    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
    
    // Lighting
    vec3 lightDir = normalize(uSunPos - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Smooth transition between day and night
    float nightBlend = smoothstep(-0.1, 0.2, -diff + 0.1);
    
    // Day is lit, night shows city lights
    vec3 col = mix(dayColor * (diff + 0.05), nightColor * 1.5, nightBlend);
    
    // Specular (Ocean reflection - rough approximation)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    // Only apply specular where there's water (darker areas in day texture)
    float waterMask = 1.0 - smoothstep(0.1, 0.4, length(dayColor));
    col += vec3(spec) * waterMask * 0.5 * diff;
    
    // Atmosphere Rim
    float rim = 1.0 - dot(normal, normalize(cameraPosition - vWorldPosition));
    rim = clamp(pow(rim, 4.0), 0.0, 1.0);
    vec3 cAtmo = vec3(0.2, 0.4, 0.8);
    col += cAtmo * rim * 0.5 * max(diff, 0.1);

    gl_FragColor = vec4(col, 1.0);
}
