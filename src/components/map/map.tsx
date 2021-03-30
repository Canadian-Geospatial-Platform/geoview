/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';

import { Map as LeafletMap, CRS } from 'leaflet';
import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet';

import { useMediaQuery } from '@material-ui/core';
import { useTheme, makeStyles } from '@material-ui/core/styles';

import { SnackbarProvider } from 'notistack';

import { MapOptions, getMapOptions } from '../../common/map';
import { BasemapLayer } from '../../common/basemap';
import { Projection } from '../../common/projection';
import { MapConfigProps } from '../../api/config';

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

const useStyles = makeStyles((theme) => ({
    snackBar: {
        '& .MuiButton-text': { color: theme.palette.primary.light },
    },
}));

export function Map(props: MapConfigProps): JSX.Element {
    const { id, center, zoom, projection, language } = props;

    const [basemapLayers, setBasemapLayers] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const defaultTheme = useTheme();
    const classes = useStyles();

    // create a new map viewer instance
    const viewer = new MapViewer(props);

    // if screen size is medium and up
    const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

    // get the needed projection. Web Mercator is out of the box but we need to create LCC
    // the projection will work with CBMT basemap. If another basemap would be use, update...
    const crs = projection === 3857 ? CRS.EPSG3857 : Projection.getProjection(projection);

    // get attribution
    const attribution = language === 'en-CA' ? viewer.basemap.attribution['en-CA'] : viewer.basemap.attribution['fr-CA'];

    // get map option from slected basemap projection
    const mapOptions: MapOptions = getMapOptions(projection);

    /**
     * Get the center position of the map when move / drag has ended
     * then emit it as an api event
     * @param event Move end event container a reference to the map
     */
    function mapMoveEnd(event: Record<string, LeafletMap>): void {
        // get a map reference from the moveend event
        const map: LeafletMap = event.target;

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
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            crs={crs}
            zoomControl={false}
            attributionControl={false}
            minZoom={mapOptions.minZoom}
            maxZoom={mapOptions.maxZooom}
            maxBounds={mapOptions.maxBounds}
            keyboardPanDelta={20}
            whenCreated={(cgpMap) => {
                // add map instance to api
                api.maps.push(viewer);

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
                viewer.init({
                    map: cgpMap,
                    id: id || generateId(id),
                });

                // call the ready function since rendering of this map instance is done
                api.ready();

                // emit the map loaded event
                setIsLoaded(true);
                api.event.emit(EVENT_NAMES.EVENT_MAP_LOADED, id, { map: cgpMap });
            }}
        >
            {isLoaded && (
                <>
                    {basemapLayers.map((basemapLayer: BasemapLayer) => {
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
                    {deviceSizeMedUp && <MousePosition />}
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
                    {deviceSizeMedUp && <OverviewMap id={id} crs={crs} language={language} zoomFactor={mapOptions.zoomFactor} />}
                    <NorthArrow projection={crs} />
                    <NorthPoleFlag projection={crs} />
                    <Crosshair id={id} />
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
