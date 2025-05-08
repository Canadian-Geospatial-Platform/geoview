//This file is automatically rebuilt by the Cesium build process.
export default "precision highp float;\n\
\n\
uniform sampler2D randomTexture;\n\
uniform sampler2D depthTexture;\n\
uniform float intensity;\n\
uniform float bias;\n\
uniform float lengthCap;\n\
uniform int stepCount;\n\
uniform int directionCount;\n\
\n\
vec4 pixelToEye(vec2 screenCoordinate)\n\
{\n\
    vec2 uv = screenCoordinate / czm_viewport.zw;\n\
    float depth = czm_readDepth(depthTexture, uv);\n\
    vec2 xy = 2.0 * uv - vec2(1.0);\n\
    vec4 posEC = czm_inverseProjection * vec4(xy, depth, 1.0);\n\
    posEC = posEC / posEC.w;\n\
    // Avoid numerical error at far plane\n\
    if (depth >= 1.0) {\n\
        posEC.z = czm_currentFrustum.y;\n\
    }\n\
    return posEC;\n\
}\n\
\n\
// Reconstruct surface normal in eye coordinates, avoiding edges\n\
vec3 getNormalXEdge(vec3 positionEC)\n\
{\n\
    // Find the 3D surface positions at adjacent screen pixels\n\
    vec2 centerCoord = gl_FragCoord.xy;\n\
    vec3 positionLeft = pixelToEye(centerCoord + vec2(-1.0, 0.0)).xyz;\n\
    vec3 positionRight = pixelToEye(centerCoord + vec2(1.0, 0.0)).xyz;\n\
    vec3 positionUp = pixelToEye(centerCoord + vec2(0.0, 1.0)).xyz;\n\
    vec3 positionDown = pixelToEye(centerCoord + vec2(0.0, -1.0)).xyz;\n\
\n\
    // Compute potential tangent vectors\n\
    vec3 dx0 = positionEC - positionLeft;\n\
    vec3 dx1 = positionRight - positionEC;\n\
    vec3 dy0 = positionEC - positionDown;\n\
    vec3 dy1 = positionUp - positionEC;\n\
\n\
    // The shorter tangent is more likely to be on the same surface\n\
    vec3 dx = length(dx0) < length(dx1) ? dx0 : dx1;\n\
    vec3 dy = length(dy0) < length(dy1) ? dy0 : dy1;\n\
\n\
    return normalize(cross(dx, dy));\n\
}\n\
\n\
const float sqrtTwoPi = sqrt(czm_twoPi);\n\
\n\
float gaussian(float x, float standardDeviation) {\n\
    float argument = x / standardDeviation;\n\
    return exp(-0.5 * argument * argument) / (sqrtTwoPi * standardDeviation);\n\
}\n\
\n\
void main(void)\n\
{\n\
    vec4 positionEC = pixelToEye(gl_FragCoord.xy);\n\
\n\
    // Exit if we are too close to the back of the frustum, where the depth value is invalid.\n\
    float maxValidDepth = czm_currentFrustum.y - lengthCap;\n\
    if (-positionEC.z > maxValidDepth)\n\
    {\n\
        out_FragColor = vec4(1.0);\n\
        return;\n\
    }\n\
\n\
    vec3 normalEC = getNormalXEdge(positionEC.xyz);\n\
    float gaussianVariance = lengthCap * sqrt(-positionEC.z);\n\
    // Choose a step length such that the marching stops just before 3 * variance.\n\
    float stepLength = 3.0 * gaussianVariance / (float(stepCount) + 1.0);\n\
    float metersPerPixel = czm_metersPerPixel(positionEC, 1.0);\n\
    // Minimum step is 1 pixel to avoid double sampling\n\
    float pixelsPerStep = max(stepLength / metersPerPixel, 1.0);\n\
    stepLength = pixelsPerStep * metersPerPixel;\n\
\n\
    float angleStepScale = 1.0 / float(directionCount);\n\
    float angleStep = angleStepScale * czm_twoPi;\n\
    float cosStep = cos(angleStep);\n\
    float sinStep = sin(angleStep);\n\
    mat2 rotateStep = mat2(cosStep, sinStep, -sinStep, cosStep);\n\
\n\
    // Initial sampling direction (different for each pixel)\n\
    const float randomTextureSize = 255.0;\n\
    vec2 randomTexCoord = fract(gl_FragCoord.xy / randomTextureSize);\n\
    float randomVal = texture(randomTexture, randomTexCoord).x;\n\
    vec2 sampleDirection = vec2(cos(angleStep * randomVal), sin(angleStep * randomVal));\n\
\n\
    float ao = 0.0;\n\
    // Loop over sampling directions\n\
#if __VERSION__ == 300\n\
    for (int i = 0; i < directionCount; i++)\n\
    {\n\
#else\n\
    for (int i = 0; i < 16; i++)\n\
    {\n\
        if (i >= directionCount) {\n\
            break;\n\
        }\n\
#endif\n\
        sampleDirection = rotateStep * sampleDirection;\n\
\n\
        float localAO = 0.0;\n\
        vec2 radialStep = pixelsPerStep * sampleDirection;\n\
\n\
#if __VERSION__ == 300\n\
        for (int j = 0; j < stepCount; j++)\n\
        {\n\
#else\n\
        for (int j = 0; j < 64; j++)\n\
        {\n\
            if (j >= stepCount) {\n\
                break;\n\
            }\n\
#endif\n\
            // Step along sampling direction, away from output pixel\n\
            vec2 samplePixel = floor(gl_FragCoord.xy + float(j + 1) * radialStep) + vec2(0.5);\n\
\n\
            // Exit if we stepped off the screen\n\
            if (clamp(samplePixel, vec2(0.0), czm_viewport.zw) != samplePixel) {\n\
                break;\n\
            }\n\
\n\
            // Compute step vector from output point to sampled point\n\
            vec4 samplePositionEC = pixelToEye(samplePixel);\n\
            vec3 stepVector = samplePositionEC.xyz - positionEC.xyz;\n\
\n\
            // Estimate the angle from the surface normal.\n\
            float dotVal = clamp(dot(normalEC, normalize(stepVector)), 0.0, 1.0);\n\
            dotVal = czm_branchFreeTernary(dotVal > bias, dotVal, 0.0);\n\
            dotVal = czm_branchFreeTernary(-samplePositionEC.z <= maxValidDepth, dotVal, 0.0);\n\
\n\
            // Weight contribution based on the distance from the output point\n\
            float sampleDistance = length(stepVector);\n\
            float weight = gaussian(sampleDistance, gaussianVariance);\n\
            localAO += weight * dotVal;\n\
        }\n\
        ao += localAO;\n\
    }\n\
\n\
    ao *= angleStepScale * stepLength;\n\
    ao = 1.0 - clamp(ao, 0.0, 1.0);\n\
    ao = pow(ao, intensity);\n\
    out_FragColor = vec4(vec3(ao), 1.0);\n\
}\n\
";
