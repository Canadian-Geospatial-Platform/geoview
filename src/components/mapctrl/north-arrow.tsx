import { useCallback, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import L, { Map } from 'leaflet';
import { useMapEvent } from 'react-leaflet';

import { api } from '../../api/api';
import { PROJECTION_NAMES } from '../../api/projection';

import { NorthArrowIcon } from '../../assests/style/north-arrow';

const useStyles = makeStyles((theme) => ({
    northArrowContainer: {
        left: theme.shape.center,
    },
    northArrow: {
        width: theme.overrides.northArrow.width,
        height: theme.overrides.northArrow.height,
    },
}));

/**
 * north arrow passed in properties
 */
interface NorthArrowProps {
    // projection is used when checking which projection is being used in the Map
    projection: L.CRS;
}

/**
 * Create a north arrow
 *
 * @param {NorthArrowProps} props north arrow properties
 */
export function NorthArrow(props: NorthArrowProps): JSX.Element {
    const { projection } = props;

    const classes = useStyles();

    const northArrowRef = useRef();

    /**
     * Get an updated north arrow angle, used for LCC projection
     *
     * @param {L.Point} point a leaflet point used to update the arrow angle
     * @param {Map} map A Leaflet map used to get map min/max bounds
     */
    const getNorthArrowAngle = (point: L.Point | null, map: Map): string => {
        const { min, max } = map.getPixelBounds();

        // get center point in longitude and use bottom value for latitude for default point
        const bottomCenter: L.Point = L.point((min.x + max.x) / 2, min.y);

        // get point if specified by caller else get default
        const p = point ? point || bottomCenter : bottomCenter;
        try {
            const b: number[] = api.projection.lccToLatLng([p.x, p.y])[0];

            const pointB = L.point(b[0], b[1]);

            // north value (set longitude to be half of Canada extent (141° W, 52° W))
            const pointA = { x: -96, y: 90 };

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
     * map moveend event callback
     */
    const onMapMoveEnd = useCallback((e) => {
        const map = e.target as Map;

        if (projection.code === PROJECTION_NAMES.LCC) {
            const offsetX = northArrowRef.current.offsetLeft;

            const arrowPoint: number[] = api.projection.latLngToLCC([offsetX, 0])[0];
            arrowPoint[1] = map.getPixelBounds().min.y;

            const angleDegrees = 270 - parseFloat(getNorthArrowAngle(L.point(arrowPoint[0], arrowPoint[1]), e.target as Map));

            const rotationAngle = 90 - angleDegrees;
            const northPoint = api.projection.lccToLatLng([-96, 90])[0];
        }
    }, []);

    // listen to map moveend event
    useMapEvent('moveend', onMapMoveEnd);

    return (
        <div ref={northArrowRef} className={`leaflet-control leaflet-top leaflet-left ${classes.northArrowContainer}`}>
            <NorthArrowIcon classes={classes} />
        </div>
    );
}
