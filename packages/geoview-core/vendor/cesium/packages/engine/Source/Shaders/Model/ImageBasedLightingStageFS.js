//This file is automatically rebuilt by the Cesium build process.
export default "#ifdef DIFFUSE_IBL\n\
vec3 sampleDiffuseEnvironment(vec3 cubeDir)\n\
{\n\
    #ifdef CUSTOM_SPHERICAL_HARMONICS\n\
        return czm_sphericalHarmonics(cubeDir, model_sphericalHarmonicCoefficients); \n\
    #else\n\
        return czm_sphericalHarmonics(cubeDir, czm_sphericalHarmonicCoefficients); \n\
    #endif\n\
}\n\
#endif\n\
\n\
#ifdef SPECULAR_IBL\n\
vec3 sampleSpecularEnvironment(vec3 cubeDir, float roughness)\n\
{\n\
    #ifdef CUSTOM_SPECULAR_IBL\n\
        float lod = roughness * model_specularEnvironmentMapsMaximumLOD;\n\
        return czm_textureCube(model_specularEnvironmentMaps, cubeDir, lod).rgb;\n\
    #else\n\
        float lod = roughness * czm_specularEnvironmentMapsMaximumLOD;\n\
        return czm_textureCube(czm_specularEnvironmentMaps, cubeDir, lod).rgb;\n\
    #endif\n\
}\n\
vec3 computeSpecularIBL(vec3 cubeDir, float NdotV, vec3 f0, float roughness)\n\
{\n\
    // see https://bruop.github.io/ibl/ at Single Scattering Results\n\
    // Roughness dependent fresnel, from Fdez-Aguera\n\
    vec3 f90 = max(vec3(1.0 - roughness), f0);\n\
    vec3 F = fresnelSchlick2(f0, f90, NdotV);\n\
\n\
    vec2 brdfLut = texture(czm_brdfLut, vec2(NdotV, roughness)).rg;\n\
    vec3 specularSample = sampleSpecularEnvironment(cubeDir, roughness);\n\
\n\
    return specularSample * (F * brdfLut.x + brdfLut.y);\n\
}\n\
#endif\n\
\n\
#if defined(DIFFUSE_IBL) || defined(SPECULAR_IBL)\n\
/**\n\
 * Compute the light contributions from environment maps and spherical harmonic coefficients.\n\
 * See Fdez-Aguera, https://www.jcgt.org/published/0008/01/03/paper.pdf, for explanation\n\
 * of the single- and multi-scattering terms.\n\
 *\n\
 * @param {vec3} viewDirectionEC Unit vector pointing from the fragment to the eye position.\n\
 * @param {vec3} normalEC The surface normal in eye coordinates.\n\
 * @param {czm_modelMaterial} The material properties.\n\
 * @return {vec3} The computed HDR color.\n\
 */\n\
vec3 textureIBL(vec3 viewDirectionEC, vec3 normalEC, czm_modelMaterial material) {\n\
    vec3 f0 = material.specular;\n\
    float roughness = material.roughness;\n\
    float specularWeight = 1.0;\n\
    #ifdef USE_SPECULAR\n\
        specularWeight = material.specularWeight;\n\
    #endif\n\
    float NdotV = clamp(dot(normalEC, viewDirectionEC), 0.0, 1.0);\n\
\n\
    // see https://bruop.github.io/ibl/ at Single Scattering Results\n\
    // Roughness dependent fresnel, from Fdez-Aguera\n\
    vec3 f90 = max(vec3(1.0 - roughness), f0);\n\
    vec3 singleScatterFresnel = fresnelSchlick2(f0, f90, NdotV);\n\
\n\
    vec2 brdfLut = texture(czm_brdfLut, vec2(NdotV, roughness)).rg;\n\
    vec3 FssEss = specularWeight * (singleScatterFresnel * brdfLut.x + brdfLut.y);\n\
\n\
    #ifdef DIFFUSE_IBL\n\
        vec3 normalMC = normalize(model_iblReferenceFrameMatrix * normalEC);\n\
        vec3 irradiance = sampleDiffuseEnvironment(normalMC);\n\
\n\
        vec3 averageFresnel = f0 + (1.0 - f0) / 21.0;\n\
        float Ems = specularWeight * (1.0 - brdfLut.x - brdfLut.y);\n\
        vec3 FmsEms = FssEss * averageFresnel * Ems / (1.0 - averageFresnel * Ems);\n\
        vec3 dielectricScattering = (1.0 - FssEss - FmsEms) * material.diffuse;\n\
        vec3 diffuseContribution = irradiance * (FmsEms + dielectricScattering) * model_iblFactor.x;\n\
    #else\n\
        vec3 diffuseContribution = vec3(0.0);\n\
    #endif\n\
\n\
    #ifdef USE_ANISOTROPY\n\
        // Bend normal to account for anisotropic distortion of specular reflection\n\
        vec3 anisotropyDirection = material.anisotropicB;\n\
        vec3 anisotropicTangent = cross(anisotropyDirection, viewDirectionEC);\n\
        vec3 anisotropicNormal = cross(anisotropicTangent, anisotropyDirection);\n\
        float bendFactor = 1.0 - material.anisotropyStrength * (1.0 - roughness);\n\
        float bendFactorPow4 = bendFactor * bendFactor * bendFactor * bendFactor;\n\
        vec3 bentNormal = normalize(mix(anisotropicNormal, normalEC, bendFactorPow4));\n\
        vec3 reflectEC = reflect(-viewDirectionEC, bentNormal);\n\
    #else\n\
        vec3 reflectEC = reflect(-viewDirectionEC, normalEC);\n\
    #endif\n\
\n\
    #ifdef SPECULAR_IBL\n\
        vec3 reflectMC = normalize(model_iblReferenceFrameMatrix * reflectEC);\n\
        vec3 radiance = sampleSpecularEnvironment(reflectMC, roughness);\n\
        vec3 specularContribution = radiance * FssEss * model_iblFactor.y;\n\
    #else\n\
        vec3 specularContribution = vec3(0.0);\n\
    #endif\n\
\n\
    return diffuseContribution + specularContribution;\n\
}\n\
#endif\n\
";
