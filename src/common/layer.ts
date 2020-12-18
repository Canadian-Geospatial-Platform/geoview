import L from 'leaflet';

// TODO: look at a bundler for esri-leaflet: https://github.com/esri/esri-leaflet-bundler
import { featureLayer, dynamicMapLayer } from 'esri-leaflet';
import 'esri-leaflet-renderers';

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @export
 * @class Layer
 */
export class Layer {
    // TODO: look at this plugin for support for more layer https://github.com/mapbox/leaflet-omnivore
    constructor() {}

    // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
    // in fact, to this for all the layer type
    /**
     * Add a WMS layer to the map.
     *
     * @param {object} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @returns {wms is object}
     */
    addWMS(map: any, layer: LayerConfig) {
        let wms: any = {};
        wms = L.tileLayer.wms(layer.url, {
            layers: layer.entries,
            format: 'image/png',
            transparent: true,
            attribution: '',
        });

        (wms as any).type = layer.type;
        wms.addTo(map);

        return wms;
    }

    /**
     * Add a ESRI feature layer to the map.
     *
     * @param {object} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @returns {feat is object}
     */
    addEsriFeature(map: any, layer: LayerConfig) {
        const feat = featureLayer({
            url: layer.url,
        });

        (feat as any).type = layer.type;
        feat.addTo(map);

        return feat;
    }

    /**
     * Add a ESRI dynamic layer to the map.
     *
     * @param {object} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @returns {feat is object}
     */
    addEsriDynamic(map: any, layer: LayerConfig) {
        const feat = dynamicMapLayer({
            url: layer.url,
            layers: layer.entries.split(',').map((item: string) => {
                return parseInt(item, 10);
            }),
            attribution: '',
        });

        (feat as any).type = layer.type;
        feat.addTo(map);

        return feat;
    }

    // WCS https://github.com/stuartmatthews/Leaflet.NonTiledLayer.WCS
}

export interface LayerConfig {
    url: string;
    type: string;
    entries: string;
}
