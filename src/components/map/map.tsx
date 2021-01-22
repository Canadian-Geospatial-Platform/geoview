/* eslint-disable react/require-default-props */
import { Suspense } from 'react';
import { render } from 'react-dom';

import { i18n } from 'i18next';

import { I18nextProvider } from 'react-i18next';

import { Map as LeafletMap, LatLngTuple, CRS } from 'leaflet';
import { MapContainer, TileLayer, ScaleControl, AttributionControl } from 'react-leaflet';

import { useMediaQuery } from '@material-ui/core';
import { ThemeProvider, useTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import { MapOptions, getMapOptions } from '../../common/map';
import { Basemap, BasemapOptions } from '../../common/basemap';
import { Layer, LayerConfig } from '../../common/layer';
import { Projection } from '../../common/projection';

import { MousePosition } from '../mapctrl/mouse-position';
import { OverviewMap } from '../mapctrl/overview-map';
import { Appbar } from '../appbar/app-bar';
import { NavBar } from '../navbar/nav-bar';

import { theme } from '../../assests/style/theme';
import api, { EVENT_NAMES } from '../../api/api';

interface MapProps {
    id?: string;
    center: LatLngTuple;
    zoom: number;
    projection: number;
    language: string;
    layers?: LayerConfig[];
}

function Map(props: MapProps): JSX.Element {
    const { id, center, zoom, projection, language, layers } = props;

    const defaultTheme = useTheme();

    // if screen size is medium and up
    const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md'));

    // get the needed projection. Web Mercator is out of the box but we need to create LCC
    // the projection will work with CBMT basemap. If another basemap would be use, update...
    const crs = projection === 3857 ? CRS.EPSG3857 : Projection.getProjection(projection);

    // get basemaps with attribution
    const basemap: Basemap = new Basemap(language);
    const basemaps: BasemapOptions[] = projection === 3857 ? basemap.wmCBMT : basemap.lccCBMT;
    const attribution = language === 'en-CA' ? basemap.attribution['en-CA'] : basemap.attribution['fr-CA'];

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
        api.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || '', {
            position: map.getCenter(),
        });
    }

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
            whenCreated={(cgpMap) => {
                // reset the view when created so overview map is moved at the right place
                cgpMap.setView(center, zoom);

                // TODO: put this a t the right place. This is temporary to show we can add different layer type to the map
                const layer = new Layer();
                const createdLayers = [];
                layers?.forEach((item) => {
                    if (item.type === 'ogcWMS') {
                        createdLayers.push(layer.addWMS(cgpMap, item));
                    } else if (item.type === 'esriFeature') {
                        createdLayers.push(layer.addEsriFeature(cgpMap, item));
                    } else if (item.type === 'esriDynamic') {
                        createdLayers.push(layer.addEsriDynamic(cgpMap, item));
                    }
                });

                // emit the initial map position
                api.emit(EVENT_NAMES.EVENT_MAP_MOVE_END, id || '', {
                    position: cgpMap.getCenter(),
                });

                // listen to map move end events
                cgpMap.on('moveend', mapMoveEnd);
            }}
        >
            {basemaps.map((base) => (
                <TileLayer key={base.id} url={base.url} attribution={attribution} />
            ))}
            <NavBar />
            {deviceSizeMedUp && <MousePosition />}
            <ScaleControl position="bottomright" imperial={false} />
            {deviceSizeMedUp && <AttributionControl position="bottomleft" />}
            {deviceSizeMedUp && <OverviewMap id={id} crs={crs} basemaps={basemaps} zoomFactor={mapOptions.zoomFactor} />}
            <div
                className="leaflet-control cgp-appbar"
                style={{
                    boxSizing: 'content-box',
                    zIndex: defaultTheme.zIndex.appBar,
                }}
            >
                <Appbar id={id} />
            </div>
        </MapContainer>
    );
}

export function createMap(element: Element, config: MapProps, i18nInstance: i18n): void {
    const center: LatLngTuple = [config.center[0], config.center[1]];

    render(
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Suspense fallback="">
                <I18nextProvider i18n={i18nInstance}>
                    <Map
                        id={element.id}
                        center={center}
                        zoom={config.zoom}
                        projection={config.projection}
                        language={config.language}
                        layers={config.layers}
                    />
                </I18nextProvider>
            </Suspense>
        </ThemeProvider>,
        element
    );
}
