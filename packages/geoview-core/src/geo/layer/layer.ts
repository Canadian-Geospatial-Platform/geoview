import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import Collection from 'ol/Collection';
import { Source } from 'ol/source';
import VectorImageLayer from 'ol/layer/VectorImage';
import ImageLayer from 'ol/layer/Image';

import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer, LayerCreationEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  layerEntryIsGroupLayer,
  CONST_LAYER_ENTRY_TYPES,
  TypeLayerStatus,
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

import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { GeoViewLayerCreatedTwiceError, GeoViewLayerNotCreatedError } from '@/geo/layer/exceptions/layer-exceptions';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { api } from '@/app';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVLayer } from './gv-layers/abstract-gv-layer';
import { GVEsriFeature } from './gv-layers/vector/gv-esri-feature';
import { GVOGCFeature } from './gv-layers/vector/gv-ogc-feature';
import { GVGeoJSON } from './gv-layers/vector/gv-geojson';
import { GVEsriDynamic } from './gv-layers/raster/gv-esri-dynamic';
import { GVWMS } from './gv-layers/raster/gv-wms';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
// import { LayerMockup } from './layer-mockup';

import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';

export type TypeRegisteredLayers = { [layerPath: string]: TypeLayerEntryConfig };

export type GeoViewLayerAddedResult = {
  layer: AbstractGeoViewLayer;
  promiseLayer: Promise<void>;
};

// ************************************************************
// INDICATES IF USING HYBRID MODE WITH THE NEW GVLAYERS CLASSES
// ************************************************************
const NEW_MODE = false;

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class LayerApi
 */
export class LayerApi {
  /** used to reference the map viewer */
  mapViewer: MapViewer;

  // used to access geometry API to create and manage geometries
  geometry: GeometryApi;

  // order to load layers
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: TypeRegisteredLayers = {};

  // Dictionary holding all the old geoview layers
  #geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // Dictionary holding all the OpenLayers layers
  #olLayers: { [geoviewLayerId: string]: BaseLayer } = {};

  // Dictionary holding all the new GVLayers
  #gvLayers: { [geoviewLayerId: string]: AbstractGVLayer } = {};

