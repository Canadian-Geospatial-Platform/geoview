//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Approximate uv coordinates based on the ellipsoid normal.\n\
 *\n\
 * @name czm_ellipsoidTextureCoordinates\n\
 * @glslFunction\n\
 */\n\
vec2 czm_ellipsoidTextureCoordinates(vec3 normal)\n\
{\n\
    return vec2(atan(normal.y, normal.x) * czm_oneOverTwoPi + 0.5, asin(normal.z) * czm_oneOverPi + 0.5);\n\
}\n\
";
