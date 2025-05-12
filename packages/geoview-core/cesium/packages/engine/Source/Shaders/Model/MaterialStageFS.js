//This file is automatically rebuilt by the Cesium build process.
export default "// If the style color is white, it implies the feature has not been styled.\n\
bool isDefaultStyleColor(vec3 color)\n\
{\n\
    return all(greaterThan(color, vec3(1.0 - czm_epsilon3)));\n\
}\n\
\n\
vec3 blend(vec3 sourceColor, vec3 styleColor, float styleColorBlend)\n\
{\n\
    vec3 blendColor = mix(sourceColor, styleColor, styleColorBlend);\n\
    vec3 color = isDefaultStyleColor(styleColor.rgb) ? sourceColor : blendColor;\n\
    return color;\n\
}\n\
\n\
vec2 computeTextureTransform(vec2 texCoord, mat3 textureTransform)\n\
{\n\
    return vec2(textureTransform * vec3(texCoord, 1.0));\n\
}\n\
\n\
#ifdef HAS_NORMAL_TEXTURE\n\
vec2 getNormalTexCoords()\n\
{\n\
    vec2 texCoord = TEXCOORD_NORMAL;\n\
    #ifdef HAS_NORMAL_TEXTURE_TRANSFORM\n\
        texCoord = vec2(u_normalTextureTransform * vec3(texCoord, 1.0));\n\
    #endif\n\
    return texCoord;\n\
}\n\
#endif\n\
\n\
#if defined(HAS_NORMAL_TEXTURE) || defined(HAS_CLEARCOAT_NORMAL_TEXTURE)\n\
vec3 computeTangent(in vec3 position, in vec2 normalTexCoords)\n\
{\n\
    vec2 tex_dx = dFdx(normalTexCoords);\n\
    vec2 tex_dy = dFdy(normalTexCoords);\n\
    float determinant = tex_dx.x * tex_dy.y - tex_dy.x * tex_dx.y;\n\
    vec3 tangent = tex_dy.t * dFdx(position) - tex_dx.t * dFdy(position);\n\
    return tangent / determinant;\n\
}\n\
#endif\n\
\n\
#ifdef USE_ANISOTROPY\n\
struct NormalInfo {\n\
    vec3 tangent;\n\
    vec3 bitangent;\n\
    vec3 normal;\n\
    vec3 geometryNormal;\n\
};\n\
\n\
NormalInfo getNormalInfo(ProcessedAttributes attributes)\n\
{\n\
    vec3 geometryNormal = attributes.normalEC;\n\
    #ifdef HAS_NORMAL_TEXTURE\n\
        vec2 normalTexCoords = getNormalTexCoords();\n\
    #endif\n\
\n\
    #ifdef HAS_BITANGENTS\n\
        vec3 tangent = attributes.tangentEC;\n\
        vec3 bitangent = attributes.bitangentEC;\n\
    #else // Assume HAS_NORMAL_TEXTURE\n\
        vec3 tangent = computeTangent(attributes.positionEC, normalTexCoords);\n\
        tangent = normalize(tangent - geometryNormal * dot(geometryNormal, tangent));\n\
        vec3 bitangent = normalize(cross(geometryNormal, tangent));\n\
    #endif\n\
\n\
    #ifdef HAS_NORMAL_TEXTURE\n\
        mat3 tbn = mat3(tangent, bitangent, geometryNormal);\n\
        vec3 normalSample = texture(u_normalTexture, normalTexCoords).rgb;\n\
        normalSample = 2.0 * normalSample - 1.0;\n\
        #ifdef HAS_NORMAL_TEXTURE_SCALE\n\
            normalSample.xy *= u_normalTextureScale;\n\
        #endif\n\
        vec3 normal = normalize(tbn * normalSample);\n\
    #else\n\
        vec3 normal = geometryNormal;\n\
    #endif\n\
\n\
    #ifdef HAS_DOUBLE_SIDED_MATERIAL\n\
        if (czm_backFacing()) {\n\
            tangent *= -1.0;\n\
            bitangent *= -1.0;\n\
            normal *= -1.0;\n\
            geometryNormal *= -1.0;\n\
        }\n\
    #endif\n\
\n\
    NormalInfo normalInfo;\n\
    normalInfo.tangent = tangent;\n\
    normalInfo.bitangent = bitangent;\n\
    normalInfo.normal = normal;\n\
    normalInfo.geometryNormal = geometryNormal;\n\
\n\
    return normalInfo;\n\
}\n\
#endif\n\
\n\
#if defined(HAS_NORMAL_TEXTURE) && !defined(HAS_WIREFRAME)\n\
vec3 getNormalFromTexture(ProcessedAttributes attributes, vec3 geometryNormal)\n\
{\n\
    vec2 normalTexCoords = getNormalTexCoords();\n\
\n\
    // If HAS_BITANGENTS is set, then HAS_TANGENTS is also set\n\
    #ifdef HAS_BITANGENTS\n\
        vec3 t = attributes.tangentEC;\n\
        vec3 b = attributes.bitangentEC;\n\
    #else\n\
        vec3 t = computeTangent(attributes.positionEC, normalTexCoords);\n\
        t = normalize(t - geometryNormal * dot(geometryNormal, t));\n\
        vec3 b = normalize(cross(geometryNormal, t));\n\
    #endif\n\
\n\
    mat3 tbn = mat3(t, b, geometryNormal);\n\
    vec3 normalSample = texture(u_normalTexture, normalTexCoords).rgb;\n\
    normalSample = 2.0 * normalSample - 1.0;\n\
    #ifdef HAS_NORMAL_TEXTURE_SCALE\n\
        normalSample.xy *= u_normalTextureScale;\n\
    #endif\n\
    return normalize(tbn * normalSample);\n\
}\n\
#endif\n\
\n\
#ifdef HAS_CLEARCOAT_NORMAL_TEXTURE\n\
vec3 getClearcoatNormalFromTexture(ProcessedAttributes attributes, vec3 geometryNormal)\n\
{\n\
    vec2 normalTexCoords = TEXCOORD_CLEARCOAT_NORMAL;\n\
    #ifdef HAS_CLEARCOAT_NORMAL_TEXTURE_TRANSFORM\n\
        normalTexCoords = vec2(u_clearcoatNormalTextureTransform * vec3(normalTexCoords, 1.0));\n\
    #endif\n\
\n\
    // If HAS_BITANGENTS is set, then HAS_TANGENTS is also set\n\
    #ifdef HAS_BITANGENTS\n\
        vec3 t = attributes.tangentEC;\n\
        vec3 b = attributes.bitangentEC;\n\
    #else\n\
        vec3 t = computeTangent(attributes.positionEC, normalTexCoords);\n\
        t = normalize(t - geometryNormal * dot(geometryNormal, t));\n\
        vec3 b = normalize(cross(geometryNormal, t));\n\
    #endif\n\
\n\
    mat3 tbn = mat3(t, b, geometryNormal);\n\
    vec3 normalSample = texture(u_clearcoatNormalTexture, normalTexCoords).rgb;\n\
    normalSample = 2.0 * normalSample - 1.0;\n\
    #ifdef HAS_CLEARCOAT_NORMAL_TEXTURE_SCALE\n\
        normalSample.xy *= u_clearcoatNormalTextureScale;\n\
    #endif\n\
    return normalize(tbn * normalSample);\n\
}\n\
#endif\n\
\n\
#ifdef HAS_NORMALS\n\
vec3 computeNormal(ProcessedAttributes attributes)\n\
{\n\
    // Geometry normal. This is already normalized \n\
    vec3 normal = attributes.normalEC;\n\
\n\
    #if defined(HAS_NORMAL_TEXTURE) && !defined(HAS_WIREFRAME)\n\
        normal = getNormalFromTexture(attributes, normal);\n\
    #endif\n\
\n\
    #ifdef HAS_DOUBLE_SIDED_MATERIAL\n\
        if (czm_backFacing()) {\n\
            normal = -normal;\n\
        }\n\
    #endif\n\
\n\
    return normal;\n\
}\n\
#endif\n\
\n\
#ifdef HAS_BASE_COLOR_TEXTURE\n\
vec4 getBaseColorFromTexture()\n\
{\n\
    vec2 baseColorTexCoords = TEXCOORD_BASE_COLOR;\n\
    #ifdef HAS_BASE_COLOR_TEXTURE_TRANSFORM\n\
        baseColorTexCoords = computeTextureTransform(baseColorTexCoords, u_baseColorTextureTransform);\n\
    #endif\n\
\n\
    vec4 baseColorWithAlpha = czm_srgbToLinear(texture(u_baseColorTexture, baseColorTexCoords));\n\
\n\
    #ifdef HAS_BASE_COLOR_FACTOR\n\
        baseColorWithAlpha *= u_baseColorFactor;\n\
    #endif\n\
\n\
    return baseColorWithAlpha;\n\
}\n\
#endif\n\
\n\
#ifdef HAS_EMISSIVE_TEXTURE\n\
vec3 getEmissiveFromTexture()\n\
{\n\
    vec2 emissiveTexCoords = TEXCOORD_EMISSIVE;\n\
    #ifdef HAS_EMISSIVE_TEXTURE_TRANSFORM\n\
        emissiveTexCoords = computeTextureTransform(emissiveTexCoords, u_emissiveTextureTransform);\n\
    #endif\n\
\n\
    vec3 emissive = czm_srgbToLinear(texture(u_emissiveTexture, emissiveTexCoords).rgb);\n\
    #ifdef HAS_EMISSIVE_FACTOR\n\
        emissive *= u_emissiveFactor;\n\
    #endif\n\
\n\
    return emissive;\n\
}\n\
#endif\n\
\n\
#if defined(LIGHTING_PBR) && defined(USE_SPECULAR_GLOSSINESS)\n\
void setSpecularGlossiness(inout czm_modelMaterial material)\n\
{\n\
    #ifdef HAS_SPECULAR_GLOSSINESS_TEXTURE\n\
        vec2 specularGlossinessTexCoords = TEXCOORD_SPECULAR_GLOSSINESS;\n\
        #ifdef HAS_SPECULAR_GLOSSINESS_TEXTURE_TRANSFORM\n\
            specularGlossinessTexCoords = computeTextureTransform(specularGlossinessTexCoords, u_specularGlossinessTextureTransform);\n\
        #endif\n\
\n\
        vec4 specularGlossiness = czm_srgbToLinear(texture(u_specularGlossinessTexture, specularGlossinessTexCoords));\n\
        vec3 specular = specularGlossiness.rgb;\n\
        float glossiness = specularGlossiness.a;\n\
        #ifdef HAS_LEGACY_SPECULAR_FACTOR\n\
            specular *= u_legacySpecularFactor;\n\
        #endif\n\
\n\
        #ifdef HAS_GLOSSINESS_FACTOR\n\
            glossiness *= u_glossinessFactor;\n\
        #endif\n\
    #else\n\
        #ifdef HAS_LEGACY_SPECULAR_FACTOR\n\
            vec3 specular = clamp(u_legacySpecularFactor, vec3(0.0), vec3(1.0));\n\
        #else\n\
            vec3 specular = vec3(1.0);\n\
        #endif\n\
\n\
        #ifdef HAS_GLOSSINESS_FACTOR\n\
            float glossiness = clamp(u_glossinessFactor, 0.0, 1.0);\n\
        #else\n\
            float glossiness = 1.0;\n\
        #endif\n\
    #endif\n\
\n\
    #ifdef HAS_DIFFUSE_TEXTURE\n\
        vec2 diffuseTexCoords = TEXCOORD_DIFFUSE;\n\
        #ifdef HAS_DIFFUSE_TEXTURE_TRANSFORM\n\
            diffuseTexCoords = computeTextureTransform(diffuseTexCoords, u_diffuseTextureTransform);\n\
        #endif\n\
\n\
        vec4 diffuse = czm_srgbToLinear(texture(u_diffuseTexture, diffuseTexCoords));\n\
        #ifdef HAS_DIFFUSE_FACTOR\n\
            diffuse *= u_diffuseFactor;\n\
        #endif\n\
    #elif defined(HAS_DIFFUSE_FACTOR)\n\
        vec4 diffuse = clamp(u_diffuseFactor, vec4(0.0), vec4(1.0));\n\
    #else\n\
        vec4 diffuse = vec4(1.0);\n\
    #endif\n\
\n\
    material.diffuse = diffuse.rgb * (1.0 - czm_maximumComponent(specular));\n\
    // the specular glossiness extension's alpha overrides anything set\n\
    // by the base material.\n\
    material.alpha = diffuse.a;\n\
\n\
    material.specular = specular;\n\
\n\
    // glossiness is the opposite of roughness, but easier for artists to use.\n\
    material.roughness = 1.0 - glossiness;\n\
}\n\
#elif defined(LIGHTING_PBR)\n\
float setMetallicRoughness(inout czm_modelMaterial material)\n\
{\n\
    #ifdef HAS_METALLIC_ROUGHNESS_TEXTURE\n\
        vec2 metallicRoughnessTexCoords = TEXCOORD_METALLIC_ROUGHNESS;\n\
        #ifdef HAS_METALLIC_ROUGHNESS_TEXTURE_TRANSFORM\n\
            metallicRoughnessTexCoords = computeTextureTransform(metallicRoughnessTexCoords, u_metallicRoughnessTextureTransform);\n\
        #endif\n\
\n\
        vec3 metallicRoughness = texture(u_metallicRoughnessTexture, metallicRoughnessTexCoords).rgb;\n\
        float metalness = clamp(metallicRoughness.b, 0.0, 1.0);\n\
        float roughness = clamp(metallicRoughness.g, 0.0, 1.0);\n\
        #ifdef HAS_METALLIC_FACTOR\n\
            metalness = clamp(metalness * u_metallicFactor, 0.0, 1.0);\n\
        #endif\n\
\n\
        #ifdef HAS_ROUGHNESS_FACTOR\n\
            roughness = clamp(roughness * u_roughnessFactor, 0.0, 1.0);\n\
        #endif\n\
    #else\n\
        #ifdef HAS_METALLIC_FACTOR\n\
            float metalness = clamp(u_metallicFactor, 0.0, 1.0);\n\
        #else\n\
            float metalness = 1.0;\n\
        #endif\n\
\n\
        #ifdef HAS_ROUGHNESS_FACTOR\n\
            float roughness = clamp(u_roughnessFactor, 0.0, 1.0);\n\
        #else\n\
            float roughness = 1.0;\n\
        #endif\n\
    #endif\n\
\n\
    // dielectrics use f0 = 0.04, metals use albedo as f0\n\
    const vec3 REFLECTANCE_DIELECTRIC = vec3(0.04);\n\
    vec3 f0 = mix(REFLECTANCE_DIELECTRIC, material.baseColor.rgb, metalness);\n\
\n\
    material.specular = f0;\n\
\n\
    // diffuse only applies to dielectrics.\n\
    material.diffuse = mix(material.baseColor.rgb, vec3(0.0), metalness);\n\
\n\
    // This is perceptual roughness. The square of this value is used for direct lighting\n\
    material.roughness = roughness;\n\
\n\
    return metalness;\n\
}\n\
#ifdef USE_SPECULAR\n\
void setSpecular(inout czm_modelMaterial material, in float metalness)\n\
{\n\
    #ifdef HAS_SPECULAR_TEXTURE\n\
        vec2 specularTexCoords = TEXCOORD_SPECULAR;\n\
        #ifdef HAS_SPECULAR_TEXTURE_TRANSFORM\n\
            specularTexCoords = computeTextureTransform(specularTexCoords, u_specularTextureTransform);\n\
        #endif\n\
        float specularWeight = texture(u_specularTexture, specularTexCoords).a;\n\
        #ifdef HAS_SPECULAR_FACTOR\n\
            specularWeight *= u_specularFactor;\n\
        #endif\n\
    #else\n\
        #ifdef HAS_SPECULAR_FACTOR\n\
            float specularWeight = u_specularFactor;\n\
        #else\n\
            float specularWeight = 1.0;\n\
        #endif\n\
    #endif\n\
\n\
    #ifdef HAS_SPECULAR_COLOR_TEXTURE\n\
        vec2 specularColorTexCoords = TEXCOORD_SPECULAR_COLOR;\n\
        #ifdef HAS_SPECULAR_COLOR_TEXTURE_TRANSFORM\n\
            specularColorTexCoords = computeTextureTransform(specularColorTexCoords, u_specularColorTextureTransform);\n\
        #endif\n\
        vec3 specularColorSample = texture(u_specularColorTexture, specularColorTexCoords).rgb;\n\
        vec3 specularColorFactor = czm_srgbToLinear(specularColorSample);\n\
        #ifdef HAS_SPECULAR_COLOR_FACTOR\n\
            specularColorFactor *= u_specularColorFactor;\n\
        #endif\n\
    #else\n\
        #ifdef HAS_SPECULAR_COLOR_FACTOR\n\
            vec3 specularColorFactor = u_specularColorFactor;\n\
        #else\n\
            vec3 specularColorFactor = vec3(1.0);\n\
        #endif\n\
    #endif\n\
    material.specularWeight = specularWeight;\n\
    vec3 f0 = material.specular;\n\
    vec3 dielectricSpecularF0 = min(f0 * specularColorFactor, vec3(1.0));\n\
    material.specular = mix(dielectricSpecularF0, material.baseColor.rgb, metalness);\n\
}\n\
#endif\n\
#ifdef USE_ANISOTROPY\n\
void setAnisotropy(inout czm_modelMaterial material, in NormalInfo normalInfo)\n\
{\n\
    mat2 rotation = mat2(u_anisotropy.xy, -u_anisotropy.y, u_anisotropy.x);\n\
    float anisotropyStrength = u_anisotropy.z;\n\
\n\
    vec2 direction = vec2(1.0, 0.0);\n\
    #ifdef HAS_ANISOTROPY_TEXTURE\n\
        vec2 anisotropyTexCoords = TEXCOORD_ANISOTROPY;\n\
        #ifdef HAS_ANISOTROPY_TEXTURE_TRANSFORM\n\
            anisotropyTexCoords = computeTextureTransform(anisotropyTexCoords, u_anisotropyTextureTransform);\n\
        #endif\n\
        vec3 anisotropySample = texture(u_anisotropyTexture, anisotropyTexCoords).rgb;\n\
        direction = anisotropySample.rg * 2.0 - vec2(1.0);\n\
        anisotropyStrength *= anisotropySample.b;\n\
    #endif\n\
\n\
    direction = rotation * direction;\n\
    mat3 tbn = mat3(normalInfo.tangent, normalInfo.bitangent, normalInfo.normal);\n\
    vec3 anisotropicT = tbn * normalize(vec3(direction, 0.0));\n\
    vec3 anisotropicB = cross(normalInfo.geometryNormal, anisotropicT);\n\
\n\
    material.anisotropicT = anisotropicT;\n\
    material.anisotropicB = anisotropicB;\n\
    material.anisotropyStrength = anisotropyStrength;\n\
}\n\
#endif\n\
#ifdef USE_CLEARCOAT\n\
void setClearcoat(inout czm_modelMaterial material, in ProcessedAttributes attributes)\n\
{\n\
    #ifdef HAS_CLEARCOAT_TEXTURE\n\
        vec2 clearcoatTexCoords = TEXCOORD_CLEARCOAT;\n\
        #ifdef HAS_CLEARCOAT_TEXTURE_TRANSFORM\n\
            clearcoatTexCoords = computeTextureTransform(clearcoatTexCoords, u_clearcoatTextureTransform);\n\
        #endif\n\
        float clearcoatFactor = texture(u_clearcoatTexture, clearcoatTexCoords).r;\n\
        #ifdef HAS_CLEARCOAT_FACTOR\n\
            clearcoatFactor *= u_clearcoatFactor;\n\
        #endif\n\
    #else\n\
        #ifdef HAS_CLEARCOAT_FACTOR\n\
            float clearcoatFactor = u_clearcoatFactor;\n\
        #else\n\
            // PERFORMANCE_IDEA: this case should turn the whole extension off\n\
            float clearcoatFactor = 0.0;\n\
        #endif\n\
    #endif\n\
\n\
    #ifdef HAS_CLEARCOAT_ROUGHNESS_TEXTURE\n\
        vec2 clearcoatRoughnessTexCoords = TEXCOORD_CLEARCOAT_ROUGHNESS;\n\
        #ifdef HAS_CLEARCOAT_ROUGHNESS_TEXTURE_TRANSFORM\n\
            clearcoatRoughnessTexCoords = computeTextureTransform(clearcoatRoughnessTexCoords, u_clearcoatRoughnessTextureTransform);\n\
        #endif\n\
        float clearcoatRoughness = texture(u_clearcoatRoughnessTexture, clearcoatRoughnessTexCoords).g;\n\
        #ifdef HAS_CLEARCOAT_ROUGHNESS_FACTOR\n\
            clearcoatRoughness *= u_clearcoatRoughnessFactor;\n\
        #endif\n\
    #else\n\
        #ifdef HAS_CLEARCOAT_ROUGHNESS_FACTOR\n\
            float clearcoatRoughness = u_clearcoatRoughnessFactor;\n\
        #else\n\
            float clearcoatRoughness = 0.0;\n\
        #endif\n\
    #endif\n\
\n\
    material.clearcoatFactor = clearcoatFactor;\n\
    // This is perceptual roughness. The square of this value is used for direct lighting\n\
    material.clearcoatRoughness = clearcoatRoughness;\n\
    #ifdef HAS_CLEARCOAT_NORMAL_TEXTURE\n\
        material.clearcoatNormal = getClearcoatNormalFromTexture(attributes, attributes.normalEC);\n\
    #else\n\
        material.clearcoatNormal = attributes.normalEC;\n\
    #endif\n\
}\n\
#endif\n\
#endif\n\
\n\
void materialStage(inout czm_modelMaterial material, ProcessedAttributes attributes, SelectedFeature feature)\n\
{\n\
    #ifdef USE_ANISOTROPY\n\
        NormalInfo normalInfo = getNormalInfo(attributes);\n\
        material.normalEC = normalInfo.normal;\n\
    #elif defined(HAS_NORMALS)\n\
        material.normalEC = computeNormal(attributes);\n\
    #endif\n\
\n\
    vec4 baseColorWithAlpha = vec4(1.0);\n\
    // Regardless of whether we use PBR, set a base color\n\
    #ifdef HAS_BASE_COLOR_TEXTURE\n\
        baseColorWithAlpha = getBaseColorFromTexture();\n\
    #elif defined(HAS_BASE_COLOR_FACTOR)\n\
        baseColorWithAlpha = u_baseColorFactor;\n\
    #endif\n\
\n\
    #ifdef HAS_POINT_CLOUD_COLOR_STYLE\n\
        baseColorWithAlpha = v_pointCloudColor;\n\
    #elif defined(HAS_COLOR_0)\n\
        vec4 color = attributes.color_0;\n\
        // .pnts files store colors in the sRGB color space\n\
        #ifdef HAS_SRGB_COLOR\n\
            color = czm_srgbToLinear(color);\n\
        #endif\n\
        baseColorWithAlpha *= color;\n\
    #endif\n\
\n\
    #ifdef USE_CPU_STYLING\n\
        baseColorWithAlpha.rgb = blend(baseColorWithAlpha.rgb, feature.color.rgb, model_colorBlend);\n\
    #endif\n\
    material.baseColor = baseColorWithAlpha;\n\
    material.diffuse = baseColorWithAlpha.rgb;\n\
    material.alpha = baseColorWithAlpha.a;\n\
\n\
    #ifdef HAS_OCCLUSION_TEXTURE\n\
        vec2 occlusionTexCoords = TEXCOORD_OCCLUSION;\n\
        #ifdef HAS_OCCLUSION_TEXTURE_TRANSFORM\n\
            occlusionTexCoords = computeTextureTransform(occlusionTexCoords, u_occlusionTextureTransform);\n\
        #endif\n\
        material.occlusion = texture(u_occlusionTexture, occlusionTexCoords).r;\n\
    #endif\n\
\n\
    #ifdef HAS_EMISSIVE_TEXTURE\n\
        material.emissive = getEmissiveFromTexture();\n\
    #elif defined(HAS_EMISSIVE_FACTOR)\n\
        material.emissive = u_emissiveFactor;\n\
    #endif\n\
\n\
    #if defined(LIGHTING_PBR) && defined(USE_SPECULAR_GLOSSINESS)\n\
        setSpecularGlossiness(material);\n\
    #elif defined(LIGHTING_PBR)\n\
        float metalness = setMetallicRoughness(material);\n\
        #ifdef USE_SPECULAR\n\
            setSpecular(material, metalness);\n\
        #endif\n\
        #ifdef USE_ANISOTROPY\n\
            setAnisotropy(material, normalInfo);\n\
        #endif\n\
        #ifdef USE_CLEARCOAT\n\
            setClearcoat(material, attributes);\n\
        #endif\n\
    #endif\n\
}\n\
";
