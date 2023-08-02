import { useCallback, useEffect, useRef, useState, useContext } from 'react';

import OLMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import { Coordinate } from 'ol/coordinate';
import { toLonLat, fromLonLat } from 'ol/proj';

import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import debounce from 'lodash/debounce';

import { PROJECTION_NAMES } from '@/geo/projection/projection';

import { NorthArrowIcon, NorthPoleIcon } from './north-arrow-icon';

import { MapContext } from '@/core/app-start';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAMapViewProjection, payloadIsABoolean, PayloadBaseClass } from '@/api/events/payloads';

const useStyles = makeStyles((theme) => ({
  northArrowContainer: {
    left: '50%',
    position: 'absolute',
  },
  northArrow: {
    width: theme.overrides?.northArrow?.size.width,
    height: theme.overrides?.northArrow?.size.height,
  },
}));

// The north pole position use for north arrow marker and get north arrow rotation angle
// north value (set longitude to be half of Canada extent (142° W, 52° W)) - projection central meridian is -95
const northPolePosition: [number, number] = [90, -95];

// interface used for NorthArrow props
interface NorthArrowProps {
  projection: string;
}

/**
 * Create a north arrow
 *
 * @returns {JSX.Element} the north arrow component
 */
export function NorthArrow(props: NorthArrowProps): JSX.Element {
  const { projection } = props;

  const classes = useStyles();

  const northArrowRef = useRef<HTMLDivElement>(null);

  const [rotationAngle, setRotationAngle] = useState({ angle: 0 });
  const [isNorthVisible, setIsNorthVisible] = useState(false);
  const [northOffset, setNorthOffset] = useState(0);

  // keep track of rotation angle for fix north
  let angle = 0;

  // do not use useState for item used inside function only without rendering... use useRef
  const isNorthFixedValue = useRef(false);

  // access transitions
  const defaultTheme = useTheme();

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection
   * https://www.movable-type.co.uk/scripts/latlong.html
   *
   * @param {OLMap} map the map
   * @returns {string} the arrow angle
   */
  const getNorthArrowAngle = (map: OLMap): string => {
    try {
      // north value
      const pointA = { x: northPolePosition[1], y: northPolePosition[0] };

      // map center (we use botton parallel to introduce less distortion)
      const extent = map.getView().calculateExtent();
      const center: Coordinate = toLonLat(
        [(extent[0] + extent[2]) / 2, extent[1]],
        api.projection.projections[api.map(mapId).currentProjection]
      );
      const pointB = { x: center[0], y: center[1] };

      // set info on longitude and latitude
      const dLon = ((pointB.x - pointA.x) * Math.PI) / 180;
      const lat1 = (pointA.y * Math.PI) / 180;
      const lat2 = (pointB.y * Math.PI) / 180;

      // calculate bearing
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const bearing = (Math.atan2(y, x) * 180) / Math.PI;

      // return angle (180 is pointing north)
      return ((bearing + 360) % 360).toFixed(1);
    } catch (error) {
      return '180.0';
    }
  };

  /**
   * Check if north is visible. This is not a perfect solution and more a work around
   * @param {OLMap} map the map
   * @returns {boolean} true if visible, false otherwise
   */
  function checkNorth(map: OLMap): boolean {
    // update map size in case an app-bar panel is open
    map.updateSize();

    // Check the container value for top middle of the screen
    // Convert this value to a lat long coordinate
    const pointXY = [map.getSize()![0] / 2, 1];
    const pt = toLonLat(map.getCoordinateFromPixel(pointXY), api.projection.projections[api.map(mapId).currentProjection]);

    // If user is pass north, long value will start to be positive (other side of the earth).
    // This will work only for LCC Canada.
    return pt ? pt[0] > 0 : true;
  }

  /**
   * Calculate the north arrow offset
   * Calculation taken from RAMP: https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/packages/ramp-core/src/app/geo/map-tools.service.js
   * @param {OLMap} map the map
   * @param {number} angleDegrees north arrow rotation
   */
  function setOffset(map: OLMap, angleDegrees: number): void {
    // update map size in case an app-bar panel is open
    map.updateSize();

    const mapWidth = map.getSize()![0] / 2;
    const arrowWidth = 24;
    const offsetX = mapWidth - arrowWidth / 2;

    if (!isNorthFixedValue.current) {
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
    } else {
      setNorthOffset(offsetX);
    }
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
      // All this happens because the arrow rotation is not constant accros the screen and in LCC projection, the more you go north,
      // the more distortion you have.
      // TODO: Add this to help doc, TODO: Check if it may creates problem with spatial intersect
      const isPassNorth = checkNorth(map);
      setIsNorthVisible(isPassNorth);

      if (!isPassNorth) {
        const arrowAngle = parseFloat(getNorthArrowAngle(map));
        const angleDegrees = 270 - arrowAngle;

        // if north if fix and rotation round angle is different, apply rotation
        // we check rotation because when zoom out, this function can run many time to adjust itself
        if (isNorthFixedValue.current && (Math.round(angle) !== Math.round(arrowAngle) || map.getView().getZoom()! > 7)) {
          angle = arrowAngle;

          // set map rotation to keep fix north
          api
            .map(mapId)
            .map.getView()
            .animate({
              rotation: ((180 - arrowAngle) * (2 * Math.PI)) / 360,
            });

          setRotationAngle({ angle: 0 });
        } else {
          // set arrow rotation
          const mapRotation = map.getView().getRotation() * (180 / Math.PI);
          setRotationAngle({ angle: 90 - angleDegrees + mapRotation });
        }

        // set arrow offset
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

  const mapFixNorthListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsABoolean(payload)) {
      isNorthFixedValue.current = payload.status;

      // if north is fix, trigger the map rotation
      if (payload.status) {
        manageArrow(api.map(mapId).map);
      }
    }
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    // listen to map moveend event
    map.on('moveend', onMapMoveEnd);

    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_FIX_NORTH, mapFixNorthListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_FIX_NORTH, mapId);
      map.un('moveend', onMapMoveEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

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

/**
 * Create a north pole flag icon
 * @param {NorthArrowProps} props north arrow icon props
 * @returns {JSX.Element} the north pole marker icon
 */
export function NorthPoleFlag(props: NorthArrowProps): JSX.Element {
  const { projection } = props;
  const northPoleRef = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);
  const [mapProjection, setMapProjection] = useState(projection);
  const { mapId } = mapConfig;
  const northPoleId = `${mapId}-northpole`;

  const mapviewProjectionChangeListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapViewProjection(payload)) {
      setMapProjection(`EPSG:${payload.projection}`);
    }
  };

  useEffect(() => {
    const { map } = api.map(mapId);
    const projectionPosition = fromLonLat(
      [northPolePosition[1], northPolePosition[0]],
      api.projection.projections[api.map(mapId).currentProjection]
    );

    // create overlay for north pole icon
    const northPoleMarker = new Overlay({
      id: northPoleId,
      position: projectionPosition,
      positioning: 'center-center',
      element: document.getElementById(northPoleId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(northPoleMarker);

    // listen to geoview-basemap-panel package change projection event
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapviewProjectionChangeListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, mapviewProjectionChangeListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={northPoleRef} id={northPoleId} style={{ visibility: mapProjection === PROJECTION_NAMES.LCC ? 'visible' : 'hidden' }}>
      <NorthPoleIcon />
    </div>
  );
}
