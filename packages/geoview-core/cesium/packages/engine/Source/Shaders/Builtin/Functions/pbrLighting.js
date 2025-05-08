//This file is automatically rebuilt by the Cesium build process.
export default "vec3 lambertianDiffuse(vec3 diffuseColor)\n\
{\n\
    return diffuseColor / czm_pi;\n\
}\n\
\n\
vec3 fresnelSchlick2(vec3 f0, vec3 f90, float VdotH)\n\
{\n\
    float versine = 1.0 - VdotH;\n\
    // pow(versine, 5.0) is slow. See https://stackoverflow.com/a/68793086/10082269\n\
    float versineSquared = versine * versine;\n\
    return f0 + (f90 - f0) * versineSquared * versineSquared * versine;\n\
}\n\
\n\
#ifdef USE_ANISOTROPY\n\
/**\n\
 * @param {float} bitangentRoughness Material roughness (along the anisotropy bitangent)\n\
 * @param {float} tangentialRoughness Anisotropic roughness (along the anisotropy tangent)\n\
 * @param {vec3} lightDirection The direction from the fragment to the light source, transformed to tangent-bitangent-normal coordinates\n\
 * @param {vec3} viewDirection The direction from the fragment to the camera, transformed to tangent-bitangent-normal coordinates\n\
 */\n\
float smithVisibilityGGX_anisotropic(float bitangentRoughness, float tangentialRoughness, vec3 lightDirection, vec3 viewDirection)\n\
{\n\
    vec3 roughnessScale = vec3(tangentialRoughness, bitangentRoughness, 1.0);\n\
    float GGXV = lightDirection.z * length(roughnessScale * viewDirection);\n\
    float GGXL = viewDirection.z * length(roughnessScale * lightDirection);\n\
    float v = 0.5 / (GGXV + GGXL);\n\
    return clamp(v, 0.0, 1.0);\n\
}\n\
\n\
/**\n\
 * @param {float} bitangentRoughness Material roughness (along the anisotropy bitangent)\n\
 * @param {float} tangentialRoughness Anisotropic roughness (along the anisotropy tangent)\n\
 * @param {vec3} halfwayDirection The unit vector halfway between light and view directions, transformed to tangent-bitangent-normal coordinates\n\
 */\n\
float GGX_anisotropic(float bitangentRoughness, float tangentialRoughness, vec3 halfwayDirection)\n\
{\n\
    float roughnessSquared = bitangentRoughness * tangentialRoughness;\n\
    vec3 f = halfwayDirection * vec3(bitangentRoughness, tangentialRoughness, roughnessSquared);\n\
    float w2 = roughnessSquared / dot(f, f);\n\
    return roughnessSquared * w2 * w2 / czm_pi;\n\
}\n\
#endif\n\
\n\
/**\n\
 * Estimate the geometric self-shadowing of the microfacets in a surface,\n\
 * using the Smith Joint GGX visibility function.\n\
 * Note: Vis = G / (4 * NdotL * NdotV)\n\
 * see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3\n\
 * see Real-Time Rendering. Page 331 to 336.\n\
 * see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)\n\
 *\n\
 * @param {float} alphaRoughness The roughness of the material, expressed as the square of perceptual roughness.\n\
 * @param {float} NdotL The cosine of the angle between the surface normal and the direction to the light source.\n\
 * @param {float} NdotV The cosine of the angle between the surface normal and the direction to the camera.\n\
 */\n\
float smithVisibilityGGX(float alphaRoughness, float NdotL, float NdotV)\n\
{\n\
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;\n\
\n\
    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);\n\
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);\n\
\n\
    float GGX = GGXV + GGXL;\n\
    if (GGX > 0.0)\n\
    {\n\
        return 0.5 / GGX;\n\
    }\n\
    return 0.0;\n\
}\n\
\n\
/**\n\
 * Estimate the fraction of the microfacets in a surface that are aligned with \n\
 * the halfway vector, which is aligned halfway between the directions from\n\
 * the fragment to the camera and from the fragment to the light source.\n\
 *\n\
 * @param {float} alphaRoughness The roughness of the material, expressed as the square of perceptual roughness.\n\
 * @param {float} NdotH The cosine of the angle between the surface normal and the halfway vector.\n\
 * @return {float} The fraction of microfacets aligned to the halfway vector.\n\
 */\n\
float GGX(float alphaRoughness, float NdotH)\n\
{\n\
    float alphaRoughnessSquared = alphaRoughness * alphaRoughness;\n\
    float f = (NdotH * alphaRoughnessSquared - NdotH) * NdotH + 1.0;\n\
    return alphaRoughnessSquared / (czm_pi * f * f);\n\
}\n\
\n\
/**\n\
 * Compute the strength of the specular reflection due to direct lighting.\n\
 *\n\
 * @param {vec3} normal The surface normal.\n\
 * @param {vec3} lightDirection The unit vector pointing from the fragment to the light source.\n\
 * @param {vec3} viewDirection The unit vector pointing from the fragment to the camera.\n\
 * @param {vec3} halfwayDirection The unit vector pointing from the fragment to halfway between the light source and the camera.\n\
 * @param {float} alphaRoughness The roughness of the material, expressed as the square of perceptual roughness.\n\
 * @return {float} The strength of the specular reflection.\n\
 */\n\
float computeDirectSpecularStrength(vec3 normal, vec3 lightDirection, vec3 viewDirection, vec3 halfwayDirection, float alphaRoughness)\n\
{\n\
    float NdotL = clamp(dot(normal, lightDirection), 0.0, 1.0);\n\
    float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);\n\
    float G = smithVisibilityGGX(alphaRoughness, NdotL, NdotV);\n\
    float NdotH = clamp(dot(normal, halfwayDirection), 0.0, 1.0);\n\
    float D = GGX(alphaRoughness, NdotH);\n\
    return G * D;\n\
}\n\
\n\
/**\n\
 * Compute the diffuse and specular contributions using physically based\n\
 * rendering. This function only handles direct lighting.\n\
 * <p>\n\
 * This function only handles the lighting calculations. Metallic/roughness\n\
 * and specular/glossy must be handled separately. See {@MaterialStageFS}\n\
 * </p>\n\
 *\n\
 * @name czm_pbrLighting\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} viewDirectionEC Unit vector pointing from the fragment to the eye position\n\
 * @param {vec3} normalEC The surface normal in eye coordinates\n\
 * @param {vec3} lightDirectionEC Unit vector pointing to the light source in eye coordinates.\n\
 * @param {czm_modelMaterial} The material properties.\n\
 * @return {vec3} The computed HDR color\n\
 */\n\
vec3 czm_pbrLighting(vec3 viewDirectionEC, vec3 normalEC, vec3 lightDirectionEC, czm_modelMaterial material)\n\
{\n\
    vec3 halfwayDirectionEC = normalize(viewDirectionEC + lightDirectionEC);\n\
    float VdotH = clamp(dot(viewDirectionEC, halfwayDirectionEC), 0.0, 1.0);\n\
    float NdotL = clamp(dot(normalEC, lightDirectionEC), 0.001, 1.0);\n\
\n\
    vec3 f0 = material.specular;\n\
    float reflectance = czm_maximumComponent(f0);\n\
    // Typical dielectrics will have reflectance 0.04, so f90 will be 1.0.\n\
    // In this case, at grazing angle, all incident energy is reflected.\n\
    vec3 f90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));\n\
    vec3 F = fresnelSchlick2(f0, f90, VdotH);\n\
\n\
    #if defined(USE_SPECULAR)\n\
        F *= material.specularWeight;\n\
    #endif\n\
\n\
    float alphaRoughness = material.roughness * material.roughness;\n\
    #ifdef USE_ANISOTROPY\n\
        mat3 tbn = mat3(material.anisotropicT, material.anisotropicB, normalEC);\n\
        vec3 lightDirection = lightDirectionEC * tbn;\n\
        vec3 viewDirection = viewDirectionEC * tbn;\n\
        vec3 halfwayDirection = halfwayDirectionEC * tbn;\n\
        float anisotropyStrength = material.anisotropyStrength;\n\
        float tangentialRoughness = mix(alphaRoughness, 1.0, anisotropyStrength * anisotropyStrength);\n\
        float bitangentRoughness = clamp(alphaRoughness, 0.001, 1.0);\n\
        float G = smithVisibilityGGX_anisotropic(bitangentRoughness, tangentialRoughness, lightDirection, viewDirection);\n\
        float D = GGX_anisotropic(bitangentRoughness, tangentialRoughness, halfwayDirection);\n\
        vec3 specularContribution = F * G * D;\n\
    #else\n\
        float specularStrength = computeDirectSpecularStrength(normalEC, lightDirectionEC, viewDirectionEC, halfwayDirectionEC, alphaRoughness);\n\
        vec3 specularContribution = F * specularStrength;\n\
    #endif\n\
\n\
    vec3 diffuseColor = material.diffuse;\n\
    // F here represents the specular contribution\n\
    vec3 diffuseContribution = (1.0 - F) * lambertianDiffuse(diffuseColor);\n\
\n\
    // Lo = (diffuse + specular) * Li * NdotL\n\
    return (diffuseContribution + specularContribution) * NdotL;\n\
}\n\
";
