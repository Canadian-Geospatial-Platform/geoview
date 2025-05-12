//This file is automatically rebuilt by the Cesium build process.
export default "vec2 getLookupUv(vec2 dimensions, int i) {\n\
    int pixY = i / int(dimensions.x);\n\
    int pixX = i - (pixY * int(dimensions.x));\n\
    float pixelWidth = 1.0 / dimensions.x;\n\
    float pixelHeight = 1.0 / dimensions.y;\n\
    float u = (float(pixX) + 0.5) * pixelWidth; // sample from center of pixel\n\
    float v = (float(pixY) + 0.5) * pixelHeight;\n\
    return vec2(u, v);\n\
}\n\
\n\
vec4 czm_unpackClippingExtents(highp sampler2D extentsTexture, int index) {\n\
    vec2 textureDimensions = vec2(textureSize(extentsTexture, 0));\n\
    return texture(extentsTexture, getLookupUv(textureDimensions, index));\n\
}";
