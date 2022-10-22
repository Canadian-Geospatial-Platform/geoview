import { GeoCore, layerConfigIsGeoCore } from './other/geocore';
import { Vector } from './vector/vector';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { Config } from '../../core/utils/config/config';
import { generateId } from '../../core/utils/utilities';
import { layerConfigPayload, payloadIsALayerConfig } from '../../api/events/payloads/layer-config-payload';
import { payloadIsAGeoViewLayer, geoviewLayerPayload } from '../../api/events/payloads/geoview-layer-payload';
import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  TypeListOfLocalizedLanguages,
} from '../map/map-schema-types';
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
  /** Layers with valid configuration for this map. */
  registeredLayers: Partial<Record<string, TypeLayerEntryConfig>> = {};

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
   * @param {string} mapId a reference to the map
   * @param {TypeGeoviewLayerConfig} layersConfig an optional array containing layers passed within the map config
   */
  constructor(mapId: string, layersConfig?: TypeGeoviewLayerConfig[]) {
    this.mapId = mapId;

    this.vector = new Vector(this.mapId);

    // listen to outside events to add layers
    api.event.on(
      EVENT_NAMES.LAYER.EVENT_ADD_LAYER,
      (payload) => {
        if (payloadIsALayerConfig(payload)) {
          if (payload.handlerName!.includes(this.mapId)) {
            const { layerConfig } = payload;

            if (layerConfigIsGeoCore(layerConfig)) {
              const geoCore = new GeoCore(this.mapId);
              geoCore.createLayers(layerConfig).then((arrayOfListOfGeoviewLayerConfig) => {
                if (arrayOfListOfGeoviewLayerConfig.length > 0) {
                  arrayOfListOfGeoviewLayerConfig.forEach((listOfGeoviewLayerConfig) => {
                    if (listOfGeoviewLayerConfig.length > 0) {
                      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
                        this.addGeoviewLayer(geoviewLayerConfig);
                      });
                    }
                  });
                }
              });
            } else if (layerConfigIsGeoJSON(layerConfig)) {
              const geoJSON = new GeoJSON(this.mapId, layerConfig);
              geoJSON.createGeoViewLayers().then(() => {
                this.addToMap(geoJSON);
              });
            } else if (layerConfigIsWMS(layerConfig)) {
              const wmsLayer = new WMS(this.mapId, layerConfig);
              wmsLayer.createGeoViewLayers().then(() => {
                this.addToMap(wmsLayer);
              });
            } else if (layerConfigIsEsriDynamic(layerConfig)) {
              const esriDynamic = new EsriDynamic(this.mapId, layerConfig);
              esriDynamic.createGeoViewLayers().then(() => {
                this.addToMap(esriDynamic);
              });
            } else if (layerConfigIsEsriFeature(layerConfig)) {
              const esriFeature = new EsriFeature(this.mapId, layerConfig);
              esriFeature.createGeoViewLayers().then(() => {
                this.addToMap(esriFeature);
              });
            } else if (layerConfigIsWFS(layerConfig)) {
              const wfsLayer = new WFS(this.mapId, layerConfig);
              wfsLayer.createGeoViewLayers().then(() => {
                this.addToMap(wfsLayer);
              });
            } else if (layerConfigIsOgcFeature(layerConfig)) {
              const ogcFeatureLayer = new OgcFeature(this.mapId, layerConfig);
              ogcFeatureLayer.createGeoViewLayers().then(() => {
                this.addToMap(ogcFeatureLayer);
              });
            } else if (layerConfigIsXYZTiles(layerConfig)) {
              const xyzTiles = new XYZTiles(this.mapId, layerConfig);
              xyzTiles.createGeoViewLayers().then(() => {
                this.addToMap(xyzTiles);
              });
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
          this.removeLayersUsingPath(payload.geoviewLayer.geoviewLayerId);
        }
      },
      this.mapId
    );

    // Load layers that was passed in with the map config
    if (layersConfig && layersConfig.length > 0) {
      layersConfig?.forEach((layerConfig) =>
        api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, layerConfig))
      );
    }
  }

  /**
   * Get the layer Path of the layer configuration parameter.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration for wich we want to get the layer path.
   *
   * @returns {string} Returns the layer path.
   */
  static getLayerPath(layerEntryConfig: TypeLayerEntryConfig, layerPath?: string): string {
    const pathEnding = typeof layerPath === 'undefined' ? layerEntryConfig.layerId : layerPath;
    if (layerEntryConfig.geoviewRootLayer === layerEntryConfig.parentLayerConfig)
      return `${layerEntryConfig.geoviewRootLayer!.geoviewLayerId!}/${pathEnding}`;
    return this.getLayerPath(
      layerEntryConfig.parentLayerConfig as TypeLayerGroupEntryConfig,
      `${(layerEntryConfig.parentLayerConfig as TypeLayerGroupEntryConfig).layerId}/${pathEnding}`
    );
  }

  /**
   * Register the layer identifier. Duplicate identifier are not allowed.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to register.
   *
   * @returns {boolean} Returns false if the layer configuration can't be registered.
   */
  registerLayerConfig(layerEntryConfig: TypeLayerEntryConfig): boolean {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    if (this.registeredLayers[layerPath]) return false;
    this.registeredLayers[layerPath] = layerEntryConfig;
    return true;
  }

  /**
   * Method used to verify if a layer is registered. Returns true if registered.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to test.
   *
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isRegistered(layerEntryConfig: TypeLayerEntryConfig): boolean {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    return this.registeredLayers[layerPath] !== undefined;
  }

  /**
   * Add the layer to the map if valid. If not (is a string) emit an error
   * @param {any} geoviewLayer the layer config
   */
  private addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add the layer to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      geoviewLayer.layerLoadError.forEach((loadError) => {
        const { layer, consoleMessage } = loadError;
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.loadfailed',
            params: [layer, this.mapId],
          })
        );
        // eslint-disable-next-line no-console
        console.log(consoleMessage);
      });
    } else {
      api.map(this.mapId).map.addLayer(geoviewLayer.gvLayers!);

      // this.layers.push(geoviewLayer);
      this.layers[geoviewLayer.geoviewLayerId] = geoviewLayer;
      api.event.emit(geoviewLayerPayload(EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, this.mapId, geoviewLayer));
    }
  }

  /**
   * Remove a GeoView layer from the map using its geoviewLayerId
   *
   * @param {string} geoviewLayerId the path of the GeoView layer to be removed
   */
  removeLayersUsingPath = (layerPath: string): void => {
    this.registeredLayers = Object.keys(this.registeredLayers)
      .filter((key) => {
        if (key.startsWith(layerPath)) {
          this.registeredLayers[key]?.gvLayer!.dispose();
          return false;
        }
        return true;
      })
      .reduce((newRegisteredLayers: Partial<Record<string, TypeLayerEntryConfig>>, key: string) => {
        // eslint-disable-next-line no-param-reassign
        newRegisteredLayers[key] = this.registeredLayers[key];
        return newRegisteredLayers;
      }, {});

    if (this.layers[layerPath]) {
      this.layers[layerPath].gvLayers!.dispose();
      delete this.layers[layerPath];
    }
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeGeoviewLayerConfig} layerConfig the layer configuration to add
   */
  addGeoviewLayer = (geoviewLayerConfig: TypeGeoviewLayerConfig, optionalSuportedLanguages?: TypeListOfLocalizedLanguages): string => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);
    // create a new config for this map element
    const config = new Config(api.map(this.mapId).map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));

    return geoviewLayerConfig.geoviewLayerId;
  };

  /**
   * Remove a layer from the map
   *
   * @param {TypeGeoviewLayerConfig} layer the layer configuration to remove
   */
  removeGeoviewLayer = (geoviewLayer: AbstractGeoViewLayer): string => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayer.geoviewLayerId = generateId(geoviewLayer.geoviewLayerId);
    api.event.emit(geoviewLayerPayload(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.mapId, geoviewLayer));

    return geoviewLayer.geoviewLayerId;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} id the layer id to look for
   * @returns the found layer data object
   */
  getGeoviewLayerById = (geoviewLayerId: string): AbstractGeoViewLayer | null => {
    return this.layers[geoviewLayerId];
  };
}
