//This file is automatically rebuilt by the Cesium build process.
export default "// See IntersectionUtils.glsl for the definitions of Ray, NO_HIT, INF_HIT,\n\
// RayShapeIntersection\n\
\n\
vec4 intersectLongitude(in Ray ray, in float angle, in bool positiveNormal) {\n\
    float normalSign = positiveNormal ? 1.0 : -1.0;\n\
    vec2 planeNormal = vec2(-sin(angle), cos(angle)) * normalSign;\n\
\n\
    vec2 position = ray.pos.xy;\n\
    vec2 direction = ray.dir.xy;\n\
    float approachRate = dot(direction, planeNormal);\n\
    float distance = -dot(position, planeNormal);\n\
\n\
    float t = (approachRate == 0.0)\n\
        ? NO_HIT\n\
        : distance / approachRate;\n\
\n\
    return vec4(planeNormal, 0.0, t);\n\
}\n\
\n\
RayShapeIntersection intersectHalfSpace(in Ray ray, in float angle, in bool positiveNormal)\n\
{\n\
    vec4 intersection = intersectLongitude(ray, angle, positiveNormal);\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
\n\
    bool hitFront = (intersection.w > 0.0) == (dot(ray.pos.xy, intersection.xy) > 0.0);\n\
    if (!hitFront) {\n\
        return RayShapeIntersection(intersection, farSide);\n\
    } else {\n\
        return RayShapeIntersection(-1.0 * farSide, intersection);\n\
    }\n\
}\n\
\n\
void intersectFlippedWedge(in Ray ray, in vec2 minMaxAngle, out RayShapeIntersection intersections[2])\n\
{\n\
    intersections[0] = intersectHalfSpace(ray, minMaxAngle.x, false);\n\
    intersections[1] = intersectHalfSpace(ray, minMaxAngle.y, true);\n\
}\n\
\n\
bool hitPositiveHalfPlane(in Ray ray, in vec4 intersection, in bool positiveNormal) {\n\
    float normalSign = positiveNormal ? 1.0 : -1.0;\n\
    vec2 planeDirection = vec2(intersection.y, -intersection.x) * normalSign;\n\
    vec2 hit = ray.pos.xy + intersection.w * ray.dir.xy;\n\
    return dot(hit, planeDirection) > 0.0;\n\
}\n\
\n\
void intersectHalfPlane(in Ray ray, in float angle, out RayShapeIntersection intersections[2]) {\n\
    vec4 intersection = intersectLongitude(ray, angle, true);\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
\n\
    if (hitPositiveHalfPlane(ray, intersection, true)) {\n\
        intersections[0].entry = -1.0 * farSide;\n\
        intersections[0].exit = vec4(-1.0 * intersection.xy, 0.0, intersection.w);\n\
        intersections[1].entry = intersection;\n\
        intersections[1].exit = farSide;\n\
    } else {\n\
        vec4 miss = vec4(normalize(ray.dir), NO_HIT);\n\
        intersections[0].entry = -1.0 * farSide;\n\
        intersections[0].exit = farSide;\n\
        intersections[1].entry = miss;\n\
        intersections[1].exit = miss;\n\
    }\n\
}\n\
\n\
RayShapeIntersection intersectRegularWedge(in Ray ray, in vec2 minMaxAngle)\n\
{\n\
    // Note: works for maxAngle > minAngle + pi, where the \"regular wedge\"\n\
    // is actually a negative volume.\n\
    // Compute intersections with the two planes.\n\
    // Normals will point toward the \"outside\" (negative space)\n\
    vec4 intersect1 = intersectLongitude(ray, minMaxAngle.x, false);\n\
    vec4 intersect2 = intersectLongitude(ray, minMaxAngle.y, true);\n\
\n\
    // Choose intersection with smallest T as the \"first\", the other as \"last\"\n\
    // Note: first or last could be in the \"shadow\" wedge, beyond the tip\n\
    bool inOrder = intersect1.w <= intersect2.w;\n\
    vec4 first = inOrder ? intersect1 : intersect2;\n\
    vec4 last = inOrder ? intersect2 : intersect1;\n\
\n\
    bool firstIsAhead = first.w >= 0.0;\n\
    bool startedInsideFirst = dot(ray.pos.xy, first.xy) < 0.0;\n\
    bool exitFromInside = firstIsAhead == startedInsideFirst;\n\
    bool lastIsAhead = last.w > 0.0;\n\
    bool startedOutsideLast = dot(ray.pos.xy, last.xy) >= 0.0;\n\
    bool enterFromOutside = lastIsAhead == startedOutsideLast;\n\
\n\
    vec4 farSide = vec4(normalize(ray.dir), INF_HIT);\n\
    vec4 miss = vec4(normalize(ray.dir), NO_HIT);\n\
\n\
    if (exitFromInside && enterFromOutside) {\n\
        // Ray crosses both faces of negative wedge, exiting then entering the positive shape\n\
        return RayShapeIntersection(first, last);\n\
    } else if (!exitFromInside && enterFromOutside) {\n\
        // Ray starts inside wedge. last is in shadow wedge, and first is actually the entry\n\
        return RayShapeIntersection(-1.0 * farSide, first);\n\
    } else if (exitFromInside && !enterFromOutside) {\n\
        // First intersection was in the shadow wedge, so last is actually the exit\n\
        return RayShapeIntersection(last, farSide);\n\
    } else { // !exitFromInside && !enterFromOutside\n\
        // Both intersections were in the shadow wedge\n\
        return RayShapeIntersection(miss, miss);\n\
    }\n\
}\n\
";
