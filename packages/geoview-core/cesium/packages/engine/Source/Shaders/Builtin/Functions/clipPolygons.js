//This file is automatically rebuilt by the Cesium build process.
export default "float getSignedDistance(vec2 uv, highp sampler2D clippingDistance) {\n\
    float signedDistance = texture(clippingDistance, uv).r;\n\
    return (signedDistance - 0.5) * 2.0;\n\
}\n\
\n\
void czm_clipPolygons(highp sampler2D clippingDistance, int extentsLength, vec2 clippingPosition, int regionIndex) {\n\
    // Position is completely outside of polygons bounds\n\
    vec2 rectUv = clippingPosition;\n\
    if (regionIndex < 0 || rectUv.x <= 0.0 || rectUv.y <= 0.0 || rectUv.x >= 1.0 || rectUv.y >= 1.0) {\n\
        #ifdef CLIPPING_INVERSE \n\
            discard;\n\
        #endif\n\
        return;\n\
    }\n\
\n\
    vec2 clippingDistanceTextureDimensions = vec2(textureSize(clippingDistance, 0));\n\
    vec2 sampleOffset = max(1.0 / clippingDistanceTextureDimensions, vec2(0.005));\n\
    float dimension = float(extentsLength);\n\
    if (extentsLength > 2) {\n\
       dimension = ceil(log2(float(extentsLength)));\n\
    }\n\
\n\
    vec2 textureOffset = vec2(mod(float(regionIndex), dimension), floor(float(regionIndex) / dimension)) / dimension;\n\
    vec2 uv = textureOffset + rectUv / dimension;\n\
\n\
    float signedDistance = getSignedDistance(uv, clippingDistance);\n\
\n\
    #ifdef CLIPPING_INVERSE\n\
    if (signedDistance > 0.0)  {\n\
        discard;\n\
    }\n\
    #else\n\
    if (signedDistance < 0.0)  {\n\
        discard;\n\
    }\n\
    #endif\n\
}\n\
";
