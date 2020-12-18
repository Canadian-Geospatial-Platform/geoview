import { Suspense, StrictMode } from 'react';
import { render } from 'react-dom';

import { I18nextProvider } from 'react-i18next';

import { LatLngTuple, CRS } from 'leaflet';
import { MapContainer, TileLayer, ScaleControl, AttributionControl } from 'react-leaflet';

import { MapOptions, getMapOptions } from '../../common/map';
import { Basemap, BasemapOptions } from '../../common/basemap';
import { Layer, LayerConfig } from '../../common/layer';
import { Projection } from '../../common/projection';

import { MousePosition } from '../mapctrl/mouse-position';
import { OverviewMap } from '../mapctrl/overview-map';
import { Appbar } from '../appbar/app-bar';
import { NavBar } from '../navbar/nav-bar';

function Map(props: MapProps): JSX.Element {
    const { id, center, zoom, projection, language, layers } = props;

    // get the needed projection. Web Mercator is out of the box but we need to create LCC
    // the projection will work with CBMT basemap. If another basemap would be use, update...
    const crs = projection === 3857 ? CRS.EPSG3857 : Projection.getProjection(projection);

    // get basemaps with attribution
    const basemap: Basemap = new Basemap(language);
    const basemaps: BasemapOptions[] = projection === 3857 ? basemap.wmCBMT : basemap.lccCBMT;
    const attribution = language === 'en-CA' ? basemap.attribution['en-CA'] : basemap.attribution['fr-CA'];

    // get map option from slected basemap projection
    const mapOptions: MapOptions = getMapOptions(projection);

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
                // reset the view when created so overviewmap is moved at the right place
                setTimeout(() => {
                    cgpMap.setView(center, zoom);
                }, 0);

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
            }}
        >
            {basemaps.map((base) => (
                <TileLayer key={base.id} url={base.url} attribution={attribution} />
            ))}
            <NavBar />
            <MousePosition />
            <ScaleControl position="bottomright" imperial={false} />
            <AttributionControl position="bottomleft" />
            <OverviewMap crs={crs} basemaps={basemaps} zoomFactor={mapOptions.zoomFactor} />
            <div className="leaflet-control cgp-appbar">
                <Appbar id={id} />
            </div>
        </MapContainer>
    );
}

export function createMap(element: Element, config: MapConfig, i18nInstance: any): void {
    const center: LatLngTuple = [config.center[0], config.center[1]];

    // * strict mode rendering twice explanation: https://mariosfakiolas.com/blog/my-react-components-render-twice-and-drive-me-crazy/
    render(
        <StrictMode>
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
        </StrictMode>,
        element
    );
}

// TODO: place configuration interface and manipulation in it's own class
// TODO: map props and config props are similar, combine to have one
interface MapConfig {
    center: number[];
    zoom: number;
    projection: number;
    language: string;
    layers?: LayerConfig[];
}

interface MapProps {
    id: string;
    center: LatLngTuple;
    zoom: number;
    projection: number;
    language: string;
    layers?: LayerConfig[];
}
