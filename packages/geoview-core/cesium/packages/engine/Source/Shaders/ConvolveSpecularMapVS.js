//This file is automatically rebuilt by the Cesium build process.
export default "in vec3 position;\n\
out vec3 v_textureCoordinates;\n\
\n\
uniform vec3 u_faceDirection;\n\
\n\
vec3 getCubeMapDirection(vec2 uv, vec3 faceDir) {\n\
    vec2 scaledUV = uv;\n\
\n\
    if (faceDir.x != 0.0) {\n\
        return vec3(faceDir.x, scaledUV.y, scaledUV.x * faceDir.x);\n\
    } else if (faceDir.y != 0.0) {\n\
        return vec3(scaledUV.x, -faceDir.y, -scaledUV.y * faceDir.y);\n\
    } else {\n\
        return vec3(scaledUV.x * faceDir.z, scaledUV.y, -faceDir.z); \n\
    }\n\
}\n\
\n\
void main() \n\
{\n\
    v_textureCoordinates = getCubeMapDirection(position.xy, u_faceDirection);\n\
    v_textureCoordinates.y = -v_textureCoordinates.y;\n\
    v_textureCoordinates.z = -v_textureCoordinates.z;\n\
    gl_Position = vec4(position, 1.0);\n\
}\n\
";
