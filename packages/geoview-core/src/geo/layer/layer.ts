/* eslint-disable no-underscore-dangle */
import { EventTypes } from 'ol/Observable';

import { GeoCore, layerConfigIsGeoCore } from './other/geocore';
import { Vector } from './vector/vector';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { Config } from '../../core/utils/config/config';
import { generateId } from '../../core/utils/utilities';
import { layerConfigPayload, payloadIsALayerConfig } from '../../api/events/payloads/layer-config-payload';
import { GeoViewLayerPayload, payloadIsGeoViewLayerAdded } from '../../api/events/payloads/geoview-layer-payload';
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
import { LayerSetPayload } from '../../api/events/payloads/layer-set-payload';

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export class Layer {
  /** Layers with valid configuration for this map. */
  registeredLayers: { [layerEntryConfigId: string]: TypeLayerEntryConfig } = {};

  // variable used to store all added geoview layers
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access vector API to create and manage geometries
  vector: Vector | undefined;

  /** used to reference the map id */
  private mapId: string;

  /**
   * Initialize layer types and listen to add/remove layer events from outside
   *
   * @param {string} mapId a reference to the map
   * @param {TypeGeoviewLayerConfig} layersConfig an optional array containing layers passed within the map config
   */
  constructor(mapId: string, geoviewLayerConfigs?: TypeGeoviewLayerConfig[]) {
    this.mapId = mapId;

    const validGeoviewLayerConfigs = this.validateGeoviewLayerConfig(geoviewLayerConfigs);

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
                arrayOfListOfGeoviewLayerConfig.forEach((listOfGeoviewLayerConfig) => {
                  // the -1 applied is because each geocore UUID config count for one. We want to replace the geocore entry by
                  // the list of geoview layer entries.
                  api.maps[this.mapId].remainingLayersThatNeedToBeLoaded += listOfGeoviewLayerConfig.length - 1;
                  api.maps[this.mapId].setEventListenerAndTimeout4ThisListOfLayer(listOfGeoviewLayerConfig);
                  listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
                    this.addGeoviewLayer(geoviewLayerConfig);
                  });
                });
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
        if (payloadIsGeoViewLayerAdded(payload)) {
          // remove layer from outside
          this.removeLayersUsingPath(payload.geoviewLayer!.geoviewLayerId);
        }
      },
      this.mapId
    );

    // Load layers that was passed in with the map config
    if (validGeoviewLayerConfigs.length > 0) {
      validGeoviewLayerConfigs.forEach((geoviewLayerConfig) =>
        api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig))
      );
    }
  }

  /**
   * Validate the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs The geoview layer configurations to validate.
   *
   * @returns {TypeGeoviewLayerConfig} The new configuration with duplicate entries eliminated.
   */
  private validateGeoviewLayerConfig(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]): TypeGeoviewLayerConfig[] {
    if (geoviewLayerConfigs && geoviewLayerConfigs.length > 0) {
      const validGeoviewLayerConfigs = geoviewLayerConfigs.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < geoviewLayerConfigs.length; configToTestIndex++)
          if (
            configToCreateIndex !== configToTestIndex &&
            geoviewLayerConfigToCreate.geoviewLayerId === geoviewLayerConfigs[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicat entry.
            configToCreateIndex >= configToTestIndex
          ) {
            this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);
            return false;
          }
        return true;
      });
      return validGeoviewLayerConfigs;
    }
    return [];
  }

  /**
   * Print an error message for the duplicate geoview layer configuration.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration in error.
   */
  private printDuplicateGeoviewLayerConfigError(geoviewLayerConfig: TypeGeoviewLayerConfig) {
    api.event.emit(
      snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
        type: 'key',
        value: 'validation.layer.usedtwice',
        params: [geoviewLayerConfig.geoviewLayerId, this.mapId],
      })
    );
    // eslint-disable-next-line no-console
    console.log(`Duplicate use of geoview layer identifier ${geoviewLayerConfig.geoviewLayerId} on map ${this.mapId}`);
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
      this.geoviewLayers[geoviewLayer.geoviewLayerId] = geoviewLayer;
      // trigger the layer added event when layer is loaded on to the map
      geoviewLayer.gvLayers?.once(['change', 'prerender'] as EventTypes[], () => {
        if (!geoviewLayer.isLoaded) {
          api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(this.mapId, geoviewLayer), geoviewLayer.geoviewLayerId);
        }
      });
    }
  }

  /**
   * Remove a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param {string} partialLayerPath the path of the layer to be removed
   */
  removeLayersUsingPath = (partialLayerPath: string): void => {
    Object.keys(this.registeredLayers).forEach((compleLayerPath) => {
      if (compleLayerPath.startsWith(partialLayerPath)) {
        this.registeredLayers[compleLayerPath]?.gvLayer!.dispose();
        api.event.emit(LayerSetPayload.createLayerRegistrationPayload(this.mapId, compleLayerPath, 'remove'));
        delete this.registeredLayers[compleLayerPath];
      }
    });

    if (this.geoviewLayers[partialLayerPath]) {
      clearTimeout(api.maps[this.mapId].layerLoadedTimeoutId[partialLayerPath]);
      this.geoviewLayers[partialLayerPath].gvLayers!.dispose();
      delete this.geoviewLayers[partialLayerPath];
    }
  };

  /**
   * Add a layer to the map
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig the geoview layer configuration to add
   * @param {TypeListOfLocalizedLanguages} optionalSuportedLanguages an optional list of supported language
   */
  addGeoviewLayer = (geoviewLayerConfig: TypeGeoviewLayerConfig, optionalSuportedLanguages?: TypeListOfLocalizedLanguages): string => {
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);
    // create a new config object for this map element
    const config = new Config(api.map(this.mapId).map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in api.maps[this.mapId].layer.geoviewLayers)
      this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      api.maps[this.mapId].setEventListenerAndTimeout4ThisListOfLayer([geoviewLayerConfig]);
      api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));
    }

    return geoviewLayerConfig.geoviewLayerId;
  };

  /**
   * Remove a geoview layer from the map
   *
   * @param {TypeGeoviewLayerConfig} layer the layer configuration to remove
   */
  removeGeoviewLayer = (geoviewLayer: AbstractGeoViewLayer): string => {
    api.event.emit(GeoViewLayerPayload.createRemoveGeoviewLayerPayload(this.mapId, geoviewLayer));

    return geoviewLayer.geoviewLayerId;
  };

  /**
   * Search for a layer using it's id and return the layer data
   *
   * @param {string} id the layer id to look for
   * @returns the found layer data object
   */
  getGeoviewLayerById = (geoviewLayerId: string): AbstractGeoViewLayer | null => {
    return this.geoviewLayers[geoviewLayerId];
  };
}
