//This file is automatically rebuilt by the Cesium build process.
export default "// See IntersectionUtils.glsl for the definitions of Ray, NO_HIT, INF_HIT, Intersections,\n\
// RayShapeIntersection, setSurfaceIntersection, setShapeIntersection\n\
// See IntersectLongitude.glsl for the definitions of intersectHalfPlane,\n\
// intersectFlippedWedge, intersectRegularWedge\n\
\n\
/* Ellipsoid defines (set in Scene/VoxelEllipsoidShape.js)\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_EQUAL_ZERO\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_UNDER_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_OVER_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_UNDER_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_EQUAL_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_OVER_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_UNDER_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_EQUAL_HALF\n\
#define ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_OVER_HALF\n\
#define ELLIPSOID_INTERSECTION_INDEX_LONGITUDE\n\
#define ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MAX\n\
#define ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MIN\n\
#define ELLIPSOID_INTERSECTION_INDEX_HEIGHT_MAX\n\
#define ELLIPSOID_INTERSECTION_INDEX_HEIGHT_MIN\n\
*/\n\
\n\
#if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE)\n\
    uniform vec2 u_ellipsoidRenderLongitudeMinMax;\n\
#endif\n\
uniform float u_eccentricitySquared;\n\
uniform vec2 u_ellipsoidRenderLatitudeSinMinMax;\n\
uniform vec2 u_clipMinMaxHeight;\n\
\n\
RayShapeIntersection intersectZPlane(in Ray ray, in float z) {\n\
    float t = -ray.pos.z / ray.dir.z;\n\
\n\
    bool startsOutside = sign(ray.pos.z) == sign(z);\n\
    bool entry = (t >= 0.0) != startsOutside;\n\
\n\
    vec4 intersect = vec4(0.0, 0.0, z, t);\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
\n\
    if (entry) {\n\
        return RayShapeIntersection(intersect, farSide);\n\
    } else {\n\
        return RayShapeIntersection(-1.0 * farSide, intersect);\n\
    }\n\
}\n\
\n\
RayShapeIntersection intersectHeight(in Ray ray, in float relativeHeight, in bool convex)\n\
{\n\
    // Scale the ray by the ellipsoid axes to make it a unit sphere\n\
    // Note: approximating ellipsoid + height as an ellipsoid\n\
    vec3 radiiCorrection = u_ellipsoidRadiiUv / (u_ellipsoidRadiiUv + relativeHeight);\n\
    vec3 position = ray.pos * radiiCorrection;\n\
    vec3 direction = ray.dir * radiiCorrection;\n\
\n\
    float a = dot(direction, direction); // ~ 1.0 (or maybe 4.0 if ray is scaled)\n\
    float b = dot(direction, position); // roughly inside [-1.0, 1.0] when zoomed in\n\
    float c = dot(position, position) - 1.0; // ~ 0.0 when zoomed in.\n\
    float determinant = b * b - a * c; // ~ b * b when zoomed in\n\
\n\
    if (determinant < 0.0) {\n\
        vec4 miss = vec4(normalize(direction), NO_HIT);\n\
        return RayShapeIntersection(miss, miss);\n\
    }\n\
\n\
    determinant = sqrt(determinant);\n\
\n\
    // Compute larger root using standard formula\n\
    float signB = b < 0.0 ? -1.0 : 1.0;\n\
    // The other root may suffer from subtractive cancellation in the standard formula.\n\
    // Compute it from the first root instead.\n\
    float t1 = (-b - signB * determinant) / a;\n\
    float t2 = c / (a * t1);\n\
    float tmin = min(t1, t2);\n\
    float tmax = max(t1, t2);\n\
\n\
    float directionScale = convex ? 1.0 : -1.0;\n\
    vec3 d1 = directionScale * normalize(position + tmin * direction);\n\
    vec3 d2 = directionScale * normalize(position + tmax * direction);\n\
\n\
    return RayShapeIntersection(vec4(d1, tmin), vec4(d2, tmax));\n\
}\n\
\n\
/**\n\
 * Given a circular cone around the z-axis, with apex at the origin,\n\
 * find the parametric distance(s) along a ray where that ray intersects\n\
 * the cone.\n\
 * The cone opening angle is described by the squared cosine of\n\
 * its half-angle (the angle between the Z-axis and the surface)\n\
 */\n\
