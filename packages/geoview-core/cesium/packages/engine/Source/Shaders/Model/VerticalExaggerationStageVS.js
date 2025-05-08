//This file is automatically rebuilt by the Cesium build process.
export default "void verticalExaggerationStage(\n\
  inout ProcessedAttributes attributes\n\
) {\n\
  // Compute the distance from the camera to the local center of curvature.\n\
  vec4 vertexPositionENU = czm_modelToEnu * vec4(attributes.positionMC, 1.0);\n\
  vec2 vertexAzimuth = normalize(vertexPositionENU.xy);\n\
  // Curvature = 1 / radius of curvature.\n\
  float azimuthalCurvature = dot(vertexAzimuth * vertexAzimuth, czm_eyeEllipsoidCurvature);\n\
  float eyeToCenter = 1.0 / azimuthalCurvature + czm_eyeHeight;\n\
\n\
  // Compute the approximate ellipsoid normal at the vertex position.\n\
  // Uses a circular approximation for the Earth curvature along the geodesic.\n\
  vec3 vertexPositionEC = (czm_modelView * vec4(attributes.positionMC, 1.0)).xyz;\n\
  vec3 centerToVertex = eyeToCenter * czm_eyeEllipsoidNormalEC + vertexPositionEC;\n\
  vec3 vertexNormal = normalize(centerToVertex);\n\
\n\
  // Estimate the (sine of the) angle between the camera direction and the vertex normal\n\
  float verticalDistance = dot(vertexPositionEC, czm_eyeEllipsoidNormalEC);\n\
  float horizontalDistance = length(vertexPositionEC - verticalDistance * czm_eyeEllipsoidNormalEC);\n\
  float sinTheta = horizontalDistance / (eyeToCenter + verticalDistance);\n\
  bool isSmallAngle = clamp(sinTheta, 0.0, 0.05) == sinTheta;\n\
\n\
  // Approximate the change in height above the ellipsoid, from camera to vertex position.\n\
  float exactVersine = 1.0 - dot(czm_eyeEllipsoidNormalEC, vertexNormal);\n\
  float smallAngleVersine = 0.5 * sinTheta * sinTheta;\n\
  float versine = isSmallAngle ? smallAngleVersine : exactVersine;\n\
  float dHeight = dot(vertexPositionEC, vertexNormal) - eyeToCenter * versine;\n\
  float vertexHeight = czm_eyeHeight + dHeight;\n\
\n\
  // Transform the approximate vertex normal to model coordinates.\n\
  vec3 vertexNormalMC = (czm_inverseModelView * vec4(vertexNormal, 0.0)).xyz;\n\
  vertexNormalMC = normalize(vertexNormalMC);\n\
\n\
  // Compute the exaggeration and apply it along the approximate vertex normal.\n\
  float stretch = u_verticalExaggerationAndRelativeHeight.x;\n\
  float shift = u_verticalExaggerationAndRelativeHeight.y;\n\
  float exaggeration = (vertexHeight - shift) * (stretch - 1.0);\n\
  attributes.positionMC += exaggeration * vertexNormalMC;\n\
}\n\
";
