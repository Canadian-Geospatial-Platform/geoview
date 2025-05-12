//This file is automatically rebuilt by the Cesium build process.
export default "void modelClippingPolygonsStage(ProcessedAttributes attributes)\n\
{\n\
    vec2 sphericalLatLong = czm_approximateSphericalCoordinates(v_positionWC);\n\
    sphericalLatLong.y = czm_branchFreeTernary(sphericalLatLong.y < czm_pi, sphericalLatLong.y, sphericalLatLong.y - czm_twoPi);\n\
\n\
    vec2 minDistance = vec2(czm_infinity);\n\
    v_regionIndex = -1;\n\
    v_clippingPosition = vec2(czm_infinity);\n\
\n\
    for (int regionIndex = 0; regionIndex < CLIPPING_POLYGON_REGIONS_LENGTH; regionIndex++) {\n\
        vec4 extents = czm_unpackClippingExtents(model_clippingExtents, regionIndex);\n\
        vec2 rectUv = (sphericalLatLong.yx - extents.yx) * extents.wz;\n\
\n\
        vec2 clamped = clamp(rectUv, vec2(0.0), vec2(1.0));\n\
        vec2 distance = abs(rectUv - clamped) * extents.wz;\n\
        \n\
        if (minDistance.x > distance.x || minDistance.y > distance.y) {\n\
            minDistance = distance;\n\
            v_clippingPosition = rectUv;\n\
        }\n\
\n\
        float threshold = 0.01;\n\
        if (rectUv.x > threshold && rectUv.y > threshold && rectUv.x < 1.0 - threshold && rectUv.y < 1.0 - threshold) {\n\
            v_regionIndex = regionIndex;\n\
        }\n\
    }\n\
}\n\
";
