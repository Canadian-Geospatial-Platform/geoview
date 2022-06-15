import { useCallback, useEffect, useRef, useState, useContext } from 'react';

import OLMap from 'ol/Map';
import { Coordinate } from 'ol/coordinate';

import { useTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import { debounce } from 'lodash';

import { PROJECTION_NAMES } from '../../../geo/projection/projection';

import { NorthArrowIcon } from './north-arrow-icon';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

const useStyles = makeStyles((theme) => ({
  northArrowContainer: {
    left: '50%', // theme.shape.center,
  },
  northArrow: {
    width: theme.overrides?.northArrow?.size.width,
    height: theme.overrides?.northArrow?.size.height,
  },
}));

// The north pole position use for north arrow marker and get north arrow rotation angle
const northPolePosition: [number, number] = [90, -95];

// interface used for NorthArrow props
interface NorthArrowProps {
  projection: string;
}

/**
 * Create a north arrow
 *
 * @return {JSX.Element} the north arrow component
 */
export function NorthArrow(props: NorthArrowProps): JSX.Element {
  const { projection } = props;

  const classes = useStyles();

  const northArrowRef = useRef<HTMLDivElement>(null);

  const [rotationAngle, setRotationAngle] = useState({ angle: 0 });
  const [isNorthVisible, setIsNorthVisible] = useState(false);
  const [northOffset, setNorthOffset] = useState(0);

  // access transitions
  const defaultTheme = useTheme();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection
   * https://www.movable-type.co.uk/scripts/latlong.html
   *
   * @param {Coordinate} center Map center in lat long
   * @return {string} the arrow angle
   */
  const getNorthArrowAngle = (center: Coordinate): string => {
    try {
      // north value (set longitude to be half of Canada extent (141° W, 52° W))
      const pointA = { x: northPolePosition[1], y: northPolePosition[0] };

      // map center
      const pointB = { x: center[0], y: center[1] };

      // set info on longitude and latitude
      const dLon = ((pointB.x - pointA.x) * Math.PI) / 180;
      const lat1 = (pointA.y * Math.PI) / 180;
      const lat2 = (pointB.y * Math.PI) / 180;

      // calculate bearing
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const bearing = (Math.atan2(y, x) * 180) / Math.PI;

      // return angle (180 is pointiong north)
      return ((bearing + 360) % 360).toFixed(1);
    } catch (error) {
      return '180.0';
    }
  };

  /**
   * Check if north is visible. This is not a perfect solution and more a work around
   * @param {OLMap} map the map
   * @return {boolean} true if visible, false otherwise
   */
  function checkNorth(map: OLMap): boolean {
    // Check the container value for top middle of the screen
    // Convert this value to a lat long coordinate
    const pointXY = [map.getSize()![0] / 2, 1];

    const pt = map.getCoordinateFromPixel(pointXY);

    // If user is pass north, long value will start to be positive (other side of the earth).
    // This willl work only for LCC Canada.
    return pt ? pt[0] > 0 : true;
  }

  /**
   * Calculate the north arrow offset
   * Calculation taken from RAMP: https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/packages/ramp-core/src/app/geo/map-tools.service.js
   * @param {OLMap} map the map
   * @param {number} angleDegrees north arrow rotation
   */
  function setOffset(map: OLMap, angleDegrees: number): void {
    const mapWidth = map.getSize()![0] / 2;
    const arrowWidth = 24;
    const offsetX = mapWidth - arrowWidth / 2;

    // hard code north pole so that arrow does not continue pointing past it
    const screenNorthPoint = map.getPixelFromCoordinate(northPolePosition);
    const screenY = screenNorthPoint[1];

    // if the extent is near the north pole be more precise otherwise use the original math
    // note: using the precise math would be ideal but when zooming in, the calculations make very
    // large adjustments so reverting to the old less precise math provides a better experience.
    const triangle = {
      x: offsetX,
      y: map.getPixelFromCoordinate(map.getView().getCenter()!)[1],
      m: 1,
    }; // original numbers
    if (screenNorthPoint[0] < 2400 && screenNorthPoint[1] > -1300 && -screenNorthPoint[1] < 3000) {
      // more precise
      // eslint-disable-next-line prefer-destructuring
      triangle.x = screenNorthPoint[0];
      triangle.y = -screenNorthPoint[1];
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
  }

  /**
   * If the projection is LCC, we rotate and apply offset to the arrow so it is pointing north
   * @param {OLMap} map the map
   */
  function manageArrow(map: OLMap): void {
    if (projection === PROJECTION_NAMES.LCC) {
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
      // All this happens because the arrow rotation is taken from the middle of the screen and in  LCC projection, the more you go north,
      // the more distortion you have.
      // TODO: Add this to help doc, TODO: Check if it may creates problem with spatial intersect
      const isPassNorth = checkNorth(map);
      setIsNorthVisible(isPassNorth);

      if (!isPassNorth) {
        // set rotation angle and offset
        const angleDegrees = 270 - parseFloat(getNorthArrowAngle(map.getView().getCenter()!));
        setRotationAngle({ angle: 90 - angleDegrees });
        setOffset(map, angleDegrees);
      }
    }
  }

  /**
   * Map moveend event callback
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMapMoveEnd = useCallback(
    debounce((e) => {
      const map = e.map as OLMap;
      manageArrow(map);
    }, 500),
    []
  );

  useEffect(() => {
    const { map } = api.map(mapId);

    manageArrow(map);

    // listen to map moveend event
    map.on('moveend', onMapMoveEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return projection === PROJECTION_NAMES.LCC ? (
    <div
      ref={northArrowRef}
      className={classes.northArrowContainer}
      style={{
        transition: defaultTheme.transitions.create(['all', 'transform'], {
          duration: defaultTheme.transitions.duration.standard,
          easing: defaultTheme.transitions.easing.easeOut,
        }),
        transform: `rotate(${rotationAngle.angle}deg)`,
        visibility: isNorthVisible ? 'hidden' : 'visible',
        left: northOffset,
      }}
    >
      <NorthArrowIcon classes={classes} />
    </div>
  ) : (
    <div />
  );
}

// /**
//  * Create a north pole flag icon
//  * @param {NorthArrowProps} props north arrow icon props
//  * @return {JSX.Element} the north pole marker icon
//  */
// export function NorthPoleFlag(props: NorthArrowProps): JSX.Element {
//   const { projection } = props;
//   const [pane, setPane] = useState(false);

//   const mapConfig = useContext(MapContext);

//   const mapId = mapConfig.id;

//   useEffect(() => {
//     // api.map(mapId).map.createPane('NorthPolePane');
//     setPane(true);
//     // Create a pane for the north pole marker
//   }, [mapId]);

//   // Create the icon
//   const iconUrl = encodeURI(`data:image/svg+xml,${NorthPoleIcon}`).replace('#', '%23');
//   const northPoleIcon = new Icon({
//     iconUrl,
//     iconSize: [24, 24],
//     iconAnchor: [6, 18],
//   });

//   return projection.code === PROJECTION_NAMES.LCC && pane ? (
//     <Marker id={generateId('')} position={northPolePosition} icon={northPoleIcon} keyboard={false} pane="NorthPolePane" />
//   ) : (
//     <div />
//   );
// }