vec2 intersectDoubleEndedCone(in Ray ray, in float cosSqrHalfAngle)\n\
{\n\
    vec3 o = ray.pos;\n\
    vec3 d = ray.dir;\n\
    float sinSqrHalfAngle = 1.0 - cosSqrHalfAngle;\n\
\n\
    float aSin = d.z * d.z * sinSqrHalfAngle;\n\
    float aCos = -dot(d.xy, d.xy) * cosSqrHalfAngle;\n\
    float a = aSin + aCos;\n\
\n\
    float bSin = d.z * o.z * sinSqrHalfAngle;\n\
    float bCos = -dot(o.xy, d.xy) * cosSqrHalfAngle;\n\
    float b = bSin + bCos;\n\
\n\
    float cSin = o.z * o.z * sinSqrHalfAngle;\n\
    float cCos = -dot(o.xy, o.xy) * cosSqrHalfAngle;\n\
    float c = cSin + cCos;\n\
    // determinant = b * b - a * c. But bSin * bSin = aSin * cSin.\n\
    // Avoid subtractive cancellation by expanding to eliminate these terms\n\
    float determinant = 2.0 * bSin * bCos + bCos * bCos - aSin * cCos - aCos * cSin - aCos * cCos;\n\
\n\
    if (determinant < 0.0) {\n\
        return vec2(NO_HIT);\n\
    } else if (a == 0.0) {\n\
        // Ray is parallel to cone surface\n\
        return (b == 0.0)\n\
            ? vec2(NO_HIT) // Ray is on cone surface\n\
            : vec2(-0.5 * c / b, NO_HIT);\n\
    }\n\
\n\
    determinant = sqrt(determinant);\n\
\n\
    // Compute larger root using standard formula\n\
    float signB = b < 0.0 ? -1.0 : 1.0;\n\
    float t1 = (-b - signB * determinant) / a;\n\
    // The other root may suffer from subtractive cancellation in the standard formula.\n\
    // Compute it from the first root instead.\n\
    float t2 = c / (a * t1);\n\
    float tmin = min(t1, t2);\n\
    float tmax = max(t1, t2);\n\
    return vec2(tmin, tmax);\n\
}\n\
\n\
/**\n\
 * Given a point on a conical surface, find the surface normal at that point.\n\
 */\n\
vec3 getConeNormal(in vec3 p, in bool convex) {\n\
    // Start with radial component pointing toward z-axis\n\
    vec2 radial = -abs(p.z) * normalize(p.xy);\n\
    // Z component points toward opening of cone\n\
    float zSign = (p.z < 0.0) ? -1.0 : 1.0;\n\
    float z = length(p.xy) * zSign;\n\
    // Flip normal if shape is convex\n\
    float flip = (convex) ? -1.0 : 1.0;\n\
    return normalize(vec3(radial, z) * flip);\n\
}\n\
\n\
/**\n\
 * Compute the shift between the ellipsoid origin and the apex of a cone of latitude\n\
 */\n\
