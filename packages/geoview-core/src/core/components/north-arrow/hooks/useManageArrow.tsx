import { useEffect, useMemo, useRef, useState } from 'react';
import { Projection } from '@/geo/utils/projection';
import { NORTH_POLE_POSITION_LONLAT } from '@/core/utils/constant';
import {
  useStoreMapCenterCoordinates,
  useStoreMapFixNorth,
  useStoreMapNorthArrowElement,
  useStoreMapCurrentProjectionEPSG,
  useStoreMapRotation,
  useStoreMapSize,
  useStoreMapZoom,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

/** Return type for the useManageArrow hook. */
interface ArrowReturn {
  /** The current rotation angle for the north arrow. */
  rotationAngle: { angle: number };
  /** The horizontal offset in pixels for the north arrow. */
  northOffset: number;
}

/** The central meridian longitude used for LCC projection calculations. */
const CENTRAL_MERIDIAN = -92;

/**
 * Custom hook to manage north arrow rotation and offset and update store state.
 *
 * @returns The rotation angle and north offset values
 */
export const useManageArrow = (): ArrowReturn => {
  // State
  const [rotationAngle, setRotationAngle] = useState({ angle: 0 });
  const [northOffset, setNorthOffset] = useState(0);
  const angle = useRef(0); // keep track of rotation angle for fix north

  // Store
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const northArrowElement = useStoreMapNorthArrowElement();
  const fixNorth = useStoreMapFixNorth();
  const mapZoom = useStoreMapZoom();
  const mapRotation = useStoreMapRotation();
  const mapCenterCoord = useStoreMapCenterCoordinates();
  const mapSize = useStoreMapSize();
  const mapController = useMapController();

  /** Whether the map projection is Lambert Conformal Conic. */
  const isLCCProjection = mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC;

  /** Whether the map projection is Web Mercator. */
  const isWebMercator = mapProjectionEPSG === Projection.PROJECTION_NAMES.WM;

  const prevRotationRef = useRef(0);
  const equalCountRef = useRef(0);

  /**
   * Calculates the north arrow rotation and offset based on projection and map state.
   */
  const { memoCalculatedRotation, memoCalculatedOffset } = useMemo(() => {
    // Log
    logger.logTraceUseMemo('USE-MANAGE-ARROW - calculatedRotation, calculatedOffset');

    // Constants
    const ARROW_WIDTH = 24;
    const mapWidth = mapSize[0] / 2;
    const offsetX = mapWidth - ARROW_WIDTH / 2;

    // Early return if no arrow element
    if (!northArrowElement) {
      return { memoCalculatedRotation: { angle: 0 }, memoCalculatedOffset: 0 };
    }

    // Early return if unsupported projection
    if (!isLCCProjection && !isWebMercator) {
      return { memoCalculatedRotation: { angle: 0 }, memoCalculatedOffset: 0 };
    }

    // Handle Web Mercator Projection first - north is always up, only map rotation matters
    if (isWebMercator) {
      return {
        memoCalculatedRotation: { angle: mapRotation * (180 / Math.PI) },
        memoCalculatedOffset: offsetX,
      };
    }

    // Early return if zoom level is smaller than 5 and map center is near central meridian (keep rotation to 0)
    const mapCenterLongitude: number = Projection.transformCoordinates(mapCenterCoord, 'EPSG:3978', 'EPSG:4326')![0] as number;
    if (mapZoom < 5 && Math.abs(CENTRAL_MERIDIAN - mapCenterLongitude) < 10) {
      return { memoCalculatedRotation: { angle: 0 }, memoCalculatedOffset: offsetX };
    }

    // Early return if north is visible
    if (northArrowElement.isNorthVisible) {
      return { memoCalculatedRotation: { angle: 0 }, memoCalculatedOffset: offsetX };
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
        const deviationFromCenter = mapCenterLongitude - CENTRAL_MERIDIAN;

        if (Math.abs(deviationFromCenter) <= 3) {
          mapController.rotate(0);
          equalCountRef.current = 0;
        } else if (diff > 0.01) {
          // Only set rotation if we haven't already set it for this value
          if (rotationValue !== prevRotationRef.current) {
            mapController.rotate(rotationValue);
            prevRotationRef.current = rotationValue;
            equalCountRef.current = 1; // Set to 1 to indicate we've used this value
          }
          // If values are the same but we haven't set rotation yet
          else if (equalCountRef.current === 0) {
            mapController.rotate(rotationValue);
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
      const northPolePosition = mapController.getPixelFromCoordinate(NORTH_POLE_POSITION_LONLAT);

      if (!fixNorth && northPolePosition !== null) {
        const screenNorthPoint = northPolePosition;
        const mapCenter = mapController.getPixelFromCoordinate(mapCenterCoord);

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

      return { memoCalculatedRotation: newRotation, memoCalculatedOffset: newOffset };
    }

    // Should never goes here but failover to default values
    return { memoCalculatedRotation: { angle: 0 }, memoCalculatedOffset: 0 };
  }, [mapSize, northArrowElement, isLCCProjection, isWebMercator, mapCenterCoord, mapZoom, mapRotation, fixNorth, mapController]);

  /**
   * Updates local state with the calculated rotation and offset values.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-MANAGE-ARROW - calculatedRotation, calculatedOffset', {
      memoCalculatedRotation,
      memoCalculatedOffset,
    });

    setRotationAngle(memoCalculatedRotation);
    setNorthOffset(memoCalculatedOffset);
  }, [memoCalculatedRotation, memoCalculatedOffset, rotationAngle, northOffset]);

  return { rotationAngle, northOffset };
};
