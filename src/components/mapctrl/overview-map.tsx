import { useCallback, useMemo, useState, useEffect, useRef, CSSProperties } from 'react';

import { useTranslation } from 'react-i18next';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import { IconButton } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';

import { Map, CRS, DomEvent } from 'leaflet';
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import { useEventHandlers, LeafletElement } from '@react-leaflet/core';

// eslint-disable-next-line import/no-unresolved
import { LeafletContextInterface } from '@react-leaflet/core/types/context';
import { Basemap } from '../../common/basemap';
import { LEAFLET_POSITION_CLASSES } from '../../common/constant';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { Cast } from '../../types/cgpv-types';

const MINIMAP_SIZE = {
    width: '150px',
    height: '150px',
};

const useStyles = makeStyles((theme) => ({
    toggleBtn: {
        transform: 'rotate(45deg)',
        color: theme.palette.primary.contrastText,
        zIndex: theme.zIndex.tooltip,
    },
    toggleBtnContainer: {
        zIndex: theme.zIndex.tooltip,
    },
    minimapOpen: {
        transform: 'rotate(-45deg)',
    },
    minimapClosed: {
        transform: 'rotate(135deg)',
    },
    minimap: {
        width: MINIMAP_SIZE.width,
        height: MINIMAP_SIZE.height,
        '-webkit-transition': '300ms linear',
        '-moz-transition': '300ms linear',
        '-o-transition': '300ms linear',
        '-ms-transition': '300ms linear',
        transition: '300ms linear',
        '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            width: 0,
            height: 0,
            borderTop: '32px solid hsla(0,0%,98%,0.9)',
            borderLeft: '32px solid transparent',
            zIndex: theme.zIndex.appBar,
            right: 0,
            top: 0,
        },
    },
}));

/**
 * Interface for overview map properties
 */
interface OverviewProps {
    id: string;
    crs: CRS;
    language: string;
    zoomFactor: number;
}

/**
 * Interface for bound polygon properties
 */
interface MiniboundProps {
    parentId: string;
    parentMap: Map;
    zoomFactor: number;
}

/**
 * Interface for the minimap toggle properties
 */
interface MinimapToggleProps {
    parentId: string;
}

/**
 * Create a toggle element to expand/collapse the overview map
 * @param {MinimapToggleProps} props toggle properties
 * @return {JSX.Element} the toggle control
 */
function MinimapToggle(props: MinimapToggleProps): JSX.Element {
    const { parentId } = props;

    const divRef = useRef<HTMLDivElement>(null);

    const { t } = useTranslation<string>();

    const [status, setStatus] = useState<boolean>(true);

    const minimap = useMap();

    const classes = useStyles();

    const theme = useTheme();

    /**
     * Toggle overview map to show or hide it
     * @param e the event being triggered on click
     */
    function toggleMinimap(): void {
        setStatus(!status);

        if (status) {
            const buttonSize = theme.overrides?.button?.size as CSSProperties;
            // decrease size of overview map to the size of the toggle btn
            minimap.getContainer().style.width = buttonSize.width as string;
            minimap.getContainer().style.height = buttonSize.height as string;
        } else {
            // restore the size of the overview map
            minimap.getContainer().style.width = MINIMAP_SIZE.width;
            minimap.getContainer().style.height = MINIMAP_SIZE.height;
        }

        // trigger a new event when overview map is toggled
        api.event.emit(EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE, parentId, {
            status,
        });
    }

    useEffect(() => {
        DomEvent.disableClickPropagation(Cast<HTMLElement>(divRef.current));
    }, []);

    return (
        <div ref={divRef} className={[LEAFLET_POSITION_CLASSES.topright, classes.toggleBtnContainer].join(' ')}>
            <IconButton
                className={['leaflet-control', classes.toggleBtn, !status ? classes.minimapOpen : classes.minimapClosed].join(' ')}
                style={{
                    margin: theme.spacing(3) * -1,
                    padding: 0,
                }}
                aria-label={t('mapctrl.overviewmap.toggle')}
                onClick={toggleMinimap}
            >
                <ChevronLeft />
            </IconButton>
        </div>
    );
}

/**
 * Create and update the bound polygon of the parent's map extent
 * @param {MiniboundProps} props bound properties
 */
