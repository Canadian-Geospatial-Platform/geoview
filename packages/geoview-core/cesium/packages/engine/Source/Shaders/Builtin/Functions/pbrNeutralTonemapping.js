//This file is automatically rebuilt by the Cesium build process.
export default "// KhronosGroup https://github.com/KhronosGroup/ToneMapping/tree/main/PBR_Neutral\n\
\n\
// Input color is non-negative and resides in the Linear Rec. 709 color space.\n\
// Output color is also Linear Rec. 709, but in the [0, 1] range.\n\
\n\
vec3 czm_pbrNeutralTonemapping(vec3 color) {\n\
    const float startCompression = 0.8 - 0.04;\n\
    const float desaturation = 0.15;\n\
\n\
    float x = min(color.r, min(color.g, color.b));\n\
    float offset = czm_branchFreeTernary(x < 0.08, x - 6.25 * x * x, 0.04);\n\
    color -= offset;\n\
\n\
    float peak = max(color.r, max(color.g, color.b));\n\
    if (peak < startCompression) return color;\n\
\n\
    const float d = 1.0 - startCompression;\n\
    float newPeak = 1.0 - d * d / (peak + d - startCompression);\n\
    color *= newPeak / peak;\n\
\n\
    float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);\n\
    return mix(color, newPeak * vec3(1.0, 1.0, 1.0), g);\n\
}\n\
";
