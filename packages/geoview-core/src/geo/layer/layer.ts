import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/utils/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { Config } from '@/core/utils/config/config';
import { generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer, GeoViewLayerRegistrationEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeListOfGeoviewLayerConfig,
  TypeListOfLocalizedLanguages,
  layerEntryIsGroupLayer,
  mapConfigLayerEntryIsGeoCore,
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

import { HoverFeatureInfoLayerSet } from '@/geo/utils/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/utils/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { LayerSet } from '@/geo/utils/layer-set';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { api } from '@/app';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';

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
  registeredLayers: TypeRegisteredLayers = {};

  // variable used to store all added geoview layers
  geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // used to access geometry API to create and manage geometries
  geometry: GeometryApi;

  // order to load layers
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** used to reference the map viewer */
  mapViewer: MapViewer;

  get mapId(): string {
    return this.mapViewer.mapId;
  }

  /** used to keep a reference of highlighted layer */
  private highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
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

  /**
   * Generate an array of layer info for the orderedLayerList.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The config to get the info from.
   * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
   */
  generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig): TypeOrderedLayerInfo[] {
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
    const promisesOfGeoCoreGeoviewLayers: Promise<TypeListOfGeoviewLayerConfig>[] = [];
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

    // Wait for all GeoCore to process
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
        .map((promise) => promise as PromiseFulfilledResult<TypeListOfGeoviewLayerConfig>)
        .forEach((promise) => {
          // For each layer
          promise.value.forEach((geocoreGVLayer) => {
            // Generate array of layer order information
            const layerInfos = this.generateArrayOfLayerOrderInfo(geocoreGVLayer);
            orderedLayerInfos.push(...layerInfos);

            // Add it
            this.addGeoviewLayer(geocoreGVLayer);
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
   * Returns the GeoView instance associated to the layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  geoviewLayer(layerPath: string): AbstractGeoViewLayer {
    // The first element of the layerPath is the geoviewLayerId
    return this.geoviewLayers[layerPath.split('/')[0]];
  }

  /**
   * Verifies if a layer is registered. Returns true if registered.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to test.
   * @returns {boolean} Returns true if the layer configuration is registered.
   */
  isRegistered(layerConfig: TypeLayerEntryConfig): boolean {
    const { layerPath } = layerConfig;
    return this.registeredLayers[layerPath] !== undefined;
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
   * @param {TypeListOfLocalizedLanguages} optionalSuportedLanguages - An optional list of supported language
   * @returns {GeoViewLayerAddedResult | undefined} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  addGeoviewLayer(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    optionalSuportedLanguages?: TypeListOfLocalizedLanguages
  ): GeoViewLayerAddedResult | undefined {
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId = generateId(geoviewLayerConfig.geoviewLayerId);
    // TODO: Refactor - We should not create a new config here.
    // TO.DOCONT: The layer class should receive an instance of configuration in is constructor.
    // TO.DOCONT: Here the function sends the config to this class to get the structure to use to generate layers.
    // TO.DOCONT: We should not have link to config anymore...
    // create a new config object for this map element
    const config = new Config(this.mapViewer.map.getTargetElement());

    const suportedLanguages = optionalSuportedLanguages || config.configValidation.defaultMapFeaturesConfig.suportedLanguages;

    // TODO: Refactor - This should be deal with the config classes and this class pushes the structure ready for consumption by layer orchestrator
    config.configValidation.validateListOfGeoviewLayerConfig(suportedLanguages, [geoviewLayerConfig]);

    if (geoviewLayerConfig.geoviewLayerId in this.geoviewLayers) this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfig);
    else {
      // Adds the configuration to the list in map
      // TODO: Refactor - Figure out why doing this - and then not do this
      // TO.DOCONT: 2024-03-20 as part of the layers refactoring, this has been commented out, leave it commented for a bit
      // TO.DOCONT: until things are confirmed to be still working
      // this.mapViewer.mapFeaturesConfig.map.listOfGeoviewLayerConfig!.push(geoviewLayerConfig);

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
      layerBeingAdded.onGeoViewLayerRegistration((geoviewLayer: AbstractGeoViewLayer, registrationEvent: GeoViewLayerRegistrationEvent) => {
        this.#handleLayerRegistration(geoviewLayer, registrationEvent);
      });

      // Prepare mandatory registrations
      // TODO: Refactor - this shouldn't have to be mandatory! And not a function of the layer.
      layerBeingAdded.initRegisteredLayers(this);

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
            // Reject
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
      this.mapViewer.map.addLayer(geoviewLayer.olLayers!);
    }

    // Log
    logger.logInfo(`GeoView Layer ${geoviewLayer.geoviewLayerId} added to map ${this.mapId}`, geoviewLayer);

    // Set the layer z indices
    MapEventProcessor.setLayerZIndices(this.mapId);
  }

  /**
   * Handles the registration of a geoview layer as part of its addition on the map.
   * This handle is called when the geoview layer is ready to be registered in the layer set.
   * @param {AbstractGeoViewLayer} geoviewLayer - The Geoview layer to register
   * @param {GeoViewLayerRegistrationEvent} registrationEvent - The registration event
   * @private
   */
  #handleLayerRegistration(geoviewLayer: AbstractGeoViewLayer, registrationEvent: GeoViewLayerRegistrationEvent): void {
    try {
      // The layer is ready to be registered, take care of it

      // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
      // logger.logDebug('REGISTERING LAYER', registrationEvent.action, registrationEvent.layerPath, registrationEvent.layerConfig);

      // Register a handler on the layer config to track the status changed
      registrationEvent.layerConfig.onLayerStatusChanged((config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => {
        this.#handleLayerStatusChanged(config, layerStatusEvent);
      });

      // If registering
      if (registrationEvent.action === 'add') {
        // Register for ordered layer information
        this.#registerForLayerInfo(registrationEvent.layerConfig);

        // Register for TimeSlider
        this.#registerForTimeSlider(registrationEvent.layerConfig).catch((error) => {
          // Log
          logger.logPromiseFailed('in registration of layer for the time slider', error);
        });
      } else {
        // Unregister from ordered layer info
        this.#unregisterFromOrderedLayerInfo(registrationEvent.layerConfig);

        // Unregister from TimeSlider
        this.#unregisterFromTimeSlider(registrationEvent.layerConfig);

        // Unregister from GeoChart
        this.#unregisterFromGeoChart(registrationEvent.layerConfig);

        // Unregister from Swiper
        this.#unregisterFromSwiper(registrationEvent.layerConfig);
      }

      // Tell the layer sets about it
      [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach(
        (layerSet: LayerSet) => {
          // Register or Unregister the layer
          layerSet.registerOrUnregisterLayer(geoviewLayer, registrationEvent.layerPath, registrationEvent.action);
        }
      );
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Registers layer information for the ordered layer info in the store.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be reordered.
   * @private
   */
  #registerForLayerInfo(layerConfig: TypeLayerEntryConfig): void {
    // Update the ordered layer info
    if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerConfig.layerPath) === -1) {
      if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerConfig.layerPath.split('.')[1]) !== -1) {
        MapEventProcessor.replaceOrderedLayerInfo(this.mapId, layerConfig, layerConfig.layerPath.split('.')[1]);
      } else if (layerConfig.parentLayerConfig) {
        const parentLayerPathArray = layerConfig.layerPath.split('/');
        parentLayerPathArray.pop();
        const parentLayerPath = parentLayerPathArray.join('/');
        const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, parentLayerPath);
        const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.mapId).filter((layerInfo) =>
          layerInfo.layerPath.startsWith(parentLayerPath)
        ).length;
        if (parentLayerIndex !== -1) MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig, parentLayerIndex + numberOfLayers);
        else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig.parentLayerConfig!);
      } else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig);
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
    // Wait until the layer is loaded (or processed?)
    await whenThisThen(() => layerConfig.IsGreaterThanOrEqualTo('loaded'), LayerApi.#MAX_WAIT_TIME_SLIDER_REGISTRATION);

    // Check and add time slider layer when needed
    TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.mapId, layerConfig);
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
      [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.allFeatureInfoLayerSet, this.featureInfoLayerSet].forEach(
        (layerSet: LayerSet) => {
          // Process the layer status change
          layerSet.processLayerStatusChanged(config, layerStatusEvent.layerPath, layerStatusEvent.layerStatus);
        }
      );
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
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers(): void {
    // For each Geoview layers
    Object.values(this.geoviewLayers).forEach((layer: AbstractGeoViewLayer) => {
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
      if (pathBeginningAreEqual) this.geoviewLayer(completeLayerPath).removeConfig(completeLayerPath);
    });
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    if (this.geoviewLayers[partialLayerPath]) {
      this.geoviewLayers[partialLayerPath].olLayers!.dispose();
      delete this.geoviewLayers[partialLayerPath];
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
   * Asynchronously gets a layer using its id and return the layer data.
   * If the layer we're searching for has to be processed, set mustBeProcessed to true when awaiting on this method.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'geoviewLayer()'.
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
    const layer = this.geoviewLayer(geoviewLayerId);

    // If layer was found
    if (layer) {
      // Check if not waiting and returning immediately
      if (!mustBeProcessed) return Promise.resolve(layer);

      try {
        // Waiting for the processed phase, possibly throwing exception if that's not happening
        await this.waitForAllLayerStatusAreGreaterThanOrEqualTo(layer, timeout, checkFrequency);
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
   * Returns the OpenLayer layer associated to a specific layer path.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {BaseLayer | LayerGroup} Returns the OpenLayer layer associated to the layer path.
   */
  getOLLayerByLayerPath(layerPath: string): BaseLayer | LayerGroup {
    // Return the olLayer object from the registered layers
    const olLayer = this.registeredLayers[layerPath]?.olLayer;
    if (olLayer) return olLayer;
    throw new Error(`Layer at path ${layerPath} not found.`);
  }

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayerByLayerPath'.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns {Promise<BaseLayer | LayerGroup>} Returns the OpenLayer layer associated to the layer path.
   */
  async getOLLayerByLayerPathAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer | LayerGroup> {
    // Make sure the open layer has been created, sometimes it can still be in the process of being created
    const promisedLayer = await whenThisThen(
      () => {
        return this.registeredLayers[layerPath]?.olLayer;
      },
      timeout,
      checkFrequency
    );
    // Here, the layer resolved
    return promisedLayer!;
  }

  /**
   * Returns a Promise that will be resolved once the given layer is in a processed phase.
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * @param {AbstractGeoViewLayer} geoviewLayerConfig - The layer object
   * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns {Promise<void>} A promise when done waiting
   * @throws An exception when the layer failed to become in processed phase before the timeout expired
   */
  async waitForAllLayerStatusAreGreaterThanOrEqualTo(
    geoviewLayerConfig: AbstractGeoViewLayer,
    timeout?: number,
    checkFrequency?: number
  ): Promise<void> {
    // Wait for the processed phase
    await whenThisThen(
      () => {
        return geoviewLayerConfig.allLayerStatusAreGreaterThanOrEqualTo('processed');
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  }

  /**
   * Highlights layer or sublayer on map
   *
   * @param {string} layerPath - ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    this.highlightedLayer = { layerPath, originalOpacity: this.geoviewLayer(layerPath).getOpacity(layerPath) };
    this.geoviewLayer(layerPath).setOpacity(1, layerPath);
    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        if (
          !registeredLayerPath.startsWith(layerPath) &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity(registeredLayerPath);
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        } else this.registeredLayers[registeredLayerPath].olLayer!.setZIndex(999);
      });
    } else {
      Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (
          registeredLayerPath !== layerPath &&
          !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
        ) {
          const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity(registeredLayerPath);
          this.geoviewLayer(registeredLayerPath).setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
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
    if (this.highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.highlightedLayer;
      if (layerEntryIsGroupLayer(this.registeredLayers[layerPath] as TypeLayerEntryConfig)) {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          if (
            !registeredLayerPath.startsWith(layerPath) &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity(registeredLayerPath);
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      } else {
        Object.keys(this.registeredLayers).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          if (
            registeredLayerPath !== layerPath &&
            !layerEntryIsGroupLayer(this.registeredLayers[registeredLayerPath] as TypeLayerEntryConfig)
          ) {
            const otherOpacity = this.geoviewLayer(registeredLayerPath).getOpacity(registeredLayerPath);
            this.geoviewLayer(registeredLayerPath).setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else this.geoviewLayer(registeredLayerPath).setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      }
      MapEventProcessor.setLayerZIndices(this.mapId);
      this.highlightedLayer.layerPath = undefined;
      this.highlightedLayer.originalOpacity = undefined;
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
