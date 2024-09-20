import { useEffect, useRef, useState } from 'react';
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

/**
 * Custom hook to Manage North arrow.
 * @returns rotationAngle and northoffset
 */
// TODO: Refactor - Explicit this return as a type for rotationAngle and northoffset
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useManageArrow = (): any => {
  const [rotationAngle, setRotationAngle] = useState({ angle: 0 });
  const [northOffset, setNorthOffset] = useState(0);
  const angle = useRef(0); // keep track of rotation angle for fix north

  // get the values from store
  const mapProjection = useMapProjection();
  const northArrowElement = useMapNorthArrowElement();
  const fixNorth = useMapFixNorth();
  const mapZoom = useMapZoom();
  const mapRotation = useMapRotation();
  const mapCenterCoord = useMapCenterCoordinates();
  const mapSize = useMapSize();
  const { getPixelFromCoordinate, setRotation } = useMapStoreActions();

  /**
   * Calculate the north arrow offset
   * Calculation taken from RAMP: https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/packages/ramp-core/src/app/geo/map-tools.service.js
   * @param {number} angleDegrees north arrow rotation
   */
  function setOffset(angleDegrees: number): void {
    const mapWidth = mapSize[0] / 2;
    const arrowWidth = 24;
    const offsetX = mapWidth - arrowWidth / 2;

    if (!fixNorth && getPixelFromCoordinate(NORTH_POLE_POSITION) !== null && `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC) {
      // hard code north pole so that arrow does not continue pointing past it
      const screenNorthPoint = getPixelFromCoordinate(NORTH_POLE_POSITION);
      const screenY = screenNorthPoint[1];

      // if the extent is near the north pole be more precise otherwise use the original math
      // note: using the precise math would be ideal but when zooming in, the calculations make very
      // large adjustments so reverting to the old less precise math provides a better experience.
      const triangle = {
        x: offsetX,
        y: getPixelFromCoordinate(mapCenterCoord)[1],
        m: 1,
      }; // original numbers
      if (screenNorthPoint[0] < 2400 && screenNorthPoint[1] > -1300 && -screenNorthPoint[1] < 3000) {
        // more precise
        [triangle.x, triangle.y] = screenNorthPoint;
        triangle.m = -1;
      }

      // z is the hypotenuse line from center point to the top of the viewer. The triangle is always a right triangle
      const z = triangle.y / Math.sin(angleDegrees * 0.01745329252); // 0.01745329252 is the radian conversion

      // this would be the bottom of our triangle, the length from center to where the arrow should be placed
      let screenX =
        screenY < 0
          ? triangle.x + triangle.m * (Math.sin((90 - angleDegrees) * 0.01745329252) * z) - arrowWidth / 2
          : screenNorthPoint[0] - arrowWidth;

      // Limit the arrow to the bounds of the inner shell (+/- 25% from center)
      screenX = Math.max(offsetX - mapWidth * 0.25, Math.min(screenX, offsetX + mapWidth * 0.25));

      setNorthOffset(screenX);
    } else {
      setNorthOffset(offsetX);
    }
  }

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEMANAGEARROW - northArrowElement', northArrowElement, fixNorth);

    if (`EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC) {
      // Because of the projection, corners are wrapped and central value of the polygon may be higher then corners values.
      // There is no easy way to see if the user sees the north pole just by using bounding box. One of the solution may
      // be to use a debounce function to call on moveEnd where we
      // - Get the bbox in lat/long
      // - Densify the bbox
      // - Project the bbox in LCC
      // - Check if upper value of the densify bbox is higher or lower then LCC north value for north pole
      //
      // Even embeded bounds.contains will not work because they work with bbox. Good in WM but terrible in LCC
      //
      // All this happens because the arrow rotation is not constant accros the screen and in LCC projection, the more you go north,
      // the more distortion you have.
      // TODO: Add this to help doc, TODO: Check if it may creates problem with spatial intersect

      if (!northArrowElement.isNorthVisible) {
        const arrowAngle = parseFloat(northArrowElement.degreeRotation);
        const angleDegrees = 270 - arrowAngle;

        // if north if fix and rotation round angle is different, apply rotation
        // we check rotation because when zoom out, this function can run many time to adjust itself
        if (fixNorth && (Math.round(angle.current) !== Math.round(arrowAngle) || mapZoom > 7)) {
          angle.current = arrowAngle;

          // set map rotation to keep fix north
          setRotation(((180 - arrowAngle) * (2 * Math.PI)) / 360);

          setRotationAngle({ angle: 0 });
        } else {
          // set arrow rotation
          const mapRotationValue = fixNorth ? mapRotation * (180 / Math.PI) : mapRotation * (180 / Math.PI);
          setRotationAngle({ angle: 90 - angleDegrees + mapRotationValue });
        }

        // set arrow offset
        setOffset(angleDegrees);
      }
    } else if (`EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.WM) {
      setOffset(0);

      // set arrow rotation to map rotation as Web /mercator always has north straight up
      setRotationAngle({ angle: mapRotation * (180 / Math.PI) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [northArrowElement, fixNorth, mapSize, mapRotation]);

  return { rotationAngle, northOffset };
};

export default useManageArrow;
