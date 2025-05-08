//This file is automatically rebuilt by the Cesium build process.
export default "in vec3 v_outerPositionWC;\n\
\n\
uniform vec3 u_hsbShift;\n\
\n\
#ifndef PER_FRAGMENT_ATMOSPHERE\n\
in vec3 v_mieColor;\n\
in vec3 v_rayleighColor;\n\
in float v_opacity;\n\
in float v_translucent;\n\
#endif\n\
\n\
void main (void)\n\
{\n\
    float lightEnum = u_radiiAndDynamicAtmosphereColor.z;\n\
    vec3 lightDirection = czm_getDynamicAtmosphereLightDirection(v_outerPositionWC, lightEnum);\n\
\n\
    vec3 mieColor;\n\
    vec3 rayleighColor;\n\
    float opacity;\n\
    float translucent;\n\
\n\
    #ifdef PER_FRAGMENT_ATMOSPHERE\n\
        computeAtmosphereScattering(\n\
            v_outerPositionWC,\n\
            lightDirection,\n\
            rayleighColor,\n\
            mieColor,\n\
            opacity,\n\
            translucent\n\
        );\n\
    #else\n\
        mieColor = v_mieColor;\n\
        rayleighColor = v_rayleighColor;\n\
        opacity = v_opacity;\n\
        translucent = v_translucent;\n\
    #endif\n\
\n\
    vec4 color = computeAtmosphereColor(v_outerPositionWC, lightDirection, rayleighColor, mieColor, opacity);\n\
\n\
    #ifndef HDR\n\
        color.rgb = czm_pbrNeutralTonemapping(color.rgb);\n\
        color.rgb = czm_inverseGamma(color.rgb);\n\
    #endif\n\
\n\
    #ifdef COLOR_CORRECT\n\
        const bool ignoreBlackPixels = true;\n\
        color.rgb = czm_applyHSBShift(color.rgb, u_hsbShift, ignoreBlackPixels);\n\
    #endif\n\
\n\
    // For the parts of the sky atmosphere that are not behind a translucent globe,\n\
    // we mix in the default opacity so that the sky atmosphere still appears at distance.\n\
    // This is needed because the opacity in the sky atmosphere is initially adjusted based\n\
    // on the camera height.\n\
    if (translucent == 0.0) {\n\
        color.a = mix(color.b, 1.0, color.a) * smoothstep(0.0, 1.0, czm_morphTime);\n\
    }\n\
\n\
    out_FragColor = color;\n\
}\n\
";
