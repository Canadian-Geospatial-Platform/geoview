import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { GeoJSONObject } from 'ol/format/GeoJSON';

import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { generateId, isValidUUID, whenThisThen } from '@/core/utils/utilities';
import {
  ConfigBaseClass,
  LayerStatusChangedDelegate as ConfigLayerStatusChangedDelegate,
  LayerStatusChangedEvent as ConfigLayerStatusChangedEvent,
} from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';

import {
  AbstractGeoViewLayer,
  LayerEntryProcessedEvent,
  LayerGroupCreatedEvent,
  LayerEntryRegisterInitEvent,
  LayerGVCreatedEvent,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeDisplayLanguage, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  TypeLayerStatus,
  GeoCoreLayerConfig,
  layerConfigIsEsriDynamicFromType,
  layerConfigIsEsriImageFromType,
  layerConfigIsImageStaticFromType,
  layerConfigIsVectorTilesFromType,
  layerConfigIsOgcWmsFromType,
  layerConfigIsXYZTilesFromType,
  layerConfigIsCSVFromType,
  layerConfigIsEsriFeatureFromType,
  layerConfigIsGeoJSONFromType,
  layerConfigIsOgcFeatureFromType,
  layerConfigIsWFSFromType,
  layerConfigIsWKBFromType,
  GeoPackageLayerConfig,
} from '@/api/config/types/layer-schema-types';

import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';
import { WKB } from '@/geo/layer/geoview-layers/vector/wkb';

import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import {
  LayerCreatedTwiceError,
  LayerDifferingFieldLengths,
  LayerNotFoundError,
  LayerNotGeoJsonError,
  LayerNotQueryableError,
  LayerWrongTypeError,
} from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigError } from '@/core/exceptions/layer-entry-config-exceptions';
import {
  AbstractBaseLayer,
  LayerOpacityChangedEvent,
  LayerOpacityChangedDelegate,
  VisibleChangedEvent,
  VisibleChangedDelegate,
} from '@/geo/layer/gv-layers/abstract-base-layer';
import {
  AbstractGVLayer,
  LayerDelegate as GVLayerDelegate,
  LayerErrorEvent as GVLayerErrorEvent,
  LayerErrorDelegate as GVLayerErrorDelegate,
  LayerMessageDelegate,
  LayerMessageEvent,
} from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { getExtentUnion, getZoomFromScale } from '@/geo/utils/utilities';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { TypeLegendItem } from '@/core/components/layers/types';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { LayerGeoCoreError } from '@/core/exceptions/geocore-exceptions';
import { ShapefileReader } from '@/core/utils/config/reader/shapefile-reader';
import { GeoPackageReader } from '@/core/utils/config/reader/geopackage-reader';

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 * @exports
 * @class LayerApi
 */
export class LayerApi {
  /** Maximum time duration to wait when registering a layer for the time slider */
  static readonly #MAX_WAIT_TIME_SLIDER_REGISTRATION = 20000;

  /** Temporary debugging flag indicating if we want the WMS group layers to have their sub layers fully blown up */
  static readonly DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS = false;

  /** Reference on the map viewer */
  mapViewer: MapViewer;

  /** Used to access geometry API to create and manage geometries */
  geometry: GeometryApi;

  /** Order to load layers */
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** Used to access feature and bounding box highlighting */
  featureHighlight: FeatureHighlight;

  /** Legends layer set associated to the map */
  legendsLayerSet: LegendsLayerSet;

  /** Hover feature info layer set associated to the map */
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  /** All feature info layer set associated to the map */
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  /** Feature info layer set associated to the map */
  featureInfoLayerSet: FeatureInfoLayerSet;

  /** All the layer sets */
  #allLayerSets: AbstractLayerSet[];

  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: { [layerPath: string]: ConfigBaseClass } = {};

  /** Dictionary holding all the old geoview layers */
  #geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  /** Dictionary holding all the OpenLayers layers */
  #olLayers: { [layerPath: string]: BaseLayer } = {};

  /** Dictionary holding all the new GVLayers */
  #gvLayers: { [layerPath: string]: AbstractBaseLayer } = {};

