import { Layer as leafletLayer } from 'leaflet';

import { EsriDynamic } from './web-layers/esri/esri-dynamic';
import { EsriFeature } from './web-layers/esri/esri-feature';
import { WMS } from './web-layers/ogc/wms';
import { WFS } from './web-layers/ogc/wfs';
import { OgcFeature } from './web-layers/ogc/ogc_feature';
import { XYZTiles } from './web-layers/map-tile/xyz-tiles';
import { GeoJSON } from './web-layers/file/geojson';
import { Vector } from './vector/vector';
import { MarkerClusterClass } from './vector/marker-cluster';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/event';

import {
  Cast,
  CONST_LAYER_TYPES,
  AbstractWebLayersClass,
  TypeLayerConfig,
  TypeWMSLayer,
  TypeDynamicLayer,
  TypeFeatureLayer,
  TypeGeoJSONLayer,
  TypeWFSLayer,
  TypeOgcFeatureLayer,
  TypeXYZTiles,
} from '../../core/types/cgpv-types';
import { generateId } from '../../core/utils/utilities';

// TODO: look at a bundler for esri-leaflet: https://github.com/esri/esri-leaflet-bundler
// import "esri-leaflet-renderers";

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @export
 * @class Layer
 */
export class Layer {
  // variable used to store all added layers
  layers: { [key: string]: AbstractWebLayersClass } = {};

  // used to access vector API to create and manage geometries
  vector: Vector;

  // used to access marker cluster API to create and manage marker cluster groups
  markerCluster: MarkerClusterClass;

  /**
   * used to reference the map id
   */
  #mapId: string;

