//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * A wrapper around the texture (WebGL2) / textureCube (WebGL1)\n\
 * function to allow for WebGL 1 support.\n\
 * \n\
 * @name czm_textureCube\n\
 * @glslFunction\n\
 *\n\
 * @param {samplerCube} sampler The sampler.\n\
 * @param {vec3} p The coordinate at which to sample the texture.\n\
 */\n\
vec4 czm_textureCube(samplerCube sampler, vec3 p) {\n\
#if __VERSION__ == 300\n\
    return texture(sampler, p);\n\
#else\n\
    return textureCube(sampler, p);\n\
#endif\n\
}\n\
\n\
/**\n\
 * A wrapper around the textureLod (WebGL2) / textureCube (WebGL1)\n\
 * function to allow for WebGL 1 support in fragment shaders.\n\
 *\n\
 * @name czm_textureCubeLod\n\
 * @glslFunction\n\
 *\n\
 * @param {samplerCube} sampler The sampler.\n\
 * @param {vec3} p The coordinate at which to sample the texture.\n\
 * @param {float} lod The mipmap level from which to sample.\n\
 */\n\
vec4 czm_textureCube(samplerCube sampler, vec3 p, float lod) {\n\
#if __VERSION__ == 300\n\
    return textureLod(sampler, p, lod);\n\
#elif defined(GL_EXT_shader_texture_lod)\n\
    return textureCubeLodEXT(sampler, p, lod);\n\
#endif\n\
}";
