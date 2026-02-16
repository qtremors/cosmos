uniform float uTime;
uniform vec3 uCamPos;

varying vec2 vUv;

#define MAX_DIST 100.0

float hash(float n) { 
    return fract(sin(n) * 43758.5453123); 
}

float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    
    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; ++i) {
        v += a * noise(p);
        p = p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    vec3 ro = uCamPos;

    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 zAxis = normalize(target - ro);
    vec3 xAxis = normalize(cross(vec3(0.0, 1.0, 0.0), zAxis));
    if (length(xAxis) < 0.001) {
        xAxis = normalize(cross(vec3(0.0, 0.0, 1.0), zAxis));
    }
    vec3 yAxis = cross(zAxis, xAxis);
    mat3 camRot = mat3(xAxis, yAxis, zAxis);
    vec3 rd = camRot * normalize(vec3(uv, 2.0));

    vec3 col = vec3(0.0);
    float glow = 0.0;
    float totalAccretion = 0.0;

    vec3 p = ro;
    float d = 0.0;

    // Black hole parameters
    float accretionMin = 3.0;
    float accretionMax = 14.0;
    
    // Boost brightness when viewing from top/bottom (camera Y dominates)
    float camYRatio = abs(ro.y) / length(ro);
    float topViewBoost = 1.0 + camYRatio * 2.5;  // Up to 3.5x brighter from directly above

    for(int i = 0; i < 150; i++) {
        float distToCenter = length(p);
        
        // Core area
        if (distToCenter < 2.5) {
            break;
        }

        // Gravitational Lensing
        vec3 toCenter = normalize(-p);
        float bendStrength = 0.15 / (distToCenter * distToCenter);
        rd = normalize(rd + toCenter * bendStrength);

        // Accretion Disk
        float planeDist = abs(p.y);
        
        if (distToCenter > accretionMin && distToCenter < accretionMax && planeDist < 0.6) {
            float r = distToCenter;
            float angle = atan(p.z, p.x);
            
            // Keplerian rotation
            float rotSpeed = 3.0 / r;
            float animAngle = angle + uTime * rotSpeed;
            
            // Multi-layer turbulence for detail
            vec3 noisePos1 = vec3(r * 2.0, animAngle * 3.0, uTime * 0.1);
            vec3 noisePos2 = vec3(r * 4.0, animAngle * 6.0, uTime * 0.15);
            float density = fbm(noisePos1) * 0.7 + fbm(noisePos2) * 0.3;
            
            float fade = smoothstep(accretionMax, accretionMax - 3.0, r) * smoothstep(accretionMin, accretionMin + 1.5, r);
            float verticalFade = smoothstep(0.5, 0.0, planeDist);
            
            float intensity = density * fade * verticalFade;

            // Doppler colors
            float doppler = dot(normalize(cross(vec3(0.0, 1.0, 0.0), p)), normalize(ro - p));
            vec3 coolColor = vec3(1.0, 0.4, 0.1);
            vec3 hotColor = vec3(0.3, 0.6, 1.0);
            vec3 diskColor = mix(coolColor, hotColor, smoothstep(-0.5, 0.5, doppler));
            
            // Accumulation
            totalAccretion += intensity * 0.15 * topViewBoost;
            col += diskColor * intensity * 0.2 * topViewBoost * (1.0 - min(glow, 1.0));
        }
        
        // Glow
        float glowContrib = 1.0 / (distToCenter * distToCenter * 25.0 * max(abs(p.y), 0.05) + 0.05);
        glow += glowContrib;

        float stepSize = max(0.04, distToCenter * 0.04); 
        p += rd * stepSize;
        d += stepSize;
        
        if(d > MAX_DIST) break;
    }

    // Glow
    col += vec3(1.0, 0.7, 0.4) * glow * 0.05;
    col = 1.0 - exp(-col * 1.8);
    
    // Circular mask
    float distFromCenter = length(uv);
    float circleMask = 1.0 - smoothstep(0.85, 1.0, distFromCenter);
    
    // Alpha
    float alpha = circleMask * max(totalAccretion * 2.0, glow * 0.15);
    alpha = min(alpha, 1.0);
    
    gl_FragColor = vec4(col, alpha);
}
