//This file is automatically rebuilt by the Cesium build process.
export default "precision highp float;\n\
\n\
in vec3 v_textureCoordinates;\n\
\n\
uniform float u_roughness;\n\
uniform samplerCube u_radianceTexture;\n\
uniform vec3 u_faceDirection;\n\
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
vec3 importanceSampleGGX(vec2 xi, float alphaRoughness, vec3 N)\n\
{\n\
    float alphaRoughnessSquared = alphaRoughness * alphaRoughness;\n\
    float phi = czm_twoPi * xi.x;\n\
    float cosTheta = sqrt((1.0 - xi.y) / (1.0 + (alphaRoughnessSquared - 1.0) * xi.y));\n\
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);\n\
    vec3 H = vec3(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);\n\
    vec3 upVector = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);\n\
    vec3 tangentX = normalize(cross(upVector, N));\n\
    vec3 tangentY = cross(N, tangentX);\n\
    return tangentX * H.x + tangentY * H.y + N * H.z;\n\
}\n\
\n\
// Sample count is relatively low for the sake of performance, but should still be enough to prevent artifacting in lower roughnesses\n\
const int samples = 128;\n\
\n\
void main() {\n\
    vec3 normal = u_faceDirection;\n\
    vec3 V = normalize(v_textureCoordinates);\n\
    float roughness = u_roughness;\n\
\n\
    vec4 color = vec4(0.0);\n\
    float weight = 0.0;\n\
    for (int i = 0; i < samples; ++i) {\n\
            vec2 xi = hammersley2D(i, samples);\n\
            vec3 H = importanceSampleGGX(xi, roughness, V);\n\
            vec3 L = 2.0 * dot(V, H) * H - V; // reflected vector\n\
\n\
            float NdotL = max(dot(V, L), 0.0);\n\
            if (NdotL > 0.0) {\n\
                color += vec4(czm_textureCube(u_radianceTexture, L).rgb, 1.0) * NdotL;\n\
                weight += NdotL;\n\
            }\n\
        }\n\
    out_FragColor = color / weight;\n\
}\n\
";
