//This file is automatically rebuilt by the Cesium build process.
export default "/* Box defines (set in Scene/VoxelBoxShape.js)\n\
#define BOX_HAS_SHAPE_BOUNDS\n\
*/\n\
\n\
#if defined(BOX_HAS_SHAPE_BOUNDS)\n\
    uniform vec3 u_boxUvToShapeUvScale;\n\
    uniform vec3 u_boxUvToShapeUvTranslate;\n\
#endif\n\
\n\
PointJacobianT convertUvToShapeSpaceDerivative(in vec3 positionUv) {\n\
    // For BOX, UV space = shape space, so we can use positionUv as-is,\n\
    // and the Jacobian is the identity matrix, except that a step of 1\n\
    // only spans half the shape space [-1, 1], so the identity is scaled.\n\
    return PointJacobianT(positionUv, mat3(0.5));\n\
}\n\
\n\
vec3 convertShapeToShapeUvSpace(in vec3 positionShape) {\n\
#if defined(BOX_HAS_SHAPE_BOUNDS)\n\
    return positionShape * u_boxUvToShapeUvScale + u_boxUvToShapeUvTranslate;\n\
#else\n\
    return positionShape;\n\
#endif\n\
}\n\
\n\
PointJacobianT convertUvToShapeUvSpaceDerivative(in vec3 positionUv) {\n\
    PointJacobianT pointJacobian = convertUvToShapeSpaceDerivative(positionUv);\n\
    pointJacobian.point = convertShapeToShapeUvSpace(pointJacobian.point);\n\
    return pointJacobian;\n\
}\n\
\n\
vec3 convertShapeUvToUvSpace(in vec3 shapeUv) {\n\
#if defined(BOX_HAS_SHAPE_BOUNDS)\n\
    return (shapeUv - u_boxUvToShapeUvTranslate) / u_boxUvToShapeUvScale;\n\
#else\n\
    return shapeUv;\n\
#endif\n\
}\n\
\n\
vec3 scaleShapeUvToShapeSpace(in vec3 shapeUv) {\n\
#if defined(BOX_HAS_SHAPE_BOUNDS)\n\
    return shapeUv / u_boxUvToShapeUvScale;\n\
#else\n\
    return shapeUv;\n\
#endif\n\
}";
