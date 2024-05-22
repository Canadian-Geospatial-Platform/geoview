import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Extent } from 'ol/extent';

import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { createLocalizedString, generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer, LayerRegistrationEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
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
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';

export type TypeRegisteredLayers = { [layerPath: string]: TypeLayerEntryConfig };

export type GeoViewLayerAddedResult = {
  layer: AbstractGeoViewLayer;
  promiseLayer: Promise<void>;
};

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class LayerApi
 */
export class LayerApi {
  /** Layers with valid configuration for this map. */
  // TODO: Refactor - Turn this #private if we don't want developers to be able to push (or delete) in this array in an
  // TO.DOCONT: attempt to register layers without going through the proper process. Any other modifiers aren't enough, due to calls from pure JS.
  registeredLayers: TypeRegisteredLayers = {};

  // variable used to store all added geoview layers
  // TODO: Refactor - Turn this #private if we don't want developers to be able to push (or delete) in this array in an
  // TO.DOCONT: attempt to register layers without going through the proper process. Any other modifiers aren't enough, due to calls from pure JS.
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access geometry API to create and manage geometries
  geometry: GeometryApi;

  // order to load layers
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** used to reference the map viewer */
  mapViewer: MapViewer;

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

  #onLayerRemovedHandlers: LayerRemovedDelegate[] = [];

  #onLayerVisibilityToggledHandlers: LayerVisibilityToggledDelegate[] = [];

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
    return this.mapViewer.mapId;
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
                    // TODO: Use a generic error message
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
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);

    // TODO: Refactor - This should be deal with the config classes and this class pushes the structure ready for consumption by layer orchestrator
    ConfigValidation.validateListOfGeoviewLayerConfig([geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in this.geoviewLayers) this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
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
      this.geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

      // Register a handle when the layer wants to register
      layerBeingAdded.onGeoViewLayerRegistration((geoviewLayer: AbstractGeoViewLayer, registrationEvent: LayerRegistrationEvent) => {
        this.#handleLayerRegistration(registrationEvent);
      });

      // Prepare mandatory registrations
      // TODO: Refactor - Review this function call in the refactoring rethinking
      this.initRegisteredLayers(layerBeingAdded, layerBeingAdded.listOfLayerEntryConfig);

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

  /** ***************************************************************************************************************************
   * Process recursively the list of layer entries to initialize the registeredLayers object.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries to process.
   */
  initRegisteredLayers(geoviewLayer: AbstractGeoViewLayer, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig, i) => {
      if (this.isLayerEntryConfigRegistered(layerConfig.layerPath)) {
        geoviewLayer.layerLoadError.push({
          layer: layerConfig.layerPath,
          loggerMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`,
        });
        // Duplicate layer can't be kept because it has the same layer path than the first encontered layer.
        // eslint-disable-next-line no-param-reassign
        delete listOfLayerEntryConfig[i];
      } else {
        // TODO: Check - If we're doing the assignation here, is it still necessary to do it in setLayerAndLoadEndListeners!?
        // eslint-disable-next-line no-param-reassign
        layerConfig.geoviewLayerInstance = geoviewLayer;
        layerConfig.registerLayerConfig();
      }
      if (layerEntryIsGroupLayer(layerConfig)) this.initRegisteredLayers(geoviewLayer, layerConfig.listOfLayerEntryConfig);
    });
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
   * Checks if the layer results sets are all ready using the resultSet from the FeatureInfoLayerSet
   */
  checkLayerResultSetsReady(callbackNotReady?: (geoviewLayer: TypeLayerEntryConfig) => void): boolean {
    // For each registered layer entry
    let allGood = true;
    Object.entries(this.registeredLayers).forEach(([layerPath, registeredLayer]) => {
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
   * Handles the registration of a geoview layer as part of its addition on the map.
   * This handle is called when the geoview layer is ready to be registered in the layer set.
   * @param {AbstractGeoViewLayer} geoviewLayer - The Geoview layer to register
   * @param {GeoViewLayerRegistrationEvent} registrationEvent - The registration event
   * @private
   */
  #handleLayerRegistration(registrationEvent: LayerRegistrationEvent): void {
    try {
      // The layer is ready to be registered, take care of it

      // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
      // logger.logDebug('REGISTERING LAYER', registrationEvent.action, registrationEvent.layerPath, registrationEvent.layerConfig);

      // If registering
      if (registrationEvent.action === 'add') {
        // Register
        this.registerLayer(registrationEvent.layerConfig);
      } else {
        // Unregister
        this.unregisterLayer(registrationEvent.layerConfig);
      }
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Registers the layer in the LayerApi to start managing it.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer associated with the layer entry config
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config to register
   */
  registerLayer(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Register a handler on the layer config to track the status changed
    layerConfig.onLayerStatusChanged((config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => {
      this.#handleLayerStatusChanged(config, layerStatusEvent);
    });

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
  }

  /**
   * Unregisters the layer in the LayerApi to stop managing it.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer associated with the layer entry config
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to unregister
   */
  unregisterLayer(layerConfig: TypeLayerEntryConfig): void {
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
   * Unregisters layer information from layer info store.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromOrderedLayerInfo(layerConfig: TypeLayerEntryConfig): void {
    // Remove from ordered layer info
    MapEventProcessor.removeOrderedLayerInfo(this.mapId, layerConfig.layerPath);
  }

  /**
   * Registers layer information for TimeSlider.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  async #registerForTimeSlider(layerConfig: TypeLayerEntryConfig): Promise<void> {
    let geoviewLayer;
    try {
      // Wait until the layer is loaded (or processed?)
      await whenThisThen(() => layerConfig.isGreaterThanOrEqualTo('loaded'), LayerApi.#MAX_WAIT_TIME_SLIDER_REGISTRATION);
      geoviewLayer = this.getGeoviewLayer(layerConfig.layerPath);
    } catch (error) {
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // The error itself, regarding the loaded failure, is already being taken care of elsewhere.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }

    // If the layer is loaded, continue
    if (geoviewLayer) {
      // Check and add time slider layer when needed
      TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.mapId, layerConfig);
    }
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
   * Handles when the layer status changes on a given layer/configuration as part of its addition on the map.
   * This handle is called when the geoview layer is being added.
   * @param {ConfigBaseClass} config - The Configuration class
   * @param {LayerStatusChangedEvent} layerStatusEvent - The layer status changed event
   * @private
   */
  #handleLayerStatusChanged(config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent): void {
    try {
      // The layer status has changed for the given config/layer, take care of it

      // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
      // logger.logDebug('LAYER STATUS CHANGED', layerStatusEvent.layerPath, layerStatusEvent.layerStatus, config);

      // Tell the layer sets about it
      [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach((layerSet) => {
        // Process the layer status change
        layerSet.processLayerStatusChanged(config, layerStatusEvent.layerPath, layerStatusEvent.layerStatus);
      });
    } catch (error) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', config.layerPath, error);
    }
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

  /**
   * Emits an event to all handlers.
   * @param {LayerRemovedEvent} event - The event to emit
   * @private
   */
  emitLayerRemoved(event: LayerRemovedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   * @param {LayerRemovedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerRemoved(callback: LayerRemovedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   * @param {LayerRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerRemoved(callback: LayerRemovedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRemovedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerAddedEvent} event - The event to emit
   * @private
   */
  emitLayerVisibilityToggled(event: LayerVisibilityToggledEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer added event handler.
   * @param {LayerAddedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer added event handler.
   * @param {LayerAddedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers(): void {
    // For each Geoview layers
    Object.keys(this.registeredLayers).forEach((layerPath) => {
      // Remove it
      this.removeGeoviewLayer(layerPath);
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
    // Redirect to legend event processor
    LegendEventProcessor.deleteLayer(this.mapId, partialLayerPath);
  }

  /**
   * Returns the GeoView instance associated to the layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractGeoViewLayer | undefined {
    // The first element of the layerPath is the geoviewLayerId
    return this.geoviewLayers[layerPath.split('/')[0]];
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
   * Verifies if a layer is registered. Returns true if registered.
   * @param {string} layerPath - The layer path to check.
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isLayerEntryConfigRegistered(layerPath: string): boolean {
    return !!this.registeredLayers[layerPath];
  }

  /** ***************************************************************************************************************************
   * Get the layer configuration of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {TypeLayerEntryConfig | undefined} The layer configuration or undefined if not found.
   */
  getLayerEntryConfig(layerPath: string): TypeLayerEntryConfig | undefined {
    return this.registeredLayers?.[layerPath];
  }

  /**
   * Returns the OpenLayer instance associated with the layer path.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  getOLLayer(layerPath: string): BaseLayer | LayerGroup | undefined {
    return this.getLayerEntryConfig(layerPath)?.olLayer;
  }

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns {Promise<BaseLayer | LayerGroup>} Returns the OpenLayer layer associated to the layer path.
   */
  getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer | LayerGroup> {
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
   * Highlights layer or sublayer on map
   *
   * @param {string} layerPath - ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    this.#highlightedLayer = { layerPath, originalOpacity: this.getGeoviewLayer(layerPath)?.getOpacity(layerPath) };
    this.getGeoviewLayer(layerPath)?.setOpacity(1, layerPath);
    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayer(registeredLayerPath)!;
        if (
          !registeredLayerPath.startsWith(layerPath) &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = theLayer.getOpacity(registeredLayerPath);
          theLayer.setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        } else this.registeredLayers[registeredLayerPath].olLayer!.setZIndex(999);
      });
    } else {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayer(registeredLayerPath)!;
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (
          registeredLayerPath !== layerPath &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = theLayer.getOpacity(registeredLayerPath);
          theLayer.setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        }
      });
      this.registeredLayers[layerPath].olLayer!.setZIndex(999);
    }
  }

  /**
   * Removes layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    this.featureHighlight.removeBBoxHighlight();
    if (this.#highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.#highlightedLayer;
      if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          const theLayer = this.getGeoviewLayer(registeredLayerPath)!;
          if (
            !registeredLayerPath.startsWith(layerPath) &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = theLayer.getOpacity(registeredLayerPath);
            theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else theLayer.setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      } else {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          const theLayer = this.getGeoviewLayer(registeredLayerPath)!;
          if (
            registeredLayerPath !== layerPath &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
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
  getExtentOfMultipleLayers(layerIds: string[] = Object.keys(this.registeredLayers)): Extent {
    let bounds: Extent = [];

    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = Object.keys(this.registeredLayers).filter((layerPath) => layerPath.includes(layerId));

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
   * Set visibility of all geoview layers on the map
   *
   * @param {boolean} newValue - The new visibility.
   */
  setAllLayersVisibility(newValue: boolean): void {
    Object.keys(this.registeredLayers).forEach((layerPath) => {
      this.setOrToggleLayerVisibility(layerPath, newValue);
    });
  }

  /**
   * Sets or toggles the visibility of a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {boolean} newValue - The new value of visibility.
   */
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): void {
    // Redirect to processor
    MapEventProcessor.setOrToggleMapLayerVisibility(this.mapId, layerPath, newValue);
  }

  /**
   * Renames a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {string} name - The new name to use.
   */
  setLayerName(layerPath: string, name: string): void {
    const layerConfig = this.registeredLayers[layerPath];
    if (layerConfig) {
      layerConfig.layerName = createLocalizedString(name);
      [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach((layerSet) => {
        // Process the layer status change
        layerSet.processNameChanged(layerPath, name);
      });
      TimeSliderEventProcessor.setLayerName(this.mapId, layerPath, name);
    } else {
      logger.logError(`Unable to find layer ${layerPath}`);
    }
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

/**
 * Define a delegate for the event handler function signature
 */
type LayerRemovedDelegate = EventDelegateBase<LayerApi, LayerRemovedEvent>;

/**
 * Define an event for the delegate
 */
export type LayerRemovedEvent = {
  // The added layer
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerVisibilityToggledEvent>;

/**
 * Define an event for the delegate
 */
export type LayerVisibilityToggledEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // The new visibility
  visibility: boolean;
};
