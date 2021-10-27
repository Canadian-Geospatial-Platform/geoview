/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';

import { CRS } from 'leaflet';
import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet';

import { useMediaQuery } from '@material-ui/core';
import { useTheme, makeStyles } from '@material-ui/core/styles';

import { SnackbarProvider } from 'notistack';

import { getMapOptions } from '../../common/map';
import { Projection } from '../../common/projection';

import { Crosshair } from '../mapctrl/crosshair';
import { MousePosition } from '../mapctrl/mouse-position';
import { OverviewMap } from '../mapctrl/overview-map';
import { Attribution } from '../mapctrl/attribution';
import { Snackbar } from '../mapctrl/snackbar';
import { Appbar } from '../appbar/app-bar';
import { NavBar } from '../navbar/nav-bar';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { MapViewer } from '../../common/map-viewer';
import { generateId } from '../../common/constant';
import { NorthArrow, NorthPoleFlag } from '../mapctrl/north-arrow';
import { ClickMarker } from '../mapctrl/click-marker';
import { TypeMapConfigProps, TypeBasemapLayer } from '../../types/cgpv-types';

const useStyles = makeStyles((theme) => ({
    snackBar: {
        '& .MuiButton-text': { color: theme.palette.primary.light },
    },
}));

export function Map(props: TypeMapConfigProps): JSX.Element {
    // make sure the id is not undefined
    // eslint-disable-next-line react/destructuring-assignment
    const id = props.id ? props.id : generateId('');

    const { center, zoom, projection, language, selectBox, boxZoom } = props;

    const [basemapLayers, setBasemapLayers] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const defaultTheme = useTheme();
    const classes = useStyles();

    // create a new map viewer instance
    let viewer: MapViewer;

    // if screen size is medium and up
    const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

    // get the needed projection. Web Mercator is out of the box but we need to create LCC
    // the projection will work with CBMT basemap. If another basemap would be use, update...
    const crs = projection === 3857 ? CRS.EPSG3857 : Projection.getProjection(projection);

    // attribution used by the map
    let attribution = '';

    // get map option from slected basemap projection
    const mapOptions: L.MapOptions = getMapOptions(projection);

    /**
     * Get the center position of the map when move / drag has ended
     * then emit it as an api event
     * @param event Move end event container a reference to the map
     */
    function mapMoveEnd(event: L.LeafletEvent): void {
        // get a map reference from the moveend event
        const map: L.Map = event.target;

        // emit the moveend event to the api
        api.event.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || '', {
            position: map.getCenter(),
        });
    }

    useEffect(() => {
        // listen to adding a new basemap events
        api.event.on(
            EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE,
            (payload) => {
                if (payload && payload.handlerName === id) setBasemapLayers(payload.layers);
            },
            id
        );

        return () => {
            api.event.off(EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            crs={crs}
            zoomControl={false}
            selectBox={selectBox}
            boxZoom={boxZoom}
            attributionControl={false}
            minZoom={mapOptions.minZoom}
            maxZoom={mapOptions.maxZoom}
            maxBounds={mapOptions.maxBounds}
            keyboardPanDelta={20}
            whenCreated={(cgpMap: L.Map) => {
                // eslint-disable-next-line no-param-reassign
                cgpMap.id = id;

                // add a class to map container to easely find the container
                cgpMap.getContainer().classList.add(`leaflet-map-${id}`);

                // reset the view when created so overview map is moved at the right place
                cgpMap.setView(center, zoom);

                // emit the initial map position
                api.event.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || '', {
                    position: cgpMap.getCenter(),
                });

                // listen to map move end events
                cgpMap.on('moveend', mapMoveEnd);

                // initialize the map viewer and load plugins
                viewer = new MapViewer(props, cgpMap);

                // get attribution
                attribution = language === 'en-CA' ? viewer.basemap.attribution['en-CA'] : viewer.basemap.attribution['fr-CA'];

                // call the ready function since rendering of this map instance is done
                api.ready();

                // emit the map loaded event
                setIsLoaded(true);
                api.event.emit(EVENT_NAMES.EVENT_MAP_LOADED, id, { map: cgpMap });
            }}
        >
            {isLoaded && (
                <>
                    {basemapLayers.map((basemapLayer: TypeBasemapLayer) => {
                        return (
                            <TileLayer
                                key={basemapLayer.id}
                                url={basemapLayer.url}
                                attribution={attribution}
                                opacity={basemapLayer.opacity}
                                pane={basemapLayer.basemapPaneName}
                            />
                        );
                    })}
                    {deviceSizeMedUp && <MousePosition id={id} />}
                    <ScaleControl position="bottomright" imperial={false} />
                    {deviceSizeMedUp && <Attribution attribution={attribution} />}
                    <div
                        className="leaflet-control cgp-appbar"
                        style={{
                            boxSizing: 'content-box',
                            zIndex: defaultTheme.zIndex.appBar,
                        }}
                    >
                        <Appbar />
                    </div>
                    {deviceSizeMedUp && <OverviewMap id={id} crs={crs} language={language} zoomFactor={mapOptions.zoomFactor as number} />}
                    <NorthArrow projection={crs} />
                    <NorthPoleFlag projection={crs} />
                    <Crosshair id={id} />
                    <ClickMarker />
                    <NavBar />
                    <SnackbarProvider
                        maxSnack={3}
                        dense
                        autoHideDuration={4000}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        className={`${classes.snackBar}`}
                    >
                        <Snackbar id={id} />
                    </SnackbarProvider>
                </>
            )}
        </MapContainer>
    );
}
