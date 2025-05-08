//This file is automatically rebuilt by the Cesium build process.
export default "uniform samplerCube u_radianceMap;\n\
\n\
in vec2 v_textureCoordinates;\n\
\n\
\n\
const float twoSqrtPi = 2.0 * sqrt(czm_pi);\n\
\n\
// Coutesy of https://www.ppsloan.org/publications/StupidSH36.pdf\n\
float computeShBasis(int index, vec3 s) {\n\
    if (index == 0) { // l = 0, m = 0\n\
        return 1.0 / twoSqrtPi;\n\
    }\n\
    \n\
    if (index == 1) { // l = 1, m = -1\n\
        return -sqrt(3.0) * s.y / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 2) { // l = 1, m = 0\n\
        return sqrt(3.0) * s.z / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 3) { // l = 1, m = 1\n\
        return -sqrt(3.0) * s.x / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 4) { // l = 2, m = -2\n\
        return sqrt(15.0) * s.y * s.x / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 5) { // l = 2, m = -1\n\
        return -sqrt(15.0) * s.y * s.z / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 6) { // l = 2, m = 0\n\
        return sqrt(5.0) * (3.0 * s.z * s.z - 1.0) / 2.0 / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 7) { // l = 2, m = 1\n\
        return -sqrt(15.0) * s.x * s.z / twoSqrtPi;\n\
    }\n\
\n\
    if (index == 8) { // l = 2, m = 2\n\
        return sqrt(15.0) * (s.x * s.x - s.y * s.y) / 2.0 / twoSqrtPi;\n\
    }\n\
\n\
    return 0.0;\n\
}\n\
\n\
float vdcRadicalInverse(int i)\n\
{\n\
    float r;\n\
    float base = 2.0;\n\
    float value = 0.0;\n\
    float invBase = 1.0 / base;\n\
    float invBi = invBase;\n\
    for (int x = 0; x < 100; x++)\n\
    {\n\
        if (i <= 0)\n\
        {\n\
            break;\n\
        }\n\
        r = mod(float(i), base);\n\
        value += r * invBi;\n\
        invBi *= invBase;\n\
        i = int(float(i) * invBase);\n\
    }\n\
    return value;\n\
}\n\
\n\
vec2 hammersley2D(int i, int N)\n\
{\n\
    return vec2(float(i) / float(N), vdcRadicalInverse(i));\n\
}\n\
\n\
// Sample count is relatively low for the sake of performance, but should still be enough to capture directionality needed for third-order harmonics\n\
const int samples = 256; \n\
const float solidAngle = 1.0 / float(samples);\n\
\n\
void main() {\n\
    // Get the current coefficient based on the uv\n\
   vec2 uv = v_textureCoordinates.xy * 3.0;\n\
   int coefficientIndex = int(floor(uv.y) * 3.0 + floor(uv.x));\n\
\n\
    for (int i = 0; i < samples; ++i) {\n\
        vec2 xi = hammersley2D(i, samples);\n\
        float phi = czm_twoPi * xi.x;\n\
        float cosTheta = 1.0 - 2.0 * sqrt(1.0 - xi.y * xi.y);\n\
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);\n\
        vec3 direction = normalize(vec3(sinTheta * cos(phi), cosTheta, sinTheta * sin(phi)));\n\
\n\
        // Generate the spherical harmonics basis from the direction\n\
        float Ylm = computeShBasis(coefficientIndex, direction);\n\
\n\
        vec3 lookupDirection = -direction.xyz;\n\
        lookupDirection.z = -lookupDirection.z;\n\
\n\
        vec4 color = czm_textureCube(u_radianceMap, lookupDirection, 0.0);\n\
\n\
        // Use the relevant function for this coefficient\n\
        out_FragColor += Ylm * color * solidAngle * sinTheta;\n\
    }\n\
    \n\
}\n\
";
