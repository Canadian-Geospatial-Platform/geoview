//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Apply a HSB color shift to an RGB color.\n\
 *\n\
 * @param {vec3} rgb The color in RGB space.\n\
 * @param {vec3} hsbShift The amount to shift each component. The xyz components correspond to hue, saturation, and brightness. Shifting the hue by +/- 1.0 corresponds to shifting the hue by a full cycle. Saturation and brightness are clamped between 0 and 1 after the adjustment\n\
 * @param {bool} ignoreBlackPixels If true, black pixels will be unchanged. This is necessary in some shaders such as atmosphere-related effects.\n\
 *\n\
 * @return {vec3} The RGB color after shifting in HSB space and clamping saturation and brightness to a valid range.\n\
 */\n\
vec3 czm_applyHSBShift(vec3 rgb, vec3 hsbShift, bool ignoreBlackPixels) {\n\
    // Convert rgb color to hsb\n\
    vec3 hsb = czm_RGBToHSB(rgb);\n\
\n\
    // Perform hsb shift\n\
    // Hue cycles around so no clamp is needed.\n\
    hsb.x += hsbShift.x; // hue\n\
    hsb.y = clamp(hsb.y + hsbShift.y, 0.0, 1.0); // saturation\n\
\n\
    // brightness\n\
    //\n\
    // Some shaders such as atmosphere-related effects need to leave black\n\
    // pixels unchanged\n\
    if (ignoreBlackPixels) {\n\
        hsb.z = hsb.z > czm_epsilon7 ? hsb.z + hsbShift.z : 0.0;\n\
    } else {\n\
        hsb.z = hsb.z + hsbShift.z;\n\
    }\n\
    hsb.z = clamp(hsb.z, 0.0, 1.0);\n\
\n\
    // Convert shifted hsb back to rgb\n\
    return czm_HSBToRGB(hsb);\n\
}\n\
";
