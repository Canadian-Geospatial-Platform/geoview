//This file is automatically rebuilt by the Cesium build process.
export default "/* Cylinder defines (set in Scene/VoxelCylinderShape.js)\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_RADIUS\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_HEIGHT\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_ANGLE\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_DISCONTINUITY\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MAX_DISCONTINUITY\n\
#define CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_MAX_REVERSED\n\
*/\n\
\n\
#if defined(CYLINDER_HAS_SHAPE_BOUNDS_RADIUS)\n\
    uniform vec2 u_cylinderUvToShapeUvRadius; // x = scale, y = offset\n\
#endif\n\
#if defined(CYLINDER_HAS_SHAPE_BOUNDS_HEIGHT)\n\
    uniform vec2 u_cylinderUvToShapeUvHeight; // x = scale, y = offset\n\
#endif\n\
#if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE)\n\
    uniform vec2 u_cylinderUvToShapeUvAngle; // x = scale, y = offset\n\
#endif\n\
#if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_DISCONTINUITY) || defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MAX_DISCONTINUITY)\n\
    uniform vec2 u_cylinderShapeUvAngleMinMax;\n\
#endif\n\
#if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_DISCONTINUITY) || defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MAX_DISCONTINUITY) || defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_MAX_REVERSED)\n\
    uniform float u_cylinderShapeUvAngleRangeZeroMid;\n\
#endif\n\
\n\
PointJacobianT convertUvToShapeSpaceDerivative(in vec3 positionUv) {\n\
    // Convert from Cartesian UV space [0, 1] to Cartesian local space [-1, 1]\n\
    vec3 position = positionUv * 2.0 - 1.0;\n\
\n\
    float radius = length(position.xy); // [0, 1]\n\
    vec3 radial = normalize(vec3(position.xy, 0.0));\n\
\n\
    // Shape space height is defined within [0, 1]\n\
    float height = positionUv.z; // [0, 1]\n\
    vec3 z = vec3(0.0, 0.0, 1.0);\n\
\n\
    float angle = atan(position.y, position.x);\n\
    vec3 east = normalize(vec3(-position.y, position.x, 0.0));\n\
\n\
    vec3 point = vec3(radius, angle, height);\n\
    mat3 jacobianT = mat3(radial, z, east / length(position.xy));\n\
    return PointJacobianT(point, jacobianT);\n\
}\n\
\n\
vec3 convertShapeToShapeUvSpace(in vec3 positionShape) {\n\
    float radius = positionShape.x;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_RADIUS)\n\
        radius = radius * u_cylinderUvToShapeUvRadius.x + u_cylinderUvToShapeUvRadius.y;\n\
    #endif\n\
\n\
    float angle = (positionShape.y + czm_pi) / czm_twoPi;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE)\n\
        #if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_MAX_REVERSED)\n\
            // Comparing against u_cylinderShapeUvAngleMinMax has precision problems. u_cylinderShapeUvAngleRangeZeroMid is more conservative.\n\
            angle += float(angle < u_cylinderShapeUvAngleRangeZeroMid);\n\
        #endif\n\
\n\
        // Avoid flickering from reading voxels from both sides of the -pi/+pi discontinuity.\n\
        #if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MIN_DISCONTINUITY)\n\
            angle = angle > u_cylinderShapeUvAngleRangeZeroMid ? u_cylinderShapeUvAngleMinMax.x : angle;\n\
        #elif defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE_MAX_DISCONTINUITY)\n\
            angle = angle < u_cylinderShapeUvAngleRangeZeroMid ? u_cylinderShapeUvAngleMinMax.y : angle;\n\
        #endif\n\
\n\
        angle = angle * u_cylinderUvToShapeUvAngle.x + u_cylinderUvToShapeUvAngle.y;\n\
    #endif\n\
\n\
    float height = positionShape.z;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_HEIGHT)\n\
        height = height * u_cylinderUvToShapeUvHeight.x + u_cylinderUvToShapeUvHeight.y;\n\
    #endif\n\
\n\
    return vec3(radius, angle, height);\n\
}\n\
\n\
PointJacobianT convertUvToShapeUvSpaceDerivative(in vec3 positionUv) {\n\
    PointJacobianT pointJacobian = convertUvToShapeSpaceDerivative(positionUv);\n\
    pointJacobian.point = convertShapeToShapeUvSpace(pointJacobian.point);\n\
    return pointJacobian;\n\
}\n\
\n\
vec3 scaleShapeUvToShapeSpace(in vec3 shapeUv) {\n\
    float radius = shapeUv.x;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_RADIUS)\n\
        radius /= u_cylinderUvToShapeUvRadius.x;\n\
    #endif\n\
\n\
    float angle = shapeUv.y * czm_twoPi;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_ANGLE)\n\
        angle /= u_cylinderUvToShapeUvAngle.x;\n\
    #endif\n\
\n\
    float height = shapeUv.z;\n\
    #if defined(CYLINDER_HAS_SHAPE_BOUNDS_HEIGHT)\n\
        height /= u_cylinderUvToShapeUvHeight.x;\n\
    #endif\n\
\n\
    return vec3(radius, angle, height);\n\
}\n\
";
