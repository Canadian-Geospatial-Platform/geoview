//This file is automatically rebuilt by the Cesium build process.
export default "precision highp float;\n\
\n\
in vec2 v_textureCoordinates;\n\
\n\
uniform vec3 u_faceDirection; // Current cubemap face\n\
uniform vec3 u_positionWC;\n\
uniform mat4 u_enuToFixedFrame;\n\
uniform vec4 u_brightnessSaturationGammaIntensity;\n\
uniform vec4 u_groundColor; // alpha component represent albedo\n\
\n\
vec4 getCubeMapDirection(vec2 uv, vec3 faceDir) {\n\
    vec2 scaledUV = uv * 2.0 - 1.0;\n\
\n\
    if (faceDir.x != 0.0) {\n\
        return vec4(faceDir.x,  scaledUV.x * faceDir.x, -scaledUV.y, 0.0);\n\
    } else if (faceDir.y != 0.0) {\n\
        return vec4(scaledUV.x, -scaledUV.y * faceDir.y, faceDir.y, 0.0);\n\
    } else {\n\
        return vec4(scaledUV.x * faceDir.z, -faceDir.z, -scaledUV.y, 0.0); \n\
    }\n\
}\n\
\n\
void main() {    \n\
    float height = length(u_positionWC);\n\
    float atmosphereInnerRadius = u_radiiAndDynamicAtmosphereColor.y;\n\
    float ellipsoidHeight = max(height - atmosphereInnerRadius, 0.0);\n\
\n\
    // Scale the position to ensure the sky color is present, even when underground.\n\
    vec3 positionWC = u_positionWC / height * (ellipsoidHeight + atmosphereInnerRadius);\n\
\n\
    float atmosphereOuterRadius = u_radiiAndDynamicAtmosphereColor.x;\n\
    float atmosphereHeight = atmosphereOuterRadius - atmosphereInnerRadius;\n\
\n\
    vec3 direction = (u_enuToFixedFrame * getCubeMapDirection(v_textureCoordinates, u_faceDirection)).xyz;\n\
    vec3 normalizedDirection = normalize(direction);\n\
\n\
    czm_ray ray = czm_ray(positionWC, normalizedDirection);\n\
    czm_raySegment intersection = czm_raySphereIntersectionInterval(ray, vec3(0.0), atmosphereInnerRadius);\n\
    if (!czm_isEmpty(intersection)) {\n\
        intersection = czm_rayEllipsoidIntersectionInterval(ray, vec3(0.0), czm_ellipsoidInverseRadii);\n\
    }\n\
\n\
    bool onEllipsoid = intersection.start >= 0.0;\n\
    float rayLength = czm_branchFreeTernary(onEllipsoid, intersection.start, atmosphereOuterRadius);\n\
\n\
    // Compute sky color for each position on a sphere at radius centered around the provided position's origin\n\
    vec3 skyPositionWC = positionWC + normalizedDirection * rayLength;\n\
\n\
    float lightEnum = u_radiiAndDynamicAtmosphereColor.z;\n\
    vec3 lightDirectionWC = normalize(czm_getDynamicAtmosphereLightDirection(skyPositionWC, lightEnum));\n\
    vec3 mieColor;\n\
    vec3 rayleighColor;\n\
    float opacity;\n\
    czm_computeScattering(\n\
        ray,\n\
        rayLength,\n\
        lightDirectionWC,\n\
        atmosphereInnerRadius, \n\
        rayleighColor,\n\
        mieColor,\n\
        opacity\n\
    );\n\
\n\
    vec4 atmopshereColor = czm_computeAtmosphereColor(ray, lightDirectionWC, rayleighColor, mieColor, opacity);\n\
\n\
#ifdef ATMOSPHERE_COLOR_CORRECT\n\
    const bool ignoreBlackPixels = true;\n\
    atmopshereColor.rgb = czm_applyHSBShift(atmopshereColor.rgb, czm_atmosphereHsbShift, ignoreBlackPixels);\n\
#endif\n\
\n\
    vec3 lookupDirection = -normalizedDirection;\n\
     // Flipping the X vector is a cheap way to get the inverse of czm_temeToPseudoFixed, since that's a rotation about Z.\n\
    lookupDirection.x = -lookupDirection.x;\n\
    lookupDirection = -normalize(czm_temeToPseudoFixed * lookupDirection);\n\
    lookupDirection.x = -lookupDirection.x;\n\
\n\
    // Values outside the atmopshere are rendered as black, when they should be treated as transparent\n\
    float skyAlpha = clamp((1.0 - ellipsoidHeight / atmosphereHeight) * atmopshereColor.a, 0.0, 1.0);\n\
    skyAlpha = czm_branchFreeTernary(length(atmopshereColor.rgb) <= czm_epsilon7, 0.0, skyAlpha); // Treat black as transparent\n\
\n\
    // Blend starmap with atmopshere scattering\n\
    float intensity = u_brightnessSaturationGammaIntensity.w;\n\
    vec4 sceneSkyBoxColor = czm_textureCube(czm_environmentMap, lookupDirection);\n\
    vec3 skyBackgroundColor = mix(czm_backgroundColor.rgb, sceneSkyBoxColor.rgb, sceneSkyBoxColor.a);\n\
    vec4 combinedSkyColor = vec4(mix(skyBackgroundColor, atmopshereColor.rgb * intensity, skyAlpha), 1.0);\n\
\n\
    // Compute ground color based on amount of reflected light, then blend it with ground atmosphere based on height\n\
    vec3 up = normalize(positionWC);\n\
    float occlusion = max(dot(lightDirectionWC, up), 0.05);\n\
    vec4 groundColor = vec4(u_groundColor.rgb * u_groundColor.a * (vec3(intensity * occlusion) + atmopshereColor.rgb), 1.0);\n\
    vec4 blendedGroundColor = mix(groundColor, atmopshereColor, clamp(ellipsoidHeight / atmosphereHeight, 0.0, 1.0));\n\
\n\
    vec4 color = czm_branchFreeTernary(onEllipsoid, blendedGroundColor, combinedSkyColor);\n\
\n\
    float brightness = u_brightnessSaturationGammaIntensity.x;\n\
    float saturation = u_brightnessSaturationGammaIntensity.y;\n\
    float gamma = u_brightnessSaturationGammaIntensity.z;\n\
\n\
#ifdef ENVIRONMENT_COLOR_CORRECT\n\
    color.rgb = mix(vec3(0.0), color.rgb, brightness);\n\
    color.rgb = czm_saturation(color.rgb, saturation);\n\
#endif\n\
    color.rgb = pow(color.rgb, vec3(gamma)); // Normally this would be in the ifdef above, but there is a precision issue with the atmopshere scattering transmittance (alpha). Having this line is a workaround for that issue, even when gamma is 1.0.\n\
    color.rgb = czm_gammaCorrect(color.rgb);\n\
\n\
    out_FragColor = color;\n\
}\n\
";
