//This file is automatically rebuilt by the Cesium build process.
export default "/* Ellipsoid defines (set in Scene/VoxelEllipsoidShape.js)\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MIN_DISCONTINUITY\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MAX_DISCONTINUITY\n\
#define ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE\n\
#define ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE_MIN_MAX_REVERSED\n\
#define ELLIPSOID_HAS_SHAPE_BOUNDS_LATITUDE\n\
*/\n\
\n\
uniform vec3 u_ellipsoidRadiiUv; // [0,1]\n\
uniform vec2 u_evoluteScale; // (radiiUv.x ^ 2 - radiiUv.z ^ 2) * vec2(1.0, -1.0) / radiiUv;\n\
uniform vec3 u_ellipsoidInverseRadiiSquaredUv;\n\
#if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MIN_DISCONTINUITY) || defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MAX_DISCONTINUITY) || defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE_MIN_MAX_REVERSED)\n\
    uniform vec3 u_ellipsoidShapeUvLongitudeMinMaxMid;\n\
#endif\n\
#if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE)\n\
    uniform vec2 u_ellipsoidUvToShapeUvLongitude; // x = scale, y = offset\n\
#endif\n\
#if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LATITUDE)\n\
    uniform vec2 u_ellipsoidUvToShapeUvLatitude; // x = scale, y = offset\n\
#endif\n\
uniform float u_ellipsoidInverseHeightDifferenceUv;\n\
\n\
// robust iterative solution without trig functions\n\
// https://github.com/0xfaded/ellipse_demo/issues/1\n\
// https://stackoverflow.com/questions/22959698/distance-from-given-point-to-given-ellipse\n\
// Extended to return radius of curvature along with the point\n\
vec3 nearestPointAndRadiusOnEllipse(vec2 pos, vec2 radii) {\n\
    vec2 p = abs(pos);\n\
    vec2 inverseRadii = 1.0 / radii;\n\
\n\
    // We describe the ellipse parametrically: v = radii * vec2(cos(t), sin(t))\n\
    // but store the cos and sin of t in a vec2 for efficiency.\n\
    // Initial guess: t = pi/4\n\
    vec2 tTrigs = vec2(0.7071067811865476);\n\
    // Initial guess of point on ellipsoid\n\
    vec2 v = radii * tTrigs;\n\
    // Center of curvature of the ellipse at v\n\
    vec2 evolute = u_evoluteScale * tTrigs * tTrigs * tTrigs;\n\
\n\
    const int iterations = 3;\n\
    for (int i = 0; i < iterations; ++i) {\n\
        // Find the (approximate) intersection of p - evolute with the ellipsoid.\n\
        vec2 q = normalize(p - evolute) * length(v - evolute);\n\
        // Update the estimate of t.\n\
        tTrigs = (q + evolute) * inverseRadii;\n\
        tTrigs = normalize(clamp(tTrigs, 0.0, 1.0));\n\
        v = radii * tTrigs;\n\
        evolute = u_evoluteScale * tTrigs * tTrigs * tTrigs;\n\
    }\n\
\n\
    return vec3(v * sign(pos), length(v - evolute));\n\
}\n\
\n\
PointJacobianT convertUvToShapeSpaceDerivative(in vec3 positionUv) {\n\
    // Convert from UV space [0, 1] to local space [-1, 1]\n\
    vec3 position = positionUv * 2.0 - 1.0;\n\
    // Undo the scaling from ellipsoid to sphere\n\
    position = position * u_ellipsoidRadiiUv;\n\
\n\
    float longitude = atan(position.y, position.x);\n\
    vec3 east = normalize(vec3(-position.y, position.x, 0.0));\n\
\n\
    // Convert the 3D position to a 2D position relative to the ellipse (radii.x, radii.z)\n\
    // (assume radii.y == radii.x) and find the nearest point on the ellipse and its normal\n\
    float distanceFromZAxis = length(position.xy);\n\
    vec2 posEllipse = vec2(distanceFromZAxis, position.z);\n\
    vec3 surfacePointAndRadius = nearestPointAndRadiusOnEllipse(posEllipse, u_ellipsoidRadiiUv.xz);\n\
    vec2 surfacePoint = surfacePointAndRadius.xy;\n\
\n\
    vec2 normal2d = normalize(surfacePoint * u_ellipsoidInverseRadiiSquaredUv.xz);\n\
    float latitude = atan(normal2d.y, normal2d.x);\n\
    vec3 north = vec3(-normal2d.y * normalize(position.xy), abs(normal2d.x));\n\
\n\
    float heightSign = length(posEllipse) < length(surfacePoint) ? -1.0 : 1.0;\n\
    float height = heightSign * length(posEllipse - surfacePoint);\n\
    vec3 up = normalize(cross(east, north));\n\
\n\
    vec3 point = vec3(longitude, latitude, height);\n\
    mat3 jacobianT = mat3(east / distanceFromZAxis, north / (surfacePointAndRadius.z + height), up);\n\
    return PointJacobianT(point, jacobianT);\n\
}\n\
\n\
vec3 convertShapeToShapeUvSpace(in vec3 positionShape) {\n\
    // Longitude: shift & scale to [0, 1]\n\
    float longitude = (positionShape.x + czm_pi) / czm_twoPi;\n\
\n\
    // Correct the angle when max < min\n\
    // Technically this should compare against min longitude - but it has precision problems so compare against the middle of empty space.\n\
    #if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE_MIN_MAX_REVERSED)\n\
        longitude += float(longitude < u_ellipsoidShapeUvLongitudeMinMaxMid.z);\n\
    #endif\n\
\n\
    // Avoid flickering from reading voxels from both sides of the -pi/+pi discontinuity.\n\
    #if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MIN_DISCONTINUITY)\n\
        longitude = longitude > u_ellipsoidShapeUvLongitudeMinMaxMid.z ? u_ellipsoidShapeUvLongitudeMinMaxMid.x : longitude;\n\
    #endif\n\
    #if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_MAX_DISCONTINUITY)\n\
        longitude = longitude < u_ellipsoidShapeUvLongitudeMinMaxMid.z ? u_ellipsoidShapeUvLongitudeMinMaxMid.y : longitude;\n\
    #endif\n\
\n\
    #if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE)\n\
        longitude = longitude * u_ellipsoidUvToShapeUvLongitude.x + u_ellipsoidUvToShapeUvLongitude.y;\n\
    #endif\n\
\n\
    // Latitude: shift and scale to [0, 1]\n\
    float latitude = (positionShape.y + czm_piOverTwo) / czm_pi;\n\
    #if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LATITUDE)\n\
        latitude = latitude * u_ellipsoidUvToShapeUvLatitude.x + u_ellipsoidUvToShapeUvLatitude.y;\n\
    #endif\n\
\n\
    // Height: scale to the range [0, 1]\n\
    float height = 1.0 + positionShape.z * u_ellipsoidInverseHeightDifferenceUv;\n\
\n\
    return vec3(longitude, latitude, height);\n\
}\n\
\n\
PointJacobianT convertUvToShapeUvSpaceDerivative(in vec3 positionUv) {\n\
    PointJacobianT pointJacobian = convertUvToShapeSpaceDerivative(positionUv);\n\
    pointJacobian.point = convertShapeToShapeUvSpace(pointJacobian.point);\n\
    return pointJacobian;\n\
}\n\
\n\
vec3 scaleShapeUvToShapeSpace(in vec3 shapeUv) {\n\
    // Convert from [0, 1] to radians [-pi, pi]\n\
    float longitude = shapeUv.x * czm_twoPi;\n\
    #if defined (ELLIPSOID_HAS_SHAPE_BOUNDS_LONGITUDE)\n\
        longitude /= u_ellipsoidUvToShapeUvLongitude.x;\n\
    #endif\n\
\n\
    // Convert from [0, 1] to radians [-pi/2, pi/2]\n\
    float latitude = shapeUv.y * czm_pi;\n\
    #if defined(ELLIPSOID_HAS_SHAPE_BOUNDS_LATITUDE)\n\
        latitude /= u_ellipsoidUvToShapeUvLatitude.x;\n\
    #endif\n\
    \n\
    float height = shapeUv.z / u_ellipsoidInverseHeightDifferenceUv;\n\
\n\
    return vec3(longitude, latitude, height);\n\
}\n\
";
