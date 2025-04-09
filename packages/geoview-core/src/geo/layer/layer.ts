import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import Collection from 'ol/Collection';
import { ImageArcGISRest, ImageWMS, Source, VectorTile, XYZ } from 'ol/source';
import Static from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import LayerGroup from 'ol/layer/Group';
import { GeoJSONObject } from 'ol/format/GeoJSON';

import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { generateId, getLocalizedMessage, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import {
  AbstractGeoViewLayer,
  LayerEntryProcessedEvent,
  LayerRequestingEvent,
  LayerCreationEvent,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  layerEntryIsGroupLayer,
  TypeLayerStatus,
  GeoCoreLayerConfig,
} from '@/api/config/types/map-schema-types';
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

import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { GeoViewLayerCreatedTwiceError, GeoViewLayerLoadedFailedError } from '@/core/exceptions/layer-exceptions';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer, LayerMessageEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GVImageStatic } from '@/geo/layer/gv-layers/raster/gv-image-static';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVXYZTiles } from '@/geo/layer/gv-layers/tile/gv-xyz-tiles';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';
import { GVVectorTiles } from '@/geo/layer/gv-layers/vector/gv-vector-tiles';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import { GVCSV } from '@/geo/layer/gv-layers/vector/gv-csv';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { getExtentUnion, getZoomFromScale } from '@/geo/utils/utilities';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { TypeLegendItem } from '@/core/components/layers/types';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { ConfigApi } from '@/api/config/config-api';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';
// import { LayerMockup } from '@/geo/layer/layer-mockup';

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
  /** used to reference the map viewer */
  mapViewer: MapViewer;

  // used to access geometry API to create and manage geometries
  geometry: GeometryApi;

  // order to load layers
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

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

  // All the layer sets
  #allLayerSets: AbstractLayerSet[];

  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: { [layerPath: string]: ConfigBaseClass } = {};

  // Dictionary holding all the old geoview layers
  #geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  // Dictionary holding all the OpenLayers layers
  #olLayers: { [layerPath: string]: BaseLayer } = {};

  // Dictionary holding all the new GVLayers
  #gvLayers: { [layerPath: string]: AbstractBaseLayer } = {};

  /** used to keep a reference of highlighted layer */
  #highlightedLayer: { layerPath?: string; originalOpacity?: number } = {
    layerPath: undefined,
    originalOpacity: undefined,
  };

  // Keep all callback delegates references
  #onLayerAddedHandlers: LayerAddedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerLoadedHandlers: LayerLoadedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerErrorHandlers: LayerErrorDelegate[] = [];

  // Keep all callback delegates references
  #onLayerRemovedHandlers: LayerRemovedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerVisibilityToggledHandlers: LayerVisibilityToggledDelegate[] = [];

  // Keep all callback delegates references
  #onLayerItemVisibilityToggledHandlers: LayerItemVisibilityToggledDelegate[] = [];

  // Maximum time duration to wait when registering a layer for the time slider
  static #MAX_WAIT_TIME_SLIDER_REGISTRATION = 20000;

  // Temporary debugging flag indicating if we want the WMS group layers to have their sub layers fully blown up
  static DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS = false;

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
   * Attaches event handlers to a layer
   * @private
   * @param {AbstractGVLayer} gvLayer - The layer instance to attach events to
   * @returns {void}
   *
   * @fires LayerMessage - When a layer sends a message
   * @fires LayerLoaded - When an individual layer is loaded on the map
   *
   * @description
   * This method sets up the following event handlers:
   * - Layer message handling through onLayerMessage
   * - Layer loading completion through onIndividualLayerLoaded
   *   - Handles setting visible range properties
   *   - Manages legend information and bounds
   *
   * @private
   */
  #attachEventsOnLayer(gvLayer: AbstractGVLayer): void {
    // Add a handler on layer's message
    gvLayer.onLayerMessage(this.#handleLayerMessage.bind(this));

    // Register a hook when a layer is loaded on the map
    gvLayer.onIndividualLayerLoaded((sender, payload) => {
      // Log
      logger.logDebug(`LAYERS - 10 - ${payload.layerPath} loaded on map ${this.getMapId()}`);

      // Set in visible range property for all newly added layers
      this.#setLayerInVisibleRange(sender, gvLayer.getLayerConfig());

      // Ensure that the layer bounds are set when the layer is loaded
      const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(this.getMapId(), payload.layerPath);
      if (legendLayerInfo && !legendLayerInfo.bounds) LegendEventProcessor.getLayerBounds(this.getMapId(), payload.layerPath);

      this.#emitLayerLoaded({ layer: sender, layerPath: payload.layerPath });
    });
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
    const localMessage = getLocalizedMessage(layerMessageEvent.messageKey, this.mapViewer.getDisplayLanguage());

    if (layerMessageEvent.messageType === 'info') {
      this.mapViewer.notifications.showMessage(localMessage, layerMessageEvent.messageParams, layerMessageEvent.notification);
    } else if (layerMessageEvent.messageType === 'warning') {
      this.mapViewer.notifications.showWarning(localMessage, layerMessageEvent.messageParams, layerMessageEvent.notification);
    } else if (layerMessageEvent.messageType === 'error') {
      this.mapViewer.notifications.showError(localMessage, layerMessageEvent.messageParams, layerMessageEvent.notification);
    } else if (layerMessageEvent.messageType === 'success') {
      this.mapViewer.notifications.showSuccess(localMessage, layerMessageEvent.messageParams, layerMessageEvent.notification);
    }
  }

  /**
   * Obsolete function to set the layer configuration in the registered layers.
   */
  setLayerEntryConfigObsolete(layerConfig: ConfigBaseClass): void {
    // FIXME: This function should be deleted once the Layers refactoring is done. It unregisters and registers an updated layer entry config.
    // FIX.MECONT: This is because of the EsriDynamic and EsriFeature entry config being generated on-the-fly when registration of layer entry config has already happened.
    // Get the config already existing if any
    const alreadyExisting = this.#layerEntryConfigs[layerConfig.layerPath];
    if (alreadyExisting) {
      // Unregister the old one
      this.unregisterLayerConfig(alreadyExisting, false);
    }

    // Register this new one
    this.registerLayerConfigInit(layerConfig);
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
   * Load layers that was passed in with the map config
   * @param {MapConfigLayerEntry[]} mapConfigLayerEntries - An optional array containing layers passed within the map config
   * @returns {Promise<void>}
   */
  async loadListOfGeoviewLayer(mapConfigLayerEntries?: MapConfigLayerEntry[]): Promise<void> {
    const validGeoviewLayerConfigs = this.#deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // set order for layers to appear on the map according to config
    const promisesOfGeoCoreGeoviewLayers: Promise<TypeGeoviewLayerConfig[]>[] = [];
    for (let i = 0; i < validGeoviewLayerConfigs.length; i++) {
      const geoviewLayerConfig = validGeoviewLayerConfigs[i];

      // If the layer is GeoCore add it via the core function
      if (mapConfigLayerEntryIsGeoCore(geoviewLayerConfig)) {
        // Prep the GeoCore
        const geoCore = new GeoCore(this.getMapId(), this.mapViewer.getDisplayLanguage());

        // Create a promise to fetch from UUID
        const promise = geoCore.createLayersFromUUID(geoviewLayerConfig.geoviewLayerId, geoviewLayerConfig as GeoCoreLayerConfig);

        // Catch when the promise fails (if it does)
        promise.catch((error) => {
          // Log and show the error
          this.logAndShowLayerError(error, geoviewLayerConfig.geoviewLayerId);
        });

        // Add the promise to the array
        promisesOfGeoCoreGeoviewLayers.push(promise);
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
    const orderedLayerInfos: TypeOrderedLayerInfo[] = MapEventProcessor.getMapOrderedLayerInfo(this.getMapId()).length
      ? MapEventProcessor.getMapOrderedLayerInfo(this.getMapId())
      : [];
    const promisedLayers = await Promise.allSettled(promisesOfGeoCoreGeoviewLayers);
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
            this.addGeoviewLayer(geoviewLayerConfig);
          } catch (error) {
            // Log and show the error
            this.logAndShowLayerError(error, geoviewLayerConfig.geoviewLayerId);
          }
        });
      });

    // Init ordered layer info (?)
    MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), orderedLayerInfos);
  }

  /**
   * Show the errors that happened during layers loading.
   * If it's an aggregate error, log and show all of them.
   * If it's a regular error, log and show only that error.
   * @param error - The error to log and show.
   * @param geoviewLayerId - The Geoview layer id for which the error happened.
   */
  logAndShowLayerError(error: unknown, geoviewLayerId: string): void {
    // If an aggregation error
    if (error instanceof AggregateError) {
      // For each errors
      error.errors.forEach((layerError) => {
        // Recursive
        this.logAndShowLayerError(layerError, geoviewLayerId);
      });
    } else {
      // Read the message
      const errorMessage = error as string;

      // Read the layer path if possible, more precise
      let layerPathOrId = geoviewLayerId;
      if (error instanceof GeoViewLayerLoadedFailedError) {
        layerPathOrId = error.layerConfig.layerPath;
      }

      // Show error
      this.mapViewer.notifications.showError(errorMessage, [], true);

      // Emit about it
      this.#emitLayerError({ layerPath: layerPathOrId, error: errorMessage });
    }
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
          if (ConfigApi.isValidUUID(config.geoviewLayerConfig.geoviewLayerId) && config.parentLayerConfig === undefined) {
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
            sender.offLayerAdded(removeChildLayers);
          }
          this.onLayerAdded(removeChildLayers);
        });

        // Prepare listeners for changing the visibility
        MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), originalMapOrderedLayerInfo);
        originalMapOrderedLayerInfo.forEach((layerInfo) => {
          function setLayerVisibility(sender: LayerApi, event: LayerLoadedEvent): void {
            if (layerInfo.layerPath === event.layerPath) {
              const { visible } = originalMapOrderedLayerInfo.filter((info) => info.layerPath === event.layerPath)[0];
              event.layer?.setVisible(visible);
              sender.offLayerLoaded(setLayerVisibility);
            }
          }
          this.onLayerLoaded(setLayerVisibility);
        });
      })
      .catch((err) => logger.logError(err));
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

    // GV: This is here as a placeholder so that the layers will appear in the proper order,
    // GV: regardless of how quickly we get the response. It is removed if the layer fails.
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

    // Create geocore layer configs and add
    const geoCoreGeoviewLayerInstance = new GeoCore(this.getMapId(), this.mapViewer.getDisplayLanguage());

    try {
      // Create the layers from the UUID
      const layers = await geoCoreGeoviewLayerInstance.createLayersFromUUID(uuid, optionalConfig);
      layers.forEach((geoviewLayerConfig) => {
        // Redirect
        this.addGeoviewLayer(geoviewLayerConfig);
      });
    } catch (error) {
      // Log and show the error
      this.logAndShowLayerError(error, uuid);
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
    geoviewLayerConfig.geoviewLayerId = geoviewLayerConfig.geoviewLayerId || generateId();

    // TODO: Refactor - This should be dealt with the config classes and this line commented out
    ConfigValidation.validateListOfGeoviewLayerConfig(this.mapViewer.getDisplayLanguage(), [geoviewLayerConfig]);

    // TODO: Refactor - This should be dealt with the config classes and this line commented out, therefore, content of addGeoviewLayerStep2 becomes this addGeoviewLayer function.
    if (this.getGeoviewLayerIds().includes(geoviewLayerConfig.geoviewLayerId)) {
      // Throw that the geoview layer id was already created
      throw new GeoViewLayerCreatedTwiceError(this.getMapId(), geoviewLayerConfig.geoviewLayerId);
    } else {
      // Process the addition of the layer
      const result: GeoViewLayerAddedResult = this.#addGeoviewLayerStep2(geoviewLayerConfig);

      // Upon termination, we want to check if there was any errors and log/show them within this addGeoviewLayer function which can be called from external
      result.promiseLayer
        .then(() => {
          // Time to throw to log/show any/all errors that happened during the layer processing
          result.layer.throwAggregatedLayerLoadErrors();
        })
        .catch((error) => {
          // Log and show the error
          this.logAndShowLayerError(error, geoviewLayerConfig.geoviewLayerId);
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
    // TODO: Refactor - Here the function should use the structure created by validation config with the metadata fetch and no need to pass the validation.
    let layerBeingAdded: AbstractGeoViewLayer;
    if (layerConfigIsGeoJSON(geoviewLayerConfig)) {
      layerBeingAdded = new GeoJSON(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsGeoPackage(geoviewLayerConfig)) {
      layerBeingAdded = new GeoPackage(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsCSV(geoviewLayerConfig)) {
      layerBeingAdded = new CSV(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsWMS(geoviewLayerConfig)) {
      layerBeingAdded = new WMS(this.getMapId(), geoviewLayerConfig, LayerApi.DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS);
    } else if (layerConfigIsEsriDynamic(geoviewLayerConfig)) {
      layerBeingAdded = new EsriDynamic(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsEsriFeature(geoviewLayerConfig)) {
      layerBeingAdded = new EsriFeature(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsEsriImage(geoviewLayerConfig)) {
      layerBeingAdded = new EsriImage(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsImageStatic(geoviewLayerConfig)) {
      layerBeingAdded = new ImageStatic(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsWFS(geoviewLayerConfig)) {
      layerBeingAdded = new WFS(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsOgcFeature(geoviewLayerConfig)) {
      layerBeingAdded = new OgcFeature(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsXYZTiles(geoviewLayerConfig)) {
      layerBeingAdded = new XYZTiles(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsVectorTiles(geoviewLayerConfig)) {
      layerBeingAdded = new VectorTiles(this.getMapId(), geoviewLayerConfig);
    } else {
      // Not implemented
      throw new NotImplementedError('Unsupported layer class type');
    }

    // Add in the geoviewLayers set
    this.#geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

    // For each layer entry config in the geoview layer
    layerBeingAdded.getAllLayerEntryConfigs().forEach((layerConfig) => {
      // Log
      logger.logDebug(`LAYERS - 1 - Registering layer entry config ${layerConfig.layerPath} on map ${this.getMapId()}`, layerConfig);

      // Register it
      this.registerLayerConfigInit(layerConfig);

      // Add filters to map initial filters, if they exist
      this.#addInitialFilters(layerConfig);
    });

    // TODO: if we keep geoview layers, regroup the event like what we do for gv layers
    // Register the messsage handler
    layerBeingAdded.onLayerMessage(this.#handleLayerMessage.bind(this));

    // Register when layer entry config has become processed (catching on-the-fly layer entry configs as they are further processed)
    layerBeingAdded.onLayerEntryProcessed((geoviewLayer: AbstractGeoViewLayer, event: LayerEntryProcessedEvent) => {
      // Log
      logger.logDebug(
        `LAYERS - 6 - Layer entry config processed for ${event.config.layerPath} on map ${this.getMapId()}`,
        event.config.layerStatus,
        event.config
      );

      const selectedLayerPath =
        this.mapViewer.mapFeaturesConfig.footerBar?.selectedLayersLayerPath ||
        this.mapViewer.mapFeaturesConfig.appBar?.selectedLayersLayerPath;
      if (selectedLayerPath && event.config.layerPath.startsWith(selectedLayerPath))
        LegendEventProcessor.setSelectedLayersTabLayer(this.getMapId(), selectedLayerPath as string);
    });

    // Register hook when an OpenLayer source has been created
    layerBeingAdded.onLayerRequesting((geoviewLayer: AbstractGeoViewLayer, event: LayerRequestingEvent): BaseLayer => {
      // Log
      logger.logDebug(
        `LAYERS - 8 - Requesting layer for ${event.config.layerPath} on map ${this.getMapId()}`,
        event.config.layerStatus,
        event.config
      );

      // Create the corresponding GVLayer
      const gvLayer = this.#createGVLayer(this.getMapId(), geoviewLayer, event.source, event.config, event.extraConfig);

      // If found the GV layer
      if (gvLayer) {
        return gvLayer.getOLLayer();
      }

      throw new GeoViewError(this.getMapId(), 'Error, no corresponding GV layer');
    });

    // Register hook when an OpenLayer layer has been created
    layerBeingAdded.onLayerCreation((geoviewLayer: AbstractGeoViewLayer, event: LayerCreationEvent) => {
      // Log
      logger.logDebug(
        `LAYERS - 9 - OpenLayer created for ${event.config.layerPath} on map ${this.getMapId()}`,
        event.config.layerStatus,
        event.config
      );

      // Keep a reference
      // This is tempting to put in the onLayerRequesting handler, but this one here also traps the LayerGroups
      this.#olLayers[event.config.layerPath] = event.layer;

      // Create the corresponding GVLayer. If group layer was created
      if (event.layer instanceof LayerGroup && event.config instanceof GroupLayerEntryConfig) {
        // Create the GV Group Layer
        this.#createGVGroupLayer(this.getMapId(), event.layer, event.config);
      }
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

          // Emit about it
          this.#emitLayerAdded({ layer: layerBeingAdded });
        })
        .catch((error) => {
          // Reject it higher, because that's not where we want to handle the promise failure, we're returning the promise higher
          reject(error);
        });
    });

    // Return the layer with the promise it'll be on the map
    return { layer: layerBeingAdded, promiseLayer };
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
    this.#registerForTimeSlider(layerConfig as TypeLayerEntryConfig).catch((error) => {
      // Log
      logger.logPromiseFailed('in registration of layer for the time slider', error);
    });

    // Tell the layer sets about it
    this.#allLayerSets.forEach((layerSet) => {
      // Register the config to the layer set
      layerSet.registerLayerConfig(layerConfig);
    });

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
      layerSet.registerLayer(layer).catch((error) => {
        // Log
        logger.logPromiseFailed('in registerLayer in registerLayerUpdate', error);
      });
    });
  }

  /**
   * Creates a GVLayer based on the provided OLLayer and layer config.
   * @param mapId - The map id
   * @param geoviewLayer - The GeoView layer (just to retrieve config-calculated information from it)
   * @param olLayer - The OpenLayer layer
   * @param config - The layer config
   * @returns A new GV Layer which is kept track of in LayerApi and initialized
   */
  #createGVLayer(
    mapId: string,
    geoviewLayer: AbstractGeoViewLayer,
    olSource: Source,
    layerConfig: ConfigBaseClass,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraConfig?: any
  ): AbstractGVLayer | undefined {
    // Get the metadata and the time dimension information as processed
    // GV: We use the old abstractGeoviewLayer format as the GV layer is not created yet
    const { metadata } = geoviewLayer;
    const layerMetadata = geoviewLayer.getLayerMetadata(layerConfig.layerPath);
    const timeDimension = geoviewLayer.getTemporalDimension(layerConfig.layerPath);
    const style = geoviewLayer.getStyle(layerConfig.layerPath);

    // HACK: INJECT CONFIGURATION STUFF PRETENDNG THEY WERE PROCESSED
    // GV Keep this code commented in the source base for now
    // if (layerConfig.layerPath === 'esriFeatureLYR5/0') {
    //   metadata = LayerMockup.configTop100Metadata();
    // } else if (layerConfig.layerPath === 'nonmetalmines/5') {
    //   metadata = LayerMockup.configNonMetalMetadata();
    // } else if (layerConfig.layerPath === 'airborne_radioactivity/1') {
    //   metadata = LayerMockup.configAirborneMetadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/polygons.json') {
    //   metadata = LayerMockup.configPolygonsMetadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/lines.json') {
    //   metadata = LayerMockup.configLinesMetadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/icon_points.json') {
    //   metadata = LayerMockup.configIconPointsMetadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points.json') {
    //   metadata = LayerMockup.configPointsMetadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_1.json') {
    //   metadata = LayerMockup.configPoints1Metadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_2.json') {
    //   metadata = LayerMockup.configPoints2Metadata();
    // } else if (layerConfig.layerPath === 'geojsonLYR1/geojsonLYR1/point-feature-group/points_3.json') {
    //   metadata = LayerMockup.configPoints3Metadata();
    // } else if (layerConfig.layerPath === 'historical-flood/0') {
    //   metadata = LayerMockup.configHistoricalFloodMetadata();
    //   timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
    // } else if (layerConfig.layerPath === 'uniqueValueId/1') {
    //   metadata = LayerMockup.configCESIMetadata();
    //   // timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
    // } else if (layerConfig.layerPath === 'esriFeatureLYR1/0') {
    //   metadata = LayerMockup.configTemporalTestBedMetadata();
    //   // timeDimension = LayerMockup.configHistoricalFloodTemporalDimension();
    // } else if (layerConfig.layerPath === 'wmsLYR1-spatiotemporel/RADAR_1KM_RSNO') {
    //   metadata = LayerMockup.configRadarMetadata();
    //   timeDimension = LayerMockup.configRadarTemporalDimension();
    // } else if (layerConfig.layerPath === 'MSI/msi-94-or-more') {
    //   metadata = LayerMockup.configMSIMetadata();
    //   timeDimension = LayerMockup.configMSITemporalDimension();
    // }

    // If good config
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // If any metadata
      if (metadata) layerConfig.setServiceMetadata(metadata);
      if (layerMetadata) layerConfig.setLayerMetadata(layerMetadata);
    }

    // Create the right GV Layer based on the OLLayer and config type
    let gvLayer;
    if (olSource instanceof ImageArcGISRest && layerConfig instanceof EsriDynamicLayerEntryConfig)
      gvLayer = new GVEsriDynamic(mapId, olSource, layerConfig);
    else if (olSource instanceof ImageArcGISRest && layerConfig instanceof EsriImageLayerEntryConfig)
      gvLayer = new GVEsriImage(mapId, olSource, layerConfig);
    else if (olSource instanceof Static && layerConfig instanceof ImageStaticLayerEntryConfig)
      gvLayer = new GVImageStatic(mapId, olSource, layerConfig);
    else if (olSource instanceof ImageWMS && layerConfig instanceof OgcWmsLayerEntryConfig)
      gvLayer = new GVWMS(mapId, olSource, layerConfig, extraConfig.layerCapabilities);
    else if (olSource instanceof VectorSource && layerConfig instanceof EsriFeatureLayerEntryConfig)
      gvLayer = new GVEsriFeature(mapId, olSource, layerConfig);
    else if (olSource instanceof VectorSource && layerConfig instanceof GeoJSONLayerEntryConfig)
      gvLayer = new GVGeoJSON(mapId, olSource, layerConfig);
    else if (olSource instanceof VectorSource && layerConfig instanceof OgcFeatureLayerEntryConfig)
      gvLayer = new GVOGCFeature(mapId, olSource, layerConfig);
    else if (olSource instanceof VectorSource && layerConfig instanceof WfsLayerEntryConfig)
      gvLayer = new GVWFS(mapId, olSource, layerConfig);
    else if (olSource instanceof VectorSource && layerConfig instanceof CsvLayerEntryConfig)
      gvLayer = new GVCSV(mapId, olSource, layerConfig);
    else if (olSource instanceof VectorTile && layerConfig instanceof VectorTilesLayerEntryConfig)
      gvLayer = new GVVectorTiles(mapId, olSource, layerConfig);
    else if (olSource instanceof XYZ && layerConfig instanceof XYZTilesLayerEntryConfig)
      gvLayer = new GVXYZTiles(mapId, olSource, layerConfig);

    // If created
    if (gvLayer) {
      // Keep track
      this.#gvLayers[layerConfig.layerPath] = gvLayer;

      // If any time dimension to inject
      if (timeDimension) gvLayer.setTemporalDimension(timeDimension);

      // If any style to inject
      if (style) gvLayer.setStyle(style);

      // Initialize the layer, triggering the loaded/error status
      gvLayer.init();

      // Attach the events handler
      this.#attachEventsOnLayer(gvLayer);

      // Return the GVLayer
      return gvLayer;
    }

    // Couldn't create it
    logger.logError(`Unsupported GVLayer for ${layerConfig.layerPath}`);
    return undefined;
  }

  /**
   * Creates a GVLayer based on the provided OLLayer and layer config.
   * @param mapId - The map id
   * @param geoviewLayer - The GeoView layer (just to retrieve config-calculated information from it)
   * @param olLayer - The OpenLayer layer
   * @param config - The layer config
   * @returns A new GV Layer which is kept track of in LayerApi and initialized
   */
  #createGVGroupLayer(mapId: string, olLayerGroup: LayerGroup, layerConfig: GroupLayerEntryConfig): GVGroupLayer | undefined {
    // Create the GV Group Layer
    const gvGroupLayer = new GVGroupLayer(mapId, olLayerGroup, layerConfig);

    // Keep track
    this.#gvLayers[layerConfig.layerPath] = gvGroupLayer;

    // Set in visible range property for all newly added layers
    this.#setLayerInVisibleRange(gvGroupLayer, layerConfig);

    // Return the GV Group Layer
    return gvGroupLayer;
  }

  #setLayerInVisibleRange(gvLayer: AbstractGVLayer | GVGroupLayer, layerConfig: TypeLayerEntryConfig): void {
    // Set the final maxZoom and minZoom values
    // Skip the GVGroupLayers since we don't want to prevent the children from loading if they aren't initially
    // in visible range. Inheritance has already been passed in the config and the group layer visibility will
    // be handled in the map-viewer's handleMapZoomEnd by checking the children visibility
    const mapView = this.mapViewer.getView();
    if ((layerConfig.initialSettings.maxZoom || layerConfig.maxScale) && !(gvLayer instanceof GVGroupLayer)) {
      let maxScaleZoomLevel = getZoomFromScale(mapView, layerConfig.maxScale);
      maxScaleZoomLevel = maxScaleZoomLevel ? Math.ceil(maxScaleZoomLevel * 100) / 100 : undefined;
      const maxZoom = Math.min(layerConfig.initialSettings.maxZoom ?? Infinity, maxScaleZoomLevel ?? Infinity);
      gvLayer.setMaxZoom(maxZoom);
    }

    if ((layerConfig.initialSettings.minZoom || layerConfig.minScale) && !(gvLayer instanceof GVGroupLayer)) {
      let minScaleZoomLevel = getZoomFromScale(mapView, layerConfig.minScale);
      minScaleZoomLevel = minScaleZoomLevel ? Math.ceil(minScaleZoomLevel * 100) / 100 : undefined;
      const minZoom = Math.max(layerConfig.initialSettings.minZoom ?? -Infinity, minScaleZoomLevel ?? -Infinity);
      gvLayer.setMinZoom(minZoom);
    }

    const zoom = mapView.getZoom() as number;
    const inVisibleRange = gvLayer.inVisibleRange(zoom) as boolean;
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
      if (
        MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), parentLayerPath) !== -1 &&
        ConfigApi.isValidUUID(parentLayerPath)
      ) {
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
          MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), layerConfig.parentLayerConfig!);
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
      if (geoviewLayer instanceof AbstractGVLayer && geoviewLayer.getIsTimeAware()) {
        // Check and add time slider layer when needed
        TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.getMapId(), layerConfig);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // The error itself, regarding the loaded failure, is already being taken care of elsewhere.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
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
   * Checks if the layer results sets are all greater than or equal to the provided status
   */
  checkLayerStatus(
    status: TypeLayerStatus,
    layerEntriesToCheck: MapConfigLayerEntry[] | undefined,
    callbackNotGood?: (layerConfig: ConfigBaseClass) => void
  ): [boolean, number] {
    // If no layer entries at all or there are layer entries and there are geoview layers to check
    let allGood = layerEntriesToCheck?.length === 0 || this.getGeoviewLayerIds().length > 0;

    // For each registered layer entry
    this.getLayerEntryConfigs().forEach((layerConfig) => {
      const layerIsGood = ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo(status, [layerConfig]);
      if (!layerIsGood) {
        // Callback about it
        callbackNotGood?.(layerConfig);
        allGood = false;
      }
    });

    // Return if all good
    return [allGood, this.getGeoviewLayerIds().length];
  }

  /**
   * Checks if the layer results sets are all ready using the resultSet from the FeatureInfo LayerSet
   */
  checkFeatureInfoLayerResultSetsReady(callbackNotReady?: (layerEntryConfig: AbstractBaseLayerEntryConfig) => void): boolean {
    // For each registered layer entry
    let allGood = true;
    this.getLayerEntryConfigs().forEach((layerConfig) => {
      // If not instance of AbstractBaseLayerEntryConfig, don't expect a result set
      if (!(layerConfig instanceof AbstractBaseLayerEntryConfig)) return;
      // If not queryable, don't expect a result set
      if (!layerConfig.source?.featureInfo?.queryable) return;

      const { resultSet } = this.featureInfoLayerSet;
      const layerResultSetReady = Object.keys(resultSet).includes(layerConfig.layerPath);
      if (!layerResultSetReady) {
        // Callback about it
        callbackNotReady?.(layerConfig);
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

    // initialize these two constant now because we will delete the information used to get their values.
    const indexToDelete = this.#layerEntryConfigs[layerPath]
      ? this.#layerEntryConfigs[layerPath].parentLayerConfig?.listOfLayerEntryConfig.findIndex(
          (layerConfig) => layerConfig === this.#layerEntryConfigs[layerPath]
        )
      : undefined;
    const listOfLayerEntryConfigAffected = this.#layerEntryConfigs[layerPath]?.parentLayerConfig?.listOfLayerEntryConfig;

    // Remove layer info from registered layers
    this.getLayerEntryConfigIds().forEach((registeredLayerPath) => {
      if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
        // Remove actual OL layer from the map
        if (this.getOLLayer(registeredLayerPath)) this.mapViewer.map.removeLayer(this.getOLLayer(registeredLayerPath) as BaseLayer);

        // Unregister layer config from the application
        this.unregisterLayerConfig(this.getLayerEntryConfig(registeredLayerPath)!);

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
        delete this.#geoviewLayers[layerPathNodes[0]];
        const { mapFeaturesConfig } = this.mapViewer;

        // TODO: refactor - remove cast
        if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
          mapFeaturesConfig.map.listOfGeoviewLayerConfig = (mapFeaturesConfig.map.listOfGeoviewLayerConfig as MapConfigLayerEntry[]).filter(
            (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== layerPath
          );
      } else if (layerPathNodes.length === 2) {
        const updatedListOfLayerEntryConfig = geoviewLayer.listOfLayerEntryConfig.filter(
          (entryConfig) => entryConfig.layerId !== layerPathNodes[1]
        );
        geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
      } else {
        // For layer paths more than two deep, drill down through listOfLayerEntryConfigs to layer entry config to remove
        let layerEntryConfig = geoviewLayer.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[1]);

        for (let i = 1; i < layerPathNodes.length; i++) {
          if (i === layerPathNodes.length - 1 && layerEntryConfig) {
            // When we get to the top level, remove the layer entry config
            const updatedListOfLayerEntryConfig = layerEntryConfig.listOfLayerEntryConfig.filter(
              (entryConfig) => entryConfig.layerId !== layerPathNodes[i]
            );
            geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
          } else if (layerEntryConfig) {
            // Not on the top level, so update to the latest
            layerEntryConfig = layerEntryConfig.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[i]);
          }
        }
      }
    }

    // Emit about it
    this.#emitLayerRemoved({ layerPath });

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
    if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath])) {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
        const theLayer = this.getGeoviewLayer(registeredLayerPath);
        if (theLayer) {
          if (
            !(registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) &&
            !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])
          ) {
            const otherOpacity = theLayer.getOpacity();
            theLayer.setOpacity((otherOpacity || 1) * 0.25);
          } else this.getOLLayer(registeredLayerPath)!.setZIndex(999);
        }
      });
    } else {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
        const theLayer = this.getGeoviewLayer(registeredLayerPath);
        if (theLayer) {
          if (registeredLayerPath !== layerPath && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
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
      if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath])) {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
          const theLayer = this.getGeoviewLayer(registeredLayerPath);
          if (theLayer) {
            if (
              !(registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) &&
              !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])
            ) {
              const otherOpacity = theLayer.getOpacity();
              theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1);
            } else theLayer.setOpacity(originalOpacity || 1);
          }
        });
      } else {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          // Trying to get the layer associated with the layer path, can be undefined because the layer might be in error
          const theLayer = this.getGeoviewLayer(registeredLayerPath);
          if (theLayer) {
            if (registeredLayerPath !== layerPath && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
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
  getExtentOfMultipleLayers(layerIds: string[] = Object.keys(this.#layerEntryConfigs)): Extent {
    let bounds: Extent = [];

    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = Object.keys(this.#layerEntryConfigs).filter(
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
      if (geoviewLayer) this.refreshBaseLayer(geoviewLayer.getOLLayer());
    });
  }

  /**
   * Refresh geoview layer source.
   * @param {BaseLayer} baseLayer - The layer to refresh.
   */
  refreshBaseLayer(baseLayer: BaseLayer): void {
    // Check if the passed layer is a group
    const layerGroup: Array<BaseLayer> | Collection<BaseLayer> | undefined = baseLayer.get('layers');

    // Update all layers in group, or update source of layer
    if (layerGroup) {
      layerGroup.forEach((baseLayerEntry) => {
        this.refreshBaseLayer(baseLayerEntry);
      });
    } else {
      const layerSource: Source = baseLayer.get('source');
      layerSource.refresh();
    }
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

    if (visibility && !MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), layerPath)) {
      MapEventProcessor.setOrToggleMapLayerVisibility(this.getMapId(), layerPath, true);
    }

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
    const curOrderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(this.getMapId());
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), layerPath);
    // Determine the outcome of the new visibility based on parameters
    const newVisibility = newValue !== undefined ? newValue : !layerVisibility;
    const layerInfos = MapEventProcessor.findMapLayerAndChildrenFromOrderedInfo(this.getMapId(), layerPath, curOrderedLayerInfo);

    layerInfos.forEach((layerInfo: TypeOrderedLayerInfo) => {
      if (layerInfo) {
        // If the new visibility is different than before
        if (newVisibility !== layerVisibility) {
          // Go for it
          // eslint-disable-next-line no-param-reassign
          layerInfo.visible = newVisibility;
          this.getGeoviewLayer(layerInfo.layerPath)?.setVisible(layerInfo.visible);
          // Emit event
          this.#emitLayerVisibilityToggled({ layerPath: layerInfo.layerPath, visibility: layerInfo.visible });
        }
      }
    });

    // For each parent
    const parentLayerPathArray = layerPath.split('/');
    parentLayerPathArray.pop();
    let parentLayerPath = parentLayerPathArray.join('/');
    let parentLayerInfo = curOrderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);
    while (parentLayerInfo !== undefined) {
      const parentLayerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), parentLayerPath);
      if ((!layerVisibility || newValue) && parentLayerVisibility === false) {
        if (parentLayerInfo) {
          parentLayerInfo.visible = true;
          this.getGeoviewLayer(parentLayerPath)?.setVisible(true);

          // Emit event
          this.#emitLayerVisibilityToggled({ layerPath: parentLayerPath, visibility: true });
        }
      }
      const children = curOrderedLayerInfo.filter(
        // eslint-disable-next-line no-loop-func
        (info: TypeOrderedLayerInfo) => info.layerPath.startsWith(`${parentLayerPath}/`) && info.layerPath !== parentLayerPath
      );
      if (!children.some((child: TypeOrderedLayerInfo) => child.visible === true)) {
        this.setOrToggleLayerVisibility(parentLayerPath, false);

        // Emit event
        this.#emitLayerVisibilityToggled({ layerPath, visibility: false });
      }

      // Prepare for next parent
      parentLayerPathArray.pop();
      parentLayerPath = parentLayerPathArray.join('/');
      // eslint-disable-next-line no-loop-func
      parentLayerInfo = curOrderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);
    }

    // Redirect to processor so we can update the store with setterActions
    MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), curOrderedLayerInfo);

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

    // If of right type
    if (gvLayer instanceof GVGeoJSON) {
      // Override the GeoJson source
      gvLayer.setGeojsonSource(geojson);

      // Update the bounds in the store
      const bounds = gvLayer.getBounds();
      if (bounds) {
        LegendEventProcessor.setLayerBounds(mapId, layerPath, bounds);
      }

      // Reset the feature info result set
      FeatureInfoEventProcessor.resetResultSet(mapId, layerPath, 'name');

      // Update feature info
      DataTableEventProcessor.triggerGetAllFeatureInfo(mapId, layerPath).catch((error) => {
        // Log
        logger.logPromiseFailed(`Update all feature info in setGeojsonSource failed for layer ${layerPath}`, error);
      });
    } else {
      // Invalid layer
      throw new GeoViewError(mapId, `The layer ${layerPath} isn't of type Geojson.`);
    }
  }

  /**
   * Redefine feature info fields.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {string} fieldNames - The new field names to use, separated by commas.
   * @param {'alias' | 'name'} fields - The fields to change.
   */
  redefineFeatureFields(layerPath: string, fieldNames: string, fields: 'alias' | 'name'): void {
    const layerConfig = this.#layerEntryConfigs[layerPath] as AbstractBaseLayerEntryConfig;

    if (!layerConfig) logger.logError(`Unable to find layer ${layerPath}`);
    else if (
      layerConfig.source?.featureInfo &&
      layerConfig.source.featureInfo.queryable !== false &&
      layerConfig.source.featureInfo.outfields
    ) {
      // Convert the provided field names to an array so we can index
      const fieldValues = fieldNames.split(',');
      if (layerConfig.source.featureInfo.outfields.length === fieldValues.length)
        // Override existing values in each outfield with provided field name
        layerConfig.source.featureInfo.outfields?.forEach((outfield, index) => {
          // eslint-disable-next-line no-param-reassign
          outfield[fields] = fieldValues[index];
        });
      else logger.logError(`Number of provided names for layer ${layerPath} does not match number of fields`);
    } else logger.logError(`${layerPath} is not queryable`);
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
   * Recursively gathers all bounds on the layers associated with the given layer path and store them in the bounds parameter.
   * @param {ConfigBaseClass} layerConfig - The layer config being processed
   * @param {Extent[]} bounds - The currently gathered bounds during the recursion
   */
  #gatherAllBoundsRec(layerConfig: ConfigBaseClass, bounds: Extent[]): void {
    // If a leaf
    if (!layerEntryIsGroupLayer(layerConfig)) {
      // Get the layer
      const layer = this.getGeoviewLayer(layerConfig.layerPath) as AbstractGVLayer;

      if (layer) {
        // Get the bounds of the layer
        const calculatedBounds = layer.getBounds();
        if (calculatedBounds) bounds.push(calculatedBounds);
      }
    } else {
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
    if (
      (
        layerConfig as
          | VectorLayerEntryConfig
          | EsriDynamicLayerEntryConfig
          | EsriImageLayerEntryConfig
          | ImageStaticLayerEntryConfig
          | OgcWmsLayerEntryConfig
      ).layerFilter
    )
      MapEventProcessor.addInitialFilter(
        this.getMapId(),
        layerConfig.layerPath,
        (layerConfig as VectorLayerEntryConfig).layerFilter as string
      );
  }

  // #region EVENTS

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
   * Emits an event to all handlers when the layer's features have been loaded on the map.
   * @param {LayerLoadedEvent} event - The event to emit
   * @private
   */
  #emitLayerLoaded(event: LayerLoadedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   * @param {LayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: LayerLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   * @param {LayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: LayerLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's features have been flag as error on the map.
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
   * Emits an event to all handlers.
   * @param {LayerRemovedEvent} event - The event to emit
   * @private
   */
  #emitLayerRemoved(event: LayerRemovedEvent): void {
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
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerAddedDelegate = EventDelegateBase<LayerApi, LayerAddedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerAddedEvent = {
  // The added layer
  // GV: We need the AbstractGeoViewLayer because of addToMap function
  layer: AbstractGeoViewLayer | AbstractGVLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerLoadedDelegate = EventDelegateBase<LayerApi, LayerLoadedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerLoadedEvent = {
  // The loaded layer
  layer: AbstractGVLayer;

  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerErrorDelegate = EventDelegateBase<LayerApi, LayerErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
  // The layer path (or the geoview layer id) depending when the error occurs in the process
  layerPath: string;
  // The error
  error: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerRemovedDelegate = EventDelegateBase<LayerApi, LayerRemovedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerRemovedEvent = {
  // The remove layer
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerVisibilityToggledEvent, void>;

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
type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerItemVisibilityToggledEvent, void>;

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
