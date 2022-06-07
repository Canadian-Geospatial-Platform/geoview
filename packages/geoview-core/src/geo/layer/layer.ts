import { Layer as leafletLayer } from 'leaflet';

import ImageLayer from 'ol/layer/Image';
import { ImageArcGISRest } from 'ol/source';

import { EsriDynamic, layerConfigIsEsriDynamic } from './web-layers/esri/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from './web-layers/esri/esri-feature';
import { layerConfigIsWMS, WMS } from './web-layers/ogc/wms';
import { layerConfigIsWFS, WFS } from './web-layers/ogc/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from './web-layers/ogc/ogc_feature';
import { layerConfigIsXYZTiles, XYZTiles } from './web-layers/map-tile/xyz-tiles';
import { GeoJSON, layerConfigIsGeoJSON } from './web-layers/file/geojson';
import { GeoCore, layerConfigIsGeoCore } from './other/geocore';
import { Vector } from './vector/vector';
import { MarkerClusterClass } from './vector/marker-cluster';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event';

import { Cast, CONST_LAYER_TYPES, AbstractWebLayersClass, TypeLayerConfig, TypeJsonObject } from '../../core/types/cgpv-types';
import { generateId } from '../../core/utils/utilities';
import { layerConfigPayload, payloadIsALayerConfig } from '../../api/events/payloads/layer-config-payload';
import { payloadIsAWebLayer, webLayerPayload } from '../../api/events/payloads/web-layer-payload';
import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';

// TODO: look at a bundler for esri-leaflet: https://github.com/esri/esri-leaflet-bundler
// import "esri-leaflet-renderers";

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export class Layer {
  // variable used to store all added layers
  layers: { [key: string]: AbstractWebLayersClass } = {};

  // used to access vector API to create and manage geometries
  vector: Vector | undefined;

  // used to access marker cluster API to create and manage marker cluster groups
  markerCluster: MarkerClusterClass | undefined;

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

    // this.vector = new Vector(this.#mapId);
    // this.markerCluster = new MarkerClusterClass(this.#mapId);

    // listen to outside events to add layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_LAYER_ADD,
      (payload) => {
        if (payloadIsALayerConfig(payload)) {
          if (payload.handlerName!.includes(this.#mapId)) {
            const { layerConfig } = payload;

            if (layerConfigIsGeoCore(layerConfig)) {
              const geoCore = new GeoCore(this.#mapId);
              geoCore.add(layerConfig).then((uuidLayerConfig) => {
                if (uuidLayerConfig) this.addLayer(uuidLayerConfig);
              });
            } else if (layerConfigIsGeoJSON(layerConfig)) {
              const geoJSON = new GeoJSON(this.#mapId, layerConfig);
              geoJSON.add(layerConfig).then((layer) => {
                geoJSON.layer = layer;
                this.addToMap(geoJSON);
              });
              this.removeTabindex();
            } else if (layerConfigIsWMS(layerConfig)) {
              const wmsLayer = new WMS(this.#mapId, layerConfig);
              wmsLayer.add(layerConfig).then((layer) => {
                wmsLayer.layer = layer;
                this.addToMap(wmsLayer);
              });
            } else if (layerConfigIsEsriDynamic(layerConfig)) {
              const esriDynamic = new EsriDynamic(this.#mapId, layerConfig);
              esriDynamic.add(layerConfig).then((layer) => {
                esriDynamic.layer = layer;
                this.addToMap(esriDynamic);
              });
            } else if (layerConfigIsEsriFeature(layerConfig)) {
              const esriFeature = new EsriFeature(this.#mapId, layerConfig);
              esriFeature.add(layerConfig).then((layer) => {
                esriFeature.layer = layer;
                this.addToMap(esriFeature);
              });
              this.removeTabindex();
            } else if (layerConfigIsWFS(layerConfig)) {
              const wfsLayer = new WFS(this.#mapId, layerConfig);
              wfsLayer.add(layerConfig).then((layer) => {
                wfsLayer.layer = layer;
                this.addToMap(wfsLayer);
              });
            } else if (layerConfigIsOgcFeature(layerConfig)) {
              const ogcFeatureLayer = new OgcFeature(this.#mapId, layerConfig);
              ogcFeatureLayer.add(layerConfig).then((layer) => {
                ogcFeatureLayer.layer = layer;
                this.addToMap(ogcFeatureLayer);
              });
            } else if (layerConfigIsXYZTiles(layerConfig)) {
              const xyzTiles = new XYZTiles(this.#mapId, layerConfig);
              xyzTiles.add(layerConfig).then((layer) => {
                xyzTiles.layer = layer;
                this.addToMap(xyzTiles);
              });
            }
          }
        }
      },
      this.#mapId
    );

    // listen to outside events to remove layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsAWebLayer(payload)) {
          // remove layer from outside
          this.removeLayerById(payload.webLayer.id);
        }
      },
      this.#mapId
    );

    // Load layers that was passed in with the map config
    if (layers && layers.length > 0) {
      layers?.forEach((layerConfig) => api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.#mapId, layerConfig)));
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
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.#mapId, {
            type: 'key',
            value: 'validation.layer.loadfailed',
            params: [name as TypeJsonObject, this.#mapId as TypeJsonObject],
          })
        );

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
    if (typeof cgpvLayer.layer === null) {
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.#mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [cgpvLayer.name as TypeJsonObject, this.#mapId as TypeJsonObject],
        })
      );
    } else {
      // TODO
      // if (
      //   cgpvLayer.type !== CONST_LAYER_TYPES.GEOJSON &&
      //   cgpvLayer.type !== CONST_LAYER_TYPES.WFS &&
      //   cgpvLayer.type !== CONST_LAYER_TYPES.OGC_FEATURE
      // )
      //   this.layerIsLoaded(cgpvLayer.name!, cgpvLayer.layer!);

      api.map(this.#mapId).map.addLayer(cgpvLayer.layer as ImageLayer<ImageArcGISRest>);

      // this.layers.push(cgpvLayer);
      this.layers[cgpvLayer.id] = Cast<AbstractWebLayersClass>(cgpvLayer);
      api.event.emit(webLayerPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, this.#mapId, cgpvLayer));
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

    // TODO
    // this.layers[id].layer!.removeFrom(api.map(this.#mapId).map);
    delete this.layers[id];
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration to add
   */
  addLayer = (layerConfig: TypeLayerConfig): string => {
    // eslint-disable-next-line no-param-reassign
    layerConfig.id = generateId(layerConfig.id);
    api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.#mapId, layerConfig));

    return layerConfig.id;
  };

  /**
   * Remove a layer from the map
   *
   * @param {TypeLayerConfig} layer the layer configuration to remove
   */
  removeLayer = (cgpvLayer: AbstractWebLayersClass): string => {
    // eslint-disable-next-line no-param-reassign
    cgpvLayer.id = generateId(cgpvLayer.id);
    api.event.emit(webLayerPayload(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.#mapId, cgpvLayer));

    return cgpvLayer.id;
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
