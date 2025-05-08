//This file is automatically rebuilt by the Cesium build process.
export default "/**\n\
 * Compute a rational approximation to tanh(x)\n\
 *\n\
 * @param {float} x A real number input\n\
 * @returns {float} An approximation for tanh(x)\n\
*/\n\
float czm_approximateTanh(float x) {\n\
    float x2 = x * x;\n\
    return max(-1.0, min(1.0, x * (27.0 + x2) / (27.0 + 9.0 * x2)));\n\
}\n\
";