float getLatitudeConeShift(in float sinLatitude) {\n\
    // Find prime vertical radius of curvature: \n\
    // the distance along the ellipsoid normal to the intersection with the z-axis\n\
    float x2 = u_eccentricitySquared * sinLatitude * sinLatitude;\n\
    float primeVerticalRadius = inversesqrt(1.0 - x2);\n\
\n\
    // Compute a shift from the origin to the intersection of the cone with the z-axis\n\
    return primeVerticalRadius * u_eccentricitySquared * sinLatitude;\n\
}\n\
\n\
void intersectFlippedCone(in Ray ray, in float cosHalfAngle, out RayShapeIntersection intersections[2]) {\n\
    // Undo the scaling from ellipsoid to sphere\n\
    ray.pos = ray.pos * u_ellipsoidRadiiUv;\n\
    ray.dir = ray.dir * u_ellipsoidRadiiUv;\n\
    // Shift the ray to account for the latitude cone not being centered at the Earth center\n\
    ray.pos.z += getLatitudeConeShift(cosHalfAngle);\n\
\n\
    float cosSqrHalfAngle = cosHalfAngle * cosHalfAngle;\n\
    vec2 intersect = intersectDoubleEndedCone(ray, cosSqrHalfAngle);\n\
\n\
    vec4 miss = vec4(normalize(ray.dir), NO_HIT);\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
\n\
    // Initialize output with no intersections\n\
    intersections[0].entry = -1.0 * farSide;\n\
    intersections[0].exit = farSide;\n\
    intersections[1].entry = miss;\n\
    intersections[1].exit = miss;\n\
\n\
    if (intersect.x == NO_HIT) {\n\
        return;\n\
    }\n\
\n\
    // Find the points of intersection\n\
    float tmin = intersect.x;\n\
    float tmax = intersect.y;\n\
    vec3 p0 = ray.pos + tmin * ray.dir;\n\
    vec3 p1 = ray.pos + tmax * ray.dir;\n\
\n\
    vec4 intersect0 = vec4(getConeNormal(p0, true), tmin);\n\
    vec4 intersect1 = vec4(getConeNormal(p1, true), tmax);\n\
\n\
    bool p0InShadowCone = sign(p0.z) != sign(cosHalfAngle);\n\
    bool p1InShadowCone = sign(p1.z) != sign(cosHalfAngle);\n\
\n\
    if (p0InShadowCone && p1InShadowCone) {\n\
        // no valid intersections\n\
    } else if (p0InShadowCone) {\n\
        intersections[0].exit = intersect1;\n\
    } else if (p1InShadowCone) {\n\
        intersections[0].entry = intersect0;\n\
    } else {\n\
        intersections[0].exit = intersect0;\n\
        intersections[1].entry = intersect1;\n\
        intersections[1].exit = farSide;\n\
    }\n\
}\n\
\n\
RayShapeIntersection intersectRegularCone(in Ray ray, in float cosHalfAngle, in bool convex) {\n\
    // Undo the scaling from ellipsoid to sphere\n\
    ray.pos = ray.pos * u_ellipsoidRadiiUv;\n\
    ray.dir = ray.dir * u_ellipsoidRadiiUv;\n\
    // Shift the ray to account for the latitude cone not being centered at the Earth center\n\
    ray.pos.z += getLatitudeConeShift(cosHalfAngle);\n\
\n\
    float cosSqrHalfAngle = cosHalfAngle * cosHalfAngle;\n\
    vec2 intersect = intersectDoubleEndedCone(ray, cosSqrHalfAngle);\n\
\n\
    vec4 miss = vec4(normalize(ray.dir), NO_HIT);\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
\n\
    if (intersect.x == NO_HIT) {\n\
        return RayShapeIntersection(miss, miss);\n\
    }\n\
\n\
    // Find the points of intersection\n\
    float tmin = intersect.x;\n\
    float tmax = intersect.y;\n\
    vec3 p0 = ray.pos + tmin * ray.dir;\n\
    vec3 p1 = ray.pos + tmax * ray.dir;\n\
\n\
    vec4 intersect0 = vec4(getConeNormal(p0, convex), tmin);\n\
    vec4 intersect1 = vec4(getConeNormal(p1, convex), tmax);\n\
\n\
    bool p0InShadowCone = sign(p0.z) != sign(cosHalfAngle);\n\
    bool p1InShadowCone = sign(p1.z) != sign(cosHalfAngle);\n\
\n\
    if (p0InShadowCone && p1InShadowCone) {\n\
        return RayShapeIntersection(miss, miss);\n\
    } else if (p0InShadowCone) {\n\
        return RayShapeIntersection(intersect1, farSide);\n\
    } else if (p1InShadowCone) {\n\
        return RayShapeIntersection(-1.0 * farSide, intersect0);\n\
    } else {\n\
        return RayShapeIntersection(intersect0, intersect1);\n\
    }\n\
}\n\
\n\
void intersectShape(in Ray ray, inout Intersections ix) {\n\
    // Position is converted from [0,1] to [-1,+1] because shape intersections assume unit space is [-1,+1].\n\
    // Direction is scaled as well to be in sync with position.\n\
    ray.pos = ray.pos * 2.0 - 1.0;\n\
    ray.dir *= 2.0;\n\
\n\
    // Outer ellipsoid\n\
    RayShapeIntersection outerIntersect = intersectHeight(ray, u_clipMinMaxHeight.y, true);\n\
    setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_HEIGHT_MAX, outerIntersect);\n\
\n\
    // Exit early if the outer ellipsoid was missed.\n\
    if (outerIntersect.entry.w == NO_HIT) {\n\
        return;\n\
    }\n\
\n\
    // Inner ellipsoid\n\
    RayShapeIntersection innerIntersect = intersectHeight(ray, u_clipMinMaxHeight.x, false);\n\
