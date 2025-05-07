//This file is automatically rebuilt by the Cesium build process.
export default "void atmosphereStage(ProcessedAttributes attributes) {\n\
    vec3 lightDirection = czm_getDynamicAtmosphereLightDirection(v_positionWC, czm_atmosphereDynamicLighting);\n\
\n\
    czm_computeGroundAtmosphereScattering(\n\
        // This assumes the geometry stage came before this.\n\
        v_positionWC,\n\
        lightDirection,\n\
        v_atmosphereRayleighColor,\n\
        v_atmosphereMieColor,\n\
        v_atmosphereOpacity\n\
    );\n\
}\n\
";
