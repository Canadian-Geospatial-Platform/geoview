//This file is automatically rebuilt by the Cesium build process.
export default "void modelClippingPolygonsStage()\n\
{\n\
    vec2 clippingPosition = v_clippingPosition;\n\
    int regionIndex = v_regionIndex;\n\
    czm_clipPolygons(model_clippingDistance, CLIPPING_POLYGON_REGIONS_LENGTH, clippingPosition, regionIndex);\n\
}\n\
";