\n\
    if (innerIntersect.entry.w == NO_HIT) {\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_HEIGHT_MIN, innerIntersect);\n\
    } else {\n\
        // When the ellipsoid is large and thin it's possible for floating point math\n\
        // to cause the ray to intersect the inner ellipsoid before the outer ellipsoid. \n\
        // To prevent this from happening, clamp innerIntersect to outerIntersect and\n\
        // sandwich the inner ellipsoid intersection inside the outer ellipsoid intersection.\n\
\n\
        // Without this special case,\n\
        // [outerMin, outerMax, innerMin, innerMax] will bubble sort to\n\
        // [outerMin, innerMin, outerMax, innerMax] which will cause the back\n\
        // side of the ellipsoid to be invisible because it will think the ray\n\
        // is still inside the inner (negative) ellipsoid after exiting the\n\
        // outer (positive) ellipsoid.\n\
\n\
        // With this special case,\n\
        // [outerMin, innerMin, innerMax, outerMax] will bubble sort to\n\
        // [outerMin, innerMin, innerMax, outerMax] which will work correctly.\n\
\n\
        // Note: If initializeIntersections() changes its sorting function\n\
        // from bubble sort to something else, this code may need to change.\n\
        innerIntersect.entry.w = max(innerIntersect.entry.w, outerIntersect.entry.w);\n\
        innerIntersect.exit.w = min(innerIntersect.exit.w, outerIntersect.exit.w);\n\
        setSurfaceIntersection(ix, 0, outerIntersect.entry, true, true);  // positive, enter\n\
        setSurfaceIntersection(ix, 1, innerIntersect.entry, false, true); // negative, enter\n\
        setSurfaceIntersection(ix, 2, innerIntersect.exit, false, false); // negative, exit\n\
        setSurfaceIntersection(ix, 3, outerIntersect.exit, true, false);  // positive, exit\n\
    }\n\
\n\
    // Bottom cone\n\
    #if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_UNDER_HALF)\n\
        RayShapeIntersection bottomConeIntersection = intersectRegularCone(ray, u_ellipsoidRenderLatitudeSinMinMax.x, false);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MIN, bottomConeIntersection);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_EQUAL_HALF)\n\
        RayShapeIntersection bottomConeIntersection = intersectZPlane(ray, -1.0);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MIN, bottomConeIntersection);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MIN_OVER_HALF)\n\
        RayShapeIntersection bottomConeIntersections[2];\n\
        intersectFlippedCone(ray, u_ellipsoidRenderLatitudeSinMinMax.x, bottomConeIntersections);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MIN + 0, bottomConeIntersections[0]);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MIN + 1, bottomConeIntersections[1]);\n\
    #endif\n\
\n\
    // Top cone\n\
    #if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_UNDER_HALF)\n\
        RayShapeIntersection topConeIntersections[2];\n\
        intersectFlippedCone(ray, u_ellipsoidRenderLatitudeSinMinMax.y, topConeIntersections);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MAX + 0, topConeIntersections[0]);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MAX + 1, topConeIntersections[1]);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_EQUAL_HALF)\n\
        RayShapeIntersection topConeIntersection = intersectZPlane(ray, 1.0);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MAX, topConeIntersection);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LATITUDE_MAX_OVER_HALF)\n\
        RayShapeIntersection topConeIntersection = intersectRegularCone(ray, u_ellipsoidRenderLatitudeSinMinMax.y, false);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LATITUDE_MAX, topConeIntersection);\n\
    #endif\n\
\n\
    // Wedge\n\
    #if defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_EQUAL_ZERO)\n\
        RayShapeIntersection wedgeIntersects[2];\n\
        intersectHalfPlane(ray, u_ellipsoidRenderLongitudeMinMax.x, wedgeIntersects);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LONGITUDE + 0, wedgeIntersects[0]);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LONGITUDE + 1, wedgeIntersects[1]);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_UNDER_HALF)\n\
        RayShapeIntersection wedgeIntersect = intersectRegularWedge(ray, u_ellipsoidRenderLongitudeMinMax);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LONGITUDE, wedgeIntersect);\n\
    #elif defined(ELLIPSOID_HAS_RENDER_BOUNDS_LONGITUDE_RANGE_OVER_HALF)\n\
        RayShapeIntersection wedgeIntersects[2];\n\
        intersectFlippedWedge(ray, u_ellipsoidRenderLongitudeMinMax, wedgeIntersects);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LONGITUDE + 0, wedgeIntersects[0]);\n\
        setShapeIntersection(ix, ELLIPSOID_INTERSECTION_INDEX_LONGITUDE + 1, wedgeIntersects[1]);\n\
    #endif\n\
}\n\
";
