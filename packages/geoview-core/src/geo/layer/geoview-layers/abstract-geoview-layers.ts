import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import Source from 'ol/source/Source';

import { generateId, whenThisThen } from '@/core/utils/utilities';
import { TypeJsonObject } from '@/core/types/global-types';
import { TimeDimension, TypeDateFragments, DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeLayerStyleConfig,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeStyleGeometry,
  CONST_LAYER_ENTRY_TYPES,
} from '@/geo/map/map-schema-types';
import { GeoViewLayerCreatedTwiceError } from '@/core/exceptions/layer-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { SnackbarType } from '@/core/utils/notifications';

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  CSV: 'CSV Layer',
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  esriImage: 'Esri Image Layer',
  imageStatic: 'Static Image Layer',
  GeoJSON: 'GeoJson Layer',
  GeoPackage: 'GeoPackage Layer',
  xyzTiles: 'XYZ Tiles',
  vectorTiles: 'Vector Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export abstract class AbstractGeoViewLayer {
  // The default hit tolerance the query should be using
  static DEFAULT_HIT_TOLERANCE: number = 4;

  // The default hit tolerance
  hitTolerance: number = AbstractGeoViewLayer.DEFAULT_HIT_TOLERANCE;

  /** The map id on which the GeoView layer will be drawn. */
  mapId: string;

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  geoviewLayerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  geoviewLayerName: string = '';

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: string = '';

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /** Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1. */
  initialSettings?: TypeLayerInitialSettings;

  /** layers of listOfLayerEntryConfig that did not load. */
  layerLoadError: { layer: string; layerName?: string | undefined; loggerMessage: string }[] = [];

  /** The OpenLayer root layer representing this GeoView Layer. */
  olRootLayer?: BaseLayer;

  /** The service metadata. */
  metadata: TypeJsonObject | null = null;

  /** Layer metadata */
  #layerMetadata: Record<string, TypeJsonObject> = {};

  /** Layer temporal dimension indexed by layerPath. */
  #layerTemporalDimension: Record<string, TimeDimension> = {};

  /** Style to apply to the layer. */
  #layerStyle: Record<string, TypeLayerStyleConfig> = {};

  /** Attribution used in the OpenLayer source. */
  #attributions: string[] = [];

  /** Date format object used to translate server to ISO format and ISO to server format */
  serverDateFragmentsOrder?: TypeDateFragments;

  /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
  externalFragmentsOrder: TypeDateFragments;

  /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
  #isTimeAware: boolean = true;

  // Keep all callback delegates references
  #onLayerStyleChangedHandlers: LayerStyleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerEntryProcessedHandlers: LayerEntryProcessedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerRequestingHandlers: LayerRequestingDelegate[] = [];

  // Keep all callback delegate references
  #onLayerCreationHandlers: LayerCreationDelegate[] = [];

  // Keep all callback delegates references
  #onIndividualLayerLoadedHandlers: IndividualLayerLoadedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerMessageHandlers: LayerMessageDelegate[] = [];

  /** ***************************************************************************************************************************
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
   * @param {string} mapId - The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.geoviewLayerId = geoviewLayerConfig.geoviewLayerId || generateId('');
    this.geoviewLayerName = geoviewLayerConfig?.geoviewLayerName ? geoviewLayerConfig.geoviewLayerName : DEFAULT_LAYER_NAMES[type];
    if (geoviewLayerConfig.metadataAccessPath) this.metadataAccessPath = geoviewLayerConfig.metadataAccessPath.trim();
    this.initialSettings = geoviewLayerConfig.initialSettings;
    this.serverDateFragmentsOrder = geoviewLayerConfig.serviceDateFormat
      ? DateMgt.getDateFragmentsOrder(geoviewLayerConfig.serviceDateFormat)
      : undefined;
    this.externalFragmentsOrder = DateMgt.getDateFragmentsOrder(geoviewLayerConfig.externalDateFormat);
    this.#isTimeAware = geoviewLayerConfig.isTimeAware === undefined ? true : geoviewLayerConfig.isTimeAware;
    this.#setListOfLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * Set the list of layer entry configuration and initialize the registered layer object and register all layers to layer sets.
   *
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration options.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   * @private
   */
  #setListOfLayerEntryConfig(geoviewLayerConfig: TypeGeoviewLayerConfig, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    if (listOfLayerEntryConfig.length === 0) return;
    if (listOfLayerEntryConfig.length === 1) {
      this.listOfLayerEntryConfig = listOfLayerEntryConfig;
    } else {
      const layerGroup = new GroupLayerEntryConfig({
        geoviewLayerConfig: listOfLayerEntryConfig[0].geoviewLayerConfig,
        layerId: this.getGeoviewLayerId(),
        layerName: this.geoviewLayerName,
        isMetadataLayerGroup: false,
        initialSettings: geoviewLayerConfig.initialSettings,
        listOfLayerEntryConfig,
      } as GroupLayerEntryConfig);

      this.listOfLayerEntryConfig = [layerGroup];
      layerGroup.listOfLayerEntryConfig.forEach((layerConfig) => {
        // eslint-disable-next-line no-param-reassign
        layerConfig.parentLayerConfig = layerGroup;
      });
    }

    this.listOfLayerEntryConfig[0].geoviewLayerConfig.listOfLayerEntryConfig = listOfLayerEntryConfig;
  }

  /**
   * Gets the MapViewer where the layer resides
   * @returns {MapViewer} The MapViewer
   */
  getMapViewer(): MapViewer {
    // GV The GVLayers need a reference to the MapViewer to be able to perform operations.
    // GV This is a trick to obtain it. Otherwise, it'd need to be provided via constructor.
    return MapEventProcessor.getMapViewer(this.mapId);
  }

  /**
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerId(): string {
    return this.geoviewLayerId;
  }

  /** ***************************************************************************************************************************
   * Gets the layer configuration of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
   */
  getLayerConfig(layerPath: string): ConfigBaseClass | undefined {
    // Trick to get a layer config from a layer class
    return this.getMapViewer().layer.getLayerEntryConfig(layerPath);
  }

  /** ***************************************************************************************************************************
   * Gets the OpenLayer of the specified layer path.
   *
   * @param {string} layerPath The layer path.
   *
   * @returns {BaseLayer | undefined} The layer configuration or undefined if not found.
   */
  getOLLayer(layerPath: string): BaseLayer | undefined {
    // Trick to get an open layer layer from a layer class
    return this.getMapViewer().layer.getOLLayer(layerPath);
  }

  /**
   * Gets the layer status
   * @returns The layer status
   */
  getLayerStatus(layerPath: string): TypeLayerStatus {
    // Take the layer status from the config, temporary patch until layers refactoring is done
    return this.getLayerConfig(layerPath)!.layerStatus;
  }

  /**
   * Gets the layer style
   * @returns The layer style
   */
  getStyle(layerPath: string): TypeLayerStyleConfig | undefined {
    return this.#layerStyle[layerPath];
  }

  /**
   * Sets the layer style
   * @param {TypeLayerStyleConfig | undefined} style - The layer style
   */
  setStyle(layerPath: string, style: TypeLayerStyleConfig): void {
    this.#layerStyle[layerPath] = style;
    this.#emitLayerStyleChanged({ style, layerPath });
  }

  /**
   * Gets the layer attributions
   * @returns {string[]} The layer attributions
   */
  getAttributions(): string[] {
    return this.#attributions;
  }

  /**
   * Sets the layer attributions
   * @param {string[]} attributions - The layer attributions
   */
  setAttributions(attributions: string[]): void {
    this.#attributions = attributions;
  }

  /** ***************************************************************************************************************************
   * Get the layer metadata that is associated to the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TypeJsonObject} The layer metadata.
   */
  getLayerMetadata(layerPath: string): TypeJsonObject {
    return this.#layerMetadata[layerPath];
  }

  /** ***************************************************************************************************************************
   * Set the layer metadata for the layer identified by specified layerPath.
   *
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   * @param {TypeJsonObject} layerMetadata The value to assign to the layer metadata property.
   */
  setLayerMetadata(layerPath: string, layerMetadata: TypeJsonObject): void {
    this.#layerMetadata[layerPath] = layerMetadata;
  }

  /** ***************************************************************************************************************************
   * Get the temporal dimension that is associated to the layer. Returns undefined when the layer config can't be found using the layer
   * path.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
   */
  getTemporalDimension(layerPath: string): TimeDimension {
    return this.#layerTemporalDimension[layerPath];
  }

  /** ***************************************************************************************************************************
   * Set the layerTemporalDimension for the layer identified by specified layerPath.
   *
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   * @param {TimeDimension} temporalDimension The value to assign to the layer temporal dimension property.
   */
  setTemporalDimension(layerPath: string, temporalDimension: TimeDimension): void {
    this.#layerTemporalDimension[layerPath] = temporalDimension;
  }

  /**
   * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
   * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default..
   */
  getIsTimeAware(): boolean {
    return this.#isTimeAware;
  }

  /** ***************************************************************************************************************************
   * Recursively process the list of layer entries to count all layers in error.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   *                                                        (default: this.listOfLayerEntryConfig).
   *
   * @returns {number} The number of layers in error.
   */
  countErrorStatus(listOfLayerEntryConfig: TypeLayerEntryConfig[] = this.listOfLayerEntryConfig): number {
    return listOfLayerEntryConfig.reduce((counter: number, layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) return counter + this.countErrorStatus(layerConfig.listOfLayerEntryConfig);
      if ((layerConfig as AbstractBaseLayerEntryConfig).layerStatus === 'error') return counter + 1;
      return counter;
    }, 0);
  }

  /** ***************************************************************************************************************************
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
   * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
   * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
   * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
   * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
   * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
   * the method processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not
   * have a service definition, the getAdditionalServiceDefinition method does nothing.
   *
   * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
   * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
   * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  async createGeoViewLayers(): Promise<void> {
    if (!this.olRootLayer) {
      // Log
      logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - createGeoViewLayers', this.listOfLayerEntryConfig);

      // Try to get a key for logging timings
      let logTimingsKey;
      if (this.listOfLayerEntryConfig.length > 0) logTimingsKey = `${this.mapId} | ${this.listOfLayerEntryConfig[0].layerPath}`;

      // Log
      if (logTimingsKey) logger.logMarkerStart(logTimingsKey);

      // Get additional service and await
      await this.getAdditionalServiceDefinition();

      // Log the time it took thus far
      if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to get additional service definition');

      // Process list of layers and await
      this.olRootLayer = await this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

      // Log the time it took thus far
      if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to process list of layer entry config');
    } else {
      // Raise error
      throw new GeoViewLayerCreatedTwiceError(this.mapId, this as unknown as AbstractGVLayer);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  protected async getAdditionalServiceDefinition(): Promise<void> {
    try {
      await this.fetchServiceMetadata();
      if (this.listOfLayerEntryConfig.length) await this.validateAndExtractLayerMetadata();
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method Validate the list of layer configs and extract them in the geoview instance.
   */
  async validateAndExtractLayerMetadata(): Promise<void> {
    try {
      // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
      this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
      await this.processListOfLayerEntryMetadata(this.listOfLayerEntryConfig);
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async fetchServiceMetadata(): Promise<void> {
    if (this.metadataAccessPath) {
      try {
        const url = this.metadataAccessPath.toLowerCase().endsWith('json') ? this.metadataAccessPath : `${this.metadataAccessPath}?f=json`;
        const response = await fetch(url);
        const metadataJson: TypeJsonObject = await response.json();
        if (!metadataJson) this.metadata = null;
        else {
          this.metadata = metadataJson;
          const copyrightText = this.metadata.copyrightText as string;
          const attributions = this.getAttributions();
          if (copyrightText && !attributions.includes(copyrightText)) {
            // Add it
            attributions.push(copyrightText);
            this.setAttributions(attributions);
          }
        }
      } catch (error) {
        // Log
        logger.logError(error);
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    }
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the "layer list" configuration.
   *
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async processListOfLayerEntryMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void> {
    try {
      const promisedAllLayerDone: Promise<ConfigBaseClass>[] = [];
      for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
        const layerConfig = listOfLayerEntryConfig[i];
        if (layerEntryIsGroupLayer(layerConfig))
          if (layerConfig.isMetadataLayerGroup) promisedAllLayerDone.push(this.#processMetadataGroupLayer(layerConfig));
          // eslint-disable-next-line no-await-in-loop
          else await this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig);
        else promisedAllLayerDone.push(this.processLayerMetadata(layerConfig as AbstractBaseLayerEntryConfig));
      }
      const arrayOfLayerConfigs = await Promise.all(promisedAllLayerDone);
      arrayOfLayerConfigs.forEach((layerConfig) => {
        if (layerConfig.layerStatus === 'error') {
          // TODO: refactor - create meaningful message and centralize dispatch for layer - config
          // We do not log the error here, it will be trapped in setAllLayerStatusTo
          const message = `Error while loading layer path ${layerConfig.layerPath} on map ${this.mapId}`;
          throw new Error(message);
        } else {
          // When we get here, we know that the metadata (if the service provide some) are processed.

          //
          // TODO: Refactor - Layers refactoring. Make it a super clear function when moving config information in the layer for real.
          // TO.DOCONT: After this point(?) the layerConfig should be full static and the system should rely on the Layer class to do stuff.
          //
          // Save the style in the layer as we're done processing style found in metadata
          if (layerConfig instanceof AbstractBaseLayerEntryConfig) this.setStyle(layerConfig.layerPath, layerConfig.layerStyle!);

          // We need to signal to the layer sets that the 'processed' phase is done.
          layerConfig.setLayerStatusProcessed();
          this.#emitLayerEntryProcessed({ config: layerConfig });
        }
      });
    } catch (error) {
      // Log
      logger.logError(error);
    }
  }

  /**
   * Processes metadata group layer entries. These layers behave as a GeoView group layer and also as a data
   * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
   * the presence of an isMetadataLayerGroup attribute set to true.
   *
   * @param {GroupLayerEntryConfig} layerConfig The layer entry configuration to process.
   * @returns {Promise<GroupLayerEntryConfig>} A promise that the vector layer configuration has its metadata and group layers processed.
   * @private
   */
  async #processMetadataGroupLayer(layerConfig: GroupLayerEntryConfig): Promise<GroupLayerEntryConfig> {
    try {
      // Process the list of layer entry
      await this.processListOfLayerEntryMetadata(layerConfig.listOfLayerEntryConfig!);

      // Set the layer status to processed
      layerConfig.setLayerStatusProcessed();

      // Emit event about the layer entry being processed
      this.#emitLayerEntryProcessed({ config: layerConfig });
    } catch (error) {
      // Log
      logger.logError(error);
      // TODO: Check - Shouldn't we just remove the try/catch and handle this higher in the
      // TO.DOCONT: stack? When is it going to get to 'error' status otherwise?
    }

    // Return the received layer config object
    return layerConfig;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration when applicable.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = {};
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: false };

    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries to process.
   * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
   */
  async processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | undefined> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - processListOfLayerEntryConfig', listOfLayerEntryConfig);

    try {
      if (listOfLayerEntryConfig.length === 0) return undefined;
      if (listOfLayerEntryConfig.length === 1) {
        if (layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0], listOfLayerEntryConfig[0].initialSettings!);
          const groupReturned = await this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup);
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            return groupReturned;
          }
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[0].layerPath,
            layerName: listOfLayerEntryConfig[0].layerName,
            loggerMessage: `Unable to create group layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
          });
          return undefined;
        }

        if ((listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig).layerStatus === 'error') return undefined;
        const { layerPath } = listOfLayerEntryConfig[0];
        const baseLayer = await this.#processOneLayerEntry(listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig);
        if (baseLayer) {
          if (layerGroup) layerGroup!.getLayers().push(baseLayer!);
          return layerGroup || baseLayer;
        }
        this.layerLoadError.push({
          layer: listOfLayerEntryConfig[0].layerPath,
          layerName: listOfLayerEntryConfig[0].layerName,
          loggerMessage: `Unable to create layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
        });
        this.getLayerConfig(layerPath)!.setLayerStatusError();
        return undefined;
      }

      if (!layerGroup) {
        // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
        // eslint-disable-next-line no-param-reassign
        layerGroup = this.createLayerGroup(
          (listOfLayerEntryConfig[0] as AbstractBaseLayerEntryConfig).parentLayerConfig as TypeLayerEntryConfig,
          listOfLayerEntryConfig[0].initialSettings!
        );
      }
      const promiseOfLayerCreated: Promise<BaseLayer | undefined>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig, i) => {
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[i], listOfLayerEntryConfig[i].initialSettings!);
          promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!, newLayerGroup));
        } else if ((listOfLayerEntryConfig[i] as AbstractBaseLayerEntryConfig).layerStatus === 'error')
          promiseOfLayerCreated.push(Promise.resolve(undefined));
        else {
          promiseOfLayerCreated.push(this.#processOneLayerEntry(layerConfig as AbstractBaseLayerEntryConfig));
        }
      });
      const listOfLayerCreated = await Promise.all(promiseOfLayerCreated);
      listOfLayerCreated.forEach((baseLayer, i) => {
        const { layerPath } = listOfLayerEntryConfig[i];
        if (baseLayer) {
          layerGroup!.getLayers().push(baseLayer);
        } else {
          this.layerLoadError.push({
            layer: listOfLayerEntryConfig[i].layerPath,
            layerName: listOfLayerEntryConfig[i].layerName,
            loggerMessage: `Unable to create ${
              layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? CONST_LAYER_ENTRY_TYPES.GROUP : ''
            } layer ${listOfLayerEntryConfig[i].layerPath} on map ${this.mapId}`,
          });

          // Set the layer status to error
          this.getLayerConfig(layerPath)!.setLayerStatusError();
        }
      });

      return layerGroup!;
    } catch (error) {
      // Log
      logger.logError(error);
      return undefined;
    }
  }

  /**
   * Processes a layer entry and returns a Promise of an Open Layer Base Layer object or undefined.
   * This method sets the 'loading' status on the layer config and then calls the overridable method 'onProcessOneLayerEntry'.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  #processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer> {
    // Indicate that the layer config has entered the 'loading' status
    layerConfig.setLayerStatusLoading();

    // Call the overridable method to process the layer entry
    return this.onProcessOneLayerEntry(layerConfig);
  }

  /**
   * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object or undefined.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  protected abstract onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer>;

  /** ***************************************************************************************************************************
   * Creates a layer group.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
   * @returns {LayerGroup} A new layer group.
   */
  protected createLayerGroup(layerConfig: TypeLayerEntryConfig, initialSettings: TypeLayerInitialSettings): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerConfig },
    };
    if (initialSettings?.extent !== undefined) layerGroupOptions.extent = initialSettings.extent;
    if (initialSettings?.states?.opacity !== undefined) layerGroupOptions.opacity = initialSettings.states.opacity;

    // Create the OpenLayer layer
    const layerGroup = new LayerGroup(layerGroupOptions);

    // Emit about it
    this.emitLayerCreation({ config: layerConfig, layer: layerGroup });

    // Return it
    return layerGroup;
  }

  /**
   * Emits a layer-specific message event with localization support
   * @protected
   * @param {string} messageKey - The key used to lookup the localized message OR message
   * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
   * @param {SnackbarType} messageType - The message type
   * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
   * @returns {void}
   *
   * @example
   * this.emitMessage(
   *   'layers.fetchProgress',
   *   ['50', '100'],
   *   messageType: 'error',
   *   true
   * );
   *
   * @fires LayerMessageEvent
   */
  protected emitMessage(
    messageKey: string,
    messageParams: string[],
    messageType: SnackbarType = 'info' as SnackbarType,
    notification: boolean = false
  ): void {
    this.#emitLayerMessage({ messageKey, messageParams, messageType, notification });
  }

  /**
   * Overridable function called when the layer gets in error status.
   * @param layerConfig - The layer configuration
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  onError(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Set the layer status to error
    layerConfig.setLayerStatusError();
  }

  /** ***************************************************************************************************************************
   * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
   *
   * @param {TypeLayerStatus} newStatus The new status to assign to the layers.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration.
   * @param {string} errorMessage The error message.
   */
  setAllLayerStatusTo(newStatus: TypeLayerStatus, listOfLayerEntryConfig: TypeLayerEntryConfig[], errorMessage?: string): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.setAllLayerStatusTo(newStatus, layerConfig.listOfLayerEntryConfig, errorMessage);
      else {
        if (layerConfig.layerStatus === 'error') return;

        // Update the layer status
        layerConfig.setLayerStatus(newStatus);

        // If the status is error
        if (newStatus === 'error') {
          const { layerPath, layerName } = layerConfig;
          const useLayerName = layerName === undefined ? layerConfig.geoviewLayerConfig.geoviewLayerName : layerName;
          this.layerLoadError.push({
            layer: layerPath,
            layerName: useLayerName || layerPath,
            loggerMessage: `${errorMessage} for layer ${layerPath} of map ${this.mapId}`,
          });
        }
      }
    });
  }

  /** ***************************************************************************************************************************
   * Recursively processes the list of layer entries to see if all of them are greater than or equal to the provided layer status.
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
   */
  allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    // Redirect
    return ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo(layerStatus, this.listOfLayerEntryConfig);
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
  async waitForAllLayerStatusAreGreaterThanOrEqualTo(timeout?: number, checkFrequency?: number): Promise<void> {
    // Wait for the processed phase
    await whenThisThen(
      () => {
        return this.allLayerStatusAreGreaterThanOrEqualTo('processed');
      },
      timeout,
      checkFrequency
    );

    // Resolve successfully, otherwise an exception has been thrown already
    return Promise.resolve();
  }

  /**
   * Recursively gets all layer entry configs in the GeoView Layer.
   * @returns {ConfigBaseClass[]} The list of layer entry configs
   */
  getAllLayerEntryConfigs(): ConfigBaseClass[] {
    // Prepare the container
    const allLayerEntryConfigs: ConfigBaseClass[] = [];

    // Call recursive method on each root
    this.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
      // Call
      this.#getAllLayerEntryConfigsRec(allLayerEntryConfigs, layerEntryConfig);
    });

    // Return the list
    return allLayerEntryConfigs;
  }

  /**
   * Recursively gathers the layer entry configs
   * @param {ConfigBaseClass[]} totalList - The total gathered thus far
   * @param {TypeLayerEntryConfig} currentNode - The current layer entry config being worked on
   */
  #getAllLayerEntryConfigsRec(totalList: ConfigBaseClass[], currentNode: TypeLayerEntryConfig): void {
    // Add it
    totalList.push(currentNode);

    // For each children
    currentNode.listOfLayerEntryConfig?.forEach((layerEntryConfig) => {
      // Go recursive
      this.#getAllLayerEntryConfigsRec(totalList, layerEntryConfig);
    });
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerEntryProcessedEvent} event The event to emit
   * @private
   */
  #emitLayerEntryProcessed(event: LayerEntryProcessedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryProcessedHandlers, event);
  }

  /**
   * Registers a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Unregisters a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerRequestingEvent} event The event to emit
   * @private
   */
  protected emitLayerRequesting(event: LayerRequestingEvent): BaseLayer[] {
    // Emit the event for all handlers
    return EventHelper.emitEvent(this, this.#onLayerRequestingHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerRequestingDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerRequesting(callback: LayerRequestingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerRequestingHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerRequestingDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerRequesting(callback: LayerRequestingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRequestingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerCreationEvent} event The event to emit
   * @private
   */
  protected emitLayerCreation(event: LayerCreationEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerCreationHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerCreationDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerCreation(callback: LayerCreationDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreationHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerCreationDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerCreation(callback: LayerCreationDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreationHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerStyleChangedEvent} event - The event to emit
   */
  #emitLayerStyleChanged(event: LayerStyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStyleChangedHandlers, event);
  }

  /**
   * Registers a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Registers an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's sent a message.
   * @param {LayerMessageEvent} event - The event to emit
   * @private
   */
  #emitLayerMessage(event: LayerMessageEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerMessageHandlers, event);
  }

  /**
   * Registers an individual layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerMessage(callback: LayerMessageDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Unregisters an individual layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerMessage(callback: LayerMessageDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerMessageHandlers, callback);
  }

  // #endregion
}

/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = {
  layerPath: string;
};

/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
  layerPath: string;
  legend: TypeLegend;
};

/**
 * Define an event for the delegate
 */
export type VisibleChangedEvent = {
  layerPath: string;
  visible: boolean;
};

/**
 * Define an event for the delegate
 */
export type LayerEntryProcessedEvent = {
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryProcessedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryProcessedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerRequestingEvent = {
  // The configuration associated with the layer to be created
  config: ConfigBaseClass;
  // The OpenLayers source associated with the layer to be created
  source: Source;
  // Extra configuration can be anything (for simplicity)
  extraConfig?: unknown;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerRequestingDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerRequestingEvent, BaseLayer>;

/**
 * Define an event for the delegate
 */
export type LayerCreationEvent = {
  // The configuration associated with the created layer
  config: ConfigBaseClass;
  // The created layer
  layer: BaseLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerCreationDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerCreationEvent, void>;

export interface TypeWmsLegendStyle {
  name: string;
  legend: HTMLCanvasElement | null;
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerStyleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
  // The style
  style: TypeLayerStyleConfig;
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGeoViewLayer, IndividualLayerLoadedEvent, void>;

/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
  // The loaded layer
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerMessageDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerMessageEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerMessageEvent = {
  // The loaded layer
  messageKey: string;
  messageParams: string[];
  messageType: SnackbarType;
  notification: boolean;
};

export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
  styles?: TypeWmsLegendStyle[];
}

export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
}

export interface TypeVectorLegend extends TypeLegend {
  legend: TypeVectorLayerStyles;
}

export type TypeStyleRepresentation = {
  /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
   * break styles.
   */
  defaultCanvas?: HTMLCanvasElement | null;
  /** The arrayOfCanvas property is used by unique value and class break styles. */
  arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

// Definition of the keys used to create the constants of the GeoView layer
// TODO: Refactor - Move this and related types/const below lower in the architecture? Say, to MapSchemaTypes? Otherwise, things circle..
type LayerTypesKey =
  | 'CSV'
  | 'ESRI_DYNAMIC'
  | 'ESRI_FEATURE'
  | 'ESRI_IMAGE'
  | 'IMAGE_STATIC'
  | 'GEOJSON'
  | 'GEOPACKAGE'
  | 'XYZ_TILES'
  | 'VECTOR_TILES'
  | 'OGC_FEATURE'
  | 'WFS'
  | 'WMS';

/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType =
  | 'CSV'
  | 'esriDynamic'
  | 'esriFeature'
  | 'esriImage'
  | 'imageStatic'
  | 'GeoJSON'
  | 'GeoPackage'
  | 'xyzTiles'
  | 'vectorTiles'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms';

/**
 * This type is created to only be used when validating the configuration schema types.
 * Indeed, GeoCore is not an official Abstract Geoview Layer, but it can be used in schema types.
 */
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  CSV: 'CSV',
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  ESRI_IMAGE: 'esriImage',
  IMAGE_STATIC: 'imageStatic',
  GEOJSON: 'GeoJSON',
  GEOPACKAGE: 'GeoPackage',
  XYZ_TILES: 'xyzTiles',
  VECTOR_TILES: 'vectorTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
};

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string> = {
  CSV: 'TypeVectorLayerEntryConfig',
  imageStatic: 'TypeImageStaticLayerEntryConfig',
  esriDynamic: 'TypeEsriDynamicLayerEntryConfig',
  esriFeature: 'TypeVectorLayerEntryConfig',
  esriImage: 'TypeEsriImageLayerEntryConfig',
  GeoJSON: 'TypeVectorLayerEntryConfig',
  GeoPackage: 'TypeVectorLayerEntryConfig',
  xyzTiles: 'TypeTileLayerEntryConfig',
  vectorTiles: 'TypeTileLayerEntryConfig',
  ogcFeature: 'TypeVectorLayerEntryConfig',
  ogcWfs: 'TypeVectorLayerEntryConfig',
  ogcWms: 'TypeOgcWmsLayerEntryConfig',
};

// GV: ^^^^^
// GV: |||||
const validVectorLayerLegendTypes: TypeGeoviewLayerType[] = [
  CONST_LAYER_TYPES.CSV,
  CONST_LAYER_TYPES.GEOJSON,
  CONST_LAYER_TYPES.ESRI_DYNAMIC,
  CONST_LAYER_TYPES.ESRI_FEATURE,
  CONST_LAYER_TYPES.ESRI_IMAGE,
  CONST_LAYER_TYPES.OGC_FEATURE,
  CONST_LAYER_TYPES.WFS,
  CONST_LAYER_TYPES.GEOPACKAGE,
];

/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isVectorLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeVectorLegend => {
  return validVectorLayerLegendTypes.includes(verifyIfLegend?.type);
};

/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isWmsLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeWmsLegend => {
  return verifyIfLegend?.type === CONST_LAYER_TYPES.WMS;
};

/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isImageStaticLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeImageStaticLegend => {
  return verifyIfLegend?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};
