//This file is automatically rebuilt by the Cesium build process.
export default "#ifdef USE_IBL_LIGHTING\n\
vec3 computeIBL(vec3 position, vec3 normal, vec3 lightDirection, vec3 lightColorHdr, czm_modelMaterial material)\n\
{\n\
    #if defined(DIFFUSE_IBL) || defined(SPECULAR_IBL)\n\
        // Environment maps were provided, use them for IBL\n\
        vec3 viewDirection = -normalize(position);\n\
        vec3 iblColor = textureIBL(viewDirection, normal, material);\n\
        return iblColor;\n\
    #endif\n\
    \n\
    return vec3(0.0);\n\
}\n\
#endif\n\
\n\
#ifdef USE_CLEARCOAT\n\
vec3 addClearcoatReflection(vec3 baseLayerColor, vec3 position, vec3 lightDirection, vec3 lightColorHdr, czm_modelMaterial material)\n\
{\n\
    vec3 viewDirection = -normalize(position);\n\
    vec3 halfwayDirection = normalize(viewDirection + lightDirection);\n\
    vec3 normal = material.clearcoatNormal;\n\
    float NdotL = clamp(dot(normal, lightDirection), 0.001, 1.0);\n\
\n\
    // clearcoatF0 = vec3(pow((ior - 1.0) / (ior + 1.0), 2.0)), but without KHR_materials_ior, ior is a constant 1.5.\n\
    vec3 f0 = vec3(0.04);\n\
    vec3 f90 = vec3(1.0);\n\
    // Note: clearcoat Fresnel computed with dot(n, v) instead of dot(v, h).\n\
    // This is to make it energy conserving with a simple layering function.\n\
    float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);\n\
    vec3 F = fresnelSchlick2(f0, f90, NdotV);\n\
\n\
    // compute specular reflection from direct lighting\n\
    float roughness = material.clearcoatRoughness;\n\
    float alphaRoughness = roughness * roughness;\n\
    float directStrength = computeDirectSpecularStrength(normal, lightDirection, viewDirection, halfwayDirection, alphaRoughness);\n\
    vec3 directReflection = F * directStrength * NdotL;\n\
    vec3 color = lightColorHdr * directReflection;\n\
\n\
    #ifdef SPECULAR_IBL\n\
        // Find the direction in which to sample the environment map\n\
        vec3 reflectMC = normalize(model_iblReferenceFrameMatrix * reflect(-viewDirection, normal));\n\
        vec3 iblColor = computeSpecularIBL(reflectMC, NdotV, f0, roughness);\n\
        color += iblColor * material.occlusion;\n\
    #endif\n\
\n\
    float clearcoatFactor = material.clearcoatFactor;\n\
    vec3 clearcoatColor = color * clearcoatFactor;\n\
\n\
    // Dim base layer based on transmission loss through clearcoat\n\
    return baseLayerColor * (1.0 - clearcoatFactor * F) + clearcoatColor;\n\
}\n\
#endif\n\
\n\
#if defined(LIGHTING_PBR) && defined(HAS_NORMALS)\n\
vec3 computePbrLighting(in czm_modelMaterial material, in vec3 position)\n\
{\n\
    #ifdef USE_CUSTOM_LIGHT_COLOR\n\
        vec3 lightColorHdr = model_lightColorHdr;\n\
    #else\n\
        vec3 lightColorHdr = czm_lightColorHdr;\n\
    #endif\n\
\n\
    vec3 viewDirection = -normalize(position);\n\
    vec3 normal = material.normalEC;\n\
    vec3 lightDirection = normalize(czm_lightDirectionEC);\n\
\n\
    vec3 directLighting = czm_pbrLighting(viewDirection, normal, lightDirection, material);\n\
    vec3 directColor = lightColorHdr * directLighting;\n\
\n\
    // Accumulate colors from base layer\n\
    vec3 color = directColor + material.emissive;\n\
    #ifdef USE_IBL_LIGHTING\n\
        color += computeIBL(position, normal, lightDirection, lightColorHdr, material);\n\
    #endif\n\
\n\
    #ifdef USE_CLEARCOAT\n\
        color = addClearcoatReflection(color, position, lightDirection, lightColorHdr, material);\n\
    #endif\n\
\n\
    return color;\n\
}\n\
#endif\n\
\n\
/**\n\
 * Compute the material color under the current lighting conditions.\n\
 * All other material properties are passed through so further stages\n\
 * have access to them.\n\
 *\n\
 * @param {czm_modelMaterial} material The material properties from {@MaterialStageFS}\n\
 * @param {ProcessedAttributes} attributes\n\
 */\n\
void lightingStage(inout czm_modelMaterial material, ProcessedAttributes attributes)\n\
{\n\
    #ifdef LIGHTING_PBR\n\
        #ifdef HAS_NORMALS\n\
            vec3 color = computePbrLighting(material, attributes.positionEC);\n\
        #else\n\
            vec3 color = material.diffuse * material.occlusion + material.emissive;\n\
        #endif\n\
        // In HDR mode, the frame buffer is in linear color space. The\n\
        // post-processing stages (see PostProcessStageCollection) will handle\n\
        // tonemapping. However, if HDR is not enabled, we must tonemap else large\n\
        // values may be clamped to 1.0\n\
        #ifndef HDR\n\
            color = czm_pbrNeutralTonemapping(color);\n\
        #endif\n\
    #else // unlit\n\
        vec3 color = material.diffuse;\n\
    #endif\n\
\n\
    #ifdef HAS_POINT_CLOUD_COLOR_STYLE\n\
        // The colors resulting from point cloud styles are adjusted differently.\n\
        color = czm_gammaCorrect(color);\n\
    #elif !defined(HDR)\n\
        // If HDR is not enabled, the frame buffer stores sRGB colors rather than\n\
        // linear colors so the linear value must be converted.\n\
        color = czm_linearToSrgb(color);\n\
    #endif\n\
\n\
    material.diffuse = color;\n\
}\n\
";
