import { useCallback, useState, useEffect, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { useTranslation } from 'react-i18next';

import { useMapEvent } from 'react-leaflet';
import { LatLng } from 'leaflet';

import { debounce } from 'lodash';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

const useStyles = makeStyles((theme) => ({
    mouseposition: {
        position: 'absolute',
        right: '120px !important',
        zIndex: theme.zIndex.leafletControl,
        textAlign: 'center',
        bottom: theme.spacing(0),
        marginBottom: theme.spacing(),
        padding: theme.spacing(2),
        display: 'flex !important',
        flexDirection: 'column',
        fontSize: theme.typography.control.fontSize,
        fontWeight: theme.typography.control.fontWeight,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
}));

// degree char
const deg = String.fromCharCode(176);

/**
 * Format the coordinates for degrees - minutes - seconds
 * @param {number} value the value to format
 * @param {string} card the cardinality north/south or east/west
 * @return {string} the formatted value
 */
function coordFormnat(value: number, card: string): string {
    const d = Math.floor(Math.abs(value)) * (value < 0 ? -1 : 1);
    const m = Math.floor(Math.abs((value - d) * 60));
    const s = Math.round((Math.abs(value) - Math.abs(d) - m / 60) * 3600);
    return `${Math.abs(d)}${deg} ${m >= 10 ? `${m}` : `0${m}`}' ${s >= 10 ? `${s}` : `0${s}`}" ${card}`;
}

/**
 * Mouse position properties interface
 */
interface MousePositionProps {
    id: string;
}

/**
 * Create the mouse position
 * @param {MousePositionProps} props the mouse position properties
 * @return {JSX.Element} the mouse position component
 */
export function MousePosition(props: MousePositionProps): JSX.Element {
    const { id } = props;

    const { t } = useTranslation<string>();

    const classes = useStyles();

    const [position, setPosition] = useState({ lat: '--', lng: '--' });

    // keep track of crosshair status to know when update coord from keyboard navigation
    const isCrosshairsActive = useRef(false);

    /**
     * Format the coordinates output
     * @param {LatLng} latlng the Lat and Lng value to format
     */
    function formatCoord(latlng: LatLng) {
        const lat = coordFormnat(latlng.lat, latlng.lat > 0 ? t('mapctrl.mouseposition.north') : t('mapctrl.mouseposition.south'));
        const lng = coordFormnat(latlng.lng, latlng.lng < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east'));
        setPosition({ lat, lng });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onMouseMove = useCallback(
        debounce((e) => {
            formatCoord(e.latlng);
        }, 250),
        [t]
    );
    useMapEvent('mousemove', onMouseMove);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onMoveEnd = useCallback(
        debounce((e) => {
            if (isCrosshairsActive.current) {
                formatCoord(e.target.getCenter());
            }
        }, 500),
        [t]
    );
    useMapEvent('moveend', onMoveEnd);

    useEffect(() => {
        // on map crosshair enable\disable, set variable for WCAG mouse position
        api.event.on(EVENT_NAMES.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, (payload) => {
            if (payload && payload.handlerName.includes(id)) {
                isCrosshairsActive.current = payload.active;
            }
        });

        return () => {
            api.event.off(EVENT_NAMES.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <span className={classes.mouseposition}>
            {position.lat} | {position.lng}
        </span>
    );
}