  /** Used to keep a reference of highlighted layer */
  #highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
    layerPath: undefined,
    originalOpacity: undefined,
  };

  /** Keep all callback delegates references */
  #onLayerConfigAddedHandlers: LayerBuilderDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerConfigErrorHandlers: LayerConfigErrorDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerConfigRemovedHandlers: LayerPathDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerCreatedHandlers: LayerDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerLoadedFirstHandlers: LayerDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerLoadingHandlers: LayerDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerLoadedHandlers: LayerDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerErrorHandlers: LayerErrorDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerAllLoadedHandlers: LayerConfigDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerStatusChangedHandlers: LayerStatusChangedDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerVisibilityToggledHandlers: LayerVisibilityToggledDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerItemVisibilityToggledHandlers: LayerItemVisibilityToggledDelegate[] = [];

  /** Keep a bounded reference to the handle layer status changed */
  #boundedHandleLayerStatusChanged: ConfigLayerStatusChangedDelegate;

  /** Keep a bounded reference to the handle layer message */
  #boundedHandleLayerMessage: LayerMessageDelegate;

  /** Keep a bounded reference to the handle layer first load */
  #boundedHandleLayerFirstLoaded: GVLayerDelegate;

  /** Keep a bounded reference to the handle layer loading */
  #boundedHandleLayerLoading: GVLayerDelegate;

  /** Keep a bounded reference to the handle layer loaded */
  #boundedHandleLayerLoaded: GVLayerDelegate;

  /** Keep a bounded reference to the handle layer error */
  #boundedHandleLayerError: GVLayerErrorDelegate;

  /** Keep a bounded reference to the handle layer loaded */
  #boundedHandleLayerOpacityChanged: LayerOpacityChangedDelegate;

  /** Keep a bounded reference to the handle layer error */
  #boundedHandleLayerVisibleChanged: VisibleChangedDelegate;

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
    this.#allLayerSets = [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.featureInfoLayerSet, this.allFeatureInfoLayerSet];

    this.geometry = new GeometryApi(this.mapViewer);
    this.featureHighlight = new FeatureHighlight(this.mapViewer);

    // Keep bounded references to the handles
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerMessage = this.#handleLayerMessage.bind(this);
    this.#boundedHandleLayerFirstLoaded = this.#handleLayerFirstLoaded.bind(this);
    this.#boundedHandleLayerLoading = this.#handleLayerLoading.bind(this);
    this.#boundedHandleLayerLoaded = this.#handleLayerLoaded.bind(this);
    this.#boundedHandleLayerError = this.#handleLayerError.bind(this);
    this.#boundedHandleLayerOpacityChanged = this.#handleLayerOpacityChanged.bind(this);
    this.#boundedHandleLayerVisibleChanged = this.#handleLayerVisibleChanged.bind(this);
  }

  /**
   * Gets the Map Id.
   * @returns {string} The map id
   */
  getMapId(): string {
    return this.mapViewer.mapId;
  }

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    const uniqueIds = new Set<string>();
    for (const layerPath of this.getLayerEntryConfigIds()) {
      uniqueIds.add(layerPath.split('/')[0]);
    }
    return Array.from(uniqueIds);
  }

  /**
   * Gets the GeoView Layer Paths.
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    return Object.keys(this.#gvLayers);
  }

  /**
   * Gets all GeoView Layers
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseLayer[] {
    return Object.values(this.#gvLayers);
  }

  /**
   * Returns the GeoView instance associated to the layer path.
   * The first element of the layerPath is the geoviewLayerId and this function will
   * work with either the geoViewLayerId or the layerPath.
   * @param {string} layerPath - The layer path
   * @returns The new Geoview Layer
   */
  getGeoviewLayer(layerPath: string): AbstractBaseLayer | undefined {
    return this.#gvLayers[layerPath];
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

  /**
   * Gets the Layer Entry Configs
   * @returns {string[]} The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    return Object.values(this.#layerEntryConfigs);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   * @param {string} layerPath The layer path.
   * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass | undefined {
    return this.#layerEntryConfigs?.[layerPath];
  }

  /**
   * Returns the OpenLayer instance associated with the layer path.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {BaseLayer} Returns the geoview instance associated to the layer path.
   */
  getOLLayer(layerPath: string): BaseLayer | undefined {
    // Get the OpenLayer layer as part of the new GVLayer design
    return this.getGeoviewLayer(layerPath)?.getOLLayer();
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
   * Load layers that was passed in with the map config
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - An optional array containing layers passed within the map config
   * @returns {Promise<void>}
   */
  async loadListOfGeoviewLayer(mapConfigLayerEntries: MapConfigLayerEntry[]): Promise<void> {
    const validGeoviewLayerConfigs = this.#deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // Make sure to convert all map config layer entry into a GeoviewLayerConfig
    const promisesOfGeoviewLayers = LayerApi.convertMapConfigsToGeoviewLayerConfig(
      this.getMapId(),
      this.mapViewer.getDisplayLanguage(),
      mapConfigLayerEntries,
      (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => {
        // Show the error(s)
        this.showLayerError(error, mapConfigLayerEntry.geoviewLayerId);
      }
    );

    // Wait for all promises (GeoCore ones) to process
    // The reason for the Promise.allSettled is because of synch issues with the 'setMapOrderedLayerInfo' which happens below and the
    // other setMapOrderedLayerInfos that happen in parallel via the ADD_LAYER events ping/pong'ing, making the setMapOrdered below fail
    // if we don't stage the promises. If we don't stage the promises, sometimes I have 4 layers loaded in 'Details' and sometimes
    // I have 3 layers loaded in Details - for example.
    // To fix this, we'll have to synch the ADD_LAYER events and make sure those 'know' what order they should be in when they
    // propagate the mapOrderedLayerInfo in their processes. For now at least, this is repeating the same behavior until the events are fixed.
    const orderedLayerInfos: TypeOrderedLayerInfo[] = MapEventProcessor.getMapOrderedLayerInfo(this.getMapId()).length
      ? MapEventProcessor.getMapOrderedLayerInfo(this.getMapId())
      : [];
    const promisedLayers = await Promise.allSettled(promisesOfGeoviewLayers);

    // For each layers in the fulfilled promises only
    promisedLayers.forEach((promise) => {
      // If fullfilled
      if (promise.status === 'fulfilled') {
        // Get the geoview layer config
        const geoviewLayerConfig = promise.value;

        try {
          // Generate array of layer order information
          const layerInfos = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
          orderedLayerInfos.push(...layerInfos);

          // Add it
          this.addGeoviewLayer(geoviewLayerConfig);
        } catch (error: unknown) {
          // An error happening here likely means a particular, trivial, config error.
          // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

          // Show the error(s)
          this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
        }
      } else {
        // Depending on the error
        let uuids;
        if (promise.reason instanceof LayerGeoCoreError) {
          ({ uuids } = promise.reason);
        }

        // For each uuid that failed
        uuids?.forEach((uuid) => {
          // Get the index at which the TypeGeoviewLayerConfig happened
          const index = validGeoviewLayerConfigs.findIndex((mapLayerEntry) => mapLayerEntry.geoviewLayerId === uuid);

          // If found
          if (index >= 0) {
            // Remove the entry
            validGeoviewLayerConfigs.splice(index, 1);
          }
        });
      }
    });

    // At this point, we've removed the duplicated geocore (DuplicateAndMultipleUuidGeoviewLayerConfig) and the
    // geocore that were failing were removed from the validGeoviewLayerConfigs variable.
    // Time to update the list we received in param so that the rest of the application works with that list.
    // This is notably so that the map loads even if no geocore layers were valid

    // Replace the array received in param
    mapConfigLayerEntries.splice(0, mapConfigLayerEntries.length, ...validGeoviewLayerConfigs);

    // Init ordered layer info (?)
    MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), orderedLayerInfos);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   * @param {string} uuid - The GeoCore UUID to add to the map
   * @param {string} layerEntryConfig - The optional layer configuration
   * @returns {Promise<void>} A promise which resolves when done adding
   */
  async addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<void> {
    // Add a place holder to the ordered layer info array
    const layerInfo: TypeOrderedLayerInfo = {
      layerPath: uuid,
      visible: true,
      queryable: true,
      hoverable: true,
      legendCollapsed: false,
      inVisibleRange: true,
    };

    if (this.getGeoviewLayerIds().includes(uuid)) {
      // eslint-disable-next-line no-param-reassign
      uuid = `${uuid}:${generateId(8)}`;
    }

    try {
      // GV: This is here as a placeholder so that the layers will appear in the proper order,
      // GV: regardless of how quickly we get the response. It is removed, in the catch below, if the layer fails.
      MapEventProcessor.addOrderedLayerInfo(this.getMapId(), layerInfo);

      const parsedLayerEntryConfig = layerEntryConfig ? JSON.parse(layerEntryConfig) : undefined;
      if (parsedLayerEntryConfig && !parsedLayerEntryConfig[0].layerId) parsedLayerEntryConfig[0].layerId = 'base-group';

      let optionalConfig: GeoCoreLayerConfig | undefined =
        parsedLayerEntryConfig && (parsedLayerEntryConfig[0].listOfLayerEntryConfig || parsedLayerEntryConfig[0].initialSettings)
          ? {
              geoviewLayerType: 'geoCore',
              geoviewLayerId: uuid,
              geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName,
              listOfLayerEntryConfig: parsedLayerEntryConfig[0].geoviewLayerName
                ? parsedLayerEntryConfig[0].listOfLayerEntryConfig
                : parsedLayerEntryConfig,
              initialSettings: parsedLayerEntryConfig[0].initialSettings,
            }
          : undefined;

      // If a simplified config is provided, build a config with the layerName provided
      if (!optionalConfig && parsedLayerEntryConfig && (parsedLayerEntryConfig[0].layerName || parsedLayerEntryConfig[0].geoviewLayerName))
        optionalConfig = {
          geoviewLayerType: 'geoCore',
          geoviewLayerId: uuid,
          geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName || parsedLayerEntryConfig[0].layerName,
        };

      // Create the layers from the UUID
      const geoviewLayerConfig = await GeoCore.createLayerConfigFromUUID(
        uuid,
        this.mapViewer.getDisplayLanguage(),
        this.getMapId(),
        optionalConfig
      );

      // Add the geoview layer
      this.addGeoviewLayer(geoviewLayerConfig);
    } catch (error: unknown) {
      // An error happening here likely means an issue with the UUID or a trivial config error.
      // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

      // Remove geoCore ordered layer info placeholder
      if (MapEventProcessor.findMapLayerFromOrderedInfo(this.getMapId(), uuid))
        MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), uuid, false);

      // Show the error(s)
      this.showLayerError(error, uuid);
    }
  }

  /**
   * Adds a layer to the map. This is the main method to add a GeoView Layer on the map.
   * It handles all the processing, including the validations, and makes sure to inform the layer sets about the layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add
   * @returns {GeoViewLayerAddedResult} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult {
    // TODO: Refactor - This should be dealt with the config classes and this line commented out
    // eslint-disable-next-line no-param-reassign
    geoviewLayerConfig.geoviewLayerId ||= generateId(18);

    // TODO: Refactor - This should be dealt with the config classes and this line commented out
    ConfigValidation.validateListOfGeoviewLayerConfig([geoviewLayerConfig]);

    // TODO: Refactor - This should be dealt with the config classes and this line commented out, therefore, content of addGeoviewLayerStep2 becomes this addGeoviewLayer function.
    if (this.getGeoviewLayerIds().includes(geoviewLayerConfig.geoviewLayerId)) {
      // Throw that the geoview layer id was already created
      throw new LayerCreatedTwiceError(geoviewLayerConfig.geoviewLayerId, geoviewLayerConfig.geoviewLayerName);
    } else {
      // Process the addition of the layer
      const result: GeoViewLayerAddedResult = this.#addGeoviewLayerStep2(geoviewLayerConfig);

      // Upon termination, we want to check if there was any errors and log/show them within this addGeoviewLayer function which can be called from external
      result.promiseLayer
        .then(() => {
          // GV This is the major resolver of the layer processing.
          // GV.CONT The layer processing has completed, though it's possible that we piled up Errors in the layerLoadErrors.

          // Time to throw to log/show any/all errors that happened during the layer processing
          result.layer.throwAggregatedLayerLoadErrors();
        })
        .catch((error: unknown) => {
          // GV This is the major catcher of many possible layer processing issues

          // Show the error(s).
          this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
        });

      // Return the result
      return result;
    }
  }

  /**
   * Continues the addition of the geoview layer.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The geoview layer configuration to add
   * @returns {GeoViewLayerAddedResult} The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   * @private
   */
  #addGeoviewLayerStep2(geoviewLayerConfig: TypeGeoviewLayerConfig): GeoViewLayerAddedResult {
    // Create the layer for the processing
    const layerBeingAdded = this.createLayerConfigFromType(geoviewLayerConfig);

    // Add in the geoviewLayers set
    this.#geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

    // For each layer entry config in the geoview layer
    layerBeingAdded.getAllLayerEntryConfigs().forEach((layerConfig) => {
      // Log
      logger.logTraceCore(`LAYERS - 1 - Registering layer entry config ${layerConfig.layerPath} on map ${this.getMapId()}`, layerConfig);

      // Register it
      this.registerLayerConfigInit(layerConfig);

      // Add filters to map initial filters, if they exist
      this.#addInitialFilters(layerConfig);
    });

    // Register a callback when the layer entry config wants to register extra configs
    layerBeingAdded.onLayerEntryRegisterInit((geoviewLayer: AbstractGeoViewLayer, event: LayerEntryRegisterInitEvent) => {
      // Log
      logger.logTraceCore(
        `LAYERS - 1.5 - Registering an extra layer entry config ${event.config.layerPath} on map ${this.getMapId()}`,
        event.config
      );

      // If already existing
      const alreadyExisting = this.getLayerEntryConfig(event.config.layerPath);
      if (alreadyExisting) {
        // Unregister the old one
        this.unregisterLayerConfig(alreadyExisting, false);
      }

      // Register it
      this.registerLayerConfigInit(event.config);
    });

    // TODO: if we keep geoview layers, regroup the event like what we do for gv layers
    // Register a callback when layer wants to send a message
    layerBeingAdded.onLayerMessage(this.#handleLayerMessage.bind(this));

    // Register a callback when layer entry config has become processed (catching on-the-fly layer entry configs as they are further processed)
    layerBeingAdded.onLayerEntryProcessed((geoviewLayer: AbstractGeoViewLayer, event: LayerEntryProcessedEvent) => {
      // Log
      logger.logTraceCore(
        `LAYERS - 6 - Layer entry config processed for ${event.config.layerPath} on map ${this.getMapId()}`,
        event.config.layerStatus,
        event.config
      );

      // If is an AbstractBaseLayerEntryConfig
      if (event.config instanceof AbstractBaseLayerEntryConfig) {
        // Set the map layer queryable - default to queryable as this will be overridden if not queryable
        MapEventProcessor.setMapLayerQueryable(
          this.getMapId(),
          event.config.layerPath,
          event.config.source?.featureInfo?.queryable !== undefined ? event.config.source.featureInfo.queryable : true
        );
      }
    });

    // Register a callback when a Group Layer has been created
    layerBeingAdded.onLayerGroupCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGroupCreatedEvent) => {
      // Get the Group Layer and the config
      const groupLayer = event.layer;
      const layerConfig = groupLayer.getLayerConfig();

      // Log
      logger.logTraceCore(
        `LAYERS - 7 - Group Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
        layerConfig.layerStatus,
        layerConfig
      );

      // Keep track
      this.#gvLayers[layerConfig.layerPath] = groupLayer;
      this.#olLayers[layerConfig.layerPath] = groupLayer.getOLLayer();

      // Register events handler for the layer
      this.#registerGroupLayerHandlers(groupLayer);

      // TODO: Check - Do we need this line here? And if so, why only for Group Layers?
      // Set in visible range property for all newly added layers
      this.#setLayerInVisibleRange(groupLayer, layerConfig);
    });

    // Register a callback when a GV Layer has been created
    layerBeingAdded.onLayerGVCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGVCreatedEvent) => {
      // Get the GV Layer and the config
      const gvLayer = event.layer;
      const layerConfig = gvLayer.getLayerConfig();

      // Log
      logger.logTraceCore(
        `LAYERS - 9 - GV Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
        layerConfig.layerStatus,
        layerConfig
      );

      // Keep track
      this.#gvLayers[layerConfig.layerPath] = gvLayer;
      this.#olLayers[layerConfig.layerPath] = gvLayer.getOLLayer();

      // Register events handler for the layer
      this.#registerLayerHandlers(gvLayer);

      // Emit about its creation so that one can attach events on it right away if necessary
      this.#emitLayerCreated({ layer: gvLayer });

      // Init it
      gvLayer.init();
    });

    // Create a promise about the layer will be on the map
    const promiseLayer = new Promise<void>((resolve, reject) => {
      // Continue the addition process
      layerBeingAdded
        .createGeoViewLayers()
        .then(() => {
          // Add the layer on the map
          this.#addToMap(layerBeingAdded);

          // Resolve, done
          resolve();

          // Emit
          this.#emitLayerConfigAdded({ layer: layerBeingAdded });
        })
        .catch((error: unknown) => {
          // Reject it higher, because that's not where we want to handle the promise failure, we're returning the promise higher
          reject(formatError(error));
        });
    });

    // Return the layer with the promise it'll be on the map
    return { layer: layerBeingAdded, promiseLayer };
  }

  /**
   * Refreshes GeoCore Layers
   */
  reloadGeocoreLayers(): void {
    const configs = this.getLayerEntryConfigs();
    const originalMapOrderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(this.getMapId());
    const parentPaths: string[] = [];

    // Have to do the Promise allSettled so the new MapOrderedLayerInfo has all the children layerPaths
    Promise.allSettled(
      configs
        .filter((config) => {
          // Filter to just Geocore layers and not child layers
          if (isValidUUID(config.geoviewLayerConfig.geoviewLayerId) && config.parentLayerConfig === undefined) {
            return true;
          }
          return false;
        })
        .map((config) => {
          // Remove and add back in GeoCore Layers and return their promises
          parentPaths.push(config.layerPath);
          this.removeLayerUsingPath(config.layerPath);
          return this.addGeoviewLayerByGeoCoreUUID(config.geoviewLayerConfig.geoviewLayerId);
        })
    )
      .then(() => {
        const originalLayerPaths = originalMapOrderedLayerInfo.map((info) => info.layerPath);

        // Prepare listeners for removing previously removed layers
        parentPaths.forEach((parentPath) => {
          function removeChildLayers(sender: LayerApi): void {
            const childPaths = sender.#getAllChildPaths(parentPath);
            childPaths.forEach((childPath) => {
              if (!originalLayerPaths.includes(childPath)) {
                sender.removeLayerUsingPath(childPath);
              }
            });
            // TODO: Bound this 'removeChildLayers' function (like other ones) instead of creating a new handler on each 'forEach'
            sender.offLayerConfigAdded(removeChildLayers);
          }
          this.onLayerConfigAdded(removeChildLayers);
        });

        // Prepare listeners for changing the visibility
        MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), originalMapOrderedLayerInfo);
        originalMapOrderedLayerInfo.forEach((layerInfo) => {
          function setLayerVisibility(sender: LayerApi, event: LayerEvent): void {
            const layerPath = event.layer.getLayerPath();
            if (layerInfo.layerPath === layerPath) {
              const { visible } = originalMapOrderedLayerInfo.filter((info) => info.layerPath === layerPath)[0];
              event.layer?.setVisible(visible);
              // TODO: Bound this 'setLayerVisibility' function (like other ones) instead of creating a new handler on each 'forEach'
              sender.offLayerFirstLoaded(setLayerVisibility);
            }
          }
          this.onLayerFirstLoaded(setLayerVisibility);
        });
      })
      .catch((error: unknown) => {
        // Log
        logger.logError(error);
      });
  }

  /**
   * Attempt to reload a layer.
   * @param {string} layerPath - The path to the layer to reload
   */
  reloadLayer(layerPath: string): void {
    const layerEntryConfig = this.getLayerEntryConfig(layerPath);
    const geoviewLayer = layerEntryConfig ? this.#geoviewLayers[layerEntryConfig.geoviewLayerConfig.geoviewLayerId] : undefined;

    if (layerEntryConfig && geoviewLayer) {
      if (layerEntryConfig instanceof GroupLayerEntryConfig) {
        layerEntryConfig.listOfLayerEntryConfig.forEach((sublayerEntryConfig) => {
          if ((sublayerEntryConfig as AbstractBaseLayerEntryConfig).layerStatus === 'error')
            this.reloadLayer((sublayerEntryConfig as AbstractBaseLayerEntryConfig).layerPath);
        });
      } else {
        this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
          if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
            // Remove actual OL layer from the map
            if (this.getOLLayer(registeredLayerPath)) this.mapViewer.map.removeLayer(this.getOLLayer(registeredLayerPath) as BaseLayer);

            // Unregister the events on the layer
            if (this.#gvLayers[registeredLayerPath] instanceof AbstractGVLayer)
              this.#unregisterLayerHandlers(this.#gvLayers[registeredLayerPath]);
            else if (this.#gvLayers[registeredLayerPath] instanceof GVGroupLayer)
              this.#unregisterGroupLayerHandlers(this.#gvLayers[registeredLayerPath]);

            // Remove from registered layers
            delete this.#gvLayers[registeredLayerPath];
            delete this.#olLayers[registeredLayerPath];
          }
        });

        // Create and register new layer
        const layer = geoviewLayer.createGVLayer(layerEntryConfig as AbstractBaseLayerEntryConfig);

        this.#gvLayers[layerPath] = layer;
        this.#olLayers[layerPath] = layer.getOLLayer();
        this.mapViewer.map.addLayer(layer.getOLLayer());
      }
    }
  }

  /**
   * Registers the layer identifier.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to register
   */
  registerLayerConfigInit(layerConfig: ConfigBaseClass): void {
    // Log (keep the commented line for now)
    // logger.logDebug('registerLayerConfigInit', layerConfig.layerPath, layerConfig.layerStatus);

    // Keep it
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;

    // Register for ordered layer information
    this.#registerForOrderedLayerInfo(layerConfig as TypeLayerEntryConfig);

    // Register for TimeSlider
    this.#registerForTimeSlider(layerConfig as TypeLayerEntryConfig).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in registration of layer for the time slider', error);
    });

    // Tell the layer sets about it
    this.#allLayerSets.forEach((layerSet) => {
      // Register the config to the layer set
      layerSet.registerLayerConfig(layerConfig);
    });

    // Register a handler when the config layer status changes (this allows catching the status >= registered, all the way to loaded/error)
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Set the layer status to registered
    layerConfig.setLayerStatusRegistered();
  }

  /**
   * Registers the layer in the LayerApi layer-sets to start managing it.
   * This function may be used to start managing a layer in the UI when said layer has been created outside of the regular config->layer flow.
   * @param {AbstractGVLayer} layer - The layer to register
   */
  registerLayerInLayerSets(layer: AbstractGVLayer): void {
    // Tell the layer sets about it
    this.#allLayerSets.forEach((layerSet) => {
      // Register the layer to the layer set
      layerSet.registerLayer(layer).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('in registerLayer in registerLayerUpdate', error);
      });
    });
  }

  /**
   * Unregisters the layer in the LayerApi to stop managing it.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to unregister
   * @param {boolean} unregisterOrderedLayerInfo - Should it be unregistered from orderedLayerInfo
   */
  unregisterLayerConfig(layerConfig: ConfigBaseClass, unregisterOrderedLayerInfo: boolean = true): void {
    // Unregister from ordered layer info
    if (unregisterOrderedLayerInfo) this.#unregisterFromOrderedLayerInfo(layerConfig);

    // Unregister from TimeSlider
    this.#unregisterFromTimeSlider(layerConfig);

    // Unregister from GeoChart
    this.#unregisterFromGeoChart(layerConfig);

    // Unregister from Swiper
    this.#unregisterFromSwiper(layerConfig);

    // Tell the layer sets about it
    this.#allLayerSets.forEach((layerSet) => {
      // Unregister from the layer set
      layerSet.unregister(layerConfig.layerPath);
    });
  }

  /**
   * Checks if the layer results sets are all greater than or equal to the provided status
   */
  checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number] {
    // If no layer entries at all or there are layer entries and there are geoview layers to check
    let allGood = true;

    // For each layer entry config
    this.getLayerEntryConfigs().forEach((layerConfig) => {
      const layerIsGood = ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo(status, [layerConfig]);
      if (!layerIsGood) {
        // Callback about it
        callbackNotGood?.(layerConfig);
        allGood = false;
      }
    });

    // Return if all good
    return [allGood, this.getLayerEntryConfigs().length];
  }

  /**
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers(): void {
    this.getLayerEntryConfigIds().forEach((layerEntryConfigId) => {
      // Remove it
      this.removeLayerUsingPath(layerEntryConfigId);
    });
  }

  /**
   * Removes all layers in error from the map
   */
  removeAllLayersInError(): void {
    this.getLayerEntryConfigs().forEach((layerEntryConfig) => {
      // Remove it if it is in error
      if (layerEntryConfig.layerStatus === 'error') this.removeLayerUsingPath(layerEntryConfig.layerPath);
    });
  }

  /**
   * Removes layer and feature highlights for a given layer.
   * @param {string} layerPath - The path of the layer to remove highlights from.
   */
  removeLayerHighlights(layerPath: string): void {
    // Remove layer highlight if layer being removed or its child is highlighted
    if (this.#highlightedLayer.layerPath?.startsWith(`${layerPath}/`) || this.#highlightedLayer.layerPath === layerPath)
      this.removeHighlightLayer();

    // Reset the result set for the layer and any children
    this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
      if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
        // Remove feature highlight and result set for features from this layer
        FeatureInfoEventProcessor.resetResultSet(this.getMapId(), registeredLayerPath, 'name');
      }
    });
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   * @param {string} layerPath - The path or ID of the layer to be removed
   */
  removeLayerUsingPath(layerPath: string): void {
    // Remove any highlights associated with the layer
    this.removeLayerHighlights(layerPath);

    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const layerPathNodes = layerPath.split('/');

    // Get the layer entry config to remove
    const layerEntryConfig = this.getLayerEntryConfig(layerPath);

    // initialize these two constant now because we will delete the information used to get their values.
    const indexToDelete = layerEntryConfig
      ? layerEntryConfig.parentLayerConfig?.listOfLayerEntryConfig.findIndex((layerConfig) => layerConfig === layerEntryConfig)
      : undefined;
    const listOfLayerEntryConfigAffected = this.getLayerEntryConfig(layerPath)?.parentLayerConfig?.listOfLayerEntryConfig;

    // Remove layer info from registered layers
    this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
      if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
        // Remove actual OL layer from the map
        if (this.getOLLayer(registeredLayerPath)) this.mapViewer.map.removeLayer(this.getOLLayer(registeredLayerPath) as BaseLayer);

        // Set the layer status to error to ensure it is no longer loading
        // TODO: This is to handle instances where the layer is deleted while still loading - this should be probably be handled via cleanup in the layer
        this.getLayerEntryConfig(registeredLayerPath)?.setLayerStatusError();

        // Unregister layer config from the application
        this.unregisterLayerConfig(this.getLayerEntryConfig(registeredLayerPath)!);

        // Unregister the events on the layer
        if (this.#gvLayers[registeredLayerPath] instanceof AbstractGVLayer)
          this.#unregisterLayerHandlers(this.#gvLayers[registeredLayerPath]);
        else if (this.#gvLayers[registeredLayerPath] instanceof GVGroupLayer)
          this.#unregisterGroupLayerHandlers(this.#gvLayers[registeredLayerPath]);

        // Remove from registered layer configs
        delete this.#layerEntryConfigs[registeredLayerPath];
        delete this.#geoviewLayers[registeredLayerPath];

        // Remove from registered layers
        delete this.#gvLayers[registeredLayerPath];
        delete this.#olLayers[registeredLayerPath];
      }
    });

    // Remove from parents listOfLayerEntryConfig
    if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

    // Remove layer from geoview layers
    if (this.#geoviewLayers[layerPathNodes[0]]) {
      const geoviewLayer = this.#geoviewLayers[layerPathNodes[0]];

      // If it is a single layer, remove geoview layer
      if (layerPathNodes.length === 1 || (layerPathNodes.length === 2 && geoviewLayer.listOfLayerEntryConfig.length === 1)) {
        geoviewLayer.olRootLayer?.dispose();
        if (geoviewLayer.olRootLayer) delete geoviewLayer.olRootLayer;

        delete this.#geoviewLayers[layerPathNodes[0]];
        const { mapFeaturesConfig } = this.mapViewer;

        // TODO: refactor - remove cast
        if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
          mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
            (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== layerPath
          );
      } else if (layerPathNodes.length === 2) {
        const updatedListOfLayerEntryConfig = geoviewLayer.listOfLayerEntryConfig.filter(
          (entryConfig) => entryConfig.layerId !== layerPathNodes[1]
        );
        geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
      } else {
        // For layer paths more than two deep, drill down through listOfLayerEntryConfigs to layer entry config to remove
        let layerEntryConfig2 = geoviewLayer.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[1]);

        for (let i = 1; i < layerPathNodes.length; i++) {
          if (i === layerPathNodes.length - 1 && layerEntryConfig2) {
            // When we get to the top level, remove the layer entry config
            const updatedListOfLayerEntryConfig = layerEntryConfig2.listOfLayerEntryConfig.filter(
              (entryConfig) => entryConfig.layerId !== layerPathNodes[i]
            );
            geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
          } else if (layerEntryConfig2) {
            // Not on the top level, so update to the latest
            layerEntryConfig2 = layerEntryConfig2.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[i]);
          }
        }
      }
    }

    // Emit about it
    this.#emitLayerConfigRemoved({ layerPath, layerName: layerEntryConfig?.getLayerName() || 'No name / Sans nom' });

    // Log
    logger.logInfo(`Layer removed for ${layerPath}`);

    // Redirect to feature info delete
    FeatureInfoEventProcessor.deleteFeatureInfo(this.getMapId(), layerPath);
  }

  /**
   * Highlights layer or sublayer on map
   *
   * @param {string} layerPath - ID of layer to highlight
   */
  highlightLayer(layerPath: string): void {
    this.removeHighlightLayer();
    const theLayerMain = this.getGeoviewLayer(layerPath);

    this.#highlightedLayer = { layerPath, originalOpacity: theLayerMain?.getOpacity() };
    theLayerMain?.setOpacity(1);

    // If it is a group layer, highlight sublayers
    const layer = this.getLayerEntryConfig(layerPath);

    // If found
    if (layer && layer.getEntryTypeIsGroup()) {
      this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
        // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
        const theLayer = this.getGeoviewLayer(registeredLayerPath);
        if (theLayer) {
          if (
            !(registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) &&
            theLayer.getLayerConfig().getEntryTypeIsRegular()
          ) {
            const otherOpacity = theLayer.getOpacity();
            theLayer.setOpacity((otherOpacity || 1) * 0.25);
          } else this.getOLLayer(registeredLayerPath)!.setZIndex(999);
        }
      });
    } else {
      this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
        // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
        const theLayer = this.getGeoviewLayer(registeredLayerPath);
        if (theLayer) {
          if (registeredLayerPath !== layerPath && theLayer.getLayerConfig()?.getEntryTypeIsRegular()) {
            const otherOpacity = theLayer.getOpacity();
            theLayer.setOpacity((otherOpacity || 1) * 0.25);
          }
        }
      });
      this.getOLLayer(layerPath)?.setZIndex(999);
    }
  }

  /**
   * Removes layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    this.featureHighlight.removeBBoxHighlight();
    if (this.#highlightedLayer.layerPath !== undefined) {
      const { layerPath, originalOpacity } = this.#highlightedLayer;

      // Get the layer config
      const layerConfig = this.getLayerEntryConfig(layerPath);

      // IF found and a group
      if (layerConfig?.getEntryTypeIsGroup()) {
        this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
          // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
          const theLayer = this.getGeoviewLayer(registeredLayerPath);
          if (theLayer) {
            if (
              !(registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) &&
              theLayer.getLayerConfig().getEntryTypeIsRegular()
            ) {
              const otherOpacity = theLayer.getOpacity();
              theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1);
            } else theLayer.setOpacity(originalOpacity || 1);
          }
        });
      } else {
        this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
          // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
          const theLayer = this.getGeoviewLayer(registeredLayerPath);
          if (theLayer) {
            if (registeredLayerPath !== layerPath && theLayer.getLayerConfig().getEntryTypeIsRegular()) {
              const otherOpacity = theLayer.getOpacity();
              theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1);
            } else theLayer.setOpacity(originalOpacity || 1);
          }
        });
      }
      MapEventProcessor.setLayerZIndices(this.getMapId());
      this.#highlightedLayer.layerPath = undefined;
      this.#highlightedLayer.originalOpacity = undefined;
    }
  }

  /**
   * Gets the max extent of all layers on the map, or of a provided subset of layers.
   *
   * @param {string[]} layerIds - IDs or layerPaths of layers to get max extents from.
   * @returns {Extent} The overall extent.
   */
  getExtentOfMultipleLayers(layerIds: string[] = this.getLayerEntryConfigIds()): Extent {
    let bounds: Extent = [];

    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = this.getLayerEntryConfigIds().filter(
        (layerPath) => layerPath.startsWith(`${layerId}/`) || layerPath === layerId
      );

      if (subLayerPaths.length) {
        // Get max extents from all selected layers.
        subLayerPaths.forEach((layerPath) => {
          // Get the bounds for the layer path
          const layerBounds = LegendEventProcessor.getLayerBounds(this.getMapId(), layerPath);

          // If bounds has not yet been defined, set to this layers bounds.
          if (!bounds.length && layerBounds) bounds = layerBounds;
          else if (layerBounds) bounds = getExtentUnion(bounds, layerBounds)!;
        });
      }
    });

    return bounds;
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   */
  refreshLayers(): void {
    // For each geoview layer
    this.getGeoviewLayers().forEach((geoviewLayer) => {
      // Call the layer refresh function
      geoviewLayer.refresh(this.mapViewer.getProjection());
    });
  }

  /**
   * Toggle visibility of an item.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {TypeLegendItem} item - The item to change.
   * @param {boolean} visibility - The visibility to set.
   * @param {boolean} updateLegendLayers - Should legend layers be updated (here to avoid repeated rerendering when setting all items in layer).
   */
  setItemVisibility(layerPath: string, item: TypeLegendItem, visibility: boolean, updateLegendLayers: boolean = true): void {
    // Get registered layer config
    const layer = this.getGeoviewLayer(layerPath);

    // If the layer is a regular layer (not a group)
    if (layer instanceof AbstractGVLayer) {
      // Assign value to registered layer. This is use by applyFilter function to set visibility
      // TODO: check if we need to refactor to centralize attribute setting....
      const geometryStyleConfig = layer.getStyle()![item.geometryType];
      // Get all styles with the label matching the name of the clicked item and update their visibility
      const toggledStyleInfos = geometryStyleConfig?.info.filter((styleInfo) => styleInfo.label === item.name);
      toggledStyleInfos?.forEach((toggledStyleInfo) => {
        // eslint-disable-next-line no-param-reassign
        if (toggledStyleInfo) toggledStyleInfo.visible = visibility;
      });

      // Force a re-render of the layer source (this is required if there are classes)
      layer.getOLLayer().changed();
    }

    // Update the legend layers if necessary
    if (updateLegendLayers) LegendEventProcessor.setItemVisibility(this.getMapId(), layerPath, item, visibility);

    // Apply filter to layer
    MapEventProcessor.applyLayerFilters(this.getMapId(), layerPath);

    // Emit event
    this.#emitLayerItemVisibilityToggled({ layerPath, itemName: item.name, visibility });
  }

  /**
   * Set visibility of all geoview layers on the map
   *
   * @param {boolean} newValue - The new visibility.
   */
  setAllLayersVisibility(newValue: boolean): void {
    this.getLayerEntryConfigIds().forEach((layerPath) => {
      this.setOrToggleLayerVisibility(layerPath, newValue);
    });
  }

  /**
   * Sets or toggles the visibility of a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {boolean} newValue - The new value of visibility.
   */
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean {
    // Apply some visibility logic
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), layerPath);
    // Determine the outcome of the new visibility based on parameters
    const newVisibility = newValue !== undefined ? newValue : !layerVisibility;

    if (layerVisibility !== newVisibility) {
      // Change visibility
      this.getGeoviewLayer(layerPath)?.setVisible(newVisibility);
      // Emit event
      this.#emitLayerVisibilityToggled({ layerPath, visibility: newVisibility });
    }

    return newVisibility;
  }

  /**
   * Renames a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {string} name - The new name to use.
   */
  setLayerName(layerPath: string, name: string): void {
    // Get the layer
    const layer = this.getGeoviewLayer(layerPath);

    // If found
    if (layer) {
      // Set the layer name on the layer
      layer.setLayerName(name);
    } else {
      logger.logError(`Unable to find layer ${layerPath}`);
    }
  }

  /**
   * Sets opacity for a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {number} opacity - The new opacity to use.
   * @param {boolean} emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
   */
  setLayerOpacity(layerPath: string, opacity: number, emitOpacityChange?: boolean): void {
    this.getGeoviewLayer(layerPath)?.setOpacity(opacity, emitOpacityChange);
  }

  /**
   * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {GeoJSONObject | string} geojson - The new geoJSON.
   */
  setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Get the GeoviewLayer
    const gvLayer = this.getGeoviewLayer(layerPath);

    // If not found
    if (!gvLayer) throw new LayerNotFoundError(layerPath);

    // If not of right type
    if (!(gvLayer instanceof GVGeoJSON)) throw new LayerNotGeoJsonError(layerPath, gvLayer.getLayerName());

    // Override the GeoJson source
    gvLayer.setGeojsonSource(geojson, this.mapViewer.getProjection());

    // Update the bounds in the store
    const bounds = gvLayer.getBounds(this.mapViewer.getProjection(), MapViewer.DEFAULT_STOPS);
    if (bounds) {
      LegendEventProcessor.setLayerBounds(mapId, layerPath, bounds);
    }

    // Reset the feature info result set
    FeatureInfoEventProcessor.resetResultSet(mapId, layerPath, 'name');

    // Update feature info
    DataTableEventProcessor.triggerGetAllFeatureInfo(mapId, layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed(`Update all feature info in setGeojsonSource failed for layer ${layerPath}`, error);
    });
  }

  /**
   * Redefine feature info fields.
   * @param {string} layerPath - The path of the layer.
   * @param {string[]} fieldNames - The new field names to use.
   * @param {'alias' | 'name'} fields - The fields to change.
   */
  redefineFeatureFields(layerPath: string, fieldNames: string[], fields: 'alias' | 'name'): void {
    // Get the layer config
    const layerConfig = this.getLayerEntryConfig(layerPath);

    if (!layerConfig) throw new LayerNotFoundError(layerPath);
    if (layerConfig instanceof GroupLayerEntryConfig) throw new LayerWrongTypeError(layerPath, layerConfig.getLayerNameCascade());

    // Cast it
    const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

    if (
      layerConfigCasted.source?.featureInfo &&
      layerConfigCasted.source.featureInfo.queryable !== false &&
      layerConfigCasted.source.featureInfo.outfields
    ) {
      // Convert the provided field names to an array so we can index
      if (layerConfigCasted.source.featureInfo.outfields.length === fieldNames.length)
        // Override existing values in each outfield with provided field name
        layerConfigCasted.source.featureInfo.outfields?.forEach((outfield, index) => {
          // eslint-disable-next-line no-param-reassign
          outfield[fields] = fieldNames[index];
        });
      else throw new LayerDifferingFieldLengths(layerPath);
    } else throw new LayerNotQueryableError(layerConfigCasted.layerPath, layerConfigCasted.getLayerNameCascade());
  }

  /**
   * Replace outfield names, aliases and types with any number of new values, provided an identical count of each are supplied.
   * @param {string} layerPath - The path of the layer.
   * @param {string[]} types - The new field types (TypeOutfieldsType) to use.
   * @param {string[]} fieldNames - The new field names to use.
   * @param {string[]} fieldAliases - The new field aliases to use.
   */
  replaceFeatureOutfields(layerPath: string, types: TypeOutfieldsType[], fieldNames: string[], fieldAliases?: string[]): void {
    const layerConfig = this.getLayerEntryConfig(layerPath);

    if (!layerConfig) throw new LayerNotFoundError(layerPath);
    if (layerConfig instanceof GroupLayerEntryConfig) throw new LayerWrongTypeError(layerPath, layerConfig.getLayerNameCascade());

    // Cast it
    const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

    if (
      layerConfigCasted.source?.featureInfo &&
      layerConfigCasted.source.featureInfo.queryable !== false &&
      layerConfigCasted.source.featureInfo.outfields
    ) {
      // Ensure same number of all items are provided
      if (fieldNames.length === types.length) {
        // Convert to array of outfields
        const newOutfields = fieldNames.map((name, index) => {
          return {
            name,
            alias: fieldAliases ? fieldAliases[index] : name,
            type: types[index],
            domain: null,
          };
        });

        // Set new value asfeature info outfields
        layerConfigCasted.source.featureInfo.outfields = newOutfields;
      } else throw new LayerDifferingFieldLengths(layerPath);
    } else throw new LayerNotQueryableError(layerConfigCasted.layerPath, layerConfigCasted.getLayerNameCascade());
  }

  /**
   * Calculates an union of all the layer extents based on the given layerPath and its possible children.
   * @param {string} layerPath - The layer path
   * @returns {Extent | undefined} An extent representing an union of all layer extents associated with the layer path
   */
  calculateBounds(layerPath: string): Extent | undefined {
    // Get the layer config at the layer path
    const layerConfig = this.getLayerEntryConfig(layerPath);

    // Current bounds
    const boundsArray = [] as Extent[];

    // If found
    if (layerConfig) {
      // Redirect
      this.#gatherAllBoundsRec(layerConfig, boundsArray);
    }

    // For each bounds found
    let boundsUnion: Extent | undefined;
    boundsArray.forEach((bounds) => {
      // Union the bounds with each other
      boundsUnion = getExtentUnion(boundsUnion, bounds);
    });

    // Return the unioned bounds
    return boundsUnion;
  }

  /**
   * Recalculates the bounds for all layers and updates the store.
   */
  recalculateBoundsAll(): void {
    // For each layer path
    this.getLayerEntryConfigIds().forEach((layerPath: string) => {
      const bounds = this.calculateBounds(layerPath);
      LegendEventProcessor.setLayerBounds(this.getMapId(), layerPath, bounds);
    });
  }

  /**
   * Show the errors that happened during layers loading.
   * If it's an aggregate error, log and show all of them.
   * If it's a regular error, log and show only that error.
   * @param error - The error to log and show.
   * @param geoviewLayerId - The Geoview layer id for which the error happened.
   */
  showLayerError(error: unknown, geoviewLayerId: string): void {
    // If an aggregation error
    if (error instanceof AggregateError) {
      // For each errors
      error.errors.forEach((layerError) => {
        // Recursive call
        this.showLayerError(layerError, geoviewLayerId);
      });
    } else {
      // Cast the error
      const theError = formatError(error);

      // Read the layer path if possible, more precise
      let layerPathOrId = geoviewLayerId;
      if (theError instanceof LayerEntryConfigError) {
        layerPathOrId = theError.layerConfig.layerPath;
      }

      // Show error
      this.mapViewer.notifications.showErrorFromError(theError, true);

      // If the Error is GeoViewError, it has a translation
      let { message } = theError;
      if (theError instanceof GeoViewError) {
        message = theError.translateMessage(this.mapViewer.getDisplayLanguage());
      }

      // Emit about it
      this.#emitLayerConfigError({ layerPath: layerPathOrId, error: message });
    }
  }

  // #region PRIVATE FUNCTIONS

  /**
   * Attaches event handlers to a layer
   * @private
   * @param {AbstractGVLayer} gvLayer - The layer instance to attach events to
   * @description
   * This method sets up the following event handlers:
   * - Layer message handling through onLayerMessage
   * - Layer first loading completion through onLayerFirstLoaded
   * - All layer loading states through onLayerLoading
   * - All layer loaded states through onLayerLoaded
   * - Layer opacity changed through onLayerOpacityChanged
   * - Layer visibility changed through onVisibleChanged
   * @private
   */
  #registerLayerHandlers(gvLayer: AbstractGVLayer): void {
    // Add a handler on layer's message
    gvLayer.onLayerMessage(this.#boundedHandleLayerMessage);

    // Register a hook when a layer is loaded on the map
    gvLayer.onLayerFirstLoaded(this.#boundedHandleLayerFirstLoaded);

    // Register a hook when a layer is going into loading state
    gvLayer.onLayerLoading(this.#boundedHandleLayerLoading);

    // Register a hook when a layer is going into loading state
    gvLayer.onLayerLoaded(this.#boundedHandleLayerLoaded);

    // Register a hook when a layer is going into error state
    gvLayer.onLayerError(this.#boundedHandleLayerError);

    // Register a hook when a layer opacity is changed
    gvLayer.onLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Register a hook when a layer visibility is changed
    gvLayer.onVisibleChanged(this.#boundedHandleLayerVisibleChanged);
  }

  /**
   * Detaches the events registration on the layer
   * @param {AbstractGVLayer} gvLayer - The layer to detach events registrations from.
   * @private
   */
  #unregisterLayerHandlers(gvLayer: AbstractGVLayer): void {
    // Unregisters handler on layer's message
    gvLayer.offLayerMessage(this.#boundedHandleLayerMessage);

    // Unregisters handler on layers first loaded
    gvLayer.offLayerFirstLoaded(this.#boundedHandleLayerFirstLoaded);

    // Unregisters handler on layers loading
    gvLayer.offLayerLoading(this.#boundedHandleLayerLoading);

    // Unregisters handler on layers loaded
    gvLayer.offLayerLoaded(this.#boundedHandleLayerLoaded);

    // Unregisters handler on layers error
    gvLayer.offLayerError(this.#boundedHandleLayerError);

    // Unregister handler on layer opacity change
    gvLayer.offLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Unregister handler on layer visibility change
    gvLayer.offVisibleChanged(this.#boundedHandleLayerVisibleChanged);
  }

  /**
   * Attaches event handlers to a group layer
   * @private
   * @param {AbstractBaseLayer} baseLayer - The layer instance to attach events to
   * @description
   * This method sets up the following event handlers:
   * - Layer opacity changed through onLayerOpacityChanged
   * - Layer visibility changed through onVisibleChanged
   * @private
   */
  #registerGroupLayerHandlers(baseLayer: AbstractBaseLayer): void {
    // Register a hook when a layer opacity is changed
    baseLayer.onLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Register a hook when a layer visibility is changed
    baseLayer.onVisibleChanged(this.#boundedHandleLayerVisibleChanged);
  }

  /**
   * Detaches the events registration on the group layer
   * @param {AbstractBaseLayer} baseLayer - The layer to detach events registrations from.
   * @private
   */
  #unregisterGroupLayerHandlers(baseLayer: AbstractBaseLayer): void {
    // Unregister handler on layer opacity change
    baseLayer.offLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Unregister handler on layer visibility change
    baseLayer.offVisibleChanged(this.#boundedHandleLayerVisibleChanged);
  }

  /**
   * Handles when any layer status changes during any config processing
   * @param layerConfig - The layer entry config having its layer status changed.
   * @param event - The layer status changed event.
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, event: ConfigLayerStatusChangedEvent): void {
    // Emit about it
    this.#emitLayerStatusChanged({ config: layerConfig, status: event.layerStatus });

    // If the config is a layer entry (not a group)
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // Check if all layers are loaded/error right now
      const [allLoadedOrError] = this.checkLayerStatus('loaded');

      // If all loaded/error
      if (allLoadedOrError) {
        // Update the store that all layers are loaded at this point
        LegendEventProcessor.setLayersAreLoading(this.getMapId(), false);

        // Emit about it
        this.#emitLayerAllLoaded({ config: layerConfig });
      }
    }
  }

  /**
   * Handles layer-specific messages and displays them through the map viewer's notification system
   * @param {AbstractGVLayer} layer - The layer instance that triggered the message
   * @param {LayerMessageEvent} layerMessageEvent - The message event containing notification details
   * @param {string} layerMessageEvent.messageKey - Key for localized message lookup
   * @param {string[]} layerMessageEvent.messageParams - Parameters to be inserted into the localized message
   * @param {boolean} layerMessageEvent.notification - Notification configuration options
   * @returns {void}
   *
   * @example
   * handleLayerMessage(myLayer, {
   *   messageKey: 'layers.fetchProgress',
   *   messageParams: [50, 100],
   *   messageType: 'error',
   *   notification: true
   * });
   *
   * @private
   */
  #handleLayerMessage(layer: AbstractGVLayer | AbstractGeoViewLayer, layerMessageEvent: LayerMessageEvent): void {
    // Read event params for clarity
    const { messageType } = layerMessageEvent;
    const { messageKey } = layerMessageEvent;
    const { messageParams } = layerMessageEvent;
    const { notification } = layerMessageEvent;

    if (messageType === 'info') {
      this.mapViewer.notifications.showMessage(messageKey, messageParams, notification);
    } else if (messageType === 'warning') {
      this.mapViewer.notifications.showWarning(messageKey, messageParams, notification);
    } else if (messageType === 'error') {
      this.mapViewer.notifications.showError(messageKey, messageParams, notification);
    } else if (messageType === 'success') {
      this.mapViewer.notifications.showSuccess(messageKey, messageParams, notification);
    }
  }

  /**
   * Handles when a layer gets in loading stage on the map
   * @param {AbstractGVLayer} layer - The layer that's become loading.
   */
  #handleLayerLoading(layer: AbstractGVLayer): void {
    // Emit about it
    this.#emitLayerLoading({ layer });

    // Update the store that at least 1 layer is loading
    LegendEventProcessor.setLayersAreLoading(this.getMapId(), true);
  }

  /**
   * Handles when a layer is loaded on the map
   * @param {AbstractGVLayer} layer - The layer that's become loaded.
   */
  #handleLayerFirstLoaded(layer: AbstractGVLayer): void {
    // Set in visible range property for all newly added layers
    this.#setLayerInVisibleRange(layer, layer.getLayerConfig());

    // Ensure that the layer bounds are set when the layer is loaded
    const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(this.getMapId(), layer.getLayerPath());
    if (legendLayerInfo && !legendLayerInfo.bounds) LegendEventProcessor.getLayerBounds(this.getMapId(), layer.getLayerPath());

    // Emit about it
    this.#emitLayerFirstLoaded({ layer });
  }

  /**
   * Handles when a layer gets in loaded stage on the map
   * @param {AbstractGVLayer} layer - The layer that's become loaded.
   */
  #handleLayerLoaded(layer: AbstractGVLayer): void {
    // Emit about it
    this.#emitLayerLoaded({ layer });
  }

  /**
   * Handles when a layer gets in error stage on the map
   * @param {AbstractGVLayer} layer - The layer that's become loaded.
   * @param {GVLayerErrorEvent} event - The event containing the error.
   */
  #handleLayerError(layer: AbstractGVLayer, event: GVLayerErrorEvent): void {
    // Emit about it
    this.#emitLayerError({ layer, error: event.error });
  }

  /**
   * Handles when a layer opacity is changed on the map.
   * @param {LayerOpacityChangedEvent} event - The event containing the opacity change.
   */
  #handleLayerOpacityChanged(layer: AbstractBaseLayer, event: LayerOpacityChangedEvent): void {
    LegendEventProcessor.setOpacityInStore(this.getMapId(), event.layerPath, event.opacity);
  }

  /**
   * Handles when a layer visibility is changed on the map.
   * @param {AbstractGVLayer} layer - The layer that's become changed.
   * @param {GVLayerErrorEvent} event - The event containing the visibility change.
   */
  #handleLayerVisibleChanged(layer: AbstractBaseLayer, event: VisibleChangedEvent): void {
    MapEventProcessor.setMapLayerVisibilityInStore(this.getMapId(), layer.getLayerPath(), event.visible);
  }

  /**
   * Validates the geoview layer configuration array to eliminate duplicate entries and inform the user.
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - The Map Config Layer Entries to validate.
   * @returns {MapConfigLayerEntry[]} The new configuration with duplicate entries eliminated.
   * @private
   */
  #deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries?: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (mapConfigLayerEntries && mapConfigLayerEntries.length > 0) {
      const validGeoviewLayerConfigs = mapConfigLayerEntries.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < mapConfigLayerEntries.length; configToTestIndex++) {
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === mapConfigLayerEntries[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicate entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);
            // Remove geoCore ordered layer info placeholder
            if (MapEventProcessor.findMapLayerFromOrderedInfo(this.getMapId(), geoviewLayerConfigToCreate.geoviewLayerId))
              MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), geoviewLayerConfigToCreate.geoviewLayerId, false);

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
    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.getMapId()}`);

    // Show the error
    this.mapViewer.notifications.showError('validation.layer.usedtwice', [mapConfigLayerEntry.geoviewLayerId]);
  }

  /**
   * TODO Add this function to utilties
   * Gets all child paths from a parent path
   * @param {string} parentPath - The parent path
   * @returns {string[]} Child layer paths
   */
  #getAllChildPaths(parentPath: string): string[] {
    const parentLayerEntryConfig = this.getLayerEntryConfig(parentPath)?.geoviewLayerConfig.listOfLayerEntryConfig;

    if (!parentLayerEntryConfig) return [];

    function getChildPaths(listOfLayerEntryConfig: TypeLayerEntryConfig[]): string[] {
      const layerPaths: string[] = [];
      listOfLayerEntryConfig.forEach((entryConfig) => {
        layerPaths.push(entryConfig.layerPath);
        if (entryConfig.listOfLayerEntryConfig) {
          layerPaths.push(...getChildPaths(entryConfig.listOfLayerEntryConfig));
        }
      });
      return layerPaths;
    }

    const layerPaths = getChildPaths(parentLayerEntryConfig);
    return layerPaths;
  }

  #setLayerInVisibleRange(gvLayer: AbstractGVLayer | GVGroupLayer, layerConfig: TypeLayerEntryConfig): void {
    // Set the final maxZoom and minZoom values
    // Skip the GVGroupLayers since we don't want to prevent the children from loading if they aren't initially
    // in visible range. Inheritance has already been passed in the config and the group layer visibility will
    // be handled in the map-viewer's handleMapZoomEnd by checking the children visibility
    const mapView = this.mapViewer.getView();
    if ((layerConfig.initialSettings.maxZoom || layerConfig.getMaxScale()) && !(gvLayer instanceof GVGroupLayer)) {
      let maxScaleZoomLevel = getZoomFromScale(mapView, layerConfig.getMaxScale());
      maxScaleZoomLevel = maxScaleZoomLevel ? Math.ceil(maxScaleZoomLevel * 100) / 100 : undefined;
      const maxZoom = Math.min(layerConfig.initialSettings.maxZoom ?? Infinity, maxScaleZoomLevel ?? Infinity);
      gvLayer.setMaxZoom(maxZoom);
    }

    if ((layerConfig.initialSettings.minZoom || layerConfig.getMinScale()) && !(gvLayer instanceof GVGroupLayer)) {
      let minScaleZoomLevel = getZoomFromScale(mapView, layerConfig.getMinScale());
      minScaleZoomLevel = minScaleZoomLevel ? Math.ceil(minScaleZoomLevel * 100) / 100 : undefined;
      const minZoom = Math.max(layerConfig.initialSettings.minZoom ?? -Infinity, minScaleZoomLevel ?? -Infinity);
      gvLayer.setMinZoom(minZoom);
    }

    const zoom = mapView.getZoom() as number;
    const inVisibleRange = gvLayer.inVisibleRange(zoom);
    MapEventProcessor.setLayerInVisibleRange(this.getMapId(), gvLayer.getLayerPath(), inVisibleRange);
  }

  /**
   * Continues the addition of the geoview layer.
   * Adds the layer to the map if valid. If not (is a string) emits an error.
   * @param {AbstractGeoViewLayer} geoviewLayer - The layer
   * @private
   */
  #addToMap(geoviewLayer: AbstractGeoViewLayer): void {
    // If no root layer is set, forget about it
    if (!geoviewLayer.olRootLayer) return;

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.mapViewer.map.addLayer(geoviewLayer.olRootLayer);
    }

    // Log
    logger.logInfo(`GeoView Layer ${geoviewLayer.geoviewLayerId} added to map ${this.getMapId()}`, geoviewLayer);

    // Set the layer z indices
    MapEventProcessor.setLayerZIndices(this.getMapId());
  }

  /**
   * Registers layer information for the ordered layer info in the store.
   * @param {TypeLayerEntryConfig} layerConfig - The layer configuration to be reordered.
   * @private
   */
  #registerForOrderedLayerInfo(layerConfig: TypeLayerEntryConfig): void {
    // If the map index for the given layer path hasn't been set yet
    if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), layerConfig.layerPath) === -1) {
      // Get the parent layer path
      const parentLayerPathArray = layerConfig.layerPath.split('/');
      parentLayerPathArray.pop();
      const parentLayerPath = parentLayerPathArray.join('/');

      // If the map index of a parent layer path has been set and it is a valid UUID, the ordered layer info is a place holder
      // registered while the geocore layer info was fetched
      if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), parentLayerPath) !== -1 && isValidUUID(parentLayerPath)) {
        // Replace the placeholder ordered layer info
        MapEventProcessor.replaceOrderedLayerInfo(this.getMapId(), layerConfig, parentLayerPath);
      } else if (layerConfig.parentLayerConfig) {
        // Here the map index of a sub layer path hasn't been set and there's a parent layer config for the current layer config
        // Get the map index of the parent layer path
        const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), parentLayerPath);

        // Get the number of layers
        const numberOfLayers = MapEventProcessor.findMapLayerAndChildrenFromOrderedInfo(this.getMapId(), parentLayerPath).length;

        // If the map index of the parent has been set
        if (parentLayerIndex !== -1) {
          // Add the ordered layer information for the sub layer path based on the parent index + the number of child layers
          MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), layerConfig, parentLayerIndex + numberOfLayers);
        } else {
          // If we get here, something went wrong and we have a sub layer being registered before the parent
          logger.logError(`Sub layer ${layerConfig.layerPath} registered in layer order before parent layer`);
          MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), layerConfig.parentLayerConfig);
        }
      } else {
        // Add the orderedLayerInfo for layer that hasn't been set and has no parent layer or geocore placeholder
        MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), layerConfig);
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
      const geoviewLayer = this.getGeoviewLayer(layerConfig.layerPath);

      // If the layer is loaded AND flag is true to use time dimension, continue
      if (geoviewLayer instanceof AbstractGVLayer && geoviewLayer.getIsTimeAware() && geoviewLayer.getTimeDimension()) {
        // Check (if dimension is valid) and add time slider layer when needed
        TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.getMapId(), geoviewLayer);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // The error itself, regarding the loaded failure, is already being taken care of elsewhere.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
  }

  /**
   * Unregisters layer information from layer info store.
   * @param {ConfigBaseClass} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromOrderedLayerInfo(layerConfig: ConfigBaseClass): void {
    // Remove from ordered layer info
    MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from TimeSlider.
   * @param {ConfigBaseClass} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromTimeSlider(layerConfig: ConfigBaseClass): void {
    // Remove from the TimeSlider
    TimeSliderEventProcessor.removeTimeSliderLayer(this.getMapId(), layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from GeoChart.
   * @param {ConfigBaseClass} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromGeoChart(layerConfig: ConfigBaseClass): void {
    // Remove from the GeoChart Charts
    GeochartEventProcessor.removeGeochartChart(this.getMapId(), layerConfig.layerPath);
  }

  /**
   * Unregisters layer information from Swiper.
   * @param {ConfigBaseClass} layerConfig - The layer configuration to be unregistered.
   * @private
   */
  #unregisterFromSwiper(layerConfig: ConfigBaseClass): void {
    // Remove it from the Swiper
    SwiperEventProcessor.removeLayerPath(this.getMapId(), layerConfig.layerPath);
  }

  /**
   * Recursively gathers all bounds on the layers associated with the given layer path and store them in the bounds parameter.
   * @param {ConfigBaseClass} layerConfig - The layer config being processed
   * @param {Extent[]} bounds - The currently gathered bounds during the recursion
   */
  #gatherAllBoundsRec(layerConfig: ConfigBaseClass, bounds: Extent[]): void {
    // If a leaf
    if (layerConfig.getEntryTypeIsRegular()) {
      // Get the layer
      const layer = this.getGeoviewLayer(layerConfig.layerPath) as AbstractGVLayer;

      if (layer) {
        // Get the bounds of the layer
        const calculatedBounds = layer.getBounds(this.mapViewer.getProjection(), MapViewer.DEFAULT_STOPS);
        if (calculatedBounds) bounds.push(calculatedBounds);
      }
    } else if (layerConfig.getEntryTypeIsGroup()) {
      // Is a group
      layerConfig.listOfLayerEntryConfig.forEach((subLayerConfig) => {
        this.#gatherAllBoundsRec(subLayerConfig, bounds);
      });
    }
  }

  /**
   * Adds initial filters to layers, if provided.
   * @param {ConfigBaseClass} layerConfig - The layer config being processed
   */
  #addInitialFilters(layerConfig: ConfigBaseClass): void {
    // If correct subclass, otherwise skip
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // Get the layer filter
      const layerFilter = layerConfig.getLayerFilter();

      // If any layer filter
      if (layerFilter) {
        MapEventProcessor.addInitialFilter(this.getMapId(), layerConfig.layerPath, layerFilter);
      }
    }
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits an event to all handlers when a layer config has been flag as error.
   * @param {LayerConfigErrorEvent} event - The event to emit
   * @private
   */
  #emitLayerConfigError(event: LayerConfigErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigErrorHandlers, event);
  }

  /**
   * Registers a layer config error event handler.
   * @param {LayerConfigErrorDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Unregisters a layer config error event handler.
   * @param {LayerConfigErrorDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer config has been added.
   * @param {LayerBuilderEvent} event - The event to emit
   * @private
   */
  #emitLayerConfigAdded(event: LayerBuilderEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigAddedHandlers, event);
  }

  /**
   * Registers a layer config added event handler.
   * @param {LayerBuilderDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Unregisters a layer config added event handler.
   * @param {LayerBuilderDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerPathEvent} event - The event to emit
   * @private
   */
  #emitLayerConfigRemoved(event: LayerPathEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   * @param {LayerPathDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   * @param {LayerPathDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerEvent} event - The event to emit
   * @private
   */
  #emitLayerCreated(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerCreatedHandlers, event);
  }

  /**
   * Registers a layer created event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerCreated(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer created event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerCreated(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered handlers.
   * @param {LayerStatusChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerStatusChanged(event: LayerStatusChangedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer status is updated.
   * @param {LayerStatusChangedDelegate} callback - The callback function
   */
  onLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer status is updated.
   * @param {LayerStatusChangedDelegate} callback - The callback function to unregister
   */
  offLayerStatusChanged(callback: LayerStatusChangedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when all layers have turned into a loaded/error state on the map.
   * @param {LayerConfigEvent} event - The event to emit
   * @private
   */
  #emitLayerAllLoaded(event: LayerConfigEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAllLoadedHandlers, event);
  }

  /**
   * Registers a layer all loaded/error event handler.
   * @param {LayerConfigDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerAllLoaded(callback: LayerConfigDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer all loaded/error event handler.
   * @param {LayerConfigDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAllLoaded(callback: LayerConfigDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been loaded for the first time on the map.
   * @param {LayerEvent} event - The event to emit
   * @private
   */
  #emitLayerFirstLoaded(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedFirstHandlers, event);
  }

  /**
   * Registers a layer first loaded event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerFirstLoaded(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Unregisters a layer first loaded event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loading state on the map.
   * @param {LayerEvent} event - The event to emit
   * @private
   */
  #emitLayerLoading(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadingHandlers, event);
  }

  /**
   * Registers a layer loading event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoading(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters a layer loading event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loaded state on the map.
   * @param {LayerEvent} event - The event to emit
   * @private
   */
  #emitLayerLoaded(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been flag as error on the map.
   * @param {LayerErrorEvent} event - The event to emit
   * @private
   */
  #emitLayerError(event: LayerErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerErrorHandlers, event);
  }

  /**
   * Registers a layer error event handler.
   * @param {LayerErrorDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerError(callback: LayerErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Unregisters a layer error event handler.
   * @param {LayerErrorDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerError(callback: LayerErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Emits layer visibility toggled event.
   * @param {LayerVisibilityToggledEvent} event - The event to emit
   */
  #emitLayerVisibilityToggled(event: LayerVisibilityToggledEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer visibility toggled event handler.
   * @param {LayerVisibilityToggledDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer  visibility toggled event handler.
   * @param {LayerVisibilityToggledDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Emits layer item visibility toggled event.
   * @param {LayerItemVisibilityToggledEvent} event - The event to emit
   */
  #emitLayerItemVisibilityToggled(event: LayerItemVisibilityToggledEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerItemVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer item visibility toggled event handler.
   * @param {LayerItemVisibilityToggledDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer item visibility toggled event handler.
   * @param {LayerItemVisibilityToggledDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC

  /**
   * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
   * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, or standard GeoView),
   * this function processes each entry accordingly and wraps the result in a `Promise`.
   * Errors encountered during asynchronous operations are handled via a provided callback.
   * @param {string} mapId - The unique identifier of the map instance this configuration applies to.
   * @param {TypeDisplayLanguage} language - The language setting used for layer labels and metadata.
   * @param {MapConfigLayerEntry} entry - The array of layer entry to convert.
   * @param {(mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void} errorCallback - Callback invoked when an error occurs during layer processing.
   * @returns {Promise<TypeGeoviewLayerConfig>} The promise resolving to a `TypeGeoviewLayerConfig` object.
   */
  static convertMapConfigToGeoviewLayerConfig(
    mapId: string,
    language: TypeDisplayLanguage,
    entry: MapConfigLayerEntry,
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig> {
    // Depending on the map config layer entry type
    let promise: Promise<TypeGeoviewLayerConfig>;
    if (mapConfigLayerEntryIsGeoCore(entry)) {
      // Working with a GeoCore layer
      promise = GeoCore.createLayerConfigFromUUID(entry.geoviewLayerId, language, mapId, entry);
    } else if (mapConfigLayerEntryIsGeoPackage(entry)) {
      // Working with a geopackage layer
      promise = GeoPackageReader.createLayerConfigFromGeoPackage(entry as GeoPackageLayerConfig);
    } else if (mapConfigLayerEntryIsShapefile(entry)) {
      // Working with a shapefile layer
      promise = ShapefileReader.convertShapefileConfigToGeoJson(entry);
    } else {
      // Working with a standard GeoView layer
      promise = Promise.resolve(entry);
    }

    // Prepare to catch errors
    promise.catch((error) => {
      // Callback
      errorCallback?.(entry, error);
    });

    return promise;
  }

  /**
   * Converts a list of map configuration layer entries into an array of promises,
   * each resolving to one or more GeoView layer configuration objects.
   * @param {string} mapId - The unique identifier of the map instance this configuration applies to.
   * @param {TypeDisplayLanguage} language - The language setting used for layer labels and metadata.
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - The array of layer entries to convert.
   * @param {(mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void} errorCallback - Callback invoked when an error occurs during layer processing.
   * @returns {Promise<TypeGeoviewLayerConfig[]>[]} An array of promises, each resolving to an array of `TypeGeoviewLayerConfig` objects.
   */
  static convertMapConfigsToGeoviewLayerConfig(
    mapId: string,
    language: TypeDisplayLanguage,
    mapConfigLayerEntries: MapConfigLayerEntry[],
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig>[] {
    // For each layer entry
    return mapConfigLayerEntries.map((entry) => {
      // Redirect
      return LayerApi.convertMapConfigToGeoviewLayerConfig(mapId, language, entry, errorCallback);
    });
  }

  /**
   * Generate an array of layer info for the orderedLayerList.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The config to get the info from.
   * @returns {TypeOrderedLayerInfo[]} The array of ordered layer info.
   */
  static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig): TypeOrderedLayerInfo[] {
    const newOrderedLayerInfos: TypeOrderedLayerInfo[] = [];

    const addSubLayerPathToLayerOrder = (layerEntryConfig: TypeLayerEntryConfig, layerPath: string): void => {
      const subLayerPath = layerPath.endsWith(`/${layerEntryConfig.layerId}`) ? layerPath : `${layerPath}/${layerEntryConfig.layerId}`;

      const layerInfo: TypeOrderedLayerInfo = {
        layerPath: subLayerPath,
        visible: layerEntryConfig.initialSettings?.states?.visible !== false,
        queryable: layerEntryConfig.source?.featureInfo?.queryable !== undefined ? layerEntryConfig.source?.featureInfo?.queryable : true,
        hoverable:
          layerEntryConfig.initialSettings?.states?.hoverable !== undefined ? layerEntryConfig.initialSettings?.states?.hoverable : true,
        legendCollapsed:
          layerEntryConfig.initialSettings?.states?.legendCollapsed !== undefined
            ? layerEntryConfig.initialSettings.states.legendCollapsed
            : false,
        inVisibleRange: true,
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
        const layerPath = `${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}/base-group`;
        const layerInfo: TypeOrderedLayerInfo = {
          layerPath,
          legendCollapsed:
            geoviewLayerConfig.initialSettings?.states?.legendCollapsed !== undefined
              ? geoviewLayerConfig.initialSettings.states.legendCollapsed
              : false,
          visible: geoviewLayerConfig.initialSettings?.states?.visible !== false,
          inVisibleRange: true,
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
   * Creates an instance of a specific `AbstractGeoViewLayer` subclass based on the given GeoView layer configuration.
   * This function determines the correct layer type from the configuration and instantiates it accordingly.
   * @remarks
   * - This method currently supports GeoJSON, CSV, WMS, Esri Dynamic, Esri Feature, Esri Image,
   *   ImageStatic, WFS, OGC Feature, XYZ Tiles, and Vector Tiles.
   * - If the layer type is not supported, an error is thrown.
   * - TODO: Refactor to use the validated configuration with metadata already fetched.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The configuration object for the GeoView layer.
   * @param {string} mapProjectionForVectorTiles - The projection string to be used when creating Vector Tiles layers.
   * @returns {AbstractGeoViewLayer} An instance of the corresponding `AbstractGeoViewLayer` subclass.
   * @throws {NotSupportedError} If the configuration does not match any supported layer type.
   */
  createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer {
    // TODO: Refactor - Here the function should use the structure created by validation config with the metadata fetch and no need to pass the validation.
    if (layerConfigIsCSVFromType(geoviewLayerConfig)) {
      return new CSV(geoviewLayerConfig);
    }
    if (layerConfigIsEsriDynamicFromType(geoviewLayerConfig)) {
      return new EsriDynamic(geoviewLayerConfig);
    }
    if (layerConfigIsEsriFeatureFromType(geoviewLayerConfig)) {
      return new EsriFeature(geoviewLayerConfig);
    }
    if (layerConfigIsEsriImageFromType(geoviewLayerConfig)) {
      return new EsriImage(geoviewLayerConfig);
    }
    if (layerConfigIsGeoJSONFromType(geoviewLayerConfig)) {
      return new GeoJSON(geoviewLayerConfig);
    }
    if (layerConfigIsImageStaticFromType(geoviewLayerConfig)) {
      return new ImageStatic(geoviewLayerConfig);
    }
    if (layerConfigIsOgcFeatureFromType(geoviewLayerConfig)) {
      return new OgcFeature(geoviewLayerConfig);
    }
    if (layerConfigIsVectorTilesFromType(geoviewLayerConfig)) {
      return new VectorTiles(geoviewLayerConfig, this.mapViewer.getProjection());
    }
    if (layerConfigIsWFSFromType(geoviewLayerConfig)) {
      return new WFS(geoviewLayerConfig);
    }
    if (layerConfigIsWKBFromType(geoviewLayerConfig)) {
      return new WKB(geoviewLayerConfig);
    }
    if (layerConfigIsOgcWmsFromType(geoviewLayerConfig)) {
      return new WMS(geoviewLayerConfig, LayerApi.DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS);
    }
    if (layerConfigIsXYZTilesFromType(geoviewLayerConfig)) {
      return new XYZTiles(geoviewLayerConfig);
    }

    // Not implemented
    throw new NotSupportedError('Unsupported layer class type in createLayerConfigFromType');
  }

  // #endregion
}

export type GeoViewLayerAddedResult = {
  layer: AbstractGeoViewLayer;
  promiseLayer: Promise<void>;
};

// #region EVENTS & DELEGATES

/**
 * Define an event for the delegate
 */
export type LayerBuilderEvent = {
  layer: AbstractGeoViewLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerBuilderDelegate = EventDelegateBase<LayerApi, LayerBuilderEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerConfigErrorEvent = {
  // The layer path (or the geoview layer id) depending when the error occurs in the process
  layerPath: string;
  // The error
  error: string;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigErrorDelegate = EventDelegateBase<LayerApi, LayerConfigErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerEvent = {
  // The loaded layer
  layer: AbstractGVLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<LayerApi, LayerEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
  // The loaded layer
  layer: AbstractGVLayer;
  // The error
  error: unknown;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerErrorDelegate = EventDelegateBase<LayerApi, LayerErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerPathEvent = {
  // The layer path
  layerPath: string;
  // The layer name
  layerName: string;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerPathDelegate = EventDelegateBase<LayerApi, LayerPathEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerConfigEvent = {
  // The layer entry config
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigDelegate = EventDelegateBase<LayerApi, LayerConfigEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerStatusChangedEvent = {
  // The layer entry config changing layer status
  config: ConfigBaseClass;
  // The new status
  status: TypeLayerStatus;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerStatusChangedDelegate = EventDelegateBase<LayerApi, LayerStatusChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerVisibilityToggledEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // The new visibility
  visibility: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerVisibilityToggledEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerItemVisibilityToggledEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // Name of the item being toggled
  itemName: string;
  // The new visibility
  visibility: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerItemVisibilityToggledEvent, void>;

// #endregion EVENTS
