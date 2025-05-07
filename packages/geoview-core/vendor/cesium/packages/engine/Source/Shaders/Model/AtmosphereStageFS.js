//This file is automatically rebuilt by the Cesium build process.
export default "// robust iterative solution without trig functions\n\
// https://github.com/0xfaded/ellipse_demo/issues/1\n\
// https://stackoverflow.com/questions/22959698/distance-from-given-point-to-given-ellipse\n\
//\n\
// This version uses only a single iteration for best performance. For fog\n\
// rendering, the difference is negligible.\n\
vec2 nearestPointOnEllipseFast(vec2 pos, vec2 radii) {\n\
    vec2 p = abs(pos);\n\
    vec2 inverseRadii = 1.0 / radii;\n\
    vec2 evoluteScale = (radii.x * radii.x - radii.y * radii.y) * vec2(1.0, -1.0) * inverseRadii;\n\
\n\
    // We describe the ellipse parametrically: v = radii * vec2(cos(t), sin(t))\n\
    // but store the cos and sin of t in a vec2 for efficiency.\n\
    // Initial guess: t = cos(pi/4)\n\
    vec2 tTrigs = vec2(0.70710678118);\n\
    vec2 v = radii * tTrigs;\n\
\n\
    // Find the evolute of the ellipse (center of curvature) at v.\n\
    vec2 evolute = evoluteScale * tTrigs * tTrigs * tTrigs;\n\
    // Find the (approximate) intersection of p - evolute with the ellipsoid.\n\
    vec2 q = normalize(p - evolute) * length(v - evolute);\n\
    // Update the estimate of t.\n\
    tTrigs = (q + evolute) * inverseRadii;\n\
    tTrigs = normalize(clamp(tTrigs, 0.0, 1.0));\n\
    v = radii * tTrigs;\n\
\n\
    return v * sign(pos);\n\
}\n\
\n\
vec3 computeEllipsoidPositionWC(vec3 positionMC) {\n\
    // Get the world-space position and project onto a meridian plane of\n\
    // the ellipsoid\n\
    vec3 positionWC = (czm_model * vec4(positionMC, 1.0)).xyz;\n\
\n\
    vec2 positionEllipse = vec2(length(positionWC.xy), positionWC.z);\n\
    vec2 nearestPoint = nearestPointOnEllipseFast(positionEllipse, czm_ellipsoidRadii.xz);\n\
\n\
    // Reconstruct a 3D point in world space\n\
    return vec3(nearestPoint.x * normalize(positionWC.xy), nearestPoint.y);\n\
}\n\
\n\
void applyFog(inout vec4 color, vec4 groundAtmosphereColor, vec3 lightDirection, float distanceToCamera) {\n\
\n\
    vec3 fogColor = groundAtmosphereColor.rgb;\n\
\n\
    // If there is dynamic lighting, apply that to the fog.\n\
    const float NONE = 0.0;\n\
    if (czm_atmosphereDynamicLighting != NONE) {\n\
        float darken = clamp(dot(normalize(czm_viewerPositionWC), lightDirection), czm_fogMinimumBrightness, 1.0);\n\
        fogColor *= darken;\n\
    }\n\
\n\
    // Tonemap if HDR rendering is disabled\n\
    #ifndef HDR\n\
        fogColor.rgb = czm_pbrNeutralTonemapping(fogColor.rgb);\n\
        fogColor.rgb = czm_inverseGamma(fogColor.rgb);\n\
    #endif\n\
\n\
    vec3 withFog = czm_fog(distanceToCamera, color.rgb, fogColor, czm_fogVisualDensityScalar);\n\
    color = vec4(withFog, color.a);\n\
}\n\
\n\
void atmosphereStage(inout vec4 color, in ProcessedAttributes attributes) {\n\
    vec3 rayleighColor;\n\
    vec3 mieColor;\n\
    float opacity;\n\
\n\
    vec3 positionWC;\n\
    vec3 lightDirection;\n\
\n\
    // When the camera is in space, compute the position per-fragment for\n\
    // more accurate ground atmosphere. All other cases will use\n\
    //\n\
    // The if condition will be added in https://github.com/CesiumGS/cesium/issues/11717\n\
    if (false) {\n\
        positionWC = computeEllipsoidPositionWC(attributes.positionMC);\n\
        lightDirection = czm_getDynamicAtmosphereLightDirection(positionWC, czm_atmosphereDynamicLighting);\n\
\n\
        // The fog color is derived from the ground atmosphere color\n\
        czm_computeGroundAtmosphereScattering(\n\
            positionWC,\n\
            lightDirection,\n\
            rayleighColor,\n\
            mieColor,\n\
            opacity\n\
        );\n\
    } else {\n\
        positionWC = attributes.positionWC;\n\
        lightDirection = czm_getDynamicAtmosphereLightDirection(positionWC, czm_atmosphereDynamicLighting);\n\
        rayleighColor = v_atmosphereRayleighColor;\n\
        mieColor = v_atmosphereMieColor;\n\
        opacity = v_atmosphereOpacity;\n\
    }\n\
\n\
    //color correct rayleigh and mie colors\n\
    const bool ignoreBlackPixels = true;\n\
    rayleighColor = czm_applyHSBShift(rayleighColor, czm_atmosphereHsbShift, ignoreBlackPixels);\n\
    mieColor = czm_applyHSBShift(mieColor, czm_atmosphereHsbShift, ignoreBlackPixels);\n\
\n\
    vec4 groundAtmosphereColor = czm_computeAtmosphereColor(positionWC, lightDirection, rayleighColor, mieColor, opacity);\n\
\n\
    if (u_isInFog) {\n\
        float distanceToCamera = length(attributes.positionEC);\n\
        applyFog(color, groundAtmosphereColor, lightDirection, distanceToCamera);\n\
    } else {\n\
        // Ground atmosphere\n\
    }\n\
}\n\
";
