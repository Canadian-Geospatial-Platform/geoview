//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Compute atmosphere scattering for the ground atmosphere and fog. This method\n\
 * uses automatic uniforms so it is always synced with the scene settings.\n\
 *\n\
 * @name czm_computeGroundAtmosphereScattering\n\
 * @glslfunction\n\
 *\n\
 * @param {vec3} positionWC The position of the fragment in world coordinates.\n\
 * @param {vec3} lightDirection The direction of the light to calculate the scattering from.\n\
 * @param {vec3} rayleighColor The variable the Rayleigh scattering will be written to.\n\
 * @param {vec3} mieColor The variable the Mie scattering will be written to.\n\
 * @param {float} opacity The variable the transmittance will be written to.\n\
 */\n\
void czm_computeGroundAtmosphereScattering(vec3 positionWC, vec3 lightDirection, out vec3 rayleighColor, out vec3 mieColor, out float opacity) {\n\
    vec3 cameraToPositionWC = positionWC - czm_viewerPositionWC;\n\
    vec3 cameraToPositionWCDirection = normalize(cameraToPositionWC);\n\
    czm_ray primaryRay = czm_ray(czm_viewerPositionWC, cameraToPositionWCDirection);\n\
\n\
    float atmosphereInnerRadius = length(positionWC);\n\
\n\
    czm_computeScattering(\n\
        primaryRay,\n\
        length(cameraToPositionWC),\n\
        lightDirection,\n\
        atmosphereInnerRadius,\n\
        rayleighColor,\n\
        mieColor,\n\
        opacity\n\
    );\n\
}\n\
";
