import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

import { makeStyles, useTheme } from '@material-ui/core/styles';

import { Map, LatLng, LatLngExpression, CRS, Point, Icon } from 'leaflet';
import { useMapEvent, Marker, useMap } from 'react-leaflet';

import { debounce } from 'lodash';

import { PROJECTION_NAMES } from '../../api/projection';

import { northPolePosition } from '../../common/constant';

import { NorthArrowIcon, NorthPoleIcon } from '../../assests/style/north-arrow';

const useStyles = makeStyles((theme) => ({
    northArrowContainer: {
        left: theme.shape.center,
    },
    northArrow: {
        width: (theme.overrides?.northArrow?.size as CSSProperties).width,
        height: (theme.overrides?.northArrow?.size as CSSProperties).height,
    },
}));

/**
 * north arrow passed in properties
 */
interface NorthArrowProps {
    // projection is used when checking which projection is being used in the Map
    projection: CRS;
}

/**
 * Create a north arrow
 * @param {NorthArrowProps} props north arrow properties
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

    /**
     * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection
     * https://www.movable-type.co.uk/scripts/latlong.html
     *
     * @param {LatLng} center Map center in lat long
     * @return {string} the arrow angle
     */
    const getNorthArrowAngle = (center: LatLng): string => {
        try {
            // north value (set longitude to be half of Canada extent (141° W, 52° W))
            const pointA = { x: northPolePosition[1], y: northPolePosition[0] };

            // map center
            const pointB = new Point(center.lng, center.lat);

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
     * @param {Map} map the map
     * @return {boolean} true if visible, false otherwise
     */
    function checkNorth(map: Map): boolean {
        // Check the container value for top middle of the screen
        // Convert this value to a lat long coordinate
        const pointXY = new Point(map.getSize().x / 2, 1);
        const pt = map.containerPointToLatLng(pointXY);

        // If user is pass north, long value will start to be positive (other side of the earth).
        // This willl work only for LCC Canada.
        return pt.lng > 0;
    }

    /**
     * Calculate the north arrow offset
     * Calculation taken from RAMP: https://github.com/fgpv-vpgf/fgpv-vpgf/blob/master/packages/ramp-core/src/app/geo/map-tools.service.js
     * @param {Map} map the map
     * @param {number} angleDegrees north arrow rotation
     */
    function setOffset(map: Map, angleDegrees: number): void {
        const mapWidth = map.getSize().x / 2;
        const arrowWidth = 24;
        const offsetX = mapWidth - arrowWidth / 2;

        // hard code north pole so that arrow does not continue pointing past it
        const screenNorthPoint = map.latLngToContainerPoint(northPolePosition as LatLngExpression);
        const screenY = screenNorthPoint.y;

        // if the extent is near the north pole be more precise otherwise use the original math
        // note: using the precise math would be ideal but when zooming in, the calculations make very
        // large adjustments so reverting to the old less precise math provides a better experience.
        const triangle = { x: offsetX, y: map.latLngToContainerPoint(map.getCenter()).y, m: 1 }; // original numbers
        if (screenNorthPoint.x < 2400 && screenNorthPoint.x > -1300 && -screenNorthPoint.y < 3000) {
            // more precise
            triangle.x = screenNorthPoint.x;
            triangle.y = -screenNorthPoint.y;
            triangle.m = -1;
        }

        // z is the hypotenuse line from center point to the top of the viewer. The triangle is always a right triangle
        const z = triangle.y / Math.sin(angleDegrees * 0.01745329252); // 0.01745329252 is the radian conversion

        // this would be the bottom of our triangle, the length from center to where the arrow should be placed
        let screenX =
            screenY < 0
                ? triangle.x + triangle.m * (Math.sin((90 - angleDegrees) * 0.01745329252) * z) - arrowWidth / 2
                : screenNorthPoint.x - arrowWidth;

        // Limit the arrow to the bounds of the inner shell (+/- 25% from center)
        screenX = Math.max(offsetX - mapWidth * 0.25, Math.min(screenX, offsetX + mapWidth * 0.25));
        setNorthOffset(screenX);
    }

    /**
     * If the projection is LCC, we rotate and apply offset to the arrow so it is pointing north
     * @param {Map} map the map
     */
    function manageArrow(map: Map): void {
        if (projection.code === PROJECTION_NAMES.LCC) {
            // Because of the projection, corners are wrapped and central value of the polygon may be higher then corners values.
            // There is no easy way to see if the user sees the north pole just by using bounding box. One of the solution may
            // be to use a debounce function to call on moveEnd where we
            // - Get the bbox in lat/long
            // - Densify the bbox
            // - Project the bbox in LCC
            // - Check if upper value of the densify bbox is higher or lower then LCC north value for north pole
            //
            // Even embeded Leaflet bounds.contains will not work because they work with bbox. Good in WM but terrible in LCC
            //
            // All this happens because the arrow rotation is taken from the middle of the screen and in  LCC projection, the more you go north,
            // the more distortion you have.
            // TODO: Add this to help doc, TODO: Check if it may creates problem with spatial intersect
            const isPassNorth = checkNorth(map);
            setIsNorthVisible(isPassNorth);

            if (!isPassNorth) {
                // set rotation angle and offset
                const angleDegrees = 270 - parseFloat(getNorthArrowAngle(map.getCenter()));
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
            const map = e.target as Map;
            manageArrow(map);
        }, 500),
        []
    );

    // listen to map moveend event
    useMapEvent('moveend', onMapMoveEnd);

    /**
     * first render, fire the arrow creation
     */
    const map = useMap();
    useEffect(() => {
        manageArrow(map);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return projection.code === PROJECTION_NAMES.LCC ? (
        <div
            ref={northArrowRef}
            className={`leaflet-control leaflet-top leaflet-left ${classes.northArrowContainer}`}
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
        ((<div />) as JSX.Element)
    );
}

/**
 * Create a north pole flag icon
 *
 * @param {NorthArrowProps} props north pole properties (same as NorthArrow)
 * @return {JSX.Element} the north pole marker icon
 */
export function NorthPoleFlag(props: NorthArrowProps): JSX.Element {
    const { projection } = props;

    // Create a pane for the north pole marker
    const map = useMap();
    map.createPane('NorthPolePane');

    // Create the icon
    const iconUrl = encodeURI(`data:image/svg+xml,${NorthPoleIcon}`).replace('#', '%23');
    const northPoleIcon = new Icon({
        iconUrl,
        iconSize: [24, 24],
        iconAnchor: [6, 18],
    });

    return projection.code === PROJECTION_NAMES.LCC ? (
        <Marker position={northPolePosition as LatLngExpression} icon={northPoleIcon} keyboard={false} pane="NorthPolePane" />
    ) : (
        ((<div />) as JSX.Element)
    );
}
