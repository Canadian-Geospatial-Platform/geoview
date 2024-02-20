/* eslint-disable no-param-reassign */

import { GeoCore, layerConfigIsGeoCore } from '@/geo/layer/other/geocore';
import { Geometry } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/utils/feature-highlight';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { Config } from '@/core/utils/config/config';
import { generateId, showError, replaceParams, getLocalizedMessage, whenThisThen } from '@/core/utils/utilities';
import {
  layerConfigPayload,
  payloadIsALayerConfig,
  GeoViewLayerPayload,
  payloadIsRemoveGeoViewLayer,
  PayloadBaseClass,
} from '@/api/events/payloads';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeListOfLocalizedLanguages,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { GeoJSON, layerConfigIsGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoPackage, layerConfigIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import { layerConfigIsWMS, WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { EsriDynamic, layerConfigIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage, layerConfigIsEsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { ImageStatic, layerConfigIsImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { layerConfigIsWFS, WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { layerConfigIsXYZTiles, XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { layerConfigIsVectorTiles, VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV, layerConfigIsCSV } from '@/geo/layer/geoview-layers/vector/csv';
import { logger } from '@/core/utils/logger';

export type TypeRegisteredLayers = { [layerPath: string]: TypeLayerEntryConfig };

type TypeEventHandlerFunctions = {
  addLayer: (payload: PayloadBaseClass) => void;
  removeLayer: (payload: PayloadBaseClass) => void;
};

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export class Layer {
  /** Layers with valid configuration for this map. */
  registeredLayers: TypeRegisteredLayers = {};

  // variable used to store all added geoview layers
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access geometry API to create and manage geometries
  geometry: Geometry | undefined;

  // order to load layers
  initialLayerOrder: string[] = [];

  /** used to reference the map id */
  private mapId: string;

  /** used to keep a reference to the Layer's event handler functions */
  private eventHandlerFunctions: TypeEventHandlerFunctions;

  /** used to keep a reference of highlighted layer */
  private highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
    layerPath: undefined,
    originalOpacity: undefined,
  };

  // used to access feature and bounding box highlighting
  featureHighlight: FeatureHighlight;

  /**
   * Initialize layer types and listen to add/remove layer events from outside
   *
   * @param {string} mapId a reference to the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.geometry = new Geometry(this.mapId);
    this.featureHighlight = new FeatureHighlight(this.mapId);

    this.eventHandlerFunctions = {
      addLayer: (payload: PayloadBaseClass) => {
        // Log
        logger.logTraceCoreAPIEvent('LAYER - eventHandlerFunctions.addLayer', payload);

        if (payloadIsALayerConfig(payload)) {
          const { layerConfig } = payload;

          if (layerConfigIsGeoCore(layerConfig)) {
            const geoCore = new GeoCore(this.mapId);
            geoCore.createLayers(layerConfig).then((arrayOfListOfGeoviewLayerConfig) => {
              arrayOfListOfGeoviewLayerConfig.forEach((listOfGeoviewLayerConfig) => {
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
          } else if (layerConfigIsGeoPackage(layerConfig)) {
            const geoPackage = new GeoPackage(this.mapId, layerConfig);
            geoPackage.createGeoViewLayers().then(() => {
              this.addToMap(geoPackage);
            });
          } else if (layerConfigIsCSV(layerConfig)) {
            const csv = new CSV(this.mapId, layerConfig);
            csv.createGeoViewLayers().then(() => {
              this.addToMap(csv);
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
          } else if (layerConfigIsEsriImage(layerConfig)) {
            const esriImage = new EsriImage(this.mapId, layerConfig);
            esriImage.createGeoViewLayers().then(() => {
              this.addToMap(esriImage);
            });
          } else if (layerConfigIsImageStatic(layerConfig)) {
            const imageStatic = new ImageStatic(this.mapId, layerConfig);
            imageStatic.createGeoViewLayers().then(() => {
              this.addToMap(imageStatic);
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
          } else if (layerConfigIsVectorTiles(layerConfig)) {
            const vectorTiles = new VectorTiles(this.mapId, layerConfig);
            vectorTiles.createGeoViewLayers().then(() => {
              this.addToMap(vectorTiles);
            });
          }
        }
      },
      removeLayer: (payload: PayloadBaseClass) => {
        // Log
        logger.logTraceCoreAPIEvent('LAYER - eventHandlerFunctions.removeLayer', payload);

        if (payloadIsRemoveGeoViewLayer(payload)) {
          // remove layer from outside
          this.removeLayersUsingPath(payload.geoviewLayer!.geoviewLayerId);
        }
      },
    };

    // listen to outside events to add layers
    api.event.on(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.eventHandlerFunctions.addLayer, this.mapId);

    // listen to outside events to remove layers
    api.event.on(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.eventHandlerFunctions.removeLayer, this.mapId);
  }

  /**
   * Delete the event handler functions associated to the Layer instance.
   */
  deleteEventHandlerFunctionsOfThisLayerInstance() {
    api.event.off(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, this.eventHandlerFunctions!.addLayer);
    api.event.off(EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER, this.mapId, this.eventHandlerFunctions.removeLayer);
  }

  /**
   * Load layers that was passed in with the map config
   *
   * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs an optional array containing layers passed within the map config
   */
  loadListOfGeoviewLayer(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]) {
    const validGeoviewLayerConfigs = this.deleteDuplicatGeoviewLayerConfig(geoviewLayerConfigs);
    const addSubLayerPathToLayerOrder = (layerEntryConfig: TypeLayerEntryConfig, layerPath: string): void => {
      const subLayerPath = `${layerPath}/${layerEntryConfig.layerId}`;
      this.initialLayerOrder.push(subLayerPath);
      if (layerEntryConfig.listOfLayerEntryConfig?.length) {
        layerEntryConfig.listOfLayerEntryConfig?.forEach((subLayerEntryConfig) => {
          addSubLayerPathToLayerOrder(subLayerEntryConfig, subLayerPath);
        });
      }
    };

    // set order for layers to appear on the map according to config
    validGeoviewLayerConfigs.forEach((geoviewLayerConfig) => {
      let layerPath = '';
      if (geoviewLayerConfig.listOfLayerEntryConfig.length > 1) {
        layerPath = `${geoviewLayerConfig.geoviewLayerId}/${geoviewLayerConfig.geoviewLayerId}`;
        this.initialLayerOrder.push(layerPath);
        geoviewLayerConfig.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          addSubLayerPathToLayerOrder(layerEntryConfig, layerPath);
        });
      } else {
        layerPath = `${geoviewLayerConfig.geoviewLayerId}/${geoviewLayerConfig.listOfLayerEntryConfig[0].layerId}`;
        this.initialLayerOrder.push(layerPath);
      }

      api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));
    });
  }

  /**
   * Validate the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs The geoview layer configurations to validate.
   *
   * @returns {TypeGeoviewLayerConfig} The new configuration with duplicate entries eliminated.
   */
  private deleteDuplicatGeoviewLayerConfig(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]): TypeGeoviewLayerConfig[] {
    if (geoviewLayerConfigs && geoviewLayerConfigs.length > 0) {
      const validGeoviewLayerConfigs = geoviewLayerConfigs.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < geoviewLayerConfigs.length; configToTestIndex++)
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === geoviewLayerConfigs[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicat entry.
            configToCreateIndex > configToTestIndex
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
    const message = replaceParams(
      [geoviewLayerConfig.geoviewLayerId, this.mapId],
      getLocalizedMessage(this.mapId, 'validation.layer.usedtwice')
    );
    showError(this.mapId, message);

    // eslint-disable-next-line no-console
    console.log(`Duplicate use of geoview layer identifier ${geoviewLayerConfig.geoviewLayerId} on map ${this.mapId}`);
  }

  /**
   * This method returns the GeoView instance associated to a specific layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  geoviewLayer(layerPath: string): AbstractGeoViewLayer {
    const geoviewLayerInstance = this.geoviewLayers[layerPath.split('/')[0]];
    geoviewLayerInstance.layerPathAssociatedToTheGeoviewLayer = layerPath;
    return geoviewLayerInstance;
  }

  /**
   * Method used to verify if a layer is registered. Returns true if registered.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration to test.
   *
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isRegistered(layerConfig: TypeLayerEntryConfig): boolean {
    const { layerPath } = layerConfig;
    return this.registeredLayers[layerPath] !== undefined;
  }

  /**
   * Add the layer to the map if valid. If not (is a string) emit an error
   * @param {any} geoviewLayer the layer config
   */
  addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add the layer to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      geoviewLayer.layerLoadError.forEach((loadError) => {
        const { layer, consoleMessage } = loadError;

        // Log the details in the console
        logger.logError(consoleMessage);

        const message = replaceParams([layer, this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.loadfailed'));
        showError(this.mapId, message);
      });
    }

    if (geoviewLayer.allLayerStatusAreIn(['error']))
      // an empty geoview layer is created
      api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(`${this.mapId}/${geoviewLayer.geoviewLayerId}`, geoviewLayer));
    else {
      api.maps[this.mapId].map.addLayer(geoviewLayer.olLayers!);
      api.event.emit(GeoViewLayerPayload.createGeoviewLayerAddedPayload(`${this.mapId}/${geoviewLayer.geoviewLayerId}`, geoviewLayer));
    }
  }

  /**
   * Remove a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param {string} partialLayerPath the path of the layer to be removed
   */
  removeLayersUsingPath = (partialLayerPath: string): void => {
    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const partialLayerPathNodes = partialLayerPath.split('/');

    // initialize these two constant now because we will delete the information used to get their values.
    const indexToDelete = this.registeredLayers[partialLayerPath]
      ? this.registeredLayers[partialLayerPath].parentLayerConfig?.listOfLayerEntryConfig.findIndex(
          (layerConfig) => layerConfig === this.registeredLayers?.[partialLayerPath]
        )
      : undefined;
    const listOfLayerEntryConfigAffected = this.registeredLayers[partialLayerPath]?.parentLayerConfig?.listOfLayerEntryConfig;

    Object.keys(this.registeredLayers).forEach((completeLayerPath) => {
      const completeLayerPathNodes = completeLayerPath.split('/');
      const pathBeginningAreEqual = partialLayerPathNodes.reduce<boolean>((areEqual, partialLayerPathNode, nodeIndex) => {
        return areEqual && partialLayerPathNode === completeLayerPathNodes[nodeIndex];
      }, true);
      if (pathBeginningAreEqual) this.geoviewLayer(completeLayerPath).removeConfig();
    });
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    if (this.geoviewLayers[partialLayerPath]) {
      this.geoviewLayers[partialLayerPath].olLayers!.dispose();
      delete this.geoviewLayers[partialLayerPath];
      const { mapFeaturesConfig } = api.maps[this.mapId];
      if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
        mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
          (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== partialLayerPath
        );
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
    const config = new Config(api.maps[this.mapId].map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in api.maps[this.mapId].layer.geoviewLayers)
      this.printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      api.maps[this.mapId].mapFeaturesConfig.map.listOfGeoviewLayerConfig!.push(geoviewLayerConfig);
      api.maps[this.mapId].setLayerAddedListener4ThisListOfLayer([geoviewLayerConfig]);
      api.event.emit(layerConfigPayload(EVENT_NAMES.LAYER.EVENT_ADD_LAYER, this.mapId, geoviewLayerConfig));
    }

    return geoviewLayerConfig.geoviewLayerId;
  };

  /**
   * Remove a geoview layer from the map
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayer the layer configuration to remove
   */
  removeGeoviewLayer = (geoviewLayer: AbstractGeoViewLayer): string => {
    api.event.emit(GeoViewLayerPayload.createRemoveGeoviewLayerPayload(this.mapId, geoviewLayer));

    return geoviewLayer.geoviewLayerId;
  };

  /**
   * Remove all geoview layers from the map
   */
  removeAllGeoviewLayers = () => {
    Object.keys(this.geoviewLayers).forEach((layerId: string) => {
      this.removeGeoviewLayer(this.geoviewLayers[layerId]);
    });

    return this.mapId;
  };

  /**
   * Search for a layer using its id and return the layer data
   *
   * @param {string} geoviewLayerId the layer id to look for
   * @returns the found layer data object
   */
  getGeoviewLayerById = (geoviewLayerId: string): AbstractGeoViewLayer | null => {
    return this.geoviewLayers?.[geoviewLayerId] || null;
  };

  /**
   * Asynchronously gets a layer using its id and return the layer data.
   * If the layer we're searching for has to be processed, set mustBeProcessed to true when awaiting on this method.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix only to differentiate it from 'getGeoviewLayerById'.
   *
   * @param {string} layerID the layer id to look for
   * @param {string} mustBeProcessed indicate if the layer we're searching for must be found only once processed
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
   * @returns a promise with the AbstractGeoViewLayer
   * @throws an exception when the layer for the layer id couldn't be found, or waiting time expired
   */
  getGeoviewLayerByIdAsync = async (
    geoviewLayerId: string,
    mustBeProcessed: boolean,
    timeout?: number,
    checkFrequency?: number
  ): Promise<AbstractGeoViewLayer> => {
    // Redirects
    const layer = this.getGeoviewLayerById(geoviewLayerId);

    // If layer was found
    if (layer) {
      // Check if not waiting and returning immediately
      if (!mustBeProcessed) return Promise.resolve(layer);

      try {
        // Waiting for the processed phase, possibly throwing exception if that's not happening
        await this.waitForProcesseOrErrorStatus(layer, timeout, checkFrequency);
        return layer;
      } catch (error) {
        // Throw
        throw new Error(`Took too long for layer ${geoviewLayerId} to get in 'processed' phase`);
      }
    }

    // Throw
    throw new Error(`Layer ${geoviewLayerId} not found.`);
  };

  /**
   * Returns a Promise that will be resolved once the given layer is in a processed phase.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   *
   * @param {string} layer the layer object
   * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
   * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
   * @throws an exception when the layer failed to become in processed phase before the timeout expired
   */
  waitForProcesseOrErrorStatus = async (layer: AbstractGeoViewLayer, timeout?: number, checkFrequency?: number): Promise<void> => {
    // Wait for the processed phase
    await whenThisThen(
      () => {
        return layer.allLayerStatusAreIn(['processed', 'loading', 'loaded', 'error']);
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  };

  /**
   * Highlight layer or sublayer on map
   *
   * @param {string} layerPath ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    this.highlightedLayer = { layerPath, originalOpacity: this.geoviewLayer(layerPath).getOpacity() };
    this.geoviewLayer(layerPath).setOpacity(1);
    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        if (
          !registeredLayerPath.startsWith(layerPath) &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25);
        } else this.registeredLayers[registeredLayerPath].olLayer!.setZIndex(999);
      });
    } else {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (
          registeredLayerPath !== layerPath &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25);
        }
      });
      this.registeredLayers[layerPath].olLayer!.setZIndex(999);
    }
  }

  /**
   * Remove layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    api.maps[this.mapId].layer.featureHighlight.removeBBoxHighlight();
    if (this.highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.highlightedLayer;
      if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          if (
            !registeredLayerPath.startsWith(layerPath) &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1);
        });
      } else {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          if (
            registeredLayerPath !== layerPath &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity();
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1);
        });
      }
      MapEventProcessor.setLayerZIndices(this.mapId);
      this.highlightedLayer.layerPath = undefined;
      this.highlightedLayer.originalOpacity = undefined;
    }
  }
}