function MinimapBounds(props: MiniboundProps) {
    const { parentId, parentMap, zoomFactor } = props;
    const minimap = useMap();

    const [toggle, setToggle] = useState<boolean>(false);

    // Clicking a point on the minimap sets the parent's map center
    const onClick = useCallback(
        (e) => {
            parentMap.setView(e.latlng, parentMap.getZoom());
        },
        [parentMap]
    );
    useMapEvent('click', onClick);

    // Keep track of bounds in state to trigger renders
    const [bounds, setBounds] = useState({ height: 0, width: 0, top: 0, left: 0 });

    function updateMap(): void {
        // Update the minimap's view to match the parent map's center and zoom
        const newZoom = parentMap.getZoom() - zoomFactor > 0 ? parentMap.getZoom() - zoomFactor : 0;
        minimap.flyTo(parentMap.getCenter(), newZoom);

        // Set in timeout the calculation to create the bound so parentMap getBounds has the updated bounds
        setTimeout(() => {
            minimap.invalidateSize();
            const pMin = minimap.latLngToContainerPoint(parentMap.getBounds().getSouthWest());
            const pMax = minimap.latLngToContainerPoint(parentMap.getBounds().getNorthEast());
            setBounds({ height: pMin.y - pMax.y, width: pMax.x - pMin.x, top: pMax.y, left: pMin.x });
        }, 500);
    }

    useEffect(() => {
        updateMap();

        // listen to API event when the overview map is toggled
        api.event.on(EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE, (payload) => {
            if (payload && parentId === payload.handlerName) {
                updateMap();
                setToggle(payload.status);
            }
        });

        // remove the listener when the component unmounts
        return () => {
            api.event.off(EVENT_NAMES.EVENT_OVERVIEW_MAP_TOGGLE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChange = useCallback(() => {
        updateMap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minimap, parentMap, zoomFactor]);

    // Listen to events on the parent map
    const handlers = useMemo(() => ({ moveend: onChange, zoomend: onChange }), [onChange]);
    const context: LeafletContextInterface = { __version: 1, map: parentMap };
    const leafletElement: LeafletElement<L.Map> = { instance: parentMap, context };
    useEventHandlers(leafletElement, handlers);

    return !toggle ? (
        <div
            style={{
                left: `${bounds.left}px`,
                top: `${bounds.top}px`,
                width: `${bounds.width}px`,
                height: `${bounds.height}px`,
                display: 'block',
                opacity: 0.5,
                position: 'absolute',
                border: '1px solid rgb(0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
            }}
        />
    ) : null;
}

/**
 * Create the overview map component
 * @param {OverviewProps} props the overview map properties
 * @return {JSX.Element} the overview map component
 */
export function OverviewMap(props: OverviewProps): JSX.Element {
    const { id, crs, language, zoomFactor } = props;

    const classes = useStyles();

    const theme = useTheme();

    const parentMap = useMap();
    const mapZoom = parentMap.getZoom() - zoomFactor > 0 ? parentMap.getZoom() - zoomFactor : 0;
    const basemaps = new Basemap({ id: 'transport', shaded: false, labeled: true }, language, Number(crs.code?.split(':')[1]));

    const overviewRef = useRef(null);
    useEffect(() => {
        // disable events on container
        const overviewHTMLElement = Cast<HTMLElement>(overviewRef.current);
        DomEvent.disableClickPropagation(overviewHTMLElement);
        DomEvent.disableScrollPropagation(overviewHTMLElement);

        // remove ability to tab to the overview map
        overviewHTMLElement.children[0].setAttribute('tabIndex', '-1');
    }, []);

    // Memorize the minimap so it's not affected by position changes
    const minimap = useMemo(
        () => (
            <MapContainer
                className={classes.minimap}
                center={parentMap.getCenter()}
                zoom={mapZoom}
                crs={crs}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                attributionControl={false}
                zoomControl={false}
                whenCreated={(cgpMap) => {
                    const cgpMapContainer = cgpMap.getContainer();
                    DomEvent.disableClickPropagation(cgpMapContainer);
                    DomEvent.disableScrollPropagation(cgpMapContainer);
                    const cgpMapContainerParentElement = cgpMapContainer.parentElement as HTMLElement;
                    cgpMapContainerParentElement.style.margin = `${theme.spacing(3)}px`;
                }}
            >
                {basemaps.getBasemapLayers().map((base: { id: string | number | null | undefined; url: string }) => (
                    <TileLayer key={base.id} url={base.url} />
                ))}
                <MinimapBounds parentId={id} parentMap={parentMap} zoomFactor={zoomFactor} />
                <MinimapToggle parentId={id} />
            </MapContainer>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [parentMap, crs, mapZoom, basemaps, zoomFactor]
    );

    return (
        <div className={LEAFLET_POSITION_CLASSES.topright}>
            <div ref={overviewRef} className="leaflet-control leaflet-bar">
                {minimap}
            </div>
        </div>
    );
}
