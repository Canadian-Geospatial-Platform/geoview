//This file is automatically rebuilt by the Cesium build process.
export default "\n\
precision highp float;\n\
czm_modelMaterial defaultModelMaterial()\n\
{\n\
    czm_modelMaterial material;\n\
    material.diffuse = vec3(0.0);\n\
    material.specular = vec3(1.0);\n\
    material.roughness = 1.0;\n\
    material.occlusion = 1.0;\n\
    material.normalEC = vec3(0.0, 0.0, 1.0);\n\
    material.emissive = vec3(0.0);\n\
    material.alpha = 1.0;\n\
    return material;\n\
}\n\
\n\
vec4 handleAlpha(vec3 color, float alpha)\n\
{\n\
    #ifdef ALPHA_MODE_MASK\n\
    if (alpha < u_alphaCutoff) {\n\
        discard;\n\
    }\n\
    #endif\n\
\n\
    return vec4(color, alpha);\n\
}\n\
\n\
SelectedFeature selectedFeature;\n\
\n\
void main()\n\
{\n\
    #ifdef HAS_POINT_CLOUD_SHOW_STYLE\n\
        if (v_pointCloudShow == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    #endif\n\
\n\
    #ifdef HAS_MODEL_SPLITTER\n\
    modelSplitterStage();\n\
    #endif\n\
\n\
    czm_modelMaterial material = defaultModelMaterial();\n\
\n\
    ProcessedAttributes attributes;\n\
    geometryStage(attributes);\n\
\n\
    FeatureIds featureIds;\n\
    featureIdStage(featureIds, attributes);\n\
\n\
    Metadata metadata;\n\
    MetadataClass metadataClass;\n\
    MetadataStatistics metadataStatistics;\n\
    metadataStage(metadata, metadataClass, metadataStatistics, attributes);\n\
\n\
    //========================================================================\n\
    // When not picking metadata START\n\
    #ifndef METADATA_PICKING_ENABLED\n\
\n\
    #ifdef HAS_SELECTED_FEATURE_ID\n\
    selectedFeatureIdStage(selectedFeature, featureIds);\n\
    #endif\n\
\n\
    #ifndef CUSTOM_SHADER_REPLACE_MATERIAL\n\
    materialStage(material, attributes, selectedFeature);\n\
    #endif\n\
\n\
    #ifdef HAS_CUSTOM_FRAGMENT_SHADER\n\
    customShaderStage(material, attributes, featureIds, metadata, metadataClass, metadataStatistics);\n\
    #endif\n\
\n\
    lightingStage(material, attributes);\n\
\n\
    #ifdef HAS_SELECTED_FEATURE_ID\n\
    cpuStylingStage(material, selectedFeature);\n\
    #endif\n\
\n\
    #ifdef HAS_MODEL_COLOR\n\
    modelColorStage(material);\n\
    #endif\n\
\n\
    #ifdef HAS_PRIMITIVE_OUTLINE\n\
    primitiveOutlineStage(material);\n\
    #endif\n\
\n\
    vec4 color = handleAlpha(material.diffuse, material.alpha);\n\
\n\
    // When not picking metadata END\n\
    //========================================================================\n\
    #else \n\
    //========================================================================\n\
    // When picking metadata START\n\
\n\
    vec4 metadataValues = vec4(0.0, 0.0, 0.0, 0.0);\n\
    metadataPickingStage(metadata, metadataClass, metadataValues);\n\
    vec4 color = metadataValues;\n\
\n\
    #endif\n\
    // When picking metadata END\n\
    //========================================================================\n\
\n\
    #ifdef HAS_CLIPPING_PLANES\n\
    modelClippingPlanesStage(color);\n\
    #endif\n\
\n\
    #ifdef ENABLE_CLIPPING_POLYGONS\n\
    modelClippingPolygonsStage();\n\
    #endif\n\
\n\
    //========================================================================\n\
    // When not picking metadata START\n\
    #ifndef METADATA_PICKING_ENABLED\n\
\n\
    #if defined(HAS_SILHOUETTE) && defined(HAS_NORMALS)\n\
    silhouetteStage(color);\n\
    #endif\n\
\n\
    #ifdef HAS_ATMOSPHERE\n\
    atmosphereStage(color, attributes);\n\
    #endif\n\
\n\
    #endif\n\
    // When not picking metadata END\n\
    //========================================================================\n\
\n\
    out_FragColor = color;\n\
}\n\
";
