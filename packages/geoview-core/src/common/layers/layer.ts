import { Layer as leafletLayer } from 'leaflet';

import { generateId } from '../constant';
import { EsriDynamic } from './esri-dynamic';
import { EsriFeature } from './esri-feature';
import { WMS } from './wms';
import { XYZTiles } from './xyz-tiles';
import { GeoJSON } from './geojson';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { CONST_LAYER_TYPES, TypeLayerData, TypeLayerConfig } from '../../types/cgpv-types';

// TODO: look at a bundler for esri-leaflet: https://github.com/esri/esri-leaflet-bundler
import 'esri-leaflet-renderers';

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @export
 * @class Layer
 */
export class Layer {
    // variable used to store all added layers
    layers: Array<TypeLayerData> = [];

    // variable used to handle geojson functions
    geoJSON: GeoJSON;

    // variable used to handle WMS functions
    wms: WMS;

    // variable used to handle esriFeature functions
    esriFeature: EsriFeature;

    // variable used to handle esriDynamic functions
    esriDynamic: EsriDynamic;

    // variable used to handle xyzTiles functions
    xyzTiles: XYZTiles;

    /**
     * used to reference the map and its event
     */
    private map: L.Map;

    /**
     * Initialize layer types and listen to add/remove layer events from outside
     *
     * @param {Map} map a reference to the map
     * @param {TypeLayerConfig[]} layers an optional array containing layers passed within the map config
     */
    constructor(map: L.Map, layers?: TypeLayerConfig[] | undefined | null) {
        this.map = map;

        this.geoJSON = new GeoJSON();
        this.esriFeature = new EsriFeature();
        this.esriDynamic = new EsriDynamic();
        this.wms = new WMS();
        this.xyzTiles = new XYZTiles();

        // listen to outside events to add layers
        api.event.on(EVENT_NAMES.EVENT_LAYER_ADD, (payload) => {
            if (payload && payload.handlerName.includes(this.map.id)) {
                const layerConf = payload.layer;
                layerConf.id = generateId(layerConf.id);
                if (layerConf.type === CONST_LAYER_TYPES.GEOJSON) {
                    this.geoJSON.add(layerConf).then((layer: leafletLayer | string) => this.addToMap(layerConf, layer));
                    this.removeTabindex();
                } else if (layerConf.type === CONST_LAYER_TYPES.WMS) {
                    this.wms.add(layerConf).then((layer: leafletLayer | string) => this.addToMap(layerConf, layer));
                } else if (layerConf.type === CONST_LAYER_TYPES.XYZ_TILES) {
                    this.xyzTiles.add(layerConf).then((layer: leafletLayer | string) => this.addToMap(layerConf, layer));
                } else if (layerConf.type === CONST_LAYER_TYPES.ESRI_DYNAMIC) {
                    this.esriDynamic.add(layerConf).then((layer: leafletLayer | string) => this.addToMap(layerConf, layer));
                } else if (layerConf.type === CONST_LAYER_TYPES.ESRI_FEATURE) {
                    this.esriFeature.add(layerConf).then((layer: leafletLayer | string) => this.addToMap(layerConf, layer));
                    this.removeTabindex();
                }
            }
        });

        // listen to outside events to remove layers
        api.event.on(EVENT_NAMES.EVENT_REMOVE_LAYER, (payload) => {
            // remove layer from outside
            this.removeLayerById(payload.id);
        });

        // Load layers that was passed in with the map config
        if (layers && layers.length > 0) {
            layers?.forEach((layer: TypeLayerConfig) => api.event.emit(EVENT_NAMES.EVENT_LAYER_ADD, this.map.id, { layer }));
        }
    }

    /**
     * Check if the layer is loading. We do validation prior to this so it should almost alwasy load
     * @param {string} name layer name
     * @param {leafletLayer} layer to aply the load event on to see it it loads
     */
    private layerIsLoaded(name: string, layer: leafletLayer): void {
        let isLoaded = false;
        // we trap most of the erros prior tp this. When this load, layer shoud ne ok
        // ! load is not fired for GeoJSON layer
        layer.once('load', () => {
            isLoaded = true;
        });

        setTimeout(() => {
            if (!isLoaded) {
                api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, this.map.id, {
                    message: {
                        type: 'key',
                        value: 'validation.layer.loadfailed',
                        params: [name, this.map.id],
                    },
                });

                // TODO: some layer take time to load e.g. geomet so try to find a wayd to ping the layer
                // this.removeLayer(layer.id);
            }
        }, 10000);
    }

    /**
     * Add the layer to the map if valid. If not (is a string) emit an error
     * @param {TypeLayerConfig} payload the layer config
     * @param {leafletLayer | string} layer incoming as layer or string if not valid
     */
    private addToMap(payload: TypeLayerConfig, layer: leafletLayer | string): void {
        // if the return layer object is a string, it is because path or entries are bad
        // do not add to the map
        if (typeof layer === 'string') {
            api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, this.map.id, {
                message: {
                    type: 'key',
                    value: 'validation.layer.loadfailed',
                    params: [payload.name, this.map.id],
                },
            });
        } else {
            if (payload.type !== 'geoJSON') this.layerIsLoaded(payload.name, layer);
            layer.addTo(this.map);

            const id = payload.id || generateId('');
            this.layers.push({
                id,
                type: payload.type,
                layer: Object.defineProperties(layer, { id: { value: id } }),
            } as TypeLayerData);
        }
    }

    /**
     * Remove feature from ESRI Feature and GeoJSON layer from tabindex
     */
    removeTabindex(): void {
        // Because there is no way to know GeoJSON is loaded (load event never trigger), we use a timeout
        // TODO: timeout is never a good idea, may have to find a workaround...
        setTimeout(() => {
            const featElems = document
                .getElementsByClassName(`leaflet-map-${this.map.id}`)[0]
                .getElementsByClassName('leaflet-marker-pane')[0].children;
            [...featElems].forEach((element) => {
                element.setAttribute('tabindex', '-1');
            });
        }, 3000);
    }

    /**
     * Remove a layer from the map
     *
     * @param {string} id the id of the layer to be removed
     */
    removeLayerById = (id: string): void => {
        // return items not matching the id
        this.layers = this.layers.filter((item: TypeLayerData) => {
            if (item.id === id) item.layer.removeFrom(this.map);
            return item.id !== id;
        });
    };

    /**
     * Add a layer to the map
     *
     * @param {TypeLayerConfig} layer the layer configuration to add
     */
    addLayer = (layer: TypeLayerConfig): string => {
        // eslint-disable-next-line no-param-reassign
        layer.id = generateId(layer.id);
        api.event.emit(EVENT_NAMES.EVENT_LAYER_ADD, this.map.id, { layer });

        return layer.id;
    };

    /**
     * Search for a layer using it's id and return the layer data
     *
     * @param {string} id the layer id to look for
     * @returns the found layer data object
     */
    getLayerById = (id: string): TypeLayerData | null => {
        return this.layers.filter((layer: TypeLayerData) => layer.id === id)[0];
    };

    // WCS https://github.com/stuartmatthews/Leaflet.NonTiledLayer.WCS
}
