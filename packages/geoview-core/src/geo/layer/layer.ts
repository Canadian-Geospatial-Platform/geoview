import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import Collection from 'ol/Collection';
import { ImageArcGISRest, ImageWMS, Source, VectorTile, XYZ } from 'ol/source';
import Static from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';

import { GeoCore } from '@/geo/layer/other/geocore';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { createLocalizedString, generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer, LayerCreationEvent, LayerRequestingEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  layerEntryIsGroupLayer,
  TypeLayerStatus,
  TypeClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
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

import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { GeoViewLayerCreatedTwiceError, GeoViewLayerNotCreatedError } from '@/geo/layer/exceptions/layer-exceptions';
import { getExtentUnionMaybe, getMinOrMaxExtents } from '@/geo/utils/utilities';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { api } from '@/app';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVLayer } from './gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from './gv-layers/raster/gv-esri-dynamic';
import { GVEsriImage } from './gv-layers/raster/gv-esri-image';
import { GVImageStatic } from './gv-layers/raster/gv-image-static';
import { GVWMS } from './gv-layers/raster/gv-wms';
import { GVXYZTiles } from './gv-layers/tile/gv-xyz-tiles';
import { GVEsriFeature } from './gv-layers/vector/gv-esri-feature';
import { GVGeoJSON } from './gv-layers/vector/gv-geojson';
import { GVOGCFeature } from './gv-layers/vector/gv-ogc-feature';
import { GVVectorTiles } from './gv-layers/vector/gv-vector-tiles';
import { GVWFS } from './gv-layers/vector/gv-wfs';
import { GVCSV } from './gv-layers/vector/gv-csv';
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
// import { LayerMockup } from './layer-mockup';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { TypeLegendItem } from '@/core/components/layers/types';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';

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
  #gvLayers: { [layerPath: string]: AbstractGVLayer } = {};

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

  // ************************************************************
  // INDICATES IF USING HYBRID MODE WITH THE NEW GVLAYERS CLASSES
  // ************************************************************
  static LAYERS_HYBRID_MODE = false;

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
   * Gets the GeoView Layer Ids.
   * Note: those are different than the layer paths.
   * @returns {string[]} The GeoView Layer Ids
   */
  getGeoviewLayerIds(): string[] {
    return Object.keys(this.#geoviewLayers);
  }

  /**
   * Gets all GeoView Layers
   * @returns {AbstractGeoViewLayer[]} The GeoView Layers
   */
  getGeoviewLayers(): AbstractGeoViewLayer[] {
    return Object.values(this.#geoviewLayers);
  }

  /**
   * Returns the GeoView instance associated to the layer path.
   * The first element of the layerPath is the geoviewLayerId and this function will
   * work with either the geoViewLayerId or the layerPath.
   * @param {string} layerPath - The layer path (or in this case the geoviewLayerId) of the layer's configuration.
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractGeoViewLayer | undefined {
    // TODO: Refactor - This function will be replaced to return the new layer classes model
    // The first element of the layerPath is the geoviewLayerId
    return this.#geoviewLayers[layerPath.split('/')[0]];
  }

  /**
   * Temporary new function for migration purposes, replacing getGeoviewLayerIds
   * @returns The ids of the new Geoview Layers
   */
  getGeoviewLayerIdsNew(): string[] {
    return Object.keys(this.#gvLayers);
  }

  /**
   * Temporary new function for migration purposes, replacing getGeoviewLayers
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayersNew(): AbstractGVLayer[] {
    return Object.values(this.#gvLayers);
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
  getGeoviewLayerIdsHybrid(): string[] {
    // TODO: Refactor - This function will be replaced to jump to the new layer classes model
    // If new mode
    if (LayerApi.LAYERS_HYBRID_MODE) return this.getGeoviewLayerIdsNew();

    // Old mode
    return this.getGeoviewLayerIds();
  }

  /**
   * Hybrid function for migration purposes, bridging the gap between getGeoviewLayer and getGeoviewLayerNew
   * @param {string} layerPath - The layer path
   * @returns The new Geoview Layer
   */
  getGeoviewLayersHybrid(): AbstractGeoViewLayer[] | AbstractGVLayer[] {
    // TODO: Refactor - This function will be replaced to jump to the new layer classes model
    // If new mode
    if (LayerApi.LAYERS_HYBRID_MODE) return this.getGeoviewLayersNew();

    // Old mode
    return this.getGeoviewLayers();
  }

  /**
   * Hybrid function for migration purposes, bridging the gap between getGeoviewLayer and getGeoviewLayerNew
   * @param {string} layerPath - The layer path
   * @returns The new Geoview Layer or the old Geoview Layer
   */
  getGeoviewLayerHybrid(layerPath: string): AbstractGeoViewLayer | AbstractGVLayer | undefined {
    // TODO: Refactor - This function will be replaced to jump to the new layer classes model
    // If new mode
    if (LayerApi.LAYERS_HYBRID_MODE) return this.getGeoviewLayerNew(layerPath);

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
   * Obsolete function to set the layer configuration in the registered layers.
   */
  setLayerEntryConfigObsolete(layerConfig: ConfigBaseClass): void {
    // FIXME: This function should be deleted once the Layers refactoring is done. It unregisters and registers an updated layer entry config.
    // FIX.MECONT: This is because of the EsriDynamic and EsriFeature entry config being generated on-the-fly when registration of layer entry config has already happened.
    // Get the config already existing if any
    const alreadyExisting = this.#layerEntryConfigs[layerConfig.layerPath];
    if (alreadyExisting) {
      // Unregister the old one
      this.unregisterLayerConfig(alreadyExisting);
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
    // If new mode, get the OpenLayer layer as part of the new GVLayer design
    if (LayerApi.LAYERS_HYBRID_MODE) return this.getGeoviewLayerNew(layerPath)?.getOLLayer();

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
        legendCollapsed:
          layerEntryConfig.initialSettings?.states?.legendCollapsed !== undefined
            ? layerEntryConfig.initialSettings?.states?.legendCollapsed
            : false,
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
          legendCollapsed:
            geoviewLayerConfig.initialSettings?.states?.legendCollapsed !== undefined
              ? geoviewLayerConfig.initialSettings?.states?.legendCollapsed
              : false,
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
        const geoCore = new GeoCore(this.getMapId(), this.mapViewer.getDisplayLanguage());

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
                      this.getMapId(),
                    ]);
                  } else {
                    this.mapViewer.notifications.showError('validation.layer.genericError', [this.getMapId()]);
                  }
                });
              } else {
                // Layer failed to get created
                throw new GeoViewLayerNotCreatedError(geoviewLayerConfig.geoviewLayerId, this.getMapId());
              }
            } catch (error) {
              // Layer encountered a generic error when being created and added to the map

              // Log
              logger.logError(error);

              // TODO: Use a generic error message
              this.mapViewer.notifications.showError('validation.layer.genericError', [this.getMapId()]);
            }
          });
        });
      MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), orderedLayerInfos);
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
    api.maps[this.getMapId()].notifications.showError('validation.layer.usedtwice', [mapConfigLayerEntry.geoviewLayerId, this.getMapId()]);

    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.getMapId()}`);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   * @param {string} uuid - The GeoCore UUID to add to the map
   * @returns {Promise<void>} A promise which resolves when done adding
   */
  async addGeoviewLayerByGeoCoreUUID(uuid: string): Promise<void> {
    const geoCoreGeoviewLayerInstance = new GeoCore(this.getMapId(), this.mapViewer.getDisplayLanguage());
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
    ConfigValidation.validateListOfGeoviewLayerConfig(this.mapViewer.getDisplayLanguage(), [geoviewLayerConfig]);

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
      layerBeingAdded = new GeoJSON(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsGeoPackage(geoviewLayerConfig)) {
      layerBeingAdded = new GeoPackage(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsCSV(geoviewLayerConfig)) {
      layerBeingAdded = new CSV(this.getMapId(), geoviewLayerConfig);
    } else if (layerConfigIsWMS(geoviewLayerConfig)) {
      layerBeingAdded = new WMS(this.getMapId(), geoviewLayerConfig);
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
      // TODO: Refactor - Throw an Error when falling in this else and change return type to AbstractGeoViewLayer without undefined
    }

    // If created
    if (layerBeingAdded) {
      // Add in the geoviewLayers set
      this.#geoviewLayers[layerBeingAdded.geoviewLayerId] = layerBeingAdded;

      // For each layer entry config in the geoview layer
      layerBeingAdded.getAllLayerEntryConfigs().forEach((layerConfig) => {
        // Log
        logger.logDebug(`Layer entry config being registered for ${layerConfig.layerPath} on map ${this.getMapId()}`, layerConfig);

        // Register it
        this.registerLayerConfigInit(layerConfig);
      });

      // Register when layer entry config has become processed (catching on-the-fly layer entry configs as they are further processed)
      layerBeingAdded.onLayerEntryProcessed((geoviewLayer, event) => {
        // Log
        logger.logDebug(`Layer entry config processed for ${event.config.layerPath} on map ${this.getMapId()}`, event.config);

        // GV Do we need to register a layer entry config here? Leave the note for now
        // this.registerLayerConfigInit(layerConfig);
      });

      // Register hook when an OpenLayer source has been created
      layerBeingAdded.onLayerRequesting((geoviewLayer: AbstractGeoViewLayer, event: LayerRequestingEvent): BaseLayer | undefined => {
        // Log
        logger.logDebug(`Requesting layer for ${event.config.layerPath} on map ${this.getMapId()}`, event.config);

        // If new layers mode, create the corresponding GVLayer
        if (LayerApi.LAYERS_HYBRID_MODE) {
          const gvLayer = this.#createGVLayer(this.getMapId(), geoviewLayer, event.source, event.config, event.extraConfig);
          if (gvLayer) return gvLayer.getOLLayer();
        }

        // Don't provie any layer, working in old mode
        return undefined;
      });

      // Register hook when an OpenLayer layer has been created
      layerBeingAdded.onLayerCreation((geoviewLayer: AbstractGeoViewLayer, event: LayerCreationEvent) => {
        // Log
        logger.logDebug(`OpenLayer created for ${event.config.layerPath} on map ${this.getMapId()}`, event.config);

        // Keep a reference
        // This is tempting to put in the onLayerRequesting handler, but this one here also traps the LayerGroups
        this.#olLayers[event.config.layerPath] = event.layer;
      });

      // Create a promise about the layer will be on the map
      const promiseLayer = new Promise<void>((resolve, reject) => {
        // Continue the addition process
        layerBeingAdded!
          .createGeoViewLayers()
          .then(() => {
            // Register a hook when a layer is loaded on the map
            layerBeingAdded!.onIndividualLayerLoaded((sender, payload) => {
              // Log
              logger.logDebug(`${payload.layerPath} loaded on map ${this.getMapId()}`);
              this.#emitLayerLoaded({ layer: sender, layerPath: payload.layerPath });
            });

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
   * @param {ConfigBaseClass} layerConfig - The layer entry config to register
   */
  registerLayerConfigInit(layerConfig: ConfigBaseClass): void {
    // Log (keep the commented line for now)
    // logger.logDebug('registerLayerConfigInit', layerConfig.layerPath, layerConfig.layerStatus);

    // Keep it
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;

    // Register the layer entry config
    this.registerLayerConfigInLayerSets(layerConfig);
  }

  /**
   * Registers the layer config in the LayerApi to start managing it.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config to register
   */
  registerLayerConfigInLayerSets(layerConfig: ConfigBaseClass): void {
    // TODO: Refactor - Keeping this function separate from registerLayerConfigInit for now, because this registerLayerConfigUpdate was
    // TO.DOCONT: called in 'processListOfLayerEntryConfig' processes happening externally. I've since commented those calls to try
    // TO.DOCONT: things out. If things are stable, we can remove the dead code in the processListOfLayerEntryConfig and merge
    // TO.DOCONT: registerLayerConfigInit with registerLayerConfigUpdate

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

    // eslint-disable-next-line no-param-reassign
    layerConfig.layerStatus = 'registered';
  }

  /**
   * Registers the layer in the LayerApi layer-sets to start managing it.
   * This function may be used to start managing a layer in the UI when said layer has been created outside of the regular config->layer flow.
   * @param {AbstractGVLayer} layer - The layer to register
   */
  registerLayerInLayerSets(layer: AbstractGVLayer, layerPath: string): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Tell the layer sets about it
    this.#allLayerSets.forEach((layerSet) => {
      // Register the layer to the layer set
      layerSet.registerLayer(layer, layerPath).catch((error) => {
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
    config: ConfigBaseClass,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraConfig?: any
  ): AbstractGVLayer | undefined {
    // If new mode
    let metadata;
    let timeDimension;
    let style;
    if (LayerApi.LAYERS_HYBRID_MODE) {
      // Get the metadata and the time dimension information as processed
      metadata = geoviewLayer.getLayerMetadata(config.layerPath);
      timeDimension = geoviewLayer.getTemporalDimension(config.layerPath);
      style = geoviewLayer.getStyle(config.layerPath);

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

      // If good config
      if (config instanceof AbstractBaseLayerEntryConfig) {
        // If any metadata
        if (metadata) config.setMetadata(metadata);
      }
    }

    // Create the right GV Layer based on the OLLayer and config type
    let gvLayer;
    if (olSource instanceof ImageArcGISRest && config instanceof EsriDynamicLayerEntryConfig)
      gvLayer = new GVEsriDynamic(mapId, olSource, config);
    else if (olSource instanceof ImageArcGISRest && config instanceof EsriImageLayerEntryConfig)
      gvLayer = new GVEsriImage(mapId, olSource, config);
    else if (olSource instanceof Static && config instanceof ImageStaticLayerEntryConfig)
      gvLayer = new GVImageStatic(mapId, olSource, config);
    else if (olSource instanceof ImageWMS && config instanceof OgcWmsLayerEntryConfig)
      gvLayer = new GVWMS(mapId, olSource, config, extraConfig.layerCapabilities);
    else if (olSource instanceof VectorSource && config instanceof EsriFeatureLayerEntryConfig)
      gvLayer = new GVEsriFeature(mapId, olSource, config);
    else if (olSource instanceof VectorSource && config instanceof GeoJSONLayerEntryConfig)
      gvLayer = new GVGeoJSON(mapId, olSource, config);
    else if (olSource instanceof VectorSource && config instanceof OgcFeatureLayerEntryConfig)
      gvLayer = new GVOGCFeature(mapId, olSource, config);
    else if (olSource instanceof VectorSource && config instanceof WfsLayerEntryConfig) gvLayer = new GVWFS(mapId, olSource, config);
    else if (olSource instanceof VectorSource && config instanceof CsvLayerEntryConfig) gvLayer = new GVCSV(mapId, olSource, config);
    else if (olSource instanceof VectorTile && config instanceof VectorTilesLayerEntryConfig)
      gvLayer = new GVVectorTiles(mapId, olSource, config);
    else if (olSource instanceof XYZ && config instanceof XYZTilesLayerEntryConfig) gvLayer = new GVXYZTiles(mapId, olSource, config);

    // If created
    if (gvLayer) {
      // Keep track
      this.#gvLayers[config.layerPath] = gvLayer;

      // If any time dimension to inject
      if (timeDimension) gvLayer.setTemporalDimension(timeDimension);

      // If any style to inject
      if (style) gvLayer.setStyle(config.layerPath, style);

      // Initialize the layer, triggering the loaded/error status
      gvLayer.init();

      // Return the GVLayer
      return gvLayer;
    }

    // Couldn't create it
    logger.logError(`Unsupported GVLayer for ${config.layerPath}`);
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
        api.maps[this.getMapId()].notifications.showError('validation.layer.loadfailed', [layer, this.getMapId()]);

        this.#emitLayerError({ layerPath: layer });
      });
    }

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.mapViewer.map.addLayer(geoviewLayer.olRootLayer!);
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
      // Get the sub-layer-path
      const subLayerPath = layerConfig.layerPath.split('.')[1];

      // If the map index of a sub-layer-path has been set
      if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), subLayerPath) !== -1) {
        // Replace the order layer info of the layer with the index of the sub-layer-path by calling replaceOrderedLayerInfo
        MapEventProcessor.replaceOrderedLayerInfo(this.getMapId(), layerConfig, subLayerPath);
      } else if (layerConfig.parentLayerConfig) {
        // Here the map index of a sub-layer-path hasn't been set and there's a parent layer config for the current layer config
        // Get the sub-layer-path
        // TODO: Refactor - Sometimes we are getting the sub-layer-path by splitting on the '.' and sometimes on the '/'.
        // TO.DOCONT: This abstraction logic should be part of the ConfigBaseClass
        const parentLayerPathArray = layerConfig.layerPath.split('/');
        parentLayerPathArray.pop();
        const parentLayerPath = parentLayerPathArray.join('/');

        // Get the map index of the parent layer path
        const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.getMapId(), parentLayerPath);

        // Get the number of child layers
        const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.getMapId()).filter((layerInfo) =>
          layerInfo.layerPath.startsWith(parentLayerPath)
        ).length;

        // If the map index of the parent hasn't been set yet
        if (parentLayerIndex !== -1) {
          // Add the ordered layer information for the layer path based on the parent index + the number of child layers
          // TODO: Check - This addition seems wrong? Seems like it's not going to scale well when multiple layers/groups and a single index order
          MapEventProcessor.addOrderedLayerInfo(this.getMapId(), layerConfig, parentLayerIndex + numberOfLayers);
        } else {
          // Add the ordered layer information for the layer path based unshifting the current array by calling addOrderedLayerInfo
          // TODO: Check - Could use more comment here, not sure what it's meant for
          MapEventProcessor.addOrderedLayerInfo(this.getMapId(), layerConfig.parentLayerConfig!);
        }
      } else {
        // Here the map index of a sub-layer-path hasn't been set and there's no parent layer config for the current layer config
        // Add the ordered layer information for the layer path based unshifting the current array by calling addOrderedLayerInfo
        // TODO: Check - Could use more comment here, not sure what it's meant for
        MapEventProcessor.addOrderedLayerInfo(this.getMapId(), layerConfig);
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

      // If the layer is loaded AND flag is true to use time dimension, continue
      if (geoviewLayer && geoviewLayer.getIsTimeAware()) {
        // Check and add time slider layer when needed
        TimeSliderEventProcessor.checkInitTimeSliderLayerAndApplyFilters(this.getMapId(), layerConfig);
      }
    } catch (error) {
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // The error itself, regarding the loaded failure, is already being taken care of elsewhere.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
  }

  /**
   * Unregisters the layer in the LayerApi to stop managing it.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to unregister
   */
  unregisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Unregister from ordered layer info
    this.#unregisterFromOrderedLayerInfo(layerConfig);

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
    callbackNotGood?: (geoviewLayer: AbstractGeoViewLayer) => void
  ): [boolean, number] {
    // If no layer entries at all or there are layer entries and there are geoview layers to check
    let allGood = layerEntriesToCheck?.length === 0 || Object.keys(this.#geoviewLayers).length > 0;

    // For each registered layer entry
    this.getGeoviewLayers().forEach((geoviewLayer) => {
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
    // FIXME: Layers refactoring. When working in LAYERS_HYBRID_MODE=true, the GVLayers aren't created until the layer config gets in 'processed' layer status.
    // FIX.MECONT: Therefore, this can't remove the layers that failed due to for example bad metadataUrl.
    // FIX.MECONT: To effectively remove all layers in the UI boxes, this removal process should be using the 'LayerConfigs' (and the layer paths). Not the 'Layer' classes.
    // For each Geoview layers
    this.getGeoviewLayersHybrid().forEach((geoviewLayer) => {
      // Remove it
      this.removeLayerUsingPath(geoviewLayer.getGeoviewLayerId());
    });
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   * @param {string} layerPath - The path or ID of the layer to be removed
   */
  removeLayerUsingPath(layerPath: string): void {
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
      if (registeredLayerPath.startsWith(layerPath)) {
        // Remove ol layer
        if (this.getOLLayer(registeredLayerPath)) this.mapViewer.map.removeLayer(this.getOLLayer(registeredLayerPath) as BaseLayer);
        // Unregister layer
        this.unregisterLayerConfig(this.getLayerEntryConfig(registeredLayerPath)!);
        // Remove from registered layers
        delete this.#layerEntryConfigs[layerPath];
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
    const theLayerMain = this.getGeoviewLayerHybrid(layerPath);

    this.#highlightedLayer = { layerPath, originalOpacity: theLayerMain?.getOpacity(layerPath) };
    theLayerMain?.setOpacity(1, layerPath);

    // If it is a group layer, highlight sublayers
    if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath])) {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
        if (!registeredLayerPath.startsWith(layerPath) && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
          const otherOpacity = theLayer.getOpacity(registeredLayerPath);
          theLayer.setOpacity((otherOpacity || 1) * 0.25, registeredLayerPath);
        } else this.getOLLayer(registeredLayerPath)!.setZIndex(999);
      });
    } else {
      Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
        const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
        // check for otherOlLayer is undefined. It would be undefined if a layer status is error
        if (registeredLayerPath !== layerPath && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
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
      if (layerEntryIsGroupLayer(this.#layerEntryConfigs[layerPath])) {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
          if (!registeredLayerPath.startsWith(layerPath) && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
            const otherOpacity = theLayer.getOpacity(registeredLayerPath);
            theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else theLayer.setOpacity(originalOpacity || 1, registeredLayerPath);
        });
      } else {
        Object.keys(this.#layerEntryConfigs).forEach((registeredLayerPath) => {
          // check for otherOlLayer is undefined. It would be undefined if a layer status is error
          const theLayer = this.getGeoviewLayerHybrid(registeredLayerPath)!;
          if (registeredLayerPath !== layerPath && !layerEntryIsGroupLayer(this.#layerEntryConfigs[registeredLayerPath])) {
            const otherOpacity = theLayer.getOpacity(registeredLayerPath);
            theLayer.setOpacity(otherOpacity ? otherOpacity * 4 : 1, registeredLayerPath);
          } else theLayer.setOpacity(originalOpacity || 1, registeredLayerPath);
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
   * @param {string[]} layerIds - IDs of layer to get max extents from.
   * @returns {Extent} The overall extent.
   */
  getExtentOfMultipleLayers(layerIds: string[] = Object.keys(this.#layerEntryConfigs)): Extent {
    let bounds: Extent = [];

    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = Object.keys(this.#layerEntryConfigs).filter((layerPath) => layerPath.startsWith(layerId));

      // Get max extents from all selected layers.
      subLayerPaths.forEach((layerPath) => {
        // Get the bounds for the layer path
        const layerBounds = LegendEventProcessor.getLayerBounds(this.getMapId(), layerPath);
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
    this.getGeoviewLayers().forEach((geoviewLayer) => {
      if (geoviewLayer.olRootLayer) this.refreshBaseLayer(geoviewLayer.olRootLayer);
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
    const layer = this.getGeoviewLayerHybrid(layerPath);

    if (visibility && !MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), layerPath)) {
      MapEventProcessor.setOrToggleMapLayerVisibility(this.getMapId(), layerPath, true);
    }

    // Assign value to registered layer. This is use by applyFilter function to set visibility
    // TODO: check if we need to refactor to centralize attribute setting....
    // TODO: know issue when we toggle a default visibility item https://github.com/Canadian-Geospatial-Platform/geoview/issues/1564
    if (layer?.getStyle(layerPath)?.[item.geometryType]?.styleType === 'classBreaks') {
      const geometryStyleConfig = layer.getStyle(layerPath)![item.geometryType] as TypeClassBreakStyleConfig;
      const classBreakStyleInfo = geometryStyleConfig.classBreakStyleInfo.find((styleInfo) => styleInfo.label === item.name);
      if (classBreakStyleInfo) classBreakStyleInfo.visible = visibility;
      else geometryStyleConfig.defaultVisible = visibility;
    } else if (layer?.getStyle(layerPath)?.[item.geometryType]?.styleType === 'uniqueValue') {
      const geometryStyleConfig = layer.getStyle(layerPath)![item.geometryType] as TypeUniqueValueStyleConfig;
      const uniqueStyleInfo = geometryStyleConfig.uniqueValueStyleInfo.find((styleInfo) => styleInfo.label === item.name);
      if (uniqueStyleInfo) uniqueStyleInfo.visible = visibility;
      else geometryStyleConfig.defaultVisible = visibility;
    }

    // Update the legend layers if necessary
    if (updateLegendLayers) LegendEventProcessor.setItemVisibility(this.getMapId(), item, visibility);

    // Apply filter to layer (lazy casting here to access the function)
    (this.getGeoviewLayerHybrid(layerPath) as AbstractGeoViewVector).applyViewFilter?.(layerPath, '');

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
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): void {
    // Apply some visibility logic
    const curOrderedLayerInfo = MapEventProcessor.getMapLayerOrder(this.getMapId());
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), layerPath);
    // Determine the outcome of the new visibility based on parameters
    const newVisibility = newValue !== undefined ? newValue : !layerVisibility;
    const layerInfos = curOrderedLayerInfo.filter((info: { layerPath: string }) => info.layerPath.startsWith(layerPath));
    const parentLayerPathArray = layerPath.split('/');
    parentLayerPathArray.pop();
    const parentLayerPath = parentLayerPathArray.join('/');
    const parentLayerInfo = curOrderedLayerInfo.find((info: { layerPath: string }) => info.layerPath === parentLayerPath);

    layerInfos.forEach((layerInfo: { visible: boolean; layerPath: string }) => {
      if (layerInfo) {
        // If the new visibility is different than before
        if (newVisibility !== layerVisibility) {
          // Go for it
          // eslint-disable-next-line no-param-reassign
          layerInfo.visible = newVisibility;
          this.getGeoviewLayerHybrid(layerInfo.layerPath)?.setVisible(layerInfo.visible, layerInfo.layerPath);
          // Emit event
          this.#emitLayerVisibilityToggled({ layerPath: layerInfo.layerPath, visibility: layerInfo.visible });
        }
      }
    });

    if (parentLayerInfo !== undefined) {
      const parentLayerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(this.getMapId(), parentLayerPath);
      if ((!layerVisibility || newValue) && parentLayerVisibility === false) {
        if (parentLayerInfo) {
          parentLayerInfo.visible = true;
          this.getGeoviewLayerHybrid(parentLayerPath)?.setVisible(true, parentLayerPath);

          // Emit event
          this.#emitLayerVisibilityToggled({ layerPath: parentLayerPath, visibility: true });
        }
      }
      const children = curOrderedLayerInfo.filter(
        (info: { layerPath: string }) => info.layerPath.startsWith(parentLayerPath) && info.layerPath !== parentLayerPath
      );
      if (!children.some((child: { visible: boolean }) => child.visible === true)) {
        this.setOrToggleLayerVisibility(parentLayerPath, false);

        // Emit event
        this.#emitLayerVisibilityToggled({ layerPath, visibility: false });
      }
    }

    // Redirect to processor so we can update the store with setterActions
    MapEventProcessor.setOrToggleMapLayerVisibilityState(this.getMapId(), curOrderedLayerInfo);
  }

  /**
   * Renames a layer.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {string} name - The new name to use.
   */
  setLayerName(layerPath: string, name: string): void {
    // Get the layer
    const layer = this.getGeoviewLayerHybrid(layerPath);

    // If found
    if (layer) {
      // Set the layer name on the layer
      layer.setLayerName(layerPath, createLocalizedString(name));
    } else {
      logger.logError(`Unable to find layer ${layerPath}`);
    }
  }

  /**
   * Redefine feature info fields.
   *
   * @param {string} layerPath - The path of the layer.
   * @param {string} fieldNames - The new field names to use, separated by commas.
   * @param {'aliasFields' | 'outfields'} fields - The fields to change.
   */
  redefineFeatureFields(layerPath: string, fieldNames: string, fields: 'aliasFields' | 'outfields'): void {
    const layerConfig = this.#layerEntryConfigs[layerPath] as AbstractBaseLayerEntryConfig;
    if (!layerConfig) logger.logError(`Unable to find layer ${layerPath}`);
    else if (layerConfig.source?.featureInfo && layerConfig.source.featureInfo.queryable !== false)
      layerConfig.source.featureInfo[fields] = createLocalizedString(fieldNames);
    else logger.logError(`${layerPath} is not queryable`);
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
      boundsUnion = getExtentUnionMaybe(boundsUnion, bounds);
    });

    // Return the unioned bounds
    return boundsUnion;
  }

  /**
   * Recursively gathers all bounds on the layers associated with the given layer path and store them in the bounds parameter.
   * @param {ConfigBaseClass} layerConfig - The layer config being processed
   * @param {Extent[]} bounds - The currently gathered bounds during the recursion
   */
  #gatherAllBoundsRec(layerConfig: ConfigBaseClass, bounds: Extent[]): void {
    // If a leaf
    if (!layerEntryIsGroupLayer(layerConfig)) {
      // Get the bounds of the layer
      const calculatedBounds = this.getGeoviewLayerHybrid(layerConfig.layerPath)?.getBounds(layerConfig.layerPath);
      if (calculatedBounds) bounds.push(calculatedBounds);
    } else {
      // Is a group
      layerConfig.listOfLayerEntryConfig.forEach((subLayerConfig) => {
        this.#gatherAllBoundsRec(subLayerConfig, bounds);
      });
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
  layer: AbstractGeoViewLayer;
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
  layer: AbstractGeoViewLayer;

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
  // The error layer
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerRemovedDelegate = EventDelegateBase<LayerApi, LayerRemovedEvent, void>;

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
