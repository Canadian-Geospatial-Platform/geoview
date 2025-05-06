import { useEffect, useMemo, useRef, useState } from 'react';
import { Projection } from '@/geo/utils/projection';
import { NORTH_POLE_POSITION } from '@/core/utils/constant';
import {
  useMapCenterCoordinates,
  useMapFixNorth,
  useMapNorthArrowElement,
  useMapProjection,
  useMapRotation,
  useMapSize,
  useMapStoreActions,
  useMapZoom,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

interface ArrowReturn {
  rotationAngle: { angle: number };
  northOffset: number;
}

/**
 * Custom hook to Manage North arrow (rotation and offset) and update store state.
 * @returns {ArrowReturn} The ArrowReturn object who contains rotationAngle and northoffset
 */
export const useManageArrow = (): ArrowReturn => {
  // State
  const [rotationAngle, setRotationAngle] = useState({ angle: 0 });
  const [northOffset, setNorthOffset] = useState(0);
  const angle = useRef(0); // keep track of rotation angle for fix north

  // Store
  const mapProjection = useMapProjection();
  const northArrowElement = useMapNorthArrowElement();
  const fixNorth = useMapFixNorth();
  const mapZoom = useMapZoom();
  const mapRotation = useMapRotation();
  const mapCenterCoord = useMapCenterCoordinates();
  const mapSize = useMapSize();
  const { getPixelFromCoordinate, setRotation } = useMapStoreActions();

  // Memoize projection check as it's used multiple times
  const isLCCProjection = useMemo(() => `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC, [mapProjection]);
  const isWebMercator = useMemo(() => `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.WM, [mapProjection]);

  /**
   * Calculate the north arrow offset and angle
   * Calculation taken from RAMP: https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/packages/ramp-core/src/app/geo/map-tools.service.js
   */
  const { calculatedRotation, calculatedOffset } = useMemo(() => {
    // Log
    logger.logTraceUseMemo('USE-MANAGE-ARROW - calculatedRotation, calculatedOffset');

    // Early return if no arrow element
    if (!northArrowElement) {
      return { calculatedRotation: { angle: 0 }, calculatedOffset: 0 };
    }

    // Early return if unsupported projection
    if (!isLCCProjection && !isWebMercator) {
      return { calculatedRotation: { angle: 0 }, calculatedOffset: 0 };
    }

    // Constants
    const ARROW_WIDTH = 24;
    const RADIAN_CONVERSION = 0.01745329252;
    const mapWidth = mapSize[0] / 2;
    const offsetX = mapWidth - ARROW_WIDTH / 2;

    // Handle Web Mercator Projection - simpler case first
    if (isWebMercator) {
      return {
        calculatedRotation: { angle: mapRotation * (180 / Math.PI) },
        calculatedOffset: offsetX,
      };
    }

    // Early return if north is visible
    if (northArrowElement.isNorthVisible) {
      return { calculatedRotation: { angle: 0 }, calculatedOffset: offsetX };
    }

    // Handle LCC Projection
    if (isLCCProjection) {
      const arrowAngle = parseFloat(northArrowElement.degreeRotation);
      const angleDegrees = 270 - arrowAngle;

      // Calculate rotation
      let newRotation = { angle: 0 };
      if (fixNorth && (Math.round(angle.current) !== Math.round(arrowAngle) || mapZoom > 7)) {
        angle.current = arrowAngle;

        // Calculate the rotation delta and apply only when higher then 0.1 to solve bugs when in middle of
        // Canada and the map is trying to set rotation forever
        const diff = Math.abs(mapRotation - ((180 - arrowAngle) * (2 * Math.PI)) / 360);
        if (diff > 0.1) setRotation(((180 - arrowAngle) * (2 * Math.PI)) / 360);
      } else {
        const mapRotationValue = mapRotation * (180 / Math.PI);
        newRotation = { angle: 90 - angleDegrees + mapRotationValue };
      }

      // Calculate offset
      let newOffset = offsetX;
      const northPolePosition = getPixelFromCoordinate(NORTH_POLE_POSITION);

      if (!fixNorth && northPolePosition !== null) {
        const screenNorthPoint = northPolePosition;
        const screenY = screenNorthPoint[1];

        // Initialize triangle with original numbers
        const triangle = {
          x: offsetX,
          y: getPixelFromCoordinate(mapCenterCoord)[1],
          m: 1,
        };

        // If the extent is near the north pole be more precise otherwise use the original math
        // Note: using the precise math would be ideal but when zooming in, the calculations make very
        // large adjustments so reverting to the old less precise math provides a better experience.
        if (screenNorthPoint[0] < 2400 && screenNorthPoint[1] > -1300 && -screenNorthPoint[1] < 3000) {
          [triangle.x, triangle.y] = screenNorthPoint;
          triangle.m = -1;
        }

        // z is the hypotenuse line from center point to the top of the viewer. The triangle is always a right triangle
        const z = triangle.y / Math.sin(angleDegrees * RADIAN_CONVERSION);

        // this would be the bottom of our triangle, the length from center to where the arrow should be placed
        const screenX =
          screenY < 0
            ? triangle.x + triangle.m * (Math.sin((90 - angleDegrees) * RADIAN_CONVERSION) * z) - ARROW_WIDTH / 2
            : screenNorthPoint[0] - ARROW_WIDTH;

        // Limit the arrow to the bounds of the inner shell (+/- 25% from center)
        newOffset = Math.max(offsetX - mapWidth * 0.25, Math.min(screenX, offsetX + mapWidth * 0.25));
      }

      return { calculatedRotation: newRotation, calculatedOffset: newOffset };
    }

    // Should never goes here but failover to default values
    return { calculatedRotation: { angle: 0 }, calculatedOffset: 0 };
  }, [
    northArrowElement,
    isLCCProjection,
    isWebMercator,
    fixNorth,
    mapRotation,
    mapZoom,
    mapSize,
    getPixelFromCoordinate,
    mapCenterCoord,
    setRotation,
  ]);

  // Update state with calculated values
  // State updates are side effects and belong in useEffect
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-MANAGE-ARROW - calculatedRotation, calculatedOffset', {
      calculatedRotation,
      calculatedOffset,
    });

    setRotationAngle(calculatedRotation);
    setNorthOffset(calculatedOffset);
  }, [calculatedRotation, calculatedOffset, rotationAngle, northOffset]);

  return { rotationAngle, northOffset };
};
