//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Select which direction vector to use for dynamic atmosphere lighting based on an enum value\n\
 *\n\
 * @name czm_getDynamicAtmosphereLightDirection\n\
 * @glslfunction\n\
 * @see DynamicAtmosphereLightingType.js\n\
 *\n\
 * @param {vec3} positionWC the position of the vertex/fragment in world coordinates. This is normalized and returned when dynamic lighting is turned off.\n\
 * @param {float} lightEnum The enum value for selecting between light sources.\n\
 * @return {vec3} The normalized light direction vector. Depending on the enum value, it is either positionWC, czm_lightDirectionWC or czm_sunDirectionWC\n\
 */\n\
vec3 czm_getDynamicAtmosphereLightDirection(vec3 positionWC, float lightEnum) {\n\
    const float NONE = 0.0;\n\
    const float SCENE_LIGHT = 1.0;\n\
    const float SUNLIGHT = 2.0;\n\
\n\
    vec3 lightDirection =\n\
        positionWC * float(lightEnum == NONE) +\n\
        czm_lightDirectionWC * float(lightEnum == SCENE_LIGHT) +\n\
        czm_sunDirectionWC * float(lightEnum == SUNLIGHT);\n\
    return normalize(lightDirection);\n\
}\n\
";
