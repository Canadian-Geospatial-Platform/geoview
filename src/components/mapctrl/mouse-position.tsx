import { useCallback, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { useTranslation } from 'react-i18next';

import { useMapEvent } from 'react-leaflet';

import { debounce } from 'lodash';

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
 * Create the mouse position
 * @return {JSX.Element} the mouse position component
 */
export function MousePosition(): JSX.Element {
    const { t } = useTranslation();

    const classes = useStyles();

    const [position, setPosition] = useState({ lat: '--', lng: '--' });

    const onMouseMove = useCallback(
        debounce((e) => {
            const lat = coordFormnat(e.latlng.lat, e.latlng.lat > 0 ? t('mapctrl.mouseposition.north') : t('mapctrl.mouseposition.south'));
            const lng = coordFormnat(e.latlng.lng, e.latlng.lng < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east'));
            setPosition({ lat, lng });
        }, 250),
        [t]
    );
    useMapEvent('mousemove', onMouseMove);

    return (
        <span className={classes.mouseposition}>
            {position.lat} | {position.lng}
        </span>
    );
}
