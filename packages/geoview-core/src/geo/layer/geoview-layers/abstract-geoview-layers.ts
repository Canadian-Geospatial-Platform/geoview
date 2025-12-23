import type BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import type { Options as LayerGroupOptions } from 'ol/layer/Group';
import LayerGroup from 'ol/layer/Group';

import { delay } from '@/core/utils/utilities';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeGeoviewLayerType,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES, validVectorLayerLegendTypes } from '@/api/types/layer-schema-types';
import {
  LayerMetadataAccessPathMandatoryError,
  LayerNoCapabilitiesError,
  LayerServiceMetadataEmptyError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigEmptyLayerGroupError,
  LayerEntryConfigUnableToCreateGroupLayerError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { SnackbarType } from '@/core/utils/notifications';
import { CancelledError, ResponseEmptyError, PromiseRejectErrorWrapper, formatError } from '@/core/exceptions/core-exceptions';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  CSV: 'CSV Layer',
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  esriImage: 'Esri Image Layer',
  GeoJSON: 'GeoJson Layer',
  GeoTIFF: 'GeoTIFF Layer',
  imageStatic: 'Static Image Layer',
  KML: 'KML Layer',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
  WKB: 'WKB Layer',
  vectorTiles: 'Vector Tiles',
  xyzTiles: 'XYZ Tiles',
};

/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 *
 * The general order of the overridable methods in the processing is:
 * 1. onFetchAndSetServiceMetadata
 * 2. onValidateListOfLayerEntryConfig
 * 3. onValidateLayerEntryConfig
 * 4. onProcessLayerMetadata
 * 5. onProcessOneLayerEntry
 * 6. onCreateGVLayer
 *
 */
export abstract class AbstractGeoViewLayer {
  /** The default hit tolerance the query should be using */
  static readonly DEFAULT_HIT_TOLERANCE: number = 4;

  /** The default waiting time before showing a warning about the metadata taking a long time to get processed */
  static readonly DEFAULT_WAIT_PERIOD_METADATA_WARNING: number = 10 * 1000; // 10 seconds

  /** The default hit tolerance */
  hitTolerance: number = AbstractGeoViewLayer.DEFAULT_HIT_TOLERANCE;

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /** The OpenLayer root layer representing this GeoView Layer. */
  olRootLayer?: BaseLayer;

  /** The Geoview Layer Config used to create the class */
  #geoviewLayerConfig: TypeGeoviewLayerConfig;

  /** List of errors for the layers that did not load. */
  #layerLoadError: Error[] = [];

  /** The service metadata. */
  #metadata?: unknown;

  /** Date format object used to translate server to ISO format and ISO to server format */
  #serverDateFragmentsOrder?: TypeDateFragments;

  /** Keep all callback delegate references */
  #onLayerEntryRegisterInitHandlers: LayerEntryRegisterInitDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerEntryProcessedHandlers: LayerEntryProcessedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerConfigCreatedHandlers: LayerConfigCreatedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerGroupCreatedHandlers: LayerGroupCreatedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerGVCreatedHandlers: LayerGVCreatedDelegate[] = [];

  /** Keep all callback delegates references */
  #onLayerMessageHandlers: LayerMessageDelegate[] = [];

  /**
   * Constructor
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
   */
  constructor(geoviewLayerConfig: TypeGeoviewLayerConfig) {
    // Keep it internally
    this.#geoviewLayerConfig = geoviewLayerConfig;

    // Set the Date Fragments Order if it's specified in the config
    if (geoviewLayerConfig.serviceDateFormat) {
      this.setServerDateFragmentsOrder(DateMgt.getDateFragmentsOrder(geoviewLayerConfig.serviceDateFormat));
    }

    // Initialize the layer entry configs
    this.#initListOfLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);
  }

  // #region OVERRIDES

  /**
   * Must override method to read the service metadata from the metadataAccessPath.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T>} A promise resolved once the metadata has been fetched.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected abstract onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T>;

  /**
   * Must override method to initialize a layer entry based on a GeoView layer config.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected abstract onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;

  /**
   * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - Information needed to create the GeoView layer.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} The Promise that the config metadata has been processed.
   */
  protected abstract onProcessLayerMetadata(
    layerConfig: AbstractBaseLayerEntryConfig,
    abortSignal?: AbortSignal
  ): Promise<AbstractBaseLayerEntryConfig>;

