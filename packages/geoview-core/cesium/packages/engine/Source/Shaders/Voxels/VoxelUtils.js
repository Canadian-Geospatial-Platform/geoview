//This file is automatically rebuilt by the Cesium build process.
export default "struct Ray {\n\
    vec3 pos;\n\
    vec3 dir;\n\
    vec3 rawDir;\n\
};\n\
\n\
#if defined(JITTER)\n\
/**\n\
 * Generate a pseudo-random value for a given 2D screen coordinate.\n\
 * Similar to https://www.shadertoy.com/view/4djSRW with a modified hashscale.\n\
 */\n\
float hash(vec2 p)\n\
{\n\
    vec3 p3 = fract(vec3(p.xyx) * 50.0);\n\
    p3 += dot(p3, p3.yzx + 19.19);\n\
    return fract((p3.x + p3.y) * p3.z);\n\
}\n\
#endif\n\
\n\
float minComponent(in vec3 v) {\n\
    return min(min(v.x, v.y), v.z);\n\
}\n\
\n\
float maxComponent(in vec3 v) {\n\
    return max(max(v.x, v.y), v.z);\n\
}\n\
\n\
struct PointJacobianT {\n\
    vec3 point;\n\
    mat3 jacobianT;\n\
};\n\
";
