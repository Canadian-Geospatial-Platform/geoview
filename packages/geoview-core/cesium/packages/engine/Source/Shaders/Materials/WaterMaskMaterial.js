//This file is automatically rebuilt by the Cesium build process.
export default "uniform vec4 waterColor;\n\
uniform vec4 landColor;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
\n\
    vec4 outColor = mix(landColor, waterColor, materialInput.waterMask);\n\
    outColor = czm_gammaCorrect(outColor);\n\
\n\
    material.diffuse = outColor.rgb;\n\
    material.alpha = outColor.a;\n\
\n\
    return material;\n\
}\n\
";
