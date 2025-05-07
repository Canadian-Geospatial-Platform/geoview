//This file is automatically rebuilt by the Cesium build process.
export default "// See IntersectionUtils.glsl for the definitions of Ray, NO_HIT, Intersections,\n\
// RayShapeIntersection, setSurfaceIntersection, setShapeIntersection,\n\
// intersectIntersections\n\
// See IntersectLongitude.glsl for the definitions of intersectHalfPlane,\n\
// intersectFlippedWedge, intersectRegularWedge\n\
\n\
/* Cylinder defines (set in Scene/VoxelCylinderShape.js)\n\
#define CYLINDER_HAS_RENDER_BOUNDS_RADIUS_MIN\n\
#define CYLINDER_HAS_RENDER_BOUNDS_RADIUS_FLAT\n\
#define CYLINDER_HAS_RENDER_BOUNDS_ANGLE\n\
#define CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_UNDER_HALF\n\
#define CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_OVER_HALF\n\
#define CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_EQUAL_ZERO\n\
\n\
#define CYLINDER_INTERSECTION_INDEX_RADIUS_MAX\n\
#define CYLINDER_INTERSECTION_INDEX_RADIUS_MIN\n\
#define CYLINDER_INTERSECTION_INDEX_ANGLE\n\
*/\n\
\n\
// Cylinder uniforms\n\
uniform vec2 u_cylinderRenderRadiusMinMax;\n\
uniform vec2 u_cylinderRenderHeightMinMax;\n\
#if defined(CYLINDER_HAS_RENDER_BOUNDS_ANGLE)\n\
    uniform vec2 u_cylinderRenderAngleMinMax;\n\
#endif\n\
\n\
/**\n\
 * Find the intersection of a ray with the volume defined by two planes of constant z\n\
 */\n\
RayShapeIntersection intersectHeightBounds(in Ray ray, in vec2 minMaxHeight, in bool convex)\n\
{\n\
    float zPosition = ray.pos.z;\n\
    float zDirection = ray.dir.z;\n\
\n\
    float tmin = (minMaxHeight.x - zPosition) / zDirection;\n\
    float tmax = (minMaxHeight.y - zPosition) / zDirection;\n\
\n\
    // Normals point outside the volume\n\
    float signFlip = convex ? 1.0 : -1.0;\n\
    vec4 intersectMin = vec4(0.0, 0.0, -1.0 * signFlip, tmin);\n\
    vec4 intersectMax = vec4(0.0, 0.0, 1.0 * signFlip, tmax);\n\
\n\
    bool topEntry = zDirection < 0.0;\n\
    vec4 entry = topEntry ? intersectMax : intersectMin;\n\
    vec4 exit = topEntry ? intersectMin : intersectMax;\n\
\n\
    return RayShapeIntersection(entry, exit);\n\
}\n\
\n\
/**\n\
 * Find the intersection of a ray with a right cylindrical surface of a given radius\n\
 * about the z-axis.\n\
 */\n\
RayShapeIntersection intersectCylinder(in Ray ray, in float radius, in bool convex)\n\
{\n\
    vec2 position = ray.pos.xy;\n\
    vec2 direction = ray.dir.xy;\n\
\n\
    float a = dot(direction, direction);\n\
    float b = dot(position, direction);\n\
    float c = dot(position, position) - radius * radius;\n\
    float determinant = b * b - a * c;\n\
\n\
    if (determinant < 0.0) {\n\
        vec4 miss = vec4(normalize(ray.dir), NO_HIT);\n\
        return RayShapeIntersection(miss, miss);\n\
    }\n\
\n\
    determinant = sqrt(determinant);\n\
    float t1 = (-b - determinant) / a;\n\
    float t2 = (-b + determinant) / a;\n\
    float signFlip = convex ? 1.0 : -1.0;\n\
    vec4 intersect1 = vec4(normalize(position + t1 * direction) * signFlip, 0.0, t1);\n\
    vec4 intersect2 = vec4(normalize(position + t2 * direction) * signFlip, 0.0, t2);\n\
\n\
    return RayShapeIntersection(intersect1, intersect2);\n\
}\n\
\n\
/**\n\
 * Find the intersection of a ray with a right cylindrical solid of given\n\
 * radius and height bounds. NOTE: The shape is assumed to be convex.\n\
 */\n\
RayShapeIntersection intersectBoundedCylinder(in Ray ray, in float radius, in vec2 minMaxHeight)\n\
{\n\
    RayShapeIntersection cylinderIntersection = intersectCylinder(ray, radius, true);\n\
    RayShapeIntersection heightBoundsIntersection = intersectHeightBounds(ray, minMaxHeight, true);\n\
    return intersectIntersections(ray, cylinderIntersection, heightBoundsIntersection);\n\
}\n\
\n\
void intersectShape(Ray ray, inout Intersections ix)\n\
{\n\
    // Position is converted from [0,1] to [-1,+1] because shape intersections assume unit space is [-1,+1].\n\
    // Direction is scaled as well to be in sync with position.\n\
    ray.pos = ray.pos * 2.0 - 1.0;\n\
    ray.dir *= 2.0;\n\
\n\
    RayShapeIntersection outerIntersect = intersectBoundedCylinder(ray, u_cylinderRenderRadiusMinMax.y, u_cylinderRenderHeightMinMax);\n\
\n\
    setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_RADIUS_MAX, outerIntersect);\n\
\n\
    if (outerIntersect.entry.w == NO_HIT) {\n\
        return;\n\
    }\n\
\n\
    #if defined(CYLINDER_HAS_RENDER_BOUNDS_RADIUS_FLAT)\n\
        // When the cylinder is perfectly thin it's necessary to sandwich the\n\
        // inner cylinder intersection inside the outer cylinder intersection.\n\
\n\
        // Without this special case,\n\
        // [outerMin, outerMax, innerMin, innerMax] will bubble sort to\n\
        // [outerMin, innerMin, outerMax, innerMax] which will cause the back\n\
        // side of the cylinder to be invisible because it will think the ray\n\
        // is still inside the inner (negative) cylinder after exiting the\n\
        // outer (positive) cylinder.\n\
\n\
        // With this special case,\n\
        // [outerMin, innerMin, innerMax, outerMax] will bubble sort to\n\
        // [outerMin, innerMin, innerMax, outerMax] which will work correctly.\n\
\n\
        // Note: If initializeIntersections() changes its sorting function\n\
        // from bubble sort to something else, this code may need to change.\n\
        RayShapeIntersection innerIntersect = intersectCylinder(ray, 1.0, false);\n\
        setSurfaceIntersection(ix, 0, outerIntersect.entry, true, true);  // positive, enter\n\
        setSurfaceIntersection(ix, 1, innerIntersect.entry, false, true); // negative, enter\n\
        setSurfaceIntersection(ix, 2, innerIntersect.exit, false, false); // negative, exit\n\
        setSurfaceIntersection(ix, 3, outerIntersect.exit, true, false);  // positive, exit\n\
    #elif defined(CYLINDER_HAS_RENDER_BOUNDS_RADIUS_MIN)\n\
        RayShapeIntersection innerIntersect = intersectCylinder(ray, u_cylinderRenderRadiusMinMax.x, false);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_RADIUS_MIN, innerIntersect);\n\
    #endif\n\
\n\
    #if defined(CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_UNDER_HALF)\n\
        RayShapeIntersection wedgeIntersect = intersectRegularWedge(ray, u_cylinderRenderAngleMinMax);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_ANGLE, wedgeIntersect);\n\
    #elif defined(CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_OVER_HALF)\n\
        RayShapeIntersection wedgeIntersects[2];\n\
        intersectFlippedWedge(ray, u_cylinderRenderAngleMinMax, wedgeIntersects);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_ANGLE + 0, wedgeIntersects[0]);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_ANGLE + 1, wedgeIntersects[1]);\n\
    #elif defined(CYLINDER_HAS_RENDER_BOUNDS_ANGLE_RANGE_EQUAL_ZERO)\n\
        RayShapeIntersection wedgeIntersects[2];\n\
        intersectHalfPlane(ray, u_cylinderRenderAngleMinMax.x, wedgeIntersects);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_ANGLE + 0, wedgeIntersects[0]);\n\
        setShapeIntersection(ix, CYLINDER_INTERSECTION_INDEX_ANGLE + 1, wedgeIntersects[1]);\n\
    #endif\n\
}\n\
";
