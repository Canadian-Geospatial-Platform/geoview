import { GeoCore, layerConfigIsGeoCore } from './other/geocore';
import { Vector } from './vector/vector';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { generateId } from '../../core/utils/utilities';
import { layerConfigPayload, payloadIsALayerConfig } from '../../api/events/payloads/layer-config-payload';
import { payloadIsAGeoViewLayer, geoviewLayerPayload } from '../../api/events/payloads/geoview-layer-payload';
import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import { TypeGeoviewLayerConfig } from '../map/map-schema-types';
import { GeoJSON, layerConfigIsGeoJSON } from './geoview-layers/vector/geojson';
import { layerConfigIsWMS, WMS } from './geoview-layers/raster/wms';
import { EsriDynamic, layerConfigIsEsriDynamic } from './geoview-layers/raster/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from './geoview-layers/vector/esri-feature';
import { layerConfigIsWFS, WFS } from './geoview-layers/vector/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from './geoview-layers/vector/ogc-feature';
import { layerConfigIsXYZTiles, XYZTiles } from './geoview-layers/raster/xyz-tiles';

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export class Layer {
  // variable used to store all added layers
  layers: { [key: string]: AbstractGeoViewLayer } = {};

  // used to access vector API to create and manage geometries
  vector: Vector | undefined;

  /**
   * used to reference the map id
   */
  private mapId: string;

  /**
   * Initialize layer types and listen to add/remove layer events from outside
   *
   * @param {string} id a reference to the map
   * @param {TypeGeoviewLayerConfig} layersConfig an optional array containing layers passed within the map config
   */
  constructor(id: string, layersConfig?: TypeGeoviewLayerConfig[]) {
    this.mapId = id;

    this.vector = new Vector(this.mapId);

    // listen to outside events to add layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_LAYER_ADD,
      (payload) => {
        if (payloadIsALayerConfig(payload)) {
          if (payload.handlerName!.includes(this.mapId)) {
            const { layerConfig } = payload;

            if (layerConfigIsGeoCore(layerConfig)) {
              const geoCore = new GeoCore(this.mapId);
              geoCore.createLayer(layerConfig).then((uuidLayerConfig) => {
                if (uuidLayerConfig) this.addLayer(uuidLayerConfig);
              });
            } else if (layerConfigIsGeoJSON(layerConfig)) {
              const geoJSON = new GeoJSON(this.mapId, layerConfig);
              geoJSON.createGeoViewVectorLayers();
            } else if (layerConfigIsWMS(layerConfig)) {
              const wmsLayer = new WMS(this.mapId, layerConfig);
              wmsLayer.createGeoViewRasterLayers().then(() => {
                this.addToMap(wmsLayer);
              });
            } else if (layerConfigIsEsriDynamic(layerConfig)) {
              const esriDynamic = new EsriDynamic(this.mapId, layerConfig);
              esriDynamic.createGeoViewRasterLayers();
            } else if (layerConfigIsEsriFeature(layerConfig)) {
              const esriFeature = new EsriFeature(this.mapId, layerConfig);
              esriFeature.createGeoViewVectorLayers();
            } else if (layerConfigIsWFS(layerConfig)) {
              const wfsLayer = new WFS(this.mapId, layerConfig);
              wfsLayer.createGeoViewVectorLayers();
            } else if (layerConfigIsOgcFeature(layerConfig)) {
              const ogcFeatureLayer = new OgcFeature(this.mapId, layerConfig);
              ogcFeatureLayer.createGeoViewVectorLayers();
            } else if (layerConfigIsXYZTiles(layerConfig)) {
              const xyzTiles = new XYZTiles(this.mapId, layerConfig);
              xyzTiles.createGeoViewRasterLayers();
            }
          }
        }
      },
      this.mapId
    );

    // listen to outside events to remove layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsAGeoViewLayer(payload)) {
          // remove layer from outside
          this.removeLayerById(payload.geoviewLayer.id);
        }
      },
      this.mapId
    );

    // Load layers that was passed in with the map config
    if (layersConfig && layersConfig.length > 0) {
      layersConfig?.forEach((aSingleLayerConfig) =>
        api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.mapId, aSingleLayerConfig))
      );
    }
  }

  /**
   * Add the layer to the map if valid. If not (is a string) emit an error
   * @param {any} geoviewLayer the layer config
   */
  private addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      const names = geoviewLayer.layerLoadError.toString();
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [names, this.mapId],
        })
      );
      // eslint-disable-next-line no-console
      console.log(`Layer [${names}] failed to load on map ${this.mapId}`);
    } else {
      api.map(this.mapId).map.addLayer(geoviewLayer.gvLayers!);

      // this.layers.push(geoviewLayer);
      this.layers[geoviewLayer.id] = geoviewLayer;
      api.event.emit(geoviewLayerPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, this.mapId, geoviewLayer));
    }
  }

  /**
   * Remove feature from ESRI Feature and GeoJSON layer from tabindex
   */
  removeTabindex(): void {
    // Because there is no way to know GeoJSON is loaded (load event never trigger), we use a timeout
    // TODO: timeout is never a good idea, may have to find a workaround...
    setTimeout(() => {
      const mapContainer = document.getElementsByClassName(`leaflet-map-${this.mapId}`)[0];

      if (mapContainer) {
        const featElems = document
          .getElementsByClassName(`leaflet-map-${this.mapId}`)[0]
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
    this.layers[id].gvLayers!.dispose();

    // this.layers[id].layer!.removeFrom(api.map(this.mapId).map);
    delete this.layers[id];
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeGeoviewLayerConfig} layerConfig the layer configuration to add
   */
  addLayer = (layerConfig: TypeGeoviewLayerConfig): string => {
    // eslint-disable-next-line no-param-reassign
    layerConfig.id = generateId(layerConfig.id);
    api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADD, this.mapId, layerConfig));

    return layerConfig.id;
  };

  /**
   * Remove a layer from the map
   *
   * @param {TypeGeoviewLayerConfig} layer the layer configuration to remove
   */
  removeLayer = (geoviewLayer: AbstractGeoViewLayer): string => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayer.id = generateId(geoviewLayer.id);
    api.event.emit(geoviewLayerPayload(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.mapId, geoviewLayer));

    return geoviewLayer.id;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} id the layer id to look for
   * @returns the found layer data object
   */
  getLayerById = (id: string): AbstractGeoViewLayer | null => {
    // return this.layers.filter((layer: AbstractGeoViewLayer) => layer.id === id)[0];
    return this.layers[id];
  };
}
