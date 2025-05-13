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

const CENTRAL_MERIDIAN = -92;

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

  const prevRotationRef = useRef(0);
  const equalCountRef = useRef(0);

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

        // Calculate the rotation delta
        const rotationValue = ((180 - arrowAngle) * (2 * Math.PI)) / 360;
        const diff = Math.abs(mapRotation - rotationValue);

        // Calculate longitude factor
        const centerLongitude = Projection.transformCoordinates(mapCenterCoord, 'EPSG:3978', 'EPSG:4326')![0];
        const deviationFromCenter = (centerLongitude as number) - CENTRAL_MERIDIAN;

        if (Math.abs(deviationFromCenter) <= 3) {
          setRotation(0);
          equalCountRef.current = 0;
        } else if (diff > 0.01) {
          // Only set rotation if we haven't already set it for this value
          if (rotationValue !== prevRotationRef.current) {
            setRotation(rotationValue);
            prevRotationRef.current = rotationValue;
            equalCountRef.current = 1; // Set to 1 to indicate we've used this value
          }
          // If values are the same but we haven't set rotation yet
          else if (equalCountRef.current === 0) {
            setRotation(rotationValue);
            equalCountRef.current = 1;
          }
          // Otherwise, do nothing (skip setting rotation)
        }
      } else {
        const mapRotationValue = mapRotation * (180 / Math.PI);
        newRotation = { angle: 90 - angleDegrees + mapRotationValue };
      }

      // Calculate offset
      let newOffset = offsetX;
      const northPolePosition = getPixelFromCoordinate(NORTH_POLE_POSITION);

      if (!fixNorth && northPolePosition !== null) {
        const screenNorthPoint = northPolePosition;
        const mapCenter = getPixelFromCoordinate(mapCenterCoord);

        // Calculate distance from north pole using triangle
        const deltaX = screenNorthPoint[0] - mapCenter[0];
        const deltaY = screenNorthPoint[1] - mapCenter[1];
        const distanceFromNorthPole = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Calculate distance factor (0 to 1)
        const MAX_DISTANCE = 10000; // Maximum meaningful distance from north pole
        const distanceFactor = Math.min(distanceFromNorthPole / MAX_DISTANCE, 1);

        // Calculate longitude factor (-92° is center, increases towards -150° and -30°)
        const centerLongitude = mapCenterCoord[0];
        const deviationFromCenter = centerLongitude - CENTRAL_MERIDIAN;
        const longitudeFactor = Math.min(Math.abs(deviationFromCenter) / 60, 1); // 60° range to max

        // Combine both factors and apply to max offset
        const MAX_OFFSET = 100; // 100px maximum offset
        const combinedFactor = distanceFactor * longitudeFactor;

        // Apply offset - negative for western longitudes, positive for eastern
        newOffset = offsetX - Math.sign(deviationFromCenter) * MAX_OFFSET * combinedFactor;
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
