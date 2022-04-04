import { Layer as leafletLayer } from 'leaflet';

import { EsriDynamic } from './esri/esri-dynamic';
import { EsriFeature } from './esri/esri-feature';
import { WMS } from './ogc/wms';
import { WFS } from './ogc/wfs';
import { OgcFeature } from './ogc/ogc_feature';
import { XYZTiles } from './map-tile/xyz-tiles';
import { GeoJSON } from './file/geojson';
import { Vector } from './vector/vector';
import { MarkerClusterClass } from './vector/marker-cluster';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import {
  CONST_LAYER_TYPES,
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
  layers: {
    [key: string]: WMS | XYZTiles | GeoJSON | EsriDynamic | EsriFeature;
  } = {};

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
      EVENT_NAMES.EVENT_LAYER_ADD,
      (payload) => {
        if (payload && payload.handlerName.includes(this.#mapId)) {
          const layerConf: TypeLayerConfig = payload.layer;

          if (layerConf.layerType === CONST_LAYER_TYPES.GEOJSON) {
            const geoJSON = new GeoJSON(this.#mapId, layerConf as TypeGeoJSONLayer);
            geoJSON.add(layerConf as TypeGeoJSONLayer).then((layer: leafletLayer | string) => {
              geoJSON.layer = layer;
              this.addToMap(geoJSON);
            });

            this.removeTabindex();
          } else if (layerConf.layerType === CONST_LAYER_TYPES.WMS) {
            const wmsLayer = new WMS(this.#mapId, layerConf as TypeWMSLayer);

            wmsLayer.add(layerConf as TypeWMSLayer).then((layer: leafletLayer | string) => {
              wmsLayer.layer = layer;
              this.addToMap(wmsLayer);
            });
          } else if (layerConf.layerType === CONST_LAYER_TYPES.XYZ_TILES) {
            const xyzTiles = new XYZTiles(this.#mapId, layerConf as TypeXYZTiles);
            xyzTiles.add(layerConf as TypeXYZTiles).then((layer: leafletLayer | string) => {
              xyzTiles.layer = layer;
              this.addToMap(xyzTiles);
            });
          } else if (layerConf.layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC) {
            const esriDynamic = new EsriDynamic(this.#mapId, layerConf as TypeDynamicLayer);
            esriDynamic.add(layerConf as TypeDynamicLayer).then((layer: leafletLayer | string) => {
              esriDynamic.layer = layer;
              this.addToMap(esriDynamic);
            });
          } else if (layerConf.layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
            const esriFeature = new EsriFeature(this.#mapId, layerConf as TypeFeatureLayer);
            esriFeature.add(layerConf as TypeFeatureLayer).then((layer: leafletLayer | string) => {
              esriFeature.layer = layer;
              this.addToMap(esriFeature);
            });
            this.removeTabindex();
          } else if (layerConf.layerType === CONST_LAYER_TYPES.WFS) {
            const wfsLayer = new WFS(this.#mapId, layerConf as TypeWFSLayer);
            wfsLayer.add(layerConf as TypeWFSLayer).then((layer: leafletLayer | string) => {
              wfsLayer.layer = layer;
              this.addToMap(wfsLayer);
            });
          } else if (layerConf.layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
            const ogcFeatureLayer = new OgcFeature(this.#mapId, layerConf as TypeOgcFeatureLayer);
            ogcFeatureLayer.add(layerConf as TypeOgcFeatureLayer).then((layer: leafletLayer | string) => {
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
      EVENT_NAMES.EVENT_REMOVE_LAYER,
      (payload) => {
        // remove layer from outside
        this.removeLayerById(payload.layer.id);
      },
      this.#mapId
    );

    // Load layers that was passed in with the map config
    if (layers && layers.length > 0) {
      layers?.forEach((layer: TypeLayerConfig) => api.event.emit(EVENT_NAMES.EVENT_LAYER_ADD, this.#mapId, { layer }));
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
        api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, this.#mapId, {
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
  private addToMap(cgpvLayer: GeoJSON | WFS | WMS | EsriDynamic | EsriFeature | XYZTiles | OgcFeature): void {
    // if the return layer object is a string, it is because path or entries are bad
    // do not add to the map
    if (typeof cgpvLayer.layer === 'string') {
      api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, this.#mapId, {
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
        this.layerIsLoaded(cgpvLayer.name, cgpvLayer.layer);

      cgpvLayer.layer.addTo(api.map(this.#mapId).map);
      // this.layers.push(cgpvLayer);
      this.layers[cgpvLayer.id] = cgpvLayer;
      api.event.emit(EVENT_NAMES.EVENT_LAYER_ADDED, this.#mapId, {
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
    // this.layers = this.layers.filter((item: TypeLayerData) => {
    //   if (item.id === id) item.layer.removeFrom(this.#map);
    //   return item.id !== id;
    // });
    (this.layers[id].layer as L.Layer).removeFrom(api.map(this.#mapId).map);
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
    api.event.emit(EVENT_NAMES.EVENT_LAYER_ADD, this.#mapId, { layer });

    return layer.id;
  };

  /**
   * Remove a layer from the map
   *
   * @param {TypeLayerConfig} layer the layer configuration to remove
   */
  removeLayer = (layer: TypeLayerConfig): string => {
    // eslint-disable-next-line no-param-reassign
    layer.id = generateId(layer.id);
    api.event.emit(EVENT_NAMES.EVENT_REMOVE_LAYER, this.#mapId, { layer });

    return layer.id;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} id the layer id to look for
   * @returns the found layer data object
   */
  getLayerById = (id: string): WMS | XYZTiles | EsriDynamic | EsriFeature | GeoJSON | null => {
    return this.layers[id];
  };

  // WCS https://github.com/stuartmatthews/Leaflet.NonTiledLayer.WCS
}