  /** used to keep a reference of highlighted layer */
  #highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
    layerPath: undefined,
    originalOpacity: undefined,
  };

  // used to access feature and bounding box highlighting
  featureHighlight: FeatureHighlight;

  // Legends layer set associated to the map
  legendsLayerSet: LegendsLayerSet;

  // Hover feature info layer set associated to the map
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  // All feature info layer set associated to the map
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  // Feature info layer set associated to the map
  featureInfoLayerSet: FeatureInfoLayerSet;

  // Keep all callback delegates references
  #onLayerAddedHandlers: LayerAddedDelegate[] = [];

  // Maximum time duration to wait when registering a layer for the time slider
  static #MAX_WAIT_TIME_SLIDER_REGISTRATION = 20000;

  /**
   * Initializes layer types and listen to add/remove layer events from outside
   * @param {MapViewer} mapViewer - A reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    this.mapViewer = mapViewer;
    this.legendsLayerSet = new LegendsLayerSet(this);
    this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(this);
    this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(this);
    this.featureInfoLayerSet = new FeatureInfoLayerSet(this);

    this.geometry = new GeometryApi(this.mapViewer);
    this.featureHighlight = new FeatureHighlight(this.mapViewer);
  }

  get mapId(): string {
    // TODO: Check - Resign to `getMapId()` instead?
    return this.mapViewer.mapId;
  }

  /**
   * Gets the GeoView Layer Ids
   * @returns {string[]} The GeoView Layer Ids
   */
  getGeoviewLayerIds(): string[] {
    // TODO: Refactor - This function could be removed eventually?
    return Object.keys(this.#geoviewLayers);
  }

  /**
   * Returns the GeoView instance associated to the layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath - The layer path (or in this case the geoviewLayerId) of the layer's configuration.
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractGeoViewLayer | undefined {
    // TODO: Refactor - This function will be replaced to return the new layer classes model
    // The first element of the layerPath is the geoviewLayerId
    return this.#geoviewLayers[layerPath.split('/')[0]];
  }

  /**
   * Asynchronously gets a layer using its id and return the layer data.
   * If the layer we're searching for has to be processed, set mustBeProcessed to true when awaiting on this method.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getGeoviewLayer()'.
   * @param {string} geoviewLayerId - The geoview layer id to look for
   * @param {boolean} mustBeProcessed - Indicate if the layer we're searching for must be found only once processed
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layer
   * @returns {Promise<AbstractGeoViewLayer>} A promise with the AbstractGeoViewLayer
   * @throws An exception when the layer for the layer id couldn't be found, or waiting time expired
   */
  async getGeoviewLayerByIdAsync(
    geoviewLayerId: string,
    mustBeProcessed: boolean,
    timeout?: number,
    checkFrequency?: number
  ): Promise<AbstractGeoViewLayer> {
    // Redirects
    const layer = this.getGeoviewLayer(geoviewLayerId);

    // If layer was found
    if (layer) {
      // Check if not waiting and returning immediately
      if (!mustBeProcessed) return Promise.resolve(layer);

      try {
        // Waiting for the processed phase, possibly throwing exception if that's not happening
        await layer.waitForAllLayerStatusAreGreaterThanOrEqualTo(timeout, checkFrequency);
        return layer;
      } catch (error) {
        // Throw
        throw new Error(`Took too long for layer ${geoviewLayerId} to get in 'processed' phase`);
      }
    }

    // Throw
    throw new Error(`Layer ${geoviewLayerId} not found.`);
  }

  /**
   * Temporary new function for migration purposes, replacing getGeoviewLayerIds
   * @returns The new Geoview Layer
   */
  getGeoviewLayerIdsNew(): string[] {
    return Object.keys(this.#gvLayers);
  }

  /**
   * New function for migration purposes, replacing getGeoviewLayer
   * @param {string} layerPath - The layer path
   * @returns The new Geoview Layer
   */
  getGeoviewLayerNew(layerPath: string): AbstractGVLayer | undefined {
    return this.#gvLayers[layerPath];
  }

  /**
   * Hybrid function for migration purposes, bridging the gap between getGeoviewLayer and getGeoviewLayerNew
   * @param {string} layerPath - The layer path
   * @returns The new Geoview Layer
   */
  getGeoviewLayerHybrid(layerPath: string): AbstractGeoViewLayer | AbstractGVLayer | undefined {
    // If new mode
    if (NEW_MODE) return this.getGeoviewLayerNew(layerPath);

    // Old mode
    return this.getGeoviewLayer(layerPath);
  }

  /**
   * Verifies if a layer is registered. Returns true if registered.
   * @param {string} layerPath - The layer path to check.
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isLayerEntryConfigRegistered(layerPath: string): boolean {
    return !!this.#layerEntryConfigs[layerPath];
  }

  /**
   * Gets the Layer Entry Config Ids
   * @returns {string[]} The GeoView Layer Ids
   */
  getLayerEntryConfigIds(): string[] {
    // TODO: Refactor - This function could be removed eventually?
    return Object.keys(this.#layerEntryConfigs);
  }

  /** ***************************************************************************************************************************
   * Gets the layer configuration of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {TypeLayerEntryConfig | undefined} The layer configuration or undefined if not found.
   */
  getLayerEntryConfig(layerPath: string): TypeLayerEntryConfig | undefined {
    return this.#layerEntryConfigs?.[layerPath];
  }

  /**
   * Obsolete function to set the layer configuration in the registered layers.
   */
  setLayerEntryConfigObsolete(layerConfig: TypeLayerEntryConfig): void {
    // FIXME: Obsolete function that should be deleted once the Layers refactoring is done
    // Keep it :( (get rid of this later)
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;
  }

  /**
   * Returns the OpenLayer instance associated with the layer path.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {BaseLayer} Returns the geoview instance associated to the layer path.
   */
  getOLLayer(layerPath: string): BaseLayer | undefined {
    // If new mode, get the OpenLayer layer as part of the new GVLayer design
    if (NEW_MODE) return this.getGeoviewLayerNew(layerPath)?.getOLLayer();

    // Old mode, get the OpenLayer layer stored in the dictionary
    return this.#olLayers[layerPath];
  }

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns {Promise<BaseLayer>} Returns the OpenLayer layer associated to the layer path.
   */
  getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer> {
    // Make sure the open layer has been created, sometimes it can still be in the process of being created
    return whenThisThen(
      () => {
        return this.getOLLayer(layerPath)!;
      },
      timeout,
      checkFrequency
    );
  }

  /**
   * Generate an array of layer info for the orderedLayerList.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The config to get the info from.
   * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
   */
  static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig): TypeOrderedLayerInfo[] {
    const newOrderedLayerInfos: TypeOrderedLayerInfo[] = [];

    const addSubLayerPathToLayerOrder = (layerEntryConfig: TypeLayerEntryConfig, layerPath: string): void => {
      const subLayerPath = layerPath.endsWith(layerEntryConfig.layerId) ? layerPath : `${layerPath}/${layerEntryConfig.layerId}`;
      const layerInfo: TypeOrderedLayerInfo = {
        layerPath: subLayerPath,
        visible: layerEntryConfig.initialSettings?.states?.visible !== false,
        queryable: layerEntryConfig.source?.featureInfo?.queryable !== undefined ? layerEntryConfig.source?.featureInfo?.queryable : true,
        hoverable:
          layerEntryConfig.initialSettings?.states?.hoverable !== undefined ? layerEntryConfig.initialSettings?.states?.hoverable : true,
      };
      newOrderedLayerInfos.push(layerInfo);
      if (layerEntryConfig.listOfLayerEntryConfig?.length) {
        layerEntryConfig.listOfLayerEntryConfig?.forEach((subLayerEntryConfig) => {
          addSubLayerPathToLayerOrder(subLayerEntryConfig, subLayerPath);
        });
      }
    };

    if ((geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId) {
      if ((geoviewLayerConfig as TypeGeoviewLayerConfig).listOfLayerEntryConfig.length > 1) {
        const layerPath = `${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}/${
          (geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId
        }`;
        const layerInfo: TypeOrderedLayerInfo = {
          layerPath,
          visible: geoviewLayerConfig.initialSettings?.states?.visible !== false,
        };
        newOrderedLayerInfos.push(layerInfo);
        (geoviewLayerConfig as TypeGeoviewLayerConfig).listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          addSubLayerPathToLayerOrder(layerEntryConfig, layerPath);
        });
      } else {
        const layerEntryConfig = (geoviewLayerConfig as TypeGeoviewLayerConfig).listOfLayerEntryConfig[0];
        addSubLayerPathToLayerOrder(layerEntryConfig, layerEntryConfig.layerPath);
      }
    } else addSubLayerPathToLayerOrder(geoviewLayerConfig as TypeLayerEntryConfig, (geoviewLayerConfig as TypeLayerEntryConfig).layerPath);

    return newOrderedLayerInfos;
  }

  /**
   * Load layers that was passed in with the map config
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - An optional array containing layers passed within the map config
   * @returns {Promise<void>}
   */
  loadListOfGeoviewLayer(mapConfigLayerEntries?: MapConfigLayerEntry[]): Promise<void> {
    const validGeoviewLayerConfigs = this.#deleteDuplicatAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // set order for layers to appear on the map according to config
    const promisesOfGeoCoreGeoviewLayers: Promise<TypeGeoviewLayerConfig[]>[] = [];
    for (let i = 0; i < validGeoviewLayerConfigs.length; i++) {
      const geoviewLayerConfig = validGeoviewLayerConfigs[i];

      // If the layer is GeoCore add it via the core function
      if (mapConfigLayerEntryIsGeoCore(geoviewLayerConfig)) {
        // Prep the GeoCore
        const geoCore = new GeoCore(this.mapId, this.mapViewer.getDisplayLanguage());

        // Create the layers from the UUID
        promisesOfGeoCoreGeoviewLayers.push(geoCore.createLayersFromUUID(geoviewLayerConfig.geoviewLayerId));
      } else {
        // Add a resolved promise for a regular Geoview Layer Config
        promisesOfGeoCoreGeoviewLayers.push(Promise.resolve([geoviewLayerConfig as TypeGeoviewLayerConfig]));
      }
    }

    // TODO: Refactor - There should be no Geocore layer in layers in the geo folder, can the above be moved in an earlier process?

    // Wait for all promises (GeoCore ones) to process
    // The reason for the Promise.allSettled is because of synch issues with the 'setMapOrderedLayerInfo' which happens below and the
    // other setMapOrderedLayerInfos that happen in parallel via the ADD_LAYER events ping/pong'ing, making the setMapOrdered below fail
    // if we don't stage the promises. If we don't stage the promises, sometimes I have 4 layers loaded in 'Details' and sometimes
    // I have 3 layers loaded in Details - for example.
    // To fix this, we'll have to synch the ADD_LAYER events and make sure those 'know' what order they should be in when they
    // propagate the mapOrderedLayerInfo in their processes. For now at least, this is repeating the same behavior until the events are fixed.
    const orderedLayerInfos: TypeOrderedLayerInfo[] = [];
    return Promise.allSettled(promisesOfGeoCoreGeoviewLayers).then((promisedLayers) => {
      // For each layers in the fulfilled promises only
      promisedLayers
        .filter((promise) => promise.status === 'fulfilled')
        .map((promise) => promise as PromiseFulfilledResult<TypeGeoviewLayerConfig[]>)
        .forEach((promise) => {
          // For each layer
          promise.value.forEach((geoviewLayerConfig) => {
            try {
              // Generate array of layer order information
              const layerInfos = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
              orderedLayerInfos.push(...layerInfos);

              // Add it
              const addedResult = this.addGeoviewLayer(geoviewLayerConfig);

              // If processed far enough to have a result with a promise
              if (addedResult) {
                // Catch a problem with the promise if any
                addedResult.promiseLayer.catch((error) => {
                  // Layer failed inside its promise to be added to the map

                  // Log
                  logger.logError(error);

                  // If the error is a GeoViewLayerCreatedTwiceError
                  if (error instanceof GeoViewLayerCreatedTwiceError) {
                    this.mapViewer.notifications.showError('validation.layer.createtwice', [
                      (error as GeoViewLayerCreatedTwiceError).geoviewLayerId,
                      this.mapId,
                    ]);
                  } else {
                    this.mapViewer.notifications.showError('validation.layer.genericError', [this.mapId]);
                  }
                });
              } else {
                // Layer failed to get created
                throw new GeoViewLayerNotCreatedError(geoviewLayerConfig.geoviewLayerId, this.mapId);
              }
            } catch (error) {
              // Layer encountered a generic error when being created and added to the map

              // Log
              logger.logError(error);

              // TODO: Use a generic error message
              this.mapViewer.notifications.showError('validation.layer.genericError', [this.mapId]);
            }
          });
        });
      MapEventProcessor.setMapOrderedLayerInfo(this.mapId, orderedLayerInfos);
    });
  }

  /**
   * Validates the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - The Map Config Layer Entries to validate.
   * @returns {MapConfigLayerEntry[]} The new configuration with duplicate entries eliminated.
   * @private
   */
  #deleteDuplicatAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries?: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (mapConfigLayerEntries && mapConfigLayerEntries.length > 0) {
      const validGeoviewLayerConfigs = mapConfigLayerEntries.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < mapConfigLayerEntries.length; configToTestIndex++) {
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === mapConfigLayerEntries[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicate entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);
            return false;
          }
        }
        return true;
      });
      return validGeoviewLayerConfigs;
    }
    return [];
  }

  /**
   * Prints an error message for the duplicate geoview layer configuration.
   * @param {MapConfigLayerEntry} mapConfigLayerEntry - The Map Config Layer Entry in error.
   * @private
   */
  #printDuplicateGeoviewLayerConfigError(mapConfigLayerEntry: MapConfigLayerEntry): void {
    // TODO: find a more centralized way to trap error and display message
    api.maps[this.mapId].notifications.showError('validation.layer.usedtwice', [mapConfigLayerEntry.geoviewLayerId, this.mapId]);

    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.mapId}`);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   * @param {string} uuid - The GeoCore UUID to add to the map
   * @returns {Promise<void>} A promise which resolves when done adding
   */
  async addGeoviewLayerByGeoCoreUUID(uuid: string): Promise<void> {
    const geoCoreGeoviewLayerInstance = new GeoCore(this.mapId, this.mapViewer.getDisplayLanguage());
    const layers = await geoCoreGeoviewLayerInstance.createLayersFromUUID(uuid);
    layers.forEach((geoviewLayerConfig) => {
      // Redirect
      this.addGeoviewLayer(geoviewLayerConfig);
    });
  }

  /**
   * Adds a layer to the map. This is the main method to add a GeoView Layer on the map.
   * It handles all the processing, including the validations, and makes sure to inform the layer sets about the layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add
   * @returns {GeoViewLayerAddedResult | undefined} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult | undefined {
    // TODO: Refactor - This should be dealt with the config classes and this line commented out
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);

    // TODO: Refactor - This should be dealt with the config classes and this line commented out
    ConfigValidation.validateListOfGeoviewLayerConfig([geoviewLayerConfig]);

    // TODO: Refactor - This should be dealt with the config classes and this line commented out, therefore, content of addGeoviewLayerStep2 becomes this addGeoviewLayer function.
    if (geoviewLayerConfig.geoviewLayerId in this.#geoviewLayers) this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      // Process the addition of the layer
      return this.#addGeoviewLayerStep2(geoviewLayerConfig);
    }

    // Not added
    return undefined;
  }

  /**
   * Continues the addition of the geoview layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add
   * @returns {GeoViewLayerAddedResult | undefined} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   * @private
   */
  #addGeoviewLayerStep2(geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult | undefined {
    // TODO: Refactor - Here the function should use the structure created by validation config with the metadata fetch and no need to pass the validation.
    let layerBeingAdded: AbstractGeoViewLayer | undefined;
    if (layerConfigIsGeoJSON(geoviewLayerConfig)) {
      layerBeingAdded = new GeoJSON(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsGeoPackage(geoviewLayerConfig)) {
      layerBeingAdded = new GeoPackage(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsCSV(geoviewLayerConfig)) {
      layerBeingAdded = new CSV(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsWMS(geoviewLayerConfig)) {
      layerBeingAdded = new WMS(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriDynamic(geoviewLayerConfig)) {
      layerBeingAdded = new EsriDynamic(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriFeature(geoviewLayerConfig)) {
      layerBeingAdded = new EsriFeature(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsEsriImage(geoviewLayerConfig)) {
      layerBeingAdded = new EsriImage(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsImageStatic(geoviewLayerConfig)) {
      layerBeingAdded = new ImageStatic(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsWFS(geoviewLayerConfig)) {
      layerBeingAdded = new WFS(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsOgcFeature(geoviewLayerConfig)) {
      layerBeingAdded = new OgcFeature(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsXYZTiles(geoviewLayerConfig)) {
      layerBeingAdded = new XYZTiles(this.mapId, geoviewLayerConfig);
    } else if (layerConfigIsVectorTiles(geoviewLayerConfig)) {
      layerBeingAdded = new VectorTiles(this.mapId, geoviewLayerConfig);
    } else {
      // TODO: Refactor - Throw an Error when falling in this else and change return type to AbstractGeoViewLayer without undefined
    }

    // If created
    if (layerBeingAdded) {
      // Add in the geoviewLayers set
      this.#geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

      // Register when layer entry config has become processed
      layerBeingAdded.onLayerEntryProcessed((geoviewLayer, event) => {
        // Log
        logger.logDebug(`Layer entry config processed for ${event.config.layerPath} on map ${this.mapId}`, event.config);

        // Register it
        // this.registerLayerConfigInit(event.config);
      });

      // Register when OpenLayer layer has been created
      layerBeingAdded.onLayerCreation((geoviewLayer: AbstractGeoViewLayer, event: LayerCreationEvent) => {
        // Log
        logger.logDebug(`OpenLayer created for ${event.config.layerPath} on map ${this.mapId}`, event.config);

        // Keep a reference
        this.#olLayers[event.config.layerPath] = event.layer;

        // If new layers mode, create the corresponding GVLayer
        if (NEW_MODE) {
          // Create the right type of GVLayer
          const gvLayer = LayerApi.createGVLayer(event.layer, this.mapId, geoviewLayer, event.config);
          if (gvLayer) this.#gvLayers[event.config.layerPath] = gvLayer;
        }

        // Register it
        this.registerLayerConfigInit(event.config as TypeLayerEntryConfig);
      });

      // Create a promise about the layer will be on the map
      const promiseLayer = new Promise<void>((resolve, reject) => {
        // Continue the addition process
        layerBeingAdded!
          .createGeoViewLayers()
          .then(() => {
            // Add the layer on the map
            this.#addToMap(layerBeingAdded!);

            // Resolve, done
            resolve();

            // Emit about it
            this.#emitLayerAdded({ layer: layerBeingAdded! });
          })
          .catch((error) => {
            // Reject it higher, because that's not where we want to handle the promise failure, we're returning the promise higher
            reject(error);
          });
      });

      // Return the layer with the promise it'll be on the map
      return { layer: layerBeingAdded, promiseLayer };
    }

    // Not added
    return undefined;
  }

  /**
   * Registers the layer identifier.
   */
  registerLayerConfigInit(layerConfig: TypeLayerEntryConfig): void {
    // Log (keep the commented line for now)
    // logger.logDebug('registerLayerConfigInit', layerConfig.layerPath, layerConfig.layerStatus);

    // Keep it
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;

    // If not a group
    if (layerConfig.entryType !== CONST_LAYER_ENTRY_TYPES.GROUP) {
      // Register the layer entry config
      this.registerLayerConfigUpdate(layerConfig as AbstractBaseLayerEntryConfig);
    }
  }

  /**
   * Registers the layer in the LayerApi to start managing it.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer associated with the layer entry config
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config to register
   */
  registerLayerConfigUpdate(layerConfig: AbstractBaseLayerEntryConfig): void {
    // TODO: Refactor - Keeping this function separate from registerLayerConfigInit for now, because this registerLayerConfigUpdate was
    // TO.DOCONT: called in 'processListOfLayerEntryConfig' processes happening externally. I've since commented those calls to try
    // TO.DOCONT: things out. If things are stable, we can remove the dead code in the processListOfLayerEntryConfig and merge
    // TO.DOCONT: registerLayerConfigInit with registerLayerConfigUpdate

    // Register for ordered layer information
    this.#registerForOrderedLayerInfo(layerConfig);

    // Register for TimeSlider
    this.#registerForTimeSlider(layerConfig).catch((error) => {
      // Log
      logger.logPromiseFailed('in registration of layer for the time slider', error);
    });

    // TODO: Uncomment this when visibility logic handle within orchestrator rather than too close to the store
    // Register an event on the layer visible changed
    // geoviewLayer.onVisibleChanged((layer, event) => {
    //   // Propagate in the store
    //   MapEventProcessor.setOrToggleMapLayerVisibility(this.mapId, registrationEvent.layerPath, event.visible);
    // });

    // Tell the layer sets about it
    [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach((layerSet) => {
      // Register or Unregister the layer
      layerSet.registerOrUnregisterLayer(layerConfig, 'add');
    });

    // eslint-disable-next-line no-param-reassign
    layerConfig.layerStatus = 'registered';
  }

  /**
   * Continues the addition of the geoview layer.
   * Adds the layer to the map if valid. If not (is a string) emits an error.
   * @param {AbstractGeoViewLayer} geoviewLayer - The layer
   * @private
   */
  #addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // if the returned layer object has something in the layerLoadError, it is because an error was detected
    // do not add the layer to the map
    if (geoviewLayer.layerLoadError.length !== 0) {
      geoviewLayer.layerLoadError.forEach((loadError) => {
        const { layer, loggerMessage } = loadError;

        // Log the details in the console
        logger.logError(loggerMessage);

        // TODO: find a more centralized way to trap error and display message
        api.maps[this.mapId].notifications.showError('validation.layer.loadfailed', [layer, this.mapId]);
      });
    }

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.mapViewer.map.addLayer(geoviewLayer.olRootLayer!);
    }

    // Log
    logger.logInfo(`GeoView Layer ${geoviewLayer.geoviewLayerId} added to map ${this.mapId}`, geoviewLayer);

    // Set the layer z indices
    MapEventProcessor.setLayerZIndices(this.mapId);
  }

  /**
   * Registers layer information for the ordered layer info in the store.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be reordered.
   * @private
   */
  #registerForOrderedLayerInfo(layerConfig: TypeLayerEntryConfig): void {
    // If the map index for the given layer path hasn't been set yet
    if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerConfig.layerPath) === -1) {
      // Get the sub-layer-path
      const subLayerPath = layerConfig.layerPath.split('.')[1];

      // If the map index of a sub-layer-path has been set
      if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, subLayerPath) !== -1) {
        // Replace the order layer info of the layer with the index of the sub-layer-path by calling replaceOrderedLayerInfo
        MapEventProcessor.replaceOrderedLayerInfo(this.mapId, layerConfig, subLayerPath);
      } else if (layerConfig.parentLayerConfig) {
        // Here the map index of a sub-layer-path hasn't been set and there's a parent layer config for the current layer config
        // Get the sub-layer-path
        // TODO: Refactor - Sometimes we are getting the sub-layer-path by splitting on the '.' and sometimes on the '/'.
        // TO.DOCONT: This abstraction logic should be part of the ConfigBaseClass
        const parentLayerPathArray = layerConfig.layerPath.split('/');
        parentLayerPathArray.pop();
        const parentLayerPath = parentLayerPathArray.join('/');

        // Get the map index of the parent layer path
        const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, parentLayerPath);

        // Get the number of child layers
        const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.mapId).filter((layerInfo) =>
          layerInfo.layerPath.startsWith(parentLayerPath)
        ).length;

        // If the map index of the parent hasn't been set yet
        if (parentLayerIndex !== -1) {
          // Add the ordered layer information for the layer path based on the parent index + the number of child layers
          // TODO: Check - This addition seems wrong? Seems like it's not going to scale well when multiple layers/groups and a single index order
          MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig, parentLayerIndex + numberOfLayers);
        } else {
          // Add the ordered layer information for the layer path based unshifting the current array by calling addOrderedLayerInfo
          // TODO: Check - Could use more comment here, not sure what it's meant for
          MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig.parentLayerConfig!);
        }
      } else {
        // Here the map index of a sub-layer-path hasn't been set and there's no parent layer config for the current layer config
        // Add the ordered layer information for the layer path based unshifting the current array by calling addOrderedLayerInfo
        // TODO: Check - Could use more comment here, not sure what it's meant for
        MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig);
      }
    }
  }

  /**
   * Registers layer information for TimeSlider.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  async #registerForTimeSlider(layerConfig: TypeLayerEntryConfig): Promise<void> {
    try {
      // Wait until the layer is loaded (or processed?)
      await whenThisThen(() => layerConfig.isGreaterThanOrEqualTo('processed'), LayerApi.#MAX_WAIT_TIME_SLIDER_REGISTRATION);
      const geoviewLayer = this.getGeoviewLayerHybrid(layerConfig.layerPath);

      // If the layer is loaded, continue
      if (geoviewLayer) {
        // Check and add time slider layer when needed
        TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.mapId, layerConfig);
      }
    } catch (error) {
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // The error itself, regarding the loaded failure, is already being taken care of elsewhere.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
  }

  /**
   * Unregisters the layer in the LayerApi to stop managing it.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer associated with the layer entry config
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to unregister
   */
  unregisterLayer(layerConfig: TypeLayerEntryConfig): void {
    // TODO: Fix - Reactivate and make this work
    // // Register a handler on the layer config to track the status changed
    // layerConfig.offLayerStatusChanged((config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => {
    //   this.#handleLayerStatusChanged(config, layerStatusEvent);
    // });

    // Unregister from ordered layer info
    this.#unregisterFromOrderedLayerInfo(layerConfig);

    // Unregister from TimeSlider
    this.#unregisterFromTimeSlider(layerConfig);

    // Unregister from GeoChart
    this.#unregisterFromGeoChart(layerConfig);

    // Unregister from Swiper
    this.#unregisterFromSwiper(layerConfig);

    // Tell the layer sets about it
    [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach((layerSet) => {
      // Register or Unregister the layer
      layerSet.registerOrUnregisterLayer(layerConfig, 'remove');
    });
  }

  /**
   * Unregisters layer information from layer info store.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromOrderedLayerInfo(layerConfig: TypeLayerEntryConfig): void {
    // Remove from ordered layer info
    MapEventProcessor.removeOrderedLayerInfo(this.mapId, layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from TimeSlider.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromTimeSlider(layerConfig: TypeLayerEntryConfig): void {
    // Remove from the TimeSlider
    TimeSliderEventProcessor.removeTimeSliderLayer(this.mapId, layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from GeoChart.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromGeoChart(layerConfig: TypeLayerEntryConfig): void {
    // Remove from the GeoChart Charts
    GeochartEventProcessor.removeGeochartChart(this.mapId, layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from Swiper.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromSwiper(layerConfig: TypeLayerEntryConfig): void {
    // Remove it from the Swiper
    SwiperEventProcessor.removeLayerPath(this.mapId, layerConfig.layerPath);
  }

  /**
   * Checks if the layer results sets are all greater than or equal to the provided status
   */
  checkLayerStatus(
    status: TypeLayerStatus,
    layerEntriesToCheck: MapConfigLayerEntry[] | undefined,
    callbackNotGood?: (geoviewLayer: AbstractGeoViewLayer) => void
  ): [boolean, number] {
    // If no layer entries at all or there are layer entries and there are geoview layers to check
    let allGood = layerEntriesToCheck?.length === 0 || Object.keys(this.#geoviewLayers).length > 0;

    // For each registered layer entry
    Object.values(this.#geoviewLayers).forEach((geoviewLayer) => {
      const layerIsGood = geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo(status);
      if (!layerIsGood) {
        // Callback about it
        callbackNotGood?.(geoviewLayer);
        allGood = false;
      }
    });

    // Return if all good
    return [allGood, Object.keys(this.#geoviewLayers).length];
  }

  /**
   * Checks if the layer results sets are all ready using the resultSet from the FeatureInfoLayerSet
   */
  checkLayerResultSetsReady(callbackNotReady?: (layerEntryConfig: TypeLayerEntryConfig) => void): boolean {
    // For each registered layer entry
    let allGood = true;
    Object.entries(this.#layerEntryConfigs).forEach(([layerPath, registeredLayer]) => {
      // If not queryable, don't expect a result set
      if (!registeredLayer.source?.featureInfo?.queryable) return;

      const { resultSet } = this.featureInfoLayerSet;
      const layerResultSetReady = Object.keys(resultSet).includes(layerPath);
      if (!layerResultSetReady) {
        // Callback about it
        callbackNotReady?.(registeredLayer);
        allGood = false;
      }
    });

    // Return if all good
    return allGood;
  }

  /**
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers(): void {
    // For each Geoview layers
    Object.values(this.#geoviewLayers).forEach((layer: AbstractGeoViewLayer) => {
      // Remove it
      this.removeGeoviewLayer(layer.geoviewLayerId);
    });
  }

  /**
   * Removes a geoview layer from the map
   * @param {string} geoviewLayerId - The geoview layer id to remove
   */
  removeGeoviewLayer(geoviewLayerId: string): void {
    // Redirect (weird, but at the time of writing for this refactor - this was what it was doing)
    this.removeLayersUsingPath(geoviewLayerId);
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   * @param {string} partialLayerPath - The path of the layer to be removed
   */
  removeLayersUsingPath(partialLayerPath: string): void {
    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const partialLayerPathNodes = partialLayerPath.split('/');

    // initialize these two constant now because we will delete the information used to get their values.
    const indexToDelete = this.#layerEntryConfigs[partialLayerPath]
      ? this.#layerEntryConfigs[partialLayerPath].parentLayerConfig?.listOfLayerEntryConfig.findIndex(
          (layerConfig) => layerConfig === this.#layerEntryConfigs?.[partialLayerPath]
        )
      : undefined;
    const listOfLayerEntryConfigAffected = this.#layerEntryConfigs[partialLayerPath]?.parentLayerConfig?.listOfLayerEntryConfig;

    Object.keys(this.#layerEntryConfigs).forEach((completeLayerPath) => {
      const completeLayerPathNodes = completeLayerPath.split('/');
      const pathBeginningAreEqual = partialLayerPathNodes.reduce<boolean>((areEqual, partialLayerPathNode, nodeIndex) => {
        return areEqual && partialLayerPathNode === completeLayerPathNodes[nodeIndex];
      }, true);
      if (pathBeginningAreEqual && this.getLayerEntryConfig(completeLayerPath)) {
        this.unregisterLayer(this.getLayerEntryConfig(completeLayerPath)!);
        delete this.#layerEntryConfigs[completeLayerPath];
      }
    });
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    if (this.#geoviewLayers[partialLayerPath]) {
      this.#geoviewLayers[partialLayerPath].olRootLayer!.dispose();
      delete this.#geoviewLayers[partialLayerPath];
      const { mapFeaturesConfig } = this.mapViewer;
      if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
        mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
          (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== partialLayerPath
        );
    }

    // Log
    logger.logInfo(`Layer removed for ${partialLayerPath}`);
  }

  /**
   * Highlights layer or sublayer on map
   *
   * @param {string} layerPath - ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    const theLayerMain = this.getGeoviewLayerHybrid(layerPath);

    this.#highlightedLayer = { layerPath, originalOpacity: theLayerMain?.getOpacity(layerPath) };
    theLayerMain?.setOpacity(1, layerPath);

    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath] as TypeLayerEntryConfig)) {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
        if (
          !registeredLayerPath.startsWith(layerPath) &&
          !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = theLayer.getOpacity(registeredLayerPath);
          theLayer.setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        } else this.getOLLayer(registeredLayerPath)!.setZIndex(999);
      });
    } else {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (
          registeredLayerPath !== layerPath &&
          !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = theLayer.getOpacity(registeredLayerPath);
          theLayer.setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        }
      });
      this.getOLLayer(layerPath)!.setZIndex(999);
    }
  }

  /**
   * Removes layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    this.featureHighlight.removeBBoxHighlight();
    if (this.#highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.#highlightedLayer;
      if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath] as TypeLayerEntryConfig)) {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
          if (
            !registeredLayerPath.startsWith(layerPath) &&
            !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = theLayer.getOpacity(registeredLayerPath);
            theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else theLayer.setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      } else {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
          if (
            registeredLayerPath !== layerPath &&
            !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = theLayer.getOpacity(registeredLayerPath);
            theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else theLayer.setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      }
      MapEventProcessor.setLayerZIndices(this.mapId);
      this.#highlightedLayer.layerPath = undefined;
      this.#highlightedLayer.originalOpacity = undefined;
    }
  }

  /**
   * Gets the max extent of all layers on the map, or of a provided subset of layers.
   *
   * @param {string[]} layerIds - IDs of layer to get max extents from.
   * @returns {Extent} The overall extent.
   */
  getExtentOfMultipleLayers(layerIds: string[] = Object.keys(this.#layerEntryConfigs)): Extent {
    let bounds: Extent = [];

    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = Object.keys(this.#layerEntryConfigs).filter((layerPath) => layerPath.includes(layerId));

      // Get max extents from all selected layers.
      subLayerPaths.forEach((layerPath) => {
        const layerBounds = this.getGeoviewLayer(layerPath)?.calculateBounds(layerPath);
        // If bounds has not yet been defined, set to this layers bounds.
        if (!bounds.length && layerBounds) bounds = layerBounds;
        else if (layerBounds) bounds = getMinOrMaxExtents(bounds, layerBounds);
      });
    });

    return bounds;
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   */
  refreshLayers(): void {
    // For each geoview layer
    Object.entries(this.#geoviewLayers).forEach((mapLayerEntry) => {
      const refreshBaseLayerRec = (baseLayer: BaseLayer | undefined): void => {
        if (baseLayer) {
          const layerGroup: Array<BaseLayer> | Collection<BaseLayer> | undefined = baseLayer.get('layers');
          if (layerGroup) {
            layerGroup.forEach((baseLayerEntry) => {
              refreshBaseLayerRec(baseLayerEntry);
            });
          } else {
            const layerSource: Source = baseLayer.get('source');
            layerSource.refresh();
          }
        }
      };
      // TODO: Check - The index [1] seems wrong here. Should probably have a refresh function in AbstractGeoViewLayer being called here in this loop.
      refreshBaseLayerRec(mapLayerEntry[1].olRootLayer);
    });
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerAddedEvent} event - The event to emit
   * @private
   */
  #emitLayerAdded(event: LayerAddedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAddedHandlers, event);
  }

  /**
   * Registers a layer added event handler.
   * @param {LayerAddedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerAdded(callback: LayerAddedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerAddedHandlers, callback);
  }

  /**
   * Unregisters a layer added event handler.
   * @param {LayerAddedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAdded(callback: LayerAddedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAddedHandlers, callback);
  }

  static createGVLayer(
    olLayer: BaseLayer,
    mapId: string,
    geoviewLayer: AbstractGeoViewLayer,
    config: ConfigBaseClass
  ): AbstractGVLayer | undefined {
    // If new mode
    let metadata;
    let timeDimension;
    if (NEW_MODE) {
      // Get the metadata and the time dimension information as processed
      metadata = geoviewLayer.getLayerMetadata(config.layerPath);
      timeDimension = geoviewLayer.getTemporalDimension(config.layerPath);

      // HACK: INJECT CONFIGURATION STUFF PRETENDNG THEY WERE PROCESSED
      // GV Keep this code commented in the source base for now
      // if (config.layerPath === 'esriFeatureLYR5/0') {
      //   metadata = LayerMockup.configTop100Metadata();
      // } else if (config.layerPath === 'nonmetalmines/5') {
      //   metadata = LayerMockup.configNonMetalMetadata();
      // } else if (config.layerPath === 'airborne_radioactivity/1') {
      //   metadata = LayerMockup.configAirborneMetadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/polygons.json') {
      //   metadata = LayerMockup.configPolygonsMetadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/lines.json') {
      //   metadata = LayerMockup.configLinesMetadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/icon_points.json') {
      //   metadata = LayerMockup.configIconPointsMetadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points.json') {
      //   metadata = LayerMockup.configPointsMetadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_1.json') {
      //   metadata = LayerMockup.configPoints1Metadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_2.json') {
      //   metadata = LayerMockup.configPoints2Metadata();
      // } else if (config.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_3.json') {
      //   metadata = LayerMockup.configPoints3Metadata();
      // } else if (config.layerPath === 'historical-flood/0') {
      //   metadata = LayerMockup.configHistoricalFloodMetadata();
      //   timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
      // } else if (config.layerPath === 'uniqueValueId/1') {
      //   metadata = LayerMockup.configCESIMetadata();
      //   // timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
      // } else if (config.layerPath === 'esriFeatureLYR1/0') {
      //   metadata = LayerMockup.configTemporalTestBedMetadata();
      //   // timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
      // } else if (config.layerPath === 'wmsLYR1-spatiotemporel/RADAR_1KM_RSNO') {
      //   metadata = LayerMockup.configRadarMetadata();
      //   timeDimension = LayerMockup.configRadarTemporalDimension();
      // } else if (config.layerPath === 'MSI/msi-94-or-more') {
      //   metadata = LayerMockup.configMSIMetadata();
      //   timeDimension = LayerMockup.configMSITemporalDimension();
      // }

      // If any metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-param-reassign
      if (metadata && config instanceof AbstractBaseLayerEntryConfig) config.setMetadata(metadata);
    }

    // Create the right GV Layer based on the OLLayer
    let gvLayer;
    if (olLayer instanceof VectorImageLayer) {
      // Depending on the config type
      if (config instanceof EsriFeatureLayerEntryConfig) gvLayer = new GVEsriFeature(mapId, olLayer, config);
      else if (config instanceof GeoJSONLayerEntryConfig) gvLayer = new GVGeoJSON(mapId, olLayer, config);
      else if (config instanceof OgcFeatureLayerEntryConfig) gvLayer = new GVOGCFeature(mapId, olLayer, config);
    } else if (olLayer instanceof ImageLayer) {
      if (config instanceof EsriDynamicLayerEntryConfig) gvLayer = new GVEsriDynamic(mapId, olLayer, config);
      if (config instanceof OgcWmsLayerEntryConfig) gvLayer = new GVWMS(mapId, olLayer, config);
    }

    // If created
    if (gvLayer) {
      // If any time dimension to inject
      if (timeDimension) gvLayer.setTemporalDimension(timeDimension);
      return gvLayer;
    }

    // Couldn't create it
    logger.logError(`Unsupported GVLayer for ${config.layerPath}`);
    return undefined;
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerAddedDelegate = EventDelegateBase<LayerApi, LayerAddedEvent>;

/**
 * Define an event for the delegate
 */
export type LayerAddedEvent = {
  // The added layer
  layer: AbstractGeoViewLayer;
};
