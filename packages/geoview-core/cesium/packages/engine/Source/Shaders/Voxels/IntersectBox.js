//This file is automatically rebuilt by the Cesium build process.
export default "// See IntersectionUtils.glsl for the definitions of Ray, RayShapeIntersection,\n\
// NO_HIT, Intersections\n\
\n\
/* Box defines (set in Scene/VoxelBoxShape.js)\n\
#define BOX_INTERSECTION_INDEX ### // always 0\n\
*/\n\
\n\
uniform vec3 u_renderMinBounds;\n\
uniform vec3 u_renderMaxBounds;\n\
\n\
RayShapeIntersection intersectBox(in Ray ray, in vec3 minBound, in vec3 maxBound)\n\
{\n\
    // Consider the box as the intersection of the space between 3 pairs of parallel planes\n\
    // Compute the distance along the ray to each plane\n\
    vec3 t0 = (minBound - ray.pos) / ray.dir;\n\
    vec3 t1 = (maxBound - ray.pos) / ray.dir;\n\
\n\
    // Identify candidate entries/exits based on distance from ray.pos\n\
    vec3 entries = min(t0, t1);\n\
    vec3 exits = max(t0, t1);\n\
\n\
    vec3 directions = sign(ray.dir);\n\
\n\
    // The actual intersection points are the furthest entry and the closest exit\n\
    float lastEntry = maxComponent(entries);\n\
    bvec3 isLastEntry = equal(entries, vec3(lastEntry));\n\
    vec3 entryNormal = -1.0 * vec3(isLastEntry) * directions;\n\
    vec4 entry = vec4(entryNormal, lastEntry);\n\
\n\
    float firstExit = minComponent(exits);\n\
    bvec3 isFirstExit = equal(exits, vec3(firstExit));\n\
    vec3 exitNormal = vec3(isLastEntry) * directions;\n\
    vec4 exit = vec4(exitNormal, firstExit);\n\
\n\
    if (entry.w > exit.w) {\n\
        entry.w = NO_HIT;\n\
        exit.w = NO_HIT;\n\
    }\n\
\n\
    return RayShapeIntersection(entry, exit);\n\
}\n\
\n\
void intersectShape(in Ray ray, inout Intersections ix)\n\
{\n\
    RayShapeIntersection intersection = intersectBox(ray, u_renderMinBounds, u_renderMaxBounds);\n\
    setShapeIntersection(ix, BOX_INTERSECTION_INDEX, intersection);\n\
}\n\
";
