import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import Source from 'ol/source/Source';

import { generateId, whenThisThen } from '@/core/utils/utilities';
import { TypeJsonObject } from '@/api/config/types/config-types';
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
} from '@/api/config/types/map-schema-types';
import { LayerServiceMetadataEmptyError, LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigEmptyLayerGroupError,
  LayerEntryConfigUnableToCreateGroupLayerError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { SnackbarType } from '@/core/utils/notifications';
import { CancelledError, ResponseEmptyError, PromiseRejectErrorWrapper, formatError } from '@/core/exceptions/core-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

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

  /** List of errors for the layers that did not load. */
  layerLoadError: Error[] = [];

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

  /**
   * Constructor
   * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
   * @param {string} mapId - The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.geoviewLayerId = geoviewLayerConfig.geoviewLayerId || generateId();
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

  /**
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
        layerId: 'base-group',
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
   * A quick getter to help identify which layer class the current instance is coming from.
   */
  public getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
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

  /**
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

  /**
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

  /**
   * Get the layer metadata that is associated to the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TypeJsonObject} The layer metadata.
   */
  getLayerMetadata(layerPath: string): TypeJsonObject {
    return this.#layerMetadata[layerPath];
  }

  /**
   * Set the layer metadata for the layer identified by specified layerPath.
   *
   * @param {string} layerPath The layer path to the layer's configuration affected by the change.
   * @param {TypeJsonObject} layerMetadata The value to assign to the layer metadata property.
   */
  setLayerMetadata(layerPath: string, layerMetadata: TypeJsonObject): void {
    this.#layerMetadata[layerPath] = layerMetadata;
  }

  /**
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

  /**
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

  /**
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
   * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
   * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
   * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
   * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
   * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
   * the method #processListOfLayerMetadata, priority being given to the first of the two. When the GeoView layer does not
   * have a service definition, the getAdditionalServiceDefinition method does nothing.
   *
   * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
   * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
   * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
   * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
   * the details-panel.
   */
  async createGeoViewLayers(): Promise<void> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - createGeoViewLayers', this.listOfLayerEntryConfig);

    // Log
    logger.logDebug(`LAYERS - 2 - Creating GeoViewLayers for: ${this.geoviewLayerId}`, this.listOfLayerEntryConfig);

    // Try to get a key for logging timings
    let logTimingsKey;
    if (this.listOfLayerEntryConfig.length > 0) logTimingsKey = `${this.mapId} | ${this.listOfLayerEntryConfig[0].layerPath}`;

    // Log
    if (logTimingsKey) logger.logMarkerStart(logTimingsKey);

    // Fetch and set the service metadata
    await this.#fetchAndSetServiceMetadata();

    // If layers, validate the metadata
    if (this.listOfLayerEntryConfig.length) {
      // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
      this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);

      // At this point, the validation happened and all the listOfLayerEntryConfig entries exist (some get created on-the-fly during the validation)
      // Some layerConfig entries might be with layerStatus in error and some errors may have been compiled in this.layerLoadError.
      // Use a combination of those flags to determine what to do moving forward (for now).

      // Process the layer metadata for each layer entry
      await this.#processListOfLayerMetadata(this.listOfLayerEntryConfig);
    }

    // Log the time it took thus far
    if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to get additional service definition');

    // Process list of layers and await
    this.olRootLayer = await this.#processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

    // Log the time it took thus far
    if (logTimingsKey) logger.logMarkerCheck(logTimingsKey, 'to process list of layer entry config');
  }

  /**
   * This method reads the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
   * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
   * @private
   */
  async #fetchAndSetServiceMetadata(): Promise<void> {
    try {
      // If there's a metadata access path
      if (this.metadataAccessPath) {
        // Log
        logger.logDebug(`LAYERS - 3 - Fetching and setting service metadata for: ${this.geoviewLayerId}`, this.listOfLayerEntryConfig);

        // Process and, yes, keep the await here, because we want to make extra sure the onFetchAndSetServiceMetadata is
        // executed asynchronously, even if the implementation of the overriden method is synchronous.
        // All so that the try/catch works nicely here.
        await this.onFetchAndSetServiceMetadata();
      } else {
        // TODO: Check - Is this else really happening? Do we need the if (this.metadataAccessPath) at all?
        // debugger;
      }
    } catch (error: unknown) {
      // Set the layer status to all layer entries to error (that logic was as-is in this refactor, leaving as-is for now)
      AbstractGeoViewLayer.#logErrorAndSetStatusErrorAll(formatError(error), this.listOfLayerEntryConfig);

      // If empty response error
      if (error instanceof ResponseEmptyError) {
        // Throw higher
        throw new LayerServiceMetadataEmptyError(this.geoviewLayerId);
      }

      // Throw higher
      throw new LayerServiceMetadataUnableToFetchError(this.geoviewLayerId, error as Error);
    }
  }

  /**
   * Overridable method to read the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
   * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onFetchAndSetServiceMetadata(): Promise<void> {
    // Default, no metadata fetching
    return Promise.resolve();
  }

  /**
   * Recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // Log
    logger.logDebug(`LAYERS - 4 - Validating list of layer entry configs for: ${this.geoviewLayerId}`, this.listOfLayerEntryConfig);

    // When no metadata is provided, there's no validation to be done.
    if (!this.metadata) return;

    // Redirect to overridable method
    this.onValidateListOfLayerEntryConfig(listOfLayerEntryConfig);
  }

  /**
   * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
   */
  protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // Loop on each layer entry config
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      // If is a group layer
      if (layerEntryIsGroupLayer(layerConfig)) {
        // Set the layer status to processing
        layerConfig.setLayerStatusProcessing();

        // Recursive call
        this.onValidateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig);

        // If empty list, for a group layer, not good
        if (!layerConfig?.listOfLayerEntryConfig?.length) {
          // Add a layer load error
          this.addLayerLoadError(new LayerEntryConfigEmptyLayerGroupError(layerConfig), layerConfig);
        }
      } else {
        try {
          // Single entry layer
          this.validateLayerEntryConfig(layerConfig);
        } catch (error) {
          // If cancelled error
          if (error instanceof CancelledError) {
            // Cancelled.. skip (this is notably to support WMS special grouping)
          } else {
            // A validation of a layer entry config failed
            this.addLayerLoadError(error as Error, layerConfig);
          }
        }
      }
    });
  }

  /**
   * Validates the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param layerConfig - The layer entry config to validate
   */
  validateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // Set the layer status to processing
    layerConfig.setLayerStatusProcessing();

    // Redirect to overridable method
    this.onValidateLayerEntryConfig(layerConfig);
  }

  /**
   * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // Override to perform a validation on the layer entry config
  }

  /**
   * Recursively processes the metadata of each layer in the "layer list" configuration.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layers to process.
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  async #processListOfLayerMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void> {
    // Log
    logger.logDebug(
      `LAYERS - 4 - Processing list of layer entry metadata, building promises, for: ${this.geoviewLayerId}}`,
      listOfLayerEntryConfig
    );

    // Create a promise for each metadata layer found throughout the recursive config
    const allPromises: Promise<ConfigBaseClass>[] = [];
    this.#processLayerMetadataRec(listOfLayerEntryConfig, allPromises);

    // Wait for all the layers to be processed
    const arrayOfLayerConfigs = await Promise.allSettled(allPromises);

    // Log
    logger.logDebug(
      `LAYERS - 5 - Processing list of layer entry metadata, promises done, for: ${this.geoviewLayerId}`,
      listOfLayerEntryConfig
    );

    // For each promise
    arrayOfLayerConfigs.forEach((promise) => {
      // If the promise fulfilled
      if (promise.status === 'fulfilled') {
        // When we get here, we know that the layer config has completed processing.
        // However, some layerConfig might be in error at this point too.
        const layerConfig = promise.value;

        // If not error
        if (layerConfig.layerStatus !== 'error') {
          //
          // TODO: Refactor - Layers refactoring. Make it a super clear function when moving config information in the layer for real.
          // TO.DOCONT: After this point(?) the layerConfig should be full static and the system should rely on the Layer class to do stuff.
          //

          // Save the style in the layer as we're done processing style found in metadata
          if (layerConfig instanceof AbstractBaseLayerEntryConfig) this.setStyle(layerConfig.layerPath, layerConfig.layerStyle!);

          // We need to signal to the layer sets that the 'processed' phase is done.
          layerConfig.setLayerStatusProcessed();
          this.#emitLayerEntryProcessed({ config: layerConfig });
        } else {
          // This layer config was found to be in error, skip the setStyle and skip the set status processed
          // TODO: Check - This whole promise handling could probably be rewritten and removed from here
          // TO.DOCONT: That is, set the style and processed status elsewhere.
          // TO.DOCONT: Also move the failed promises in the else just below. Refactor it?
        }
      } else {
        // The promise failed. Unwrap the reason.
        const reason = promise.reason as PromiseRejectErrorWrapper<TypeLayerEntryConfig>;

        // Add the error
        this.addLayerLoadError(reason.error, reason.object);
      }
    });
  }

  /**
   * Recursively gathers all the promises of layer metadata for all the layer entry configs.
   * @param listOfLayerEntryConfig - The list of layer entry config currently being processed.
   * @param promisesEntryMetadata - The gathered promises as the recursive function is called.
   */
  #processLayerMetadataRec(listOfLayerEntryConfig: ConfigBaseClass[], promisesEntryMetadata: Promise<ConfigBaseClass>[]): void {
    // For each layer entry in the config
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // If is a group layer
      if (layerEntryIsGroupLayer(layerConfig)) {
        // Add it
        promisesEntryMetadata.push(Promise.resolve(layerConfig));

        // Go recursively in the group
        this.#processLayerMetadataRec(layerConfig.listOfLayerEntryConfig, promisesEntryMetadata);
      } else {
        // Not a group layer, process the layer metadata normally
        promisesEntryMetadata.push(this.#processLayerMetadata(layerConfig as AbstractBaseLayerEntryConfig));
      }
    });
  }

  /**
   * Processes the layer metadata. It will fill the empty outfields and aliasFields properties of the
   * layer configuration when applicable.
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
                                                      When the promise fails, the reason is wrapped in a PromiseRejectErrorWrapper
                                                      to attach the layerConfig with it.
   */
  async #processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    try {
      // If no errors already happened on the layer path being processed
      if (layerConfig.layerStatus !== 'error') {
        // Process and, yes, keep the await here, because we want to make extra sure the onProcessLayerMetadata is
        // executed asynchronously, even if the implementation of the overriden method is synchronous.
        // All so that the try/catch works nicely here.
        return await this.onProcessLayerMetadata(layerConfig);
      }

      // Skip it, that layer entry already had issues
      logger.logWarning(
        `Layer metadata processing skipped for layer path '${layerConfig.layerPath}', an error was already detected during validation phase.`
      );

      // Return as-is
      return Promise.resolve(layerConfig);
    } catch (error) {
      // Wrap so that we carry the layerConfig into the reject callback and throw it higher
      throw new PromiseRejectErrorWrapper(error as Error, layerConfig);
    }
  }

  /**
   * Overridable method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - Information needed to create the GeoView layer.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} The Promise that the config metadata has been processed.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Override this function to process layer metadata
    return Promise.resolve(layerConfig);
  }

  /**
   * Recursively processes the list of layer Entries to create the layers and the layer groups.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries to process.
   * @param {LayerGroup} layerGroup - Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   * @returns {Promise<BaseLayer | undefined>} The promise that the layers were processed.
   * @private
   */
  // TODO: Change the returned Promise here from Promise<BaseLayer | undefined> to Promise<BaseLayer> and
  // TO.DOCONT: throw an exception in the undefined cases instead and let the exception be managed higher.
  async #processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | undefined> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - processListOfLayerEntryConfig', listOfLayerEntryConfig);

    // Log
    logger.logDebug(`LAYERS - 7 - Loading list of layer entry for the Open Layer, for: ${this.geoviewLayerId}`, listOfLayerEntryConfig);

    try {
      if (listOfLayerEntryConfig.length === 0) return undefined;
      if (listOfLayerEntryConfig.length === 1) {
        // Get the config to process
        const layerConfig = listOfLayerEntryConfig[0];

        // If working on a group layer
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings);
          const groupReturned = await this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup);
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            return groupReturned;
          }

          // Add a layer load error
          this.addLayerLoadError(new LayerEntryConfigUnableToCreateGroupLayerError(layerConfig), layerConfig);
          return undefined;
        }

        if (layerConfig.layerStatus === 'error') return undefined;

        try {
          // Process entry and catch possible error
          const baseLayer = await this.#processOneLayerEntry(layerConfig as AbstractBaseLayerEntryConfig);
          if (layerGroup) layerGroup.getLayers().push(baseLayer);
          return layerGroup || baseLayer;
        } catch (error) {
          // Add a layer load error
          this.addLayerLoadError(error as Error, layerConfig);
          return undefined;
        }
      }

      // HERE, listOfLayerEntryConfig.length is >= 2

      if (!layerGroup) {
        // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
        // eslint-disable-next-line no-param-reassign
        layerGroup = this.createLayerGroup(
          listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig,
          listOfLayerEntryConfig[0].initialSettings!
        );
      }

      const promiseOfLayerCreated: Promise<BaseLayer | undefined>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings);
          promiseOfLayerCreated.push(this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup));
        } else if (layerConfig.layerStatus === 'error') {
          // This layer was already detected as in error, don't make the layer, don't add to the list
          // promiseOfLayerCreated.push(Promise.resolve(undefined)); commented unnecessary code
        } else {
          // Create promise and catch possible error
          const promise = this.#processOneLayerEntry(layerConfig as AbstractBaseLayerEntryConfig).catch((error) => {
            // Add a layer load error
            this.addLayerLoadError(error, layerConfig);
            return undefined;
          });

          // Add the promise
          promiseOfLayerCreated.push(promise);
        }
      });

      // Wait until all promises resolve
      const listOfLayerCreated = await Promise.all(promiseOfLayerCreated);

      // For each resolved promise result
      // TODO: Check - Do we still need that? This whole function is very confusing to me. I've tried adding a lot of
      // TO.DOCONT: comments and cleared the logic, but there's likely more work to be done here...
      // TO.DOCONT: At least now the real error exception that gets thrown gets logged in console.
      // TO.DOCONT: Code in the else commented out for now, to see, 2025-04-04
      listOfLayerCreated
        .filter((layer) => !!layer)
        .forEach((layer) => {
          layerGroup!.getLayers().push(layer);
          // else {
          //  this.layerLoadError.push({
          //    layer: listOfLayerEntryConfig[i].layerPath,
          //    layerName: listOfLayerEntryConfig[i].layerName,
          //    loggerMessage: `Unable to create ${
          //      layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? CONST_LAYER_ENTRY_TYPES.GROUP : ''
          //    } layer ${listOfLayerEntryConfig[i].layerPath} on map ${this.mapId}`,
          //  });
          //  // Set the layer status to error
          //  this.getLayerConfig(layerPath)!.setLayerStatusError();
          // }
        });

      return layerGroup;
    } catch (error) {
      // Log
      logger.logError(error);

      // For now, we return undefined when a layer entry config failed..
      return undefined;
    }
  }

  /**
   * Processes a layer entry and returns a Promise of an Open Layer Base Layer object.
   * This method sets the 'loading' status on the layer config and then calls the overridable method 'onProcessOneLayerEntry'.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  #processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer> {
    // Indicate that the layer config has entered the 'loading' status
    layerConfig.setLayerStatusLoading();

    // Process
    return this.onProcessOneLayerEntry(layerConfig);
  }

  /**
   * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  protected abstract onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer>;

  /**
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
   * @param {string[] | undefined} messageParams - Array of parameters to be interpolated into the localized message
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
    messageParams: string[] | undefined = [],
    messageType: SnackbarType = 'info' as SnackbarType,
    notification: boolean = false
  ): void {
    this.#emitLayerMessage({ messageKey, messageParams, messageType, notification });
  }

  /**
   * Adds a GeoViewLayerLoadedFailedError in the internal list of errors for a layer being loaded.
   * It also sets the layer status to error.
   */
  addLayerLoadError(error: Error, layerConfig: TypeLayerEntryConfig | undefined): void {
    // Add the error to the list
    this.layerLoadError.push(error);

    // Log the error and set status error right away
    AbstractGeoViewLayer.#logErrorAndSetStatusError(error, layerConfig);
  }

  /**
   * Throws an aggregate error based on the 'layerLoadError' list, if any.
   */
  throwAggregatedLayerLoadErrors(): void {
    // If any errors compiled up
    if (this.layerLoadError.length > 0) {
      // Throw an aggregated exception
      throw new AggregateError(this.layerLoadError, 'Multiple errors happened. See this.layerLoadError for the list.');
    }
  }

  /**
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

  // #region STATIC METHODS

  /**
   * Calls #logErrorAndSetStatusError for each layer entry config found in the list.
   * @param {Error} error - The error to log.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configs to update the status.
   * @private
   */
  static #logErrorAndSetStatusErrorAll(error: Error, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // For each layer entry config in the list
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      // If the layer entry is a group
      if (layerEntryIsGroupLayer(layerConfig)) {
        // Recursively set the status to the children
        AbstractGeoViewLayer.#logErrorAndSetStatusErrorAll(error, layerConfig.listOfLayerEntryConfig);
        // Log the error and set status error right away
        AbstractGeoViewLayer.#logErrorAndSetStatusError(error, layerConfig);
      } else {
        // If already set to error, don't touch it
        if (layerConfig.layerStatus === 'error') return;

        // Log the error and set status error right away
        AbstractGeoViewLayer.#logErrorAndSetStatusError(error, layerConfig);
      }
    });
  }

  /**
   * Logs an error message and updates the given layer's status to "error".
   * If the error is a `GeoViewError`, its localized message (in English) will be used.
   * If the error has a `cause`, it will be appended to the message.
   * @param {Error} error - The error to log.
   * @param {TypeLayerEntryConfig | undefined} layerConfig - The layer configuration to update, if provided.
   * @private
   */
  static #logErrorAndSetStatusError(error: Error, layerConfig: TypeLayerEntryConfig | undefined): void {
    // Log the error
    GeoViewError.logError(error);

    // Set the layer status to error
    layerConfig?.setLayerStatusError();
  }

  // #endregion
}

// #region EVENT DEFINITIONS

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

// #endregion

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

/**
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
