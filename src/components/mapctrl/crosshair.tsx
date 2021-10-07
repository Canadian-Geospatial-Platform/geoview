/* eslint-disable react/no-danger */
import { useEffect, useState, useRef, CSSProperties } from 'react';

import { useTranslation } from 'react-i18next';

import { Fade } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { useMap } from 'react-leaflet';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { CrosshairIcon } from '../../assests/style/crosshair';

const useStyles = makeStyles((theme) => ({
    crosshairContainer: {
        position: 'absolute',
        top: theme.spacing(0),
        right: theme.spacing(0),
        left: theme.spacing(0),
        bottom: theme.spacing(0),
        paddingBottom: theme.spacing(6),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        'pointer-events': 'none !important',
        zIndex: theme.zIndex.leafletControl,
    },
    crosshairInfo: {
        position: 'absolute',
        top: theme.spacing(0),
        right: theme.spacing(0),
        left: theme.spacing(0),
        height: 'calc(1em + 8px)',
        padding: theme.spacing(2, 1, 4, 1),
        backgroundColor: 'rgba(228, 227, 227, 0.9)',
        '& span': {
            paddingLeft: 70,
        },
    },
    crosshairIcon: {
        width: (theme.overrides?.crosshairIcon?.size as CSSProperties).width,
        height: (theme.overrides?.crosshairIcon?.size as CSSProperties).height,
    },
}));

/**
 * Crosshair properties interface
 */
interface CrosshairProps {
    id: string;
}

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @param {CrosshairProps} props the crosshair properties
 * @return {JSX.Element} the north arrow component
 */
export function Crosshair(props: CrosshairProps): JSX.Element {
    const { id } = props;

    const classes = useStyles();
    const { t } = useTranslation<string>();

    const map = useMap();

    const mapId = api.mapInstance(map).id;

    const mapContainer = map.getContainer();

    // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
    const [isCrosshairsActive, setCrosshairsActive] = useState(false);

    // do not use useState for item used inside function only without rendering... use useRef
    const isCrosshairsActiveValue = useRef(false);
    const panelButtonId = useRef('');

    /**
     * Siimulate map mouse click to trigger details panel
     * @function simulateClick
     * @param {KeyboardEvent} evt the keyboard event
     */
    function simulateClick(evt: KeyboardEvent): void {
        if (evt.key === 'Enter') {
            const latlngPoint = map.getCenter();

            if (isCrosshairsActiveValue.current) {
                const { panel } = api.map(mapId).appBarPanels.default[panelButtonId.current];

                if (panel) {
                    // emit an event with the latlng point
                    api.event.emit(EVENT_NAMES.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER, mapId, {
                        latlng: latlngPoint,
                    });
                }
            }
        }
    }

    /**
     * Remove the crosshair for keyboard navigation on map mouse move or blur
     * @function removeCrosshair
     */
    function removeCrosshair(): void {
        // remove simulate click event listener
        mapContainer.removeEventListener('keydown', simulateClick);
        setCrosshairsActive(false);
        isCrosshairsActiveValue.current = false;
        api.event.emit(EVENT_NAMES.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, id, { active: false });
    }

    useEffect(() => {
        // on map keyboard focus, add crosshair
        api.event.on(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS, (payload) => {
            if (payload && payload.handlerName.includes(id)) {
                setCrosshairsActive(true);
                isCrosshairsActiveValue.current = true;
                api.event.emit(EVENT_NAMES.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, id, { active: true });

                mapContainer.addEventListener('keydown', simulateClick);
                panelButtonId.current = 'detailsPanel';
            }
        });

        // when map blur, remove the crosshair and click event
        mapContainer.addEventListener('blur', removeCrosshair);

        return () => {
            api.event.off(EVENT_NAMES.EVENT_MAP_IN_KEYFOCUS);
            mapContainer.removeEventListener('keydown', simulateClick);
            mapContainer.removeEventListener('keydown', removeCrosshair);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className={classes.crosshairContainer}
            style={{
                visibility: isCrosshairsActive ? 'visible' : 'hidden',
            }}
        >
            <Fade in={isCrosshairsActive}>
                <div className={classes.crosshairIcon}>
                    <CrosshairIcon />
                </div>
            </Fade>
            <div className={classes.crosshairInfo}>
                <span dangerouslySetInnerHTML={{ __html: t('mapctrl.crosshair') }} />
            </div>
        </div>
    );
}
