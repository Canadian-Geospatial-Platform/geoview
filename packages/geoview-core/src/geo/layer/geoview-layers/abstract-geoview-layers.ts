import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';

import { doUntil, generateId } from '@/core/utils/utilities';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeDateFragments, DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeLayerInitialSettings,
  TypeLayerStatus,
  TypeStyleGeometry,
  TypeGeoviewLayerType,
  CONST_LAYER_TYPES,
  validVectorLayerLegendTypes,
} from '@/api/config/types/map-schema-types';
import { LayerServiceMetadataEmptyError, LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigEmptyLayerGroupError,
  LayerEntryConfigUnableToCreateGroupLayerError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { SnackbarType } from '@/core/utils/notifications';
import {
  CancelledError,
  ResponseEmptyError,
  PromiseRejectErrorWrapper,
  formatError,
  NotImplementedError,
} from '@/core/exceptions/core-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';

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

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  geoviewLayerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  geoviewLayerName: string;

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: string;

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /** List of errors for the layers that did not load. */
  layerLoadError: Error[] = [];

  /** The OpenLayer root layer representing this GeoView Layer. */
  olRootLayer?: BaseLayer;

  /** The service metadata. */
  metadata: TypeJsonObject | null = null;

  /** Date format object used to translate server to ISO format and ISO to server format */
  serverDateFragmentsOrder?: TypeDateFragments;

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
   * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
   */
  constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig) {
    this.type = type;
    this.geoviewLayerId = geoviewLayerConfig.geoviewLayerId || generateId(18);
    this.geoviewLayerName = geoviewLayerConfig?.geoviewLayerName ? geoviewLayerConfig.geoviewLayerName : DEFAULT_LAYER_NAMES[type];
    this.metadataAccessPath = geoviewLayerConfig.metadataAccessPath?.trim() || '';
    this.serverDateFragmentsOrder = geoviewLayerConfig.serviceDateFormat
      ? DateMgt.getDateFragmentsOrder(geoviewLayerConfig.serviceDateFormat)
      : undefined;
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
   * Gets the Geoview layer id.
   * @returns {string} The geoview layer id
   */
  getGeoviewLayerId(): string {
    return this.geoviewLayerId;
  }

  async findLayerEntries(): Promise<TypeLayerEntryConfig[]> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - findLayerEntries');

    // Fetch and set the service metadata
    await this.onFetchAndSetServiceMetadata();

    // TODO: Empty
    throw new NotImplementedError('No metadata to fetch');
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
  async createGeoViewLayers(): Promise<ConfigBaseClass[]> {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-LAYERS - createGeoViewLayers', this.listOfLayerEntryConfig);

    // Try to get a key for logging timings
    const logTimingsKey = this.geoviewLayerId;

    // Log
    logger.logMarkerStart(logTimingsKey);

    // Fetch and set the service metadata
    await this.#fetchAndSetServiceMetadata();

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
      await this.#processListOfLayerMetadata(this.listOfLayerEntryConfig, (sender, event) => {
        // If no errors
        if (event.errors.length === 0) {
          // Keep the config
          configBaseClassCreated.push(event.config);
        }
      });

      // Log the time it took thus far
      logger.logMarkerCheck(logTimingsKey, `to process the (${this.listOfLayerEntryConfig.length}) layer metadata(s)`);
    }

    // Process list of layers and await
    const layer = await this.#processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

    // Keep the OL reference
    this.olRootLayer = layer?.getOLLayer();

    // Log the time it took thus far
    logger.logMarkerCheck(logTimingsKey, 'to create the layers');

    // Return them
    return configBaseClassCreated;
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
        logger.logTraceCore(`LAYERS - 2 - Fetching and setting service metadata for: ${this.geoviewLayerId}`, this.listOfLayerEntryConfig);

        // Start a timer to see if the layer metadata could be fetched after delay
        this.#startMetadataFetchWatcher();

        // Process and, yes, keep the await here, because we want to make extra sure the onFetchAndSetServiceMetadata is
        // executed asynchronously, even if the implementation of the overriden method is synchronous.
        // All so that the try/catch works nicely here.
        await this.onFetchAndSetServiceMetadata();
      } else {
        // GV It's possible there is no metadataAccessPath, e.g.: CSV (csvLYR2), we keep the if condition here
        // Skip
      }
    } catch (error: unknown) {
      // Set the layer status to all layer entries to error (that logic was as-is in this refactor, leaving as-is for now)
      AbstractGeoViewLayer.#logErrorAndSetStatusErrorAll(formatError(error), this.listOfLayerEntryConfig);

      // If LayerServiceMetadataUnableToFetchError error
      if (error instanceof LayerServiceMetadataUnableToFetchError) {
        // Throw as-is
        throw error;
      }

      // If ResponseEmptyError error
      if (error instanceof ResponseEmptyError) {
        // Throw higher
        throw new LayerServiceMetadataEmptyError(this.geoviewLayerId, this.geoviewLayerName);
      }

      // Throw higher
      throw new LayerServiceMetadataUnableToFetchError(this.geoviewLayerId, this.geoviewLayerName, formatError(error));
    }
  }

  /**
   * Must override method to read the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
   * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
   */
  protected abstract onFetchAndSetServiceMetadata(): Promise<void>;

  /**
   * Recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
   */
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // Log
    logger.logTraceCore(`LAYERS - 3 - Validating list of layer entry configs for: ${this.geoviewLayerId}`, this.listOfLayerEntryConfig);

    // When no metadata is provided, there's no validation to be done.
    if (!this.metadata) return;

    // Copy the service metadata in each layer entry config right away
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // If an AbstractBaseLayerEntryConfig
      if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
        // Copy the service metadata right away
        layerConfig.setServiceMetadata(this.metadata!);

        // If there's a copyrightText found in the metadata
        const copyrightText = this.metadata?.copyrightText as string | undefined;
        const attributions = layerConfig.getAttributions();
        if (copyrightText && !attributions.includes(copyrightText)) {
          // Add it
          attributions.push(copyrightText);
          layerConfig.setAttributions(attributions);
        }
      }
    });

    // Redirect to overridable method
    this.onValidateListOfLayerEntryConfig(listOfLayerEntryConfig);
  }

  /**
   * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
   */
  protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    // Loop on each layer entry config
    listOfLayerEntryConfig.forEach((layerConfig) => {
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
   * Validates the configuration of the layer entries to ensure that each layer is correctly defined.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate
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
  async #processListOfLayerMetadata(
    listOfLayerEntryConfig: ConfigBaseClass[],
    callbackLayerConfigCreated: LayerConfigCreatedDelegate
  ): Promise<void> {
    // Log
    logger.logTraceCore(
      `LAYERS - 4 - Processing list of layer entry metadata, building promises, for: ${this.geoviewLayerId}}`,
      listOfLayerEntryConfig
    );

    // Create a promise for each metadata layer found throughout the recursive config
    const allPromises: Promise<ConfigBaseClass>[] = [];
    this.#processLayerMetadataRec(listOfLayerEntryConfig, allPromises);

    // Wait for all the layers to be processed
    const arrayOfLayerConfigs = await Promise.allSettled(allPromises);

    // Log
    logger.logTraceCore(
      `LAYERS - 5 - Processing list of layer entry metadata, promises done, for: ${this.geoviewLayerId}`,
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
          //
          // TODO: Refactor - Layers refactoring. Make it a super clear function when moving config information in the layer for real.
          // TO.DOCONT: After this point(?) the layerConfig should be full static and the system should rely on the Layer class to do stuff.
          //

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

        // The layer config
        layerConfig = reason.object;

        // Add the error
        this.addLayerLoadError(reason.error, reason.object);
      }

      // Callback
      callbackLayerConfigCreated?.(this, { config: layerConfig, errors: this.layerLoadError });

      // Emit that the layer config has been created
      this.#emitLayerConfigCreated({ config: layerConfig, errors: this.layerLoadError });
    });
  }

  /**
   * Recursively gathers all the promises of layer metadata for all the layer entry configs.
   * @param listOfLayerEntryConfig - The list of layer entry config currently being processed.
   * @param promisesEntryMetadata - The gathered promises as the recursive function is called.
   * @private
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
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the AbstractBaseLayerEntryConfig has its metadata processed.
                                                      When the promise fails, the reason is wrapped in a PromiseRejectErrorWrapper
                                                      to attach the layerConfig with it.
   * @private
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

      // Return as-is
      return layerConfig;
    } catch (error: unknown) {
      // Wrap so that we carry the layerConfig into the reject callback and throw it higher
      throw new PromiseRejectErrorWrapper(error, layerConfig);
    }
  }

  /**
   * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - Information needed to create the GeoView layer.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} The Promise that the config metadata has been processed.
   */
  protected abstract onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;

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
    layerGroup?: GVGroupLayer
  ): Promise<AbstractBaseLayer | undefined> {
    // Log
    logger.logTraceCore(`LAYERS - 8 - Loading list of layer entry for the Open Layer, for: ${this.geoviewLayerId}`, listOfLayerEntryConfig);

    try {
      if (listOfLayerEntryConfig.length === 0) return undefined;
      if (listOfLayerEntryConfig.length === 1) {
        // Get the config to process
        const layerConfig = listOfLayerEntryConfig[0];

        if (layerConfig.layerStatus === 'error') return undefined;

        // If working on a group layer
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings);
          const groupReturned = await this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup);
          if (groupReturned) {
            if (layerGroup) layerGroup.addLayer(groupReturned);
            return groupReturned;
          }

          // Add a layer load error
          this.addLayerLoadError(new LayerEntryConfigUnableToCreateGroupLayerError(layerConfig), layerConfig);
          return undefined;
        }

        try {
          // Process entry and catch possible error
          const baseLayer = await this.#processOneLayerEntry(layerConfig);
          if (layerGroup) layerGroup.addLayer(baseLayer);
          return layerGroup || baseLayer;
        } catch (error: unknown) {
          // Add a layer load error
          this.addLayerLoadError(formatError(error), layerConfig);
          return undefined;
        }
      }

      // HERE, listOfLayerEntryConfig.length is >= 2

      if (!layerGroup) {
        // All children of this level in the tree have the same parent, so we use the first element of the array to retrieve the parent node.
        // eslint-disable-next-line no-param-reassign
        layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig!, listOfLayerEntryConfig[0].initialSettings);
      }

      // TODO: Refactor - Rework this Promise to be "Promise<AbstractBaseLayer>"
      const promiseOfLayerCreated: Promise<AbstractBaseLayer | undefined>[] = [];
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) {
          const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings);
          promiseOfLayerCreated.push(this.#processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig, newLayerGroup));
        } else if (layerConfig.layerStatus === 'error') {
          // This layer was already detected as in error, don't make the layer, don't add to the list
          // promiseOfLayerCreated.push(Promise.resolve(undefined)); commented unnecessary code
        } else {
          // Create promise and catch possible error
          const promise = this.#processOneLayerEntry(layerConfig).catch((error: unknown) => {
            // Add a layer load error
            this.addLayerLoadError(formatError(error), layerConfig);
            return undefined;
          });

          // Add the promise
          promiseOfLayerCreated.push(promise);
        }
      });

      // Wait until all promises resolve
      const listOfLayerCreated = await Promise.all(promiseOfLayerCreated);

      // For each resolved promise result
      listOfLayerCreated
        .filter((layer) => !!layer)
        .forEach((layer) => {
          layerGroup!.addLayer(layer);
        });

      return layerGroup;
    } catch (error: unknown) {
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
   * @private
   */
  #processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayer> {
    // Process
    return this.onProcessOneLayerEntry(layerConfig);
  }

  /**
   * Overridable method to process a layer entry and return a Promise of an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
   */
  protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayer> {
    // Redirect
    const layer = this.createGVLayer(layerConfig);

    // Return the layer
    return Promise.resolve(layer);
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
   * Must override method to create a GV Layer from a layer configuration.
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @returns {AbstractGVLayer} The GV Layer that has been created.
   */
  protected abstract onCreateGVLayer(layerConfig: AbstractBaseLayerEntryConfig): AbstractGVLayer;

  /**
   * Creates a layer group.
   * @param {GroupLayerEntryConfig} layerConfig The layer group configuration.
   * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
   * @returns {LayerGroup} A new layer group.
   */
  protected createLayerGroup(layerConfig: GroupLayerEntryConfig, initialSettings: TypeLayerInitialSettings): GVGroupLayer {
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
   * Aggregates the errors that might have happened during processing and that are stored in layerLoadError, if any.
   */
  aggregateLayerLoadErrors(): AggregateError | undefined {
    // If any errors compiled up
    if (this.layerLoadError.length > 0) {
      // Throw an aggregated exception
      return new AggregateError(this.layerLoadError, 'Multiple errors happened. See this.layerLoadError for the list.');
    }

    // No errors
    return undefined;
  }

  /**
   * Throws an aggregate error based on the 'layerLoadError' list, if any.
   */
  throwAggregatedLayerLoadErrors(): void {
    // Aggregate the error
    const aggregatedError = this.aggregateLayerLoadErrors();

    // If any errors compiled up
    if (aggregatedError) {
      // Throw it
      throw aggregatedError;
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
   * Starts a delayed check to monitor the metadata fetch process for this GeoView layer.
   * After a predefined wait period (`DEFAULT_WAIT_PERIOD_METADATA_WARNING`), it verifies whether all layer configurations
   * have reached at least the 'processed' status. If not, it emits a warning message indicating that metadata loading
   * is taking longer than expected.
   *
   * This helps notify users or the system of potential delays in loading metadata.
   * @private
   */
  #startMetadataFetchWatcher(): void {
    // Do the following thing until we stop it
    doUntil(() => {
      // Check if the layer configs were all at least processed, we're done
      if (ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('processed', this.listOfLayerEntryConfig)) return true;

      // Emit message
      this.emitMessage('warning.layer.metadataTakingLongTime', [this.geoviewLayerName || this.geoviewLayerId]);

      // Continue loop
      return false;
    }, AbstractGeoViewLayer.DEFAULT_WAIT_PERIOD_METADATA_WARNING);
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LayerEntryRegisterInitEvent} event The event to emit
   */
  // TODO: Try to make this function private/protected. Public for now in this refactoring..
  emitLayerEntryRegisterInit(event: LayerEntryRegisterInitEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryRegisterInitHandlers, event);
  }

  /**
   * Registers a layer entry config processed event handler.
   * @param {LayerEntryRegisterInitDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryRegisterInitHandlers, callback);
  }

  /**
   * Unregisters a layer entry config processed event handler.
   * @param {LayerEntryRegisterInitDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryRegisterInitHandlers, callback);
  }

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
   * @param {LayerConfigCreatedEvent} event The event to emit
   * @private
   */
  #emitLayerConfigCreated(event: LayerConfigCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigCreatedHandlers, event);
  }

  /**
   * Registers a config created event handler.
   * @param {LayerConfigCreatedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerConfigCreated(callback: LayerConfigCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigCreatedHandlers, callback);
  }

  /**
   * Unregisters a config created event handler.
   * @param {LayerConfigCreatedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerConfigCreated(callback: LayerConfigCreatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigCreatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerGVCreatedEvent} event The event to emit
   * @private
   */
  #emitLayerGVCreated(event: LayerGVCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGVCreatedHandlers, event);
  }

  /**
   * Registers a config created event handler.
   * @param {LayerGVCreatedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerGVCreated(callback: LayerGVCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerGVCreatedHandlers, callback);
  }

  /**
   * Unregisters a config created event handler.
   * @param {LayerGVCreatedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerGVCreated(callback: LayerGVCreatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGVCreatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerGroupCreatedEvent} event The event to emit
   * @private
   */
  #emitLayerGroupCreated(event: LayerGroupCreatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupCreatedHandlers, event);
  }

  /**
   * Registers a layer creation event handler.
   * @param {LayerGroupCreatedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerGroupCreated(callback: LayerGroupCreatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerGroupCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer creation event handler.
   * @param {LayerGroupCreatedDelegate} callback The callback to stop being called whenever the event is emitted
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