  /**
   * Must override method to create a GV Layer from a layer configuration.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {AbstractGVLayer} The GV Layer that has been created.
   */
  protected abstract onCreateGVLayer(layerConfig: AbstractBaseLayerEntryConfig): AbstractGVLayer;

  /**
   * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
   */
  protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void {
    // Loop on each layer entry config
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // If is a group layer
      if (layerConfig.getEntryTypeIsGroup()) {
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
        } catch (error: unknown) {
          // If cancelled error
          if (error instanceof CancelledError) {
            // Cancelled.. skip (this is notably to support WMS special grouping)
          } else {
            // A validation of a layer entry config failed
            this.addLayerLoadError(formatError(error), layerConfig);
          }
        }
      }
    });
  }

  /**
   * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Override to perform a validation on the layer entry config
  }

  /**
   * Overridable method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseGVLayer> {
    // Redirect
    const layer = this.createGVLayer(layerConfig);

    // Return the layer
    return Promise.resolve(layer);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Overridable method to get the metadata.
   * Override this function to return the more precise type (covariant return).
   */
  getMetadata(): unknown | undefined {
    return this.#metadata;
  }

  /**
   * A quick getter to help identify which layer class the current instance is coming from.
   */
  getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
  }

  /**
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerConfig(): TypeGeoviewLayerConfig {
    return this.#geoviewLayerConfig;
  }

  /**
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerId(): string {
    return this.getGeoviewLayerConfig().geoviewLayerId;
  }

  /**
   * Returns the display name of the GeoView layer, if defined.
   * @returns {string} The GeoView layer name.
   */
  getGeoviewLayerName(): string {
    return this.getGeoviewLayerConfig().geoviewLayerName || DEFAULT_LAYER_NAMES[this.getGeoviewLayerConfig().geoviewLayerType];
  }

  /**
   * Indicates if the metadata access path is defined in the config.
   * @returns {boolean} True if the configuration has a metadata access path.
   */
  hasMetadataAccessPath(): boolean {
    // Check if there's a metadataAccessPath
    return !!this.getGeoviewLayerConfig().metadataAccessPath;
  }

  /**
   * Gets the metadata access path if it exists.
   * @returns {string | undefined} The trimmed metadata access path, or `undefined` if not defined.
   */
  getMetadataAccessPathIfExists(): string | undefined {
    return this.getGeoviewLayerConfig().metadataAccessPath?.trim();
  }

  /**
   * Retrieves the metadata access path used by this GeoView layer.
   * @returns {string} The metadata access path.
   * @throws {LayerMetadataAccessPathMandatoryError} When the metadataAccessPath is undefined.
   */
  getMetadataAccessPath(): string {
    // Get the metadata access path
    const { metadataAccessPath } = this.getGeoviewLayerConfig();

    // If undefined
    if (!metadataAccessPath)
      throw new LayerMetadataAccessPathMandatoryError(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerConfig().geoviewLayerType,
        this.getGeoviewLayerName()
      );

    // Return it
    return metadataAccessPath.trim();
  }

  /**
   * Sets the metadata access path used by this GeoView layer.
   * @param {string} metadataAccessPath - The metadata access path to set.
   */
  setMetadataAccessPath(metadataAccessPath: string): void {
    this.getGeoviewLayerConfig().metadataAccessPath = metadataAccessPath.trim();
  }

  /**
   * Gets the first layer entry name if any sub-layers exist or else gets the geoviewLayerName or even the geoviewLayerId.
   * @returns {string} The layer entry name if any sub-layers exist or the geoviewLayerName or even the geoviewLayerId.
   */
  getLayerEntryNameOrGeoviewLayerName(): string {
    if (this.listOfLayerEntryConfig?.length === 1) {
      // Get the layer name from the object (instance or type) inside the listOfLayerEntryConfig array
      const layerEntryName = ConfigBaseClass.getClassOrTypeLayerName(this.listOfLayerEntryConfig[0]);
      if (layerEntryName) return layerEntryName;
    }
    return this.getGeoviewLayerName() || this.getGeoviewLayerId();
  }

  /**
   * Gets the current server date fragments order.
   * The date fragments order describes how date components (e.g. day, month, year,
   * time fragments) are arranged in server-provided date strings.
   * @returns {TypeDateFragments | undefined} The server date fragments order,
   * or `undefined` if it has not been initialized.
   */
  getServerDateFragmentsOrder(): TypeDateFragments | undefined {
    return this.#serverDateFragmentsOrder;
  }

  /**
   * Sets the server date fragments order.
   * This value is typically derived from a service date format and cached
   * for reuse when parsing or formatting server dates.
   * @param {TypeDateFragments | undefined} serverDateFragmentsOrder -
   * The date fragments order to store. Use `undefined` to reset the value.
   */
  setServerDateFragmentsOrder(serverDateFragmentsOrder: TypeDateFragments | undefined): void {
    this.#serverDateFragmentsOrder = serverDateFragmentsOrder;
  }

  /**
   * Initializes the server date fragments order from a service date format string.
   * If the date fragments order has not already been set, this method derives it
   * from the provided date format using {@link DateMgt.getDateFragmentsOrder}
   * and stores it for later use.
   * @param {string} [dateFormat='DD/MM/YYYY HH:MM:SSZ'] -
   * The date format string provided by the service, used to determine
   * the order of date fragments.
   */
  initServerDateFragmentsOrderFromServiceDateFormat(dateFormat: string = 'DD/MM/YYYY HH:MM:SSZ'): void {
    // If any not already set and have a service date format provided
    if (!this.getServerDateFragmentsOrder()) {
      // Set it
      this.setServerDateFragmentsOrder(DateMgt.getDateFragmentsOrder(dateFormat));
    }
  }

  /**
   * Initializes the layer entries based on the GeoviewLayerConfig that was initially provided in the constructor.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  initGeoViewLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return this.onInitLayerEntries();
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
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<ConfigBaseClass[]>} A promise of the config base classes created.
   */
  async createGeoViewLayers(abortSignal?: AbortSignal): Promise<ConfigBaseClass[]> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - createGeoViewLayers', this.listOfLayerEntryConfig);

    // Try to get a key for logging timings
    const logTimingsKey = this.getGeoviewLayerId();

    // Log
    logger.logMarkerStart(logTimingsKey);

    // Fetch and set the service metadata
    await this.#fetchAndSetServiceMetadata(abortSignal);

    // Log the time it took thus far
    logger.logMarkerCheck(logTimingsKey, 'to fetch the service metadata');

    // If layers, validate the metadata
    const configBaseClassCreated: ConfigBaseClass[] = [];
    if (this.listOfLayerEntryConfig.length) {
      // Recursively process the configuration tree of layer entries by removing layers in error and processing valid layers.
      this.validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);

      // At this point, the validation happened and all the listOfLayerEntryConfig entries exist (some get created on-the-fly during the validation)
      // Some layerConfig entries might be with layerStatus in error and some errors may have been compiled in this.layerLoadError.
      // Use a combination of those flags to determine what to do moving forward (for now).

      // Process the layer metadata for each layer entry
      await this.#processListOfLayerMetadata(
        this.listOfLayerEntryConfig,
        (sender, event) => {
          // If no errors
          if (event.errors.length === 0) {
            // Keep the config
            configBaseClassCreated.push(event.config);
          }
        },
        abortSignal
      );

      // Log the time it took thus far
      logger.logMarkerCheck(logTimingsKey, `to process the (${this.listOfLayerEntryConfig.length}) layer metadata(s)`);
    }

    // Process list of layers and await
    const layer = await this.#processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

    // If any errors were compiled, throw about it
    this.#throwAggregatedLayerLoadErrors();

    // Keep the OL reference
    this.olRootLayer = layer?.getOLLayer();

    // Log the time it took thus far
    logger.logMarkerCheck(logTimingsKey, 'to create the layers');

    // Return them
    return configBaseClassCreated;
  }

  /**
   * Fetches the metadata by calling onFetchServiceMetadata.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T>} Returns a Promise of a metadata
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities) (WMS/WFS layers).
   */
  fetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T> {
    // Redirect
    return this.onFetchServiceMetadata<T>(abortSignal);
  }

  /**
   * Recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
   */
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void {
    // Log
    logger.logTraceCore(
      `LAYERS - 3 - Validating list of layer entry configs for: ${this.getGeoviewLayerId()}`,
      this.listOfLayerEntryConfig
    );

    // When no metadata is provided, there's no validation to be done.
    if (!this.#metadata) return;

    // Copy the service metadata, recursively, in each layer entry config right away
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // Copy the service metadata right away
      layerConfig.setServiceMetadata(this.getMetadata());
    });

    // Redirect to overridable method
    this.onValidateListOfLayerEntryConfig(listOfLayerEntryConfig);
  }

  /**
   * Validates the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate
   */
  validateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Set the layer status to processing
    layerConfig.setLayerStatusProcessing();

    // Validate and update the extent initial settings
    layerConfig.initInitialSettingsExtentAndBoundsFromConfig();

    // Redirect to overridable method
    this.onValidateLayerEntryConfig(layerConfig);
  }

  /**
   * Creates a GV Layer from a layer configuration.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {AbstractGVLayer} The GV Layer that has been created.
   */
  createGVLayer(layerConfig: AbstractBaseLayerEntryConfig): AbstractGVLayer {
    // Redirect
    const layer = this.onCreateGVLayer(layerConfig);

    // GV Time to emit about the GV Layer
    this.#emitLayerGVCreated({ layer });

    // Return it
    return layer;
  }

  /**
   * Emits a layer-specific message event with localization support
   * @protected
   * @param {string} messageKey - The key used to lookup the localized message OR message
   * @param {string[] | undefined} messageParams - Array of parameters to be interpolated into the localized message
   * @param {SnackbarType} messageType - The message type
   * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
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
   * @param {Error} error - The error
   * @param {ConfigBaseClass | undefined} layerConfig - Optional layer config
   */
  addLayerLoadError(error: Error, layerConfig: ConfigBaseClass | undefined): void {
    // Add the error to the list
    this.#layerLoadError.push(error);

    // Set the layer status to error
    layerConfig?.setLayerStatusError();
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

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Initializes the layer entry configurations.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration options.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
   * @private
   */
  #initListOfLayerEntryConfig(geoviewLayerConfig: TypeGeoviewLayerConfig, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    if (!listOfLayerEntryConfig) return;
    if (listOfLayerEntryConfig.length === 0) return;
    if (listOfLayerEntryConfig.length === 1) {
      if (!listOfLayerEntryConfig[0].getLayerName() && geoviewLayerConfig.geoviewLayerName)
        listOfLayerEntryConfig[0].setLayerName(geoviewLayerConfig.geoviewLayerName);
      this.listOfLayerEntryConfig = listOfLayerEntryConfig;
    } else {
      const layerGroup = new GroupLayerEntryConfig({
        geoviewLayerConfig,
        layerId: 'base-group',
        layerName: this.getGeoviewLayerName(),
        isMetadataLayerGroup: false,
        initialSettings: geoviewLayerConfig.initialSettings,
        listOfLayerEntryConfig,
      });

      this.listOfLayerEntryConfig = [layerGroup];
      layerGroup.listOfLayerEntryConfig.forEach((layerConfig) => {
        // Set the parent config
        layerConfig.setParentLayerConfig(layerGroup);
      });
    }
  }

  /**
   * This method reads the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @throws {LayerServiceMetadataEmptyError} When the metadata fetch return empty metadata.
   * @private
   */
  async #fetchAndSetServiceMetadata(abortSignal?: AbortSignal): Promise<void> {
    try {
      // If there's no metadata access path
      // GV e.g.: CSV (csvLYR2) and some outlier demos, we want to skip those (not fail)
      if (!this.hasMetadataAccessPath()) return;

      // Log
      logger.logTraceCore(
        `LAYERS - 2 - Fetching and setting service metadata for: ${this.getGeoviewLayerId()}`,
        this.listOfLayerEntryConfig
      );

      // Start a timer to see if the layer metadata could be fetched after delay
      this.#startMetadataFetchWatcher();

      // Process and, yes, keep the await here, because we want the try/catch to work nicely here.
      this.#metadata = await this.fetchServiceMetadata(abortSignal);
    } catch (error: unknown) {
      // Set the layer status to all layer entries to error (that logic was as-is in this refactor, leaving as-is for now)
      AbstractGeoViewLayer.#setStatusErrorAll(formatError(error), this.listOfLayerEntryConfig);

      // If LayerServiceMetadataUnableToFetchError error
      if (error instanceof LayerServiceMetadataUnableToFetchError || error instanceof LayerNoCapabilitiesError) {
        // If the inner cause is a ResponseEmptyError,
        if (error.cause instanceof ResponseEmptyError) {
          // Throw higher
          throw new LayerServiceMetadataEmptyError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName());
        }

        // Throw as-is
        throw error;
      }

      // Throw higher
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }
  }

  /**
   * Recursively processes the metadata of each layer in the "layer list" configuration.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layers to process.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  async #processListOfLayerMetadata(
    listOfLayerEntryConfig: ConfigBaseClass[],
    callbackLayerConfigCreated: LayerConfigCreatedDelegate,
    abortSignal?: AbortSignal
  ): Promise<void> {
    // Log
    logger.logTraceCore(
      `LAYERS - 4 - Processing list of layer entry metadata, building promises, for: ${this.getGeoviewLayerId()}}`,
      listOfLayerEntryConfig
    );

    // Create a promise for each metadata layer found throughout the recursive config
    const allPromises: Promise<ConfigBaseClass>[] = [];
    this.#processLayerMetadataRec(listOfLayerEntryConfig, allPromises, abortSignal);

    // Wait for all the layers to be processed
    const arrayOfLayerConfigs = await Promise.allSettled(allPromises);

    // Log
    logger.logTraceCore(
      `LAYERS - 5 - Processing list of layer entry metadata, promises done, for: ${this.getGeoviewLayerId()}`,
      listOfLayerEntryConfig
    );

    // For each promise
    arrayOfLayerConfigs.forEach((promise) => {
      // If the promise fulfilled
      let layerConfig;
      if (promise.status === 'fulfilled') {
        // When we get here, we know that the layer config has completed processing.
        // However, some layerConfig might be in error at this point too.
        layerConfig = promise.value;

        // If not error
        if (layerConfig.layerStatus !== 'error') {
          // We need to signal to the layer sets that the 'processed' phase is done.
          layerConfig.setLayerStatusProcessed();
          this.#emitLayerEntryProcessed({ config: layerConfig });
        }
      } else {
        // The promise failed. Unwrap the reason.
        const reason = promise.reason as PromiseRejectErrorWrapper<AbstractBaseLayerEntryConfig>;

        // The layer config
        layerConfig = reason.object;

        // Add the error
        this.addLayerLoadError(reason.error, reason.object);
      }

      // Callback
      callbackLayerConfigCreated?.(this, { config: layerConfig, errors: this.#layerLoadError });

      // Emit that the layer config has been created
      this.#emitLayerConfigCreated({ config: layerConfig, errors: this.#layerLoadError });
    });
  }

  /**
   * Recursively gathers all the promises of layer metadata for all the layer entry configs.
   * @param listOfLayerEntryConfig - The list of layer entry config currently being processed.
   * @param promisesEntryMetadata - The gathered promises as the recursive function is called.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @private
   */
  #processLayerMetadataRec(
    listOfLayerEntryConfig: ConfigBaseClass[],
    promisesEntryMetadata: Promise<ConfigBaseClass>[],
    abortSignal?: AbortSignal
  ): void {
    // For each layer entry in the config
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // If is a group layer
      if (layerConfig.getEntryTypeIsGroup()) {
        // Add it
        promisesEntryMetadata.push(Promise.resolve(layerConfig));

        // Go recursively in the group
        this.#processLayerMetadataRec(layerConfig.listOfLayerEntryConfig, promisesEntryMetadata);
      } else {
        // Not a group layer, process the layer metadata normally
        promisesEntryMetadata.push(this.#processLayerMetadata(layerConfig as AbstractBaseLayerEntryConfig, abortSignal));
      }
    });
  }

  /**
   * Processes the layer metadata. It will fill the empty outfields and aliasFields properties of the
   * layer configuration when applicable.
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the AbstractBaseLayerEntryConfig has its metadata processed.
                                                      When the promise fails, the reason is wrapped in a PromiseRejectErrorWrapper
                                                      to attach the layerConfig with it.
   * @private
   */
  async #processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig, abortSignal?: AbortSignal): Promise<AbstractBaseLayerEntryConfig> {
    try {
      // If no errors already happened on the layer path being processed
      if (layerConfig.layerStatus !== 'error') {
        // Process and, yes, keep the await here, because we want the try/catch to work nicely here.
        return await this.onProcessLayerMetadata(layerConfig, abortSignal);
      }

      // Return as-is
      return layerConfig;
    } catch (error: unknown) {
      // Wrap so that we carry the layerConfig into the reject callback and throw it higher
      throw new PromiseRejectErrorWrapper(error, layerConfig);
    }
  }

  /**
   * Recursively processes the list of layer Entries to create the layers and the layer groups.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries to process.
   * @param {LayerGroup} layerGroup - Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   * @returns {Promise<BaseLayer | undefined>} The promise that the layers were processed.
   * @private
   */
  async #processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    layerGroup?: GVGroupLayer
  ): Promise<AbstractBaseGVLayer | undefined> {
    // Log
    logger.logTraceCore(
      `LAYERS - 8 - Loading list of layer entry for the Open Layer, for: ${this.getGeoviewLayerId()}`,
      listOfLayerEntryConfig
    );

    try {
      // No entries → nothing to load
      if (listOfLayerEntryConfig.length === 0) return undefined;

      // -----------------------------------------------------------------------
      // CASE 1: Only one layer entry in the list
      // -----------------------------------------------------------------------
      if (listOfLayerEntryConfig.length === 1) {
        const layerConfig = listOfLayerEntryConfig[0];

        // Skip entries already in error state
        if (layerConfig.layerStatus === 'error') return undefined;

        // -------------------------------------------------------------------
        // If this entry is a GROUP
        // -------------------------------------------------------------------
        if (layerConfig.getEntryTypeIsGroup()) {
          const newLayerGroup = this.#createLayerGroup(layerConfig, layerConfig.cloneInitialSettings());

          // Recursively process children of the group
          const groupReturned = await this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup);

          if (groupReturned) {
            if (layerGroup) layerGroup.addLayer(groupReturned);
            return groupReturned;
          }

          // Group creation failed → record error
          this.addLayerLoadError(new LayerEntryConfigUnableToCreateGroupLayerError(layerConfig), layerConfig);
          return undefined;
        }

        // -------------------------------------------------------------------
        // Otherwise, this is a simple (non-group) layer entry
        // -------------------------------------------------------------------
        try {
          const baseLayer = await this.#processOneLayerEntry(layerConfig);
          if (layerGroup) layerGroup.addLayer(baseLayer);

          // If we are inside a group → return the group
          // Otherwise return the single base layer
          return layerGroup || baseLayer;
        } catch (error: unknown) {
          this.addLayerLoadError(formatError(error), layerConfig);
          return undefined;
        }
      }

      // -----------------------------------------------------------------------
      // CASE 2: Multiple layer entries (>= 2)
      // -----------------------------------------------------------------------

      // If there is no parent group for this level, create one
      if (!layerGroup) {
        const parentConfig = listOfLayerEntryConfig[0].getParentLayerConfig()!;
        // eslint-disable-next-line no-param-reassign
        layerGroup = this.#createLayerGroup(parentConfig, listOfLayerEntryConfig[0].cloneInitialSettings());
      }

      // Process all entries in parallel
      const creationPromises: Promise<AbstractBaseGVLayer | undefined>[] = listOfLayerEntryConfig.map(async (layerConfig) => {
        // GROUP entry
        if (layerConfig.getEntryTypeIsGroup()) {
          const newLayerGroup = this.#createLayerGroup(layerConfig, layerConfig.cloneInitialSettings());
          return this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup);
        }

        // Non-group entry (skip if already in error)
        if (layerConfig.layerStatus === 'error') {
          return undefined;
        }

        // Try processing the layer entry
        try {
          return await this.#processOneLayerEntry(layerConfig);
        } catch (error: unknown) {
          this.addLayerLoadError(formatError(error), layerConfig);
          return undefined;
        }
      });

      // Wait for all entries to finish
      const createdLayers = await Promise.all(creationPromises);

      // Add successfully created layers to the group
      createdLayers.forEach((layer) => {
        if (layer) layerGroup!.addLayer(layer);
      });

      return layerGroup;
    } catch (error: unknown) {
      // Log unexpected error
      logger.logError(error);

      // On unexpected failure, return nothing
      return undefined;
    }
  }

  /**
   * Processes a layer entry and returns a Promise of an Open Layer Base Layer object.
   * This method sets the 'loading' status on the layer config and then calls the overridable method 'onProcessOneLayerEntry'.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   * @private
   */
  #processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseGVLayer> {
    // Process
    return this.onProcessOneLayerEntry(layerConfig);
  }

  /**
   * Creates a layer group.
   * @param {GroupLayerEntryConfig} layerConfig The layer group configuration.
   * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
   * @returns {LayerGroup} A new layer group.
   * @private
   */
  #createLayerGroup(layerConfig: GroupLayerEntryConfig, initialSettings: TypeLayerInitialSettings): GVGroupLayer {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerConfig },
    };
    if (initialSettings?.extent !== undefined) layerGroupOptions.extent = initialSettings.extent;
    if (initialSettings?.states?.opacity !== undefined) layerGroupOptions.opacity = initialSettings.states.opacity;

    // Create the OpenLayer layer
    const layerGroup = new LayerGroup(layerGroupOptions);

    // Create the GV Group Layer
    const gvGroupLayer = new GVGroupLayer(layerGroup, layerConfig);

    // Emit about it
    this.#emitLayerGroupCreated({ layer: gvGroupLayer });

    // Return it
    return gvGroupLayer;
  }

  /**
   * Throws an aggregate error based on the 'layerLoadError' list, if any.
   */
  #throwAggregatedLayerLoadErrors(): void {
    // If no errors
    if (this.#layerLoadError.length === 0) {
      // Nothing to do
    } else {
      // Errors happened
      // If only one, throw as-is
      if (this.#layerLoadError.length === 1) throw this.#layerLoadError[0];
      // Aggregate the error into one and throw it
      throw this.#aggregateLayerLoadErrors();
    }
  }

  /**
   * Aggregates the errors that might have happened during processing and that are stored in layerLoadError, if any.
   */
  #aggregateLayerLoadErrors(): AggregateError | undefined {
    // If any errors compiled up
    if (this.#hasLayerLoadedErrors()) {
      // Throw an aggregated exception
      return new AggregateError(this.#layerLoadError, 'Multiple errors happened. See this.layerLoadError for the list.');
    }

    // No errors
    return undefined;
  }

  /**
   * Gets if the layer processing has generated errors.
   * @returns {boolean} True when the layer processing has generated errors in the 'layerLoadError' list.
   */
  #hasLayerLoadedErrors(): boolean {
    return this.#layerLoadError.length > 0;
  }

  /**
   * Recursively gathers the layer entry configs
   * @param {ConfigBaseClass[]} totalList - The total gathered thus far
   * @param {TypeLayerEntryConfig} currentNode - The current layer entry config being worked on
   * @private
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

  /**
   * Monitors the metadata fetch process for this GeoView layer.
   * After a predefined wait period (`DEFAULT_WAIT_PERIOD_METADATA_WARNING`), it verifies whether all layer configurations
   * have reached at least the 'processed' status. If not, it emits a warning message indicating that metadata loading
   * is taking longer than expected.
   *
   * This helps notify users or the system of potential delays in loading metadata.
   * @private
   */
  #startMetadataFetchWatcher(): void {
    delay(AbstractGeoViewLayer.DEFAULT_WAIT_PERIOD_METADATA_WARNING).then(
      () => {
        // Check if the layer configs were all at least processed, we're done
        if (ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('processed', this.listOfLayerEntryConfig)) return true;

        // Emit message
        this.emitMessage('warning.layer.metadataTakingLongTime', [this.getLayerEntryNameOrGeoviewLayerName()], 'warning');

        return false;
      },
      (error: unknown) => logger.logPromiseFailed('Delay in #startMetadataFetchWatcher failed', error)
    );
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerEntryRegisterInitEvent} event - The event to emit
   */
  protected emitLayerEntryRegisterInit(event: LayerEntryRegisterInitEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryRegisterInitHandlers, event);
  }

  /**
   * Registers a layer entry config processed event handler.
   * @param {LayerEntryRegisterInitDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryRegisterInitHandlers, callback);
  }

  /**
   * Unregisters a layer entry config processed event handler.
   * @param {LayerEntryRegisterInitDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryRegisterInitHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerEntryProcessedEvent} event - The event to emit
   * @private
   */
  #emitLayerEntryProcessed(event: LayerEntryProcessedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryProcessedHandlers, event);
  }

  /**
   * Registers a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Unregisters a layer entry config processed event handler.
   * @param {LayerEntryProcessedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryProcessedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerConfigCreatedEvent} event - The event to emit
   * @private
   */
  #emitLayerConfigCreated(event: LayerConfigCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigCreatedHandlers, event);
  }

  /**
   * Registers a config created event handler.
   * @param {LayerConfigCreatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigCreated(callback: LayerConfigCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigCreatedHandlers, callback);
  }

  /**
   * Unregisters a config created event handler.
   * @param {LayerConfigCreatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigCreated(callback: LayerConfigCreatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigCreatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerGVCreatedEvent} event - The event to emit
   * @private
   */
  #emitLayerGVCreated(event: LayerGVCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGVCreatedHandlers, event);
  }

  /**
   * Registers a config created event handler.
   * @param {LayerGVCreatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerGVCreated(callback: LayerGVCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerGVCreatedHandlers, callback);
  }

  /**
   * Unregisters a config created event handler.
   * @param {LayerGVCreatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGVCreated(callback: LayerGVCreatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGVCreatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerGroupCreatedEvent} event - The event to emit
   * @private
   */
  #emitLayerGroupCreated(event: LayerGroupCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupCreatedHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerGroupCreatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerGroupCreated(callback: LayerGroupCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerGroupCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerGroupCreatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGroupCreated(callback: LayerGroupCreatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGroupCreatedHandlers, callback);
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
   * Registers a layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerMessage(callback: LayerMessageDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Unregisters a layer message event handler.
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
   * @static
   */
  static #setStatusErrorAll(error: Error, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // For each layer entry config in the list
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      // If the layer entry is a group
      if (layerConfig.getEntryTypeIsGroup()) {
        // Recursively set the status to the children
        AbstractGeoViewLayer.#setStatusErrorAll(error, layerConfig.listOfLayerEntryConfig);
        // Set the layer status to error
        layerConfig?.setLayerStatusError();
      } else {
        // If already set to error, don't touch it
        if (layerConfig.layerStatus === 'error') return;

        // Set the layer status to error
        layerConfig?.setLayerStatusError();
      }
    });
  }

  /**
   * Processes a Layer Config by calling 'createGeoViewLayers' on the provided layer.
   * @param {AbstractGeoViewLayer} layer - The layer to use to process the configuration
   * @returns {Promise<ConfigBaseClass>} The promise of a generated ConfigBaseClass.
   * @protected
   * @static
   */
  protected static processConfig(layer: AbstractGeoViewLayer): Promise<ConfigBaseClass[]> {
    // Create a promise that the layer config will be created
    const promise = new Promise<ConfigBaseClass[]>((resolve, reject) => {
      // Register a handler when the layer config has been created for this config
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layer.onLayerConfigCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerConfigCreatedEvent) => {
        // A Layer Config was created
        // Leaving the callback here for development purposes
        // logger.logDebug('Config created', event.config);
      });

      // (Extra) Register a handler when a Group layer has been created for this config
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layer.onLayerGroupCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGroupCreatedEvent) => {
        // A Group Layer was created
        // Leaving the callback here for development purposes
        // logger.logDebug('Group Layer created', event.layer);
      });

      // (Extra) Register a handler when a GV layer has been created for this config
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layer.onLayerGVCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGVCreatedEvent) => {
        // A GV Layer was created
        // Leaving the callback here for development purposes
        // logger.logDebug('GV Layer created', event.layer);
      });

      // Start the geoview-layers config process
      layer
        .createGeoViewLayers()
        .then((configs) => {
          // Resolve with the configurations
          resolve(configs);
        })
        .catch((error: unknown) => {
          // Reject
          reject(formatError(error));
        });
    });

    // Return the promise
    return promise;
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
export type LayerEntryRegisterInitEvent = {
  // The configuration associated with the layer entry processed
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryRegisterInitDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryRegisterInitEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerEntryProcessedEvent = {
  // The configuration associated with the layer entry processed
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryProcessedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryProcessedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerConfigCreatedEvent = {
  // The configuration associated with the layer to be created
  config: ConfigBaseClass;

  // The errors, if any, which happened during config creation
  errors: Error[];
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerConfigCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerConfigCreatedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerGVCreatedEvent = {
  // The configuration associated with the layer to be created
  layer: AbstractGVLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerGVCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerGVCreatedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerGroupCreatedEvent = {
  // The created layer group
  layer: GVGroupLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerGroupCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerGroupCreatedEvent, void>;

export interface TypeWmsLegendStyle {
  name: string;
  legend: HTMLCanvasElement | null;
}

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

export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
}

export interface TypeVectorLegend extends TypeLegend {
  legend: TypeVectorLayerStyles;
}

export interface TypeGeoTIFFLegend extends Omit<TypeLegend, 'styleConfig'> {
  legend: HTMLCanvasElement | null;
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

/**
 * type guard function that redefines a TypeLegend as a TypeGeoTIFFLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const isGeoTIFFLegend = (verifyIfLegend: TypeLegend): verifyIfLegend is TypeGeoTIFFLegend => {
  return verifyIfLegend?.type === CONST_LAYER_TYPES.GEOTIFF;
};
