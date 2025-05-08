//This file is automatically rebuilt by the Cesium build process.
export default "// See Intersection.glsl for the definition of intersectScene\n\
// See IntersectionUtils.glsl for the definition of nextIntersection\n\
// See convertUvToBox.glsl, convertUvToCylinder.glsl, or convertUvToEllipsoid.glsl\n\
// for the definition of convertUvToShapeUvSpace. The appropriate function is \n\
// selected based on the VoxelPrimitive shape type, and added to the shader in\n\
// Scene/VoxelRenderResources.js.\n\
// See Octree.glsl for the definitions of TraversalData, SampleData,\n\
// traverseOctreeFromBeginning, and traverseOctreeFromExisting\n\
// See Megatexture.glsl for the definition of accumulatePropertiesFromMegatexture\n\
\n\
#define STEP_COUNT_MAX 1000 // Harcoded value because GLSL doesn't like variable length loops\n\
#if defined(PICKING_VOXEL)\n\
    #define ALPHA_ACCUM_MAX 0.1\n\
#else\n\
    #define ALPHA_ACCUM_MAX 0.98 // Must be > 0.0 and <= 1.0\n\
#endif\n\
\n\
uniform mat3 u_transformDirectionViewToLocal;\n\
uniform vec3 u_cameraPositionUv;\n\
uniform float u_stepSize;\n\
\n\
#if defined(PICKING)\n\
    uniform vec4 u_pickColor;\n\
#endif\n\
\n\
vec3 getSampleSize(in int level) {\n\
    vec3 sampleCount = exp2(float(level)) * vec3(u_dimensions);\n\
    vec3 sampleSizeUv = 1.0 / sampleCount;\n\
    return scaleShapeUvToShapeSpace(sampleSizeUv);\n\
}\n\
\n\
#define MINIMUM_STEP_SCALAR (0.02)\n\
#define SHIFT_FRACTION (0.001)\n\
\n\
/**\n\
 * Given a coordinate within a tile, and sample spacings along a ray through\n\
 * the coordinate, find the distance to the points where the ray entered and\n\
 * exited the voxel cell, along with the surface normals at those points.\n\
 * The surface normals are returned in shape space coordinates.\n\
 */\n\
RayShapeIntersection getVoxelIntersection(in vec3 tileUv, in vec3 sampleSizeAlongRay) {\n\
    vec3 voxelCoord = tileUv * vec3(u_dimensions);\n\
    vec3 directions = sign(sampleSizeAlongRay);\n\
    vec3 positiveDirections = max(directions, 0.0);\n\
    vec3 entryCoord = mix(ceil(voxelCoord), floor(voxelCoord), positiveDirections);\n\
    vec3 exitCoord = entryCoord + directions;\n\
\n\
    vec3 distanceFromEntry = -abs((entryCoord - voxelCoord) * sampleSizeAlongRay);\n\
    float lastEntry = maxComponent(distanceFromEntry);\n\
    bvec3 isLastEntry = equal(distanceFromEntry, vec3(lastEntry));\n\
    vec3 entryNormal = -1.0 * vec3(isLastEntry) * directions;\n\
    vec4 entry = vec4(entryNormal, lastEntry);\n\
\n\
    vec3 distanceToExit = abs((exitCoord - voxelCoord) * sampleSizeAlongRay);\n\
    float firstExit = minComponent(distanceToExit);\n\
    bvec3 isFirstExit = equal(distanceToExit, vec3(firstExit));\n\
    vec3 exitNormal = vec3(isFirstExit) * directions;\n\
    vec4 exit = vec4(exitNormal, firstExit);\n\
\n\
    return RayShapeIntersection(entry, exit);\n\
}\n\
\n\
vec4 getStepSize(in SampleData sampleData, in Ray viewRay, in RayShapeIntersection shapeIntersection, in mat3 jacobianT, in float currentT) {\n\
    // The Jacobian is computed in a space where the shape spans [-1, 1].\n\
    // But the ray is marched in a space where the shape fills [0, 1].\n\
    // So we need to scale the Jacobian by 2.\n\
    vec3 gradient = 2.0 * viewRay.rawDir * jacobianT;\n\
    vec3 sampleSizeAlongRay = getSampleSize(sampleData.tileCoords.w) / gradient;\n\
\n\
    RayShapeIntersection voxelIntersection = getVoxelIntersection(sampleData.tileUv, sampleSizeAlongRay);\n\
\n\
    // Transform normal from shape space to Cartesian space\n\
    vec3 voxelNormal = normalize(jacobianT * voxelIntersection.entry.xyz);\n\
    // Compare with the shape intersection, to choose the appropriate normal\n\
    vec4 voxelEntry = vec4(voxelNormal, currentT + voxelIntersection.entry.w);\n\
    vec4 entry = intersectionMax(shapeIntersection.entry, voxelEntry);\n\
\n\
    float fixedStep = minComponent(abs(sampleSizeAlongRay)) * u_stepSize;\n\
    float shift = fixedStep * SHIFT_FRACTION;\n\
    float dt = voxelIntersection.exit.w + shift;\n\
    if ((currentT + dt) > shapeIntersection.exit.w) {\n\
        // Stop at end of shape\n\
        dt = shapeIntersection.exit.w - currentT + shift;\n\
    }\n\
    float stepSize = clamp(dt, fixedStep * MINIMUM_STEP_SCALAR, fixedStep + shift);\n\
\n\
    return vec4(entry.xyz, stepSize);\n\
}\n\
\n\
vec2 packIntToVec2(int value) {\n\
    float shifted = float(value) / 255.0;\n\
    float lowBits = fract(shifted);\n\
    float highBits = floor(shifted) / 255.0;\n\
    return vec2(highBits, lowBits);\n\
}\n\
\n\
vec2 packFloatToVec2(float value) {\n\
    float lowBits = fract(value);\n\
    float highBits = floor(value) / 255.0;\n\
    return vec2(highBits, lowBits);\n\
}\n\
\n\
int getSampleIndex(in SampleData sampleData) {\n\
    // tileUv = 1.0 is a valid coordinate but sampleIndex = u_inputDimensions is not.\n\
    // (tileUv = 1.0 corresponds to the far edge of the last sample, at index = u_inputDimensions - 1).\n\
    // Clamp to [0, voxelDimensions - 0.5) to avoid numerical error before flooring\n\
    vec3 maxCoordinate = vec3(u_inputDimensions) - vec3(0.5);\n\
    vec3 inputCoordinate = clamp(sampleData.inputCoordinate, vec3(0.0), maxCoordinate);\n\
    ivec3 sampleIndex = ivec3(floor(inputCoordinate));\n\
    // Convert to a 1D index for lookup in a 1D data array\n\
    return sampleIndex.x + u_inputDimensions.x * (sampleIndex.y + u_inputDimensions.y * sampleIndex.z);\n\
}\n\
\n\
void main()\n\
{\n\
    vec4 fragCoord = gl_FragCoord;\n\
    vec2 screenCoord = (fragCoord.xy - czm_viewport.xy) / czm_viewport.zw; // [0,1]\n\
    vec3 eyeDirection = normalize(czm_windowToEyeCoordinates(fragCoord).xyz);\n\
    vec3 viewDirWorld = normalize(czm_inverseViewRotation * eyeDirection); // normalize again just in case\n\
    vec3 viewDirUv = normalize(u_transformDirectionViewToLocal * eyeDirection); // normalize again just in case\n\
    vec3 viewPosUv = u_cameraPositionUv;\n\
    #if defined(SHAPE_ELLIPSOID)\n\
        // viewDirUv has been scaled to a space where the ellipsoid is a sphere.\n\
        // Undo this scaling to get the raw direction.\n\
        vec3 rawDir = viewDirUv * u_ellipsoidRadiiUv;\n\
        Ray viewRayUv = Ray(viewPosUv, viewDirUv, rawDir);\n\
    #else\n\
        Ray viewRayUv = Ray(viewPosUv, viewDirUv, viewDirUv);\n\
    #endif\n\
\n\
    Intersections ix;\n\
    RayShapeIntersection shapeIntersection = intersectScene(screenCoord, viewRayUv, ix);\n\
\n\
    // Exit early if the scene was completely missed.\n\
    if (shapeIntersection.entry.w == NO_HIT) {\n\
        discard;\n\
    }\n\
\n\
    float currentT = shapeIntersection.entry.w;\n\
    float endT = shapeIntersection.exit.w;\n\
    vec3 positionUv = viewPosUv + currentT * viewDirUv;\n\
    PointJacobianT pointJacobian = convertUvToShapeUvSpaceDerivative(positionUv);\n\
\n\
    // Traverse the tree from the start position\n\
    TraversalData traversalData;\n\
    SampleData sampleDatas[SAMPLE_COUNT];\n\
    traverseOctreeFromBeginning(pointJacobian.point, traversalData, sampleDatas);\n\
    vec4 step = getStepSize(sampleDatas[0], viewRayUv, shapeIntersection, pointJacobian.jacobianT, currentT);\n\
\n\
    #if defined(JITTER)\n\
        float noise = hash(screenCoord); // [0,1]\n\
        currentT += noise * step.w;\n\
        positionUv += noise * step.w * viewDirUv;\n\
    #endif\n\
\n\
    FragmentInput fragmentInput;\n\
    #if defined(STATISTICS)\n\
        setStatistics(fragmentInput.metadata.statistics);\n\
    #endif\n\
\n\
    vec4 colorAccum = vec4(0.0);\n\
\n\
    for (int stepCount = 0; stepCount < STEP_COUNT_MAX; ++stepCount) {\n\
        // Read properties from the megatexture based on the traversal state\n\
        Properties properties = accumulatePropertiesFromMegatexture(sampleDatas);\n\
\n\
        // Prepare the custom shader inputs\n\
        copyPropertiesToMetadata(properties, fragmentInput.metadata);\n\
        fragmentInput.voxel.positionUv = positionUv;\n\
        fragmentInput.voxel.positionShapeUv = pointJacobian.point;\n\
        fragmentInput.voxel.positionUvLocal = sampleDatas[0].tileUv;\n\
        fragmentInput.voxel.viewDirUv = viewDirUv;\n\
        fragmentInput.voxel.viewDirWorld = viewDirWorld;\n\
        fragmentInput.voxel.surfaceNormal = step.xyz;\n\
        fragmentInput.voxel.travelDistance = step.w;\n\
        fragmentInput.voxel.stepCount = stepCount;\n\
        fragmentInput.voxel.tileIndex = sampleDatas[0].megatextureIndex;\n\
        fragmentInput.voxel.sampleIndex = getSampleIndex(sampleDatas[0]);\n\
\n\
        // Run the custom shader\n\
        czm_modelMaterial materialOutput;\n\
        fragmentMain(fragmentInput, materialOutput);\n\
\n\
        // Sanitize the custom shader output\n\
        vec4 color = vec4(materialOutput.diffuse, materialOutput.alpha);\n\
        color.rgb = max(color.rgb, vec3(0.0));\n\
        color.a = clamp(color.a, 0.0, 1.0);\n\
\n\
        // Pre-multiplied alpha blend\n\
        colorAccum += (1.0 - colorAccum.a) * vec4(color.rgb * color.a, color.a);\n\
\n\
        // Stop traversing if the alpha has been fully saturated\n\
        if (colorAccum.a > ALPHA_ACCUM_MAX) {\n\
            colorAccum.a = ALPHA_ACCUM_MAX;\n\
            break;\n\
        }\n\
\n\
        if (step.w == 0.0) {\n\
            // Shape is infinitely thin. The ray may have hit the edge of a\n\
            // foreground voxel. Step ahead slightly to check for more voxels\n\
            step.w == 0.00001;\n\
        }\n\
\n\
        // Keep raymarching\n\
        currentT += step.w;\n\
        positionUv = viewPosUv + currentT * viewDirUv;\n\
\n\
        // Check if there's more intersections.\n\
        if (currentT > endT) {\n\
            #if (INTERSECTION_COUNT == 1)\n\
                break;\n\
            #else\n\
                shapeIntersection = nextIntersection(ix);\n\
                if (shapeIntersection.entry.w == NO_HIT) {\n\
                    break;\n\
                } else {\n\
                    // Found another intersection. Resume raymarching there\n\
                    currentT = shapeIntersection.entry.w;\n\
                    endT = shapeIntersection.exit.w;\n\
                    positionUv = viewPosUv + currentT * viewDirUv;\n\
                }\n\
            #endif\n\
        }\n\
\n\
        // Traverse the tree from the current ray position.\n\
        // This is similar to traverseOctreeFromBeginning but is faster when the ray is in the same tile as the previous step.\n\
        pointJacobian = convertUvToShapeUvSpaceDerivative(positionUv);\n\
        traverseOctreeFromExisting(pointJacobian.point, traversalData, sampleDatas);\n\
        step = getStepSize(sampleDatas[0], viewRayUv, shapeIntersection, pointJacobian.jacobianT, currentT);\n\
    }\n\
\n\
    // Convert the alpha from [0,ALPHA_ACCUM_MAX] to [0,1]\n\
    colorAccum.a /= ALPHA_ACCUM_MAX;\n\
\n\
    #if defined(PICKING)\n\
        // If alpha is 0.0 there is nothing to pick\n\
        if (colorAccum.a == 0.0) {\n\
            discard;\n\
        }\n\
        out_FragColor = u_pickColor;\n\
    #elif defined(PICKING_VOXEL)\n\
        // If alpha is 0.0 there is nothing to pick\n\
        if (colorAccum.a == 0.0) {\n\
            discard;\n\
        }\n\
        vec2 megatextureId = packIntToVec2(sampleDatas[0].megatextureIndex);\n\
        vec2 sampleIndex = packIntToVec2(getSampleIndex(sampleDatas[0]));\n\
        out_FragColor = vec4(megatextureId, sampleIndex);\n\
    #else\n\
        out_FragColor = colorAccum;\n\
    #endif\n\
}\n\
";