  /**
   * Initialize layer types and listen to add/remove layer events from outside
   *
   * @param {string} id a reference to the map
   * @param {TypeLayerConfig[]} layers an optional array containing layers passed within the map config
   */
  constructor(id: string, layers?: TypeLayerConfig[]) {
    this.#mapId = id;

    this.vector = new Vector(this.#mapId);
    this.markerCluster = new MarkerClusterClass(this.#mapId);

    // listen to outside events to add layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_LAYER_ADD,
      (payload) => {
        if (payload && (payload.handlerName as string).includes(this.#mapId)) {
          if (payload.layer.layerType === CONST_LAYER_TYPES.GEOJSON) {
            const layerConf = Cast<TypeGeoJSONLayer>(payload.layer);
            const geoJSON = new GeoJSON(this.#mapId, layerConf);
            geoJSON.add(layerConf as TypeGeoJSONLayer).then((layer) => {
              geoJSON.layer = layer;
              this.addToMap(geoJSON);
            });

            this.removeTabindex();
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.WMS) {
            const layerConf = Cast<TypeWMSLayer>(payload.layer);
            const wmsLayer = new WMS(this.#mapId, layerConf);
            wmsLayer.add(layerConf as TypeWMSLayer).then((layer) => {
              wmsLayer.layer = layer;
              this.addToMap(wmsLayer);
            });
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.XYZ_TILES) {
            const layerConf = Cast<TypeXYZTiles>(payload.layer);
            const xyzTiles = new XYZTiles(this.#mapId, layerConf);
            xyzTiles.add(layerConf as TypeXYZTiles).then((layer) => {
              xyzTiles.layer = layer;
              this.addToMap(xyzTiles);
            });
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC) {
            const layerConf = Cast<TypeDynamicLayer>(payload.layer);
            const esriDynamic = new EsriDynamic(this.#mapId, layerConf);
            esriDynamic.add(layerConf as TypeDynamicLayer).then((layer) => {
              esriDynamic.layer = layer;
              this.addToMap(esriDynamic);
            });
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
            const layerConf = Cast<TypeFeatureLayer>(payload.layer);
            const esriFeature = new EsriFeature(this.#mapId, layerConf);
            esriFeature.add(layerConf as TypeFeatureLayer).then((layer) => {
              esriFeature.layer = layer;
              this.addToMap(esriFeature);
            });
            this.removeTabindex();
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.WFS) {
            const layerConf = Cast<TypeWFSLayer>(payload.layer);
            const wfsLayer = new WFS(this.#mapId, layerConf);
            wfsLayer.add(layerConf as TypeWFSLayer).then((layer) => {
              wfsLayer.layer = layer;
              this.addToMap(wfsLayer);
            });
          } else if (payload.layer.layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
            const layerConf = Cast<TypeOgcFeatureLayer>(payload.layer);
            const ogcFeatureLayer = new OgcFeature(this.#mapId, layerConf);
            ogcFeatureLayer.add(layerConf as TypeOgcFeatureLayer).then((layer) => {
              ogcFeatureLayer.layer = layer;
              this.addToMap(ogcFeatureLayer);
            });
          }
        }
      },
      this.#mapId
    );

    // listen to outside events to remove layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        // remove layer from outside
        this.removeLayerById(payload.layer.id as string);
      },
      this.#mapId
    );

    // Load layers that was passed in with the map config
    if (layers && layers.length > 0) {
      layers?.forEach((layer: TypeLayerConfig) => api.event.emit(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.#mapId, { layer }));
    }
  }

  /**
   * Check if the layer is loading. We do validation prior to this so it should almost alwasy load
   * @param {string} name layer name
   * @param {leafletLayer} layer to aply the load event on to see it it loads
   */
  private layerIsLoaded(name: string, layer: leafletLayer): void {
    let isLoaded = false;
    // we trap most of the erros prior to this. When this load, layer shoud be ok
    // ! load is not fired for GeoJSON layer
    if (layer) {
      layer.once('load', () => {
        isLoaded = true;
      });
    }

    setTimeout(() => {
      if (!isLoaded) {
        api.event.emit(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.#mapId, {
          message: {
            type: 'key',
            value: 'validation.layer.loadfailed',
            params: [name, this.#mapId],
          },
        });

        // TODO: some layer take time to load e.g. geomet so try to find a wayd to ping the layer
        // this.removeLayer(layer.id);
      }
    }, 10000);
  }

  /**
   * Add the layer to the map if valid. If not (is a string) emit an error
   * @param {any} cgpvLayer the layer config
   */
  private addToMap(cgpvLayer: AbstractWebLayersClass): void {
    // if the return layer object is a string, it is because path or entries are bad
    // do not add to the map
    if (typeof cgpvLayer.layer === 'string') {
      api.event.emit(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.#mapId, {
        message: {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [cgpvLayer.name, this.#mapId],
        },
      });
    } else {
      if (
        cgpvLayer.type !== CONST_LAYER_TYPES.GEOJSON &&
        cgpvLayer.type !== CONST_LAYER_TYPES.WFS &&
        cgpvLayer.type !== CONST_LAYER_TYPES.OGC_FEATURE
      )
        this.layerIsLoaded(cgpvLayer.name!, cgpvLayer.layer as leafletLayer);

      cgpvLayer.layer!.addTo(api.map(this.#mapId).map);
      // this.layers.push(cgpvLayer);
      this.layers[cgpvLayer.id] = Cast<AbstractWebLayersClass>(cgpvLayer);
      api.event.emit(EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, this.#mapId, {
        layer: cgpvLayer.layer,
      });
    }
  }

  /**
   * Remove feature from ESRI Feature and GeoJSON layer from tabindex
   */
  removeTabindex(): void {
    // Because there is no way to know GeoJSON is loaded (load event never trigger), we use a timeout
    // TODO: timeout is never a good idea, may have to find a workaround...
    setTimeout(() => {
      const mapContainer = document.getElementsByClassName(`leaflet-map-${this.#mapId}`)[0];

      if (mapContainer) {
        const featElems = document
          .getElementsByClassName(`leaflet-map-${this.#mapId}`)[0]
          .getElementsByClassName('leaflet-marker-pane')[0].children;
        [...featElems].forEach((element) => {
          element.setAttribute('tabindex', '-1');
        });
      }
    }, 3000);
  }

  /**
   * Remove a layer from the map
   *
   * @param {string} id the id of the layer to be removed
   */
  removeLayerById = (id: string): void => {
    // return items not matching the id
    // this.layers = this.layers.filter((item: AbstractWebLayersClass) => {
    //   if (item.id === id) item.layer.removeFrom(this.#map);
    //   return item.id !== id;
    // });
    this.layers[id].layer!.removeFrom(api.map(this.#mapId).map);
    delete this.layers[id];
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeLayerConfig} layer the layer configuration to add
   */
  addLayer = (layer: TypeLayerConfig): string => {
    // eslint-disable-next-line no-param-reassign
    layer.id = generateId(layer.id);
    api.event.emit(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.#mapId, { layer });

    return layer.id;
  };

  /**
   * Remove a layer from the map
   *
   * @param {TypeLayerConfig} layer the layer configuration to remove
   */
  removeLayer = (layer: AbstractWebLayersClass): string => {
    // eslint-disable-next-line no-param-reassign
    layer.id = generateId(layer.id);
    api.event.emit(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.#mapId, { layer });

    return layer.id;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} id the layer id to look for
   * @returns the found layer data object
   */
  getLayerById = (id: string): AbstractWebLayersClass | null => {
    // return this.layers.filter((layer: AbstractWebLayersClass) => layer.id === id)[0];
    return this.layers[id];
  };

  // WCS https://github.com/stuartmatthews/Leaflet.NonTiledLayer.WCS
}
