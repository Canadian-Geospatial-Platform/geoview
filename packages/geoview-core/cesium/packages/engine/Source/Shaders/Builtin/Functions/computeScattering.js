//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * This function computes the colors contributed by Rayliegh and Mie scattering on a given ray, as well as\n\
 * the transmittance value for the ray. This function uses automatic uniforms\n\
 * so the atmosphere settings are always synced with the current scene.\n\
 *\n\
 * @name czm_computeScattering\n\
 * @glslfunction\n\
 *\n\
 * @param {czm_ray} primaryRay The ray from the camera to the position.\n\
 * @param {float} primaryRayLength The length of the primary ray.\n\
 * @param {vec3} lightDirection The direction of the light to calculate the scattering from.\n\
 * @param {vec3} rayleighColor The variable the Rayleigh scattering will be written to.\n\
 * @param {vec3} mieColor The variable the Mie scattering will be written to.\n\
 * @param {float} opacity The variable the transmittance will be written to.\n\
 */\n\
void czm_computeScattering(\n\
    czm_ray primaryRay,\n\
    float primaryRayLength,\n\
    vec3 lightDirection,\n\
    float atmosphereInnerRadius,\n\
    out vec3 rayleighColor,\n\
    out vec3 mieColor,\n\
    out float opacity\n\
) {\n\
    const float ATMOSPHERE_THICKNESS = 111e3; // The thickness of the atmosphere in meters.\n\
    const int PRIMARY_STEPS_MAX = 16; // Maximum number of times the ray from the camera to the world position (primary ray) is sampled.\n\
    const int LIGHT_STEPS_MAX = 4; // Maximum number of times the light is sampled from the light source's intersection with the atmosphere to a sample position on the primary ray.\n\
\n\
    // Initialize the default scattering amounts to 0.\n\
    rayleighColor = vec3(0.0);\n\
    mieColor = vec3(0.0);\n\
    opacity = 0.0;\n\
\n\
    float atmosphereOuterRadius = atmosphereInnerRadius + ATMOSPHERE_THICKNESS;\n\
\n\
    vec3 origin = vec3(0.0);\n\
\n\
    // Calculate intersection from the camera to the outer ring of the atmosphere.\n\
    czm_raySegment primaryRayAtmosphereIntersect = czm_raySphereIntersectionInterval(primaryRay, origin, atmosphereOuterRadius);\n\
\n\
    // Return empty colors if no intersection with the atmosphere geometry.\n\
    if (primaryRayAtmosphereIntersect == czm_emptyRaySegment) {\n\
        return;\n\
    }\n\
\n\
    // To deal with smaller values of PRIMARY_STEPS (e.g. 4)\n\
    // we implement a split strategy: sky or horizon.\n\
    // For performance reasons, instead of a if/else branch\n\
    // a soft choice is implemented through a weight 0.0 <= w_stop_gt_lprl <= 1.0\n\
    float x = 1e-7 * primaryRayAtmosphereIntersect.stop / length(primaryRayLength);\n\
    // Value close to 0.0: close to the horizon\n\
    // Value close to 1.0: above in the sky\n\
    float w_stop_gt_lprl = 0.5 * (1.0 + czm_approximateTanh(x));\n\
\n\
    // The ray should start from the first intersection with the outer atmopshere, or from the camera position, if it is inside the atmosphere.\n\
    float start_0 = primaryRayAtmosphereIntersect.start;\n\
    primaryRayAtmosphereIntersect.start = max(primaryRayAtmosphereIntersect.start, 0.0);\n\
    // The ray should end at the exit from the atmosphere or at the distance to the vertex, whichever is smaller.\n\
    primaryRayAtmosphereIntersect.stop = min(primaryRayAtmosphereIntersect.stop, length(primaryRayLength));\n\
\n\
    // For the number of ray steps, distinguish inside or outside atmosphere (outer space)\n\
    // (1) from outer space we have to use more ray steps to get a realistic rendering\n\
    // (2) within atmosphere we need fewer steps for faster rendering\n\
    float x_o_a = start_0 - ATMOSPHERE_THICKNESS; // ATMOSPHERE_THICKNESS used as an ad-hoc constant, no precise meaning here, only the order of magnitude matters\n\
    float w_inside_atmosphere = 1.0 - 0.5 * (1.0 + czm_approximateTanh(x_o_a));\n\
    int PRIMARY_STEPS = PRIMARY_STEPS_MAX - int(w_inside_atmosphere * 12.0); // Number of times the ray from the camera to the world position (primary ray) is sampled.\n\
    int LIGHT_STEPS = LIGHT_STEPS_MAX - int(w_inside_atmosphere * 2.0); // Number of times the light is sampled from the light source's intersection with the atmosphere to a sample position on the primary ray.\n\
\n\
    // Setup for sampling positions along the ray - starting from the intersection with the outer ring of the atmosphere.\n\
    float rayPositionLength = primaryRayAtmosphereIntersect.start;\n\
    // (1) Outside the atmosphere: constant rayStepLength\n\
    // (2) Inside atmosphere: variable rayStepLength to compensate the rough rendering of the smaller number of ray steps\n\
    float totalRayLength = primaryRayAtmosphereIntersect.stop - rayPositionLength;\n\
    float rayStepLengthIncrease = w_inside_atmosphere * ((1.0 - w_stop_gt_lprl) * totalRayLength / (float(PRIMARY_STEPS * (PRIMARY_STEPS + 1)) / 2.0));\n\
    float rayStepLength = max(1.0 - w_inside_atmosphere, w_stop_gt_lprl) * totalRayLength / max(7.0 * w_inside_atmosphere, float(PRIMARY_STEPS));\n\
\n\
    vec3 rayleighAccumulation = vec3(0.0);\n\
    vec3 mieAccumulation = vec3(0.0);\n\
    vec2 opticalDepth = vec2(0.0);\n\
    vec2 heightScale = vec2(czm_atmosphereRayleighScaleHeight, czm_atmosphereMieScaleHeight);\n\
\n\
    // Sample positions on the primary ray.\n\
    for (int i = 0; i < PRIMARY_STEPS_MAX; ++i) {\n\
\n\
        // The loop should be: for (int i = 0; i < PRIMARY_STEPS; ++i) {...} but WebGL1 cannot\n\
        // loop with non-constant condition, so it has to break early instead\n\
        if (i >= PRIMARY_STEPS) {\n\
            break;\n\
        }\n\
\n\
        // Calculate sample position along viewpoint ray.\n\
        vec3 samplePosition = primaryRay.origin + primaryRay.direction * (rayPositionLength + rayStepLength);\n\
\n\
        // Calculate height of sample position above ellipsoid.\n\
        float sampleHeight = length(samplePosition) - atmosphereInnerRadius;\n\
\n\
        // Calculate and accumulate density of particles at the sample position.\n\
        vec2 sampleDensity = exp(-sampleHeight / heightScale) * rayStepLength;\n\
        opticalDepth += sampleDensity;\n\
\n\
        // Generate ray from the sample position segment to the light source, up to the outer ring of the atmosphere.\n\
        czm_ray lightRay = czm_ray(samplePosition, lightDirection);\n\
        czm_raySegment lightRayAtmosphereIntersect = czm_raySphereIntersectionInterval(lightRay, origin, atmosphereOuterRadius);\n\
\n\
        float lightStepLength = lightRayAtmosphereIntersect.stop / float(LIGHT_STEPS);\n\
        float lightPositionLength = 0.0;\n\
\n\
        vec2 lightOpticalDepth = vec2(0.0);\n\
\n\
        // Sample positions along the light ray, to accumulate incidence of light on the latest sample segment.\n\
        for (int j = 0; j < LIGHT_STEPS_MAX; ++j) {\n\
\n\
            // The loop should be: for (int j = 0; i < LIGHT_STEPS; ++j) {...} but WebGL1 cannot\n\
            // loop with non-constant condition, so it has to break early instead\n\
            if (j >= LIGHT_STEPS) {\n\
                break;\n\
            }\n\
\n\
            // Calculate sample position along light ray.\n\
            vec3 lightPosition = samplePosition + lightDirection * (lightPositionLength + lightStepLength * 0.5);\n\
\n\
            // Calculate height of the light sample position above ellipsoid.\n\
            float lightHeight = length(lightPosition) - atmosphereInnerRadius;\n\
\n\
            // Calculate density of photons at the light sample position.\n\
            lightOpticalDepth += exp(-lightHeight / heightScale) * lightStepLength;\n\
\n\
            // Increment distance on light ray.\n\
            lightPositionLength += lightStepLength;\n\
        }\n\
\n\
        // Compute attenuation via the primary ray and the light ray.\n\
        vec3 attenuation = exp(-((czm_atmosphereMieCoefficient * (opticalDepth.y + lightOpticalDepth.y)) + (czm_atmosphereRayleighCoefficient * (opticalDepth.x + lightOpticalDepth.x))));\n\
\n\
        // Accumulate the scattering.\n\
        rayleighAccumulation += sampleDensity.x * attenuation;\n\
        mieAccumulation += sampleDensity.y * attenuation;\n\
\n\
        // Increment distance on primary ray.\n\
        rayPositionLength += (rayStepLength += rayStepLengthIncrease);\n\
    }\n\
\n\
    // Compute the scattering amount.\n\
    rayleighColor = czm_atmosphereRayleighCoefficient * rayleighAccumulation;\n\
    mieColor = czm_atmosphereMieCoefficient * mieAccumulation;\n\
\n\
    // Compute the transmittance i.e. how much light is passing through the atmosphere.\n\
    opacity = length(exp(-((czm_atmosphereMieCoefficient * opticalDepth.y) + (czm_atmosphereRayleighCoefficient * opticalDepth.x))));\n\
}\n\
";
