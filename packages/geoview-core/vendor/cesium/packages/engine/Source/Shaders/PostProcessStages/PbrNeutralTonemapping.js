//This file is automatically rebuilt by the Cesium build process.
export default "uniform sampler2D colorTexture;\n\
\n\
in vec2 v_textureCoordinates;\n\
\n\
#ifdef AUTO_EXPOSURE\n\
uniform sampler2D autoExposure;\n\
#else\n\
uniform float exposure;\n\
#endif\n\
\n\
void main()\n\
{\n\
    vec4 fragmentColor = texture(colorTexture, v_textureCoordinates);\n\
    vec3 color = fragmentColor.rgb;\n\
\n\
#ifdef AUTO_EXPOSURE\n\
    color /= texture(autoExposure, vec2(0.5)).r;\n\
#else\n\
    color *= vec3(exposure);\n\
#endif\n\
    color = czm_pbrNeutralTonemapping(color);\n\
    color = czm_inverseGamma(color);\n\
\n\
    out_FragColor = vec4(color, fragmentColor.a);\n\
}\n\
";
