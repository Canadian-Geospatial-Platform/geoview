//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Find the maximum component of a vector.\n\
 *\n\
 * @name czm_maximumComponent\n\
 * @glslFunction\n\
 *\n\
 * @param {vec2|vec3|vec4} v The input vector.\n\
 * @returns {float} The value of the largest component.\n\
 */\n\
float czm_maximumComponent(vec2 v)\n\
{\n\
    return max(v.x, v.y);\n\
}\n\
float czm_maximumComponent(vec3 v)\n\
{\n\
    return max(max(v.x, v.y), v.z);\n\
}\n\
float czm_maximumComponent(vec4 v)\n\
{\n\
    return max(max(max(v.x, v.y), v.z), v.w);\n\
}\n\
";
