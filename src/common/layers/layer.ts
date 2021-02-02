import L, { Map } from 'leaflet';

import { EsriDynamic } from './esri-dynamic';
import { EsriFeature } from './esri-feature';
import { WMS } from './wms';
import { GeoJSON } from './geojson';

import { api } from '../../api/api';

import { EVENT_NAMES } from '../../api/event';

// TODO: look at a bundler for esri-leaflet: https://github.com/esri/esri-leaflet-bundler
import 'esri-leaflet-renderers';

/**
 * constant contains layer types
 */
export const LayerTypes = {
    WMS: 'ogcWMS',
    GEOJSON: 'geoJSON',
    ESRI_DYNAMIC: 'esriDynamic',
    ESRI_FEATURE: 'esriFeature',
};

/**
 * interface used when adding a new layer
 */
export interface LayerConfig {
    url: string;
    type: string;
    entries: string;
}

/**
 * interface used when adding a new layer
 */
export interface LayerData {
    id: string;
    type: string;
    layer: L.Layer;
}

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @export
 * @class Layer
 */
export class Layer {
    // variable used to store all added layers
    layers: Array<LayerData> = [];

    // variable used to handle geojson functions
    geoJSON: GeoJSON;

    // variable used to handle WMS functions
    wms: WMS;

    // variable used to handle esriFeature functions
    esriFeature: EsriFeature;

    // variable used to handle esriDynamic functions
    esriDynamic: EsriDynamic;

    /**
     * used to reference the map
     */
    private map: Map;

    /**
     * Initialize layer types and listen to add/remove layer events from outside
     *
     * @param {Map} map a reference to the map
     */
    constructor(map: Map) {
        this.map = map;

        this.geoJSON = new GeoJSON();
        this.esriFeature = new EsriFeature();
        this.esriDynamic = new EsriDynamic();
        this.wms = new WMS();

        // listen to outside events to add layers
        api.event.on(EVENT_NAMES.EVENT_LAYER_ADD, (payload) => {
            if (payload.type === LayerTypes.GEOJSON) {
                this.geoJSON.add(this.map, payload, this.layers);
            } else if (payload.type === LayerTypes.WMS) {
                this.wms.add(this.map, payload, this.layers);
            } else if (payload.type === LayerTypes.ESRI_DYNAMIC) {
                this.esriDynamic.add(this.map, payload, this.layers);
            } else if (payload.type === LayerTypes.ESRI_FEATURE) {
                this.esriFeature.add(this.map, payload, this.layers);
            }
        });

        // listen to outside events to remove layers
        api.event.on(EVENT_NAMES.EVENT_REMOVE_LAYER, (payload) => {
            // remove layer from outside
            this.remove(payload.id);
        });
    }

    /**
     * Remove a layer from the map
     *
     * @param {string} id the id of the layer to be removed
     */
    remove(id: string): void {
        // return items not matching the id
        this.layers = this.layers.filter((item: LayerData) => {
            if (item.id === id) item.layer.removeFrom(this.map);
            return item.id !== id;
        });
    }

    /**
     * Create a new GeoJSON layer on the map
     *
     * @param layerConfig the layer configuration
     */
    createGeoJSONLayer(layerConfig: LayerConfig): void {
        this.geoJSON.add(this.map, layerConfig, this.layers);
    }

    /**
     * Create a new WMS layer on the map
     *
     * @param layerConfig the layer configuration
     */
    createWmsLayer(layerConfig: LayerConfig): void {
        this.wms.add(this.map, layerConfig, this.layers);
    }

    /**
     * Create a new feature layer on the map
     *
     * @param layerConfig the layer configuration
     */
    createFeatureLayer(layerConfig: LayerConfig): void {
        this.esriFeature.add(this.map, layerConfig, this.layers);
    }

    /**
     * Create a new dynamic layer on the map
     *
     * @param layerConfig the layer configuration
     */
    createDynamicLayer(layerConfig: LayerConfig): void {
        this.esriDynamic.add(this.map, layerConfig, this.layers);
    }

    // WCS https://github.com/stuartmatthews/Leaflet.NonTiledLayer.WCS
}
