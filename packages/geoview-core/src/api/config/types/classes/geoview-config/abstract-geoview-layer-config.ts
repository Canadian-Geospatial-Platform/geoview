import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { TypeGeoviewLayerType, TypeDisplayLanguage } from '@config/types/map-schema-types';
import { isvalidComparedToInputSchema, isvalidComparedToInternalSchema, normalizeLocalizedString } from '@config/utils';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { EntryConfigBaseClass } from '@config/types/classes/sub-layer-config/entry-config-base-class';
import { ConfigError, GeoviewLayerConfigError } from '@config/types/classes/config-exceptions';

import { createLocalizedString, generateId } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

// ========================
// #region CLASS HEADER
/**
 *  Base class for the definition of a Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
  // ==========================
  // #region PRIVATE PROPERTIES

  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language: TypeDisplayLanguage;

  /** Cloned copy of the configuration as provided by the user when the constructor was called. */
  #userGeoviewLayerConfig: TypeJsonObject;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetectedFlag = false;

  /** The metadata returned by the service endpoint. */
  #serviceMetadata: TypeJsonObject = {};

  /**
   * Before the call to fetchServiceMetadata, this property contains the tree filter. The value specified will guide the layer
   * tree process. if the value is undefined, the layer tree will not be created. if it is an empty array, The layer tree will
   * be created for all layers found in the service metadata. If the array is not empty, only the layerIds specified will be
   * retained. When the fetchServiceMetadata call returns, this property is undefined or it contains a layer tree.
   */
  #metadataLayerTree?: EntryConfigBaseClass[];
  // #endregion PRIVATE PROPERTIES

  // =========================
  // #region PUBLIC PROPERTIES

  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
   * information.
   */
  geoviewLayerName!: string;

  /** A flag used to indicate that the layer is a GeoCore layer (default: false). When true, geoviewLayerId must be a geocoreId. */
  isGeocore: boolean;

  /** The GeoView layer access path (English/French). */
  metadataAccessPath: string;

  /** Date format used by the service endpoint. */
  serviceDateFormat: string | undefined;

  /** Date format used by the getFeatureInfo to output date variable. */
  externalDateFormat: string | undefined;

  /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
  isTimeAware: boolean | undefined;

  /** The layer entries to use from the GeoView layer. */
  listOfLayerEntryConfig: EntryConfigBaseClass[] = [];

  // GV NOTE START ****************************************************************************************************
  // The following attribute uses the 'definite assignment assertion' (! after the property name) to indicate that
  // it will not be null or undefined when used. It is not initialized by the constructor. I'm writing it here, simply,
  // explicitly, to make it clear that this AbstractGeoviewLayerConfig class owns (and expects) this attribute.

  // The geoviewLayerType property is initialized by the children classes. Each child class knows the value to
  // assign to this property.

  /** Type of GeoView layer. */
  geoviewLayerType!: TypeGeoviewLayerType;

  // GV NOTE END *****************************************************************************************************
  // #endregion PUBLIC PROPERTIES

  // ===================
  // #region CONSTRUCTOR

  /**
   * The class constructor saves a cloned copy of the Geoview configuration supplied by the user and runs a validation on it to
   * find any errors that may have been made. It only initalizes the properties needed to query the service and layer metadata.
   *
   * @param {TypeJsonObject} userGeoviewLayerConfig The layer configuration that the user has supplied for instantiation.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   */
  constructor(userGeoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage) {
    // Keep a copy of the configuration. It will be used later in the execution flow to overwrite values obtained from the metadata.
    this.#userGeoviewLayerConfig = cloneDeep(userGeoviewLayerConfig);
    if (!isvalidComparedToInputSchema(this.getGeoviewLayerSchema(), this.#userGeoviewLayerConfig)) this.setErrorDetectedFlag();

    this.#language = language;

    // GV: GeoCore layers are processed by the configApi. GeoView layer instances do not recognize them as a valid geoView layer Type.
    // GV: However, whe have the isGeocore flag to keep track of geocore layers that were converted to geoview layers.
    this.isGeocore = (userGeoviewLayerConfig.isGeocore as boolean) || false;
    if (this.isGeocore) this.geoviewLayerName = userGeoviewLayerConfig.geoviewLayerName[this.#language] as string;
    this.geoviewLayerId = (userGeoviewLayerConfig.geoviewLayerId || generateId()) as string;
    this.metadataAccessPath = normalizeLocalizedString(userGeoviewLayerConfig.metadataAccessPath)![this.#language]!;

    // Validate the structure of the sublayer list and correct it if needed.
    switch ((this.#userGeoviewLayerConfig?.listOfLayerEntryConfig as TypeJsonArray)?.length) {
      case undefined:
      case 0:
        (this.#userGeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray) = [];
        break;
      case 1:
        // Do nothing, the top layer is a single leaf node and the structure is correct.
        break;
      default:
        // We create a group because the node at the top of the layer tree cannot be an array.
        (this.#userGeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray) = [
          Cast<TypeJsonObject>({
            layerId: this.#userGeoviewLayerConfig.geoviewLayerId,
            layerName: { ...(this.#userGeoviewLayerConfig.geoviewLayerName as object) },
            isLayerGroup: true,
            listOfLayerEntryConfig: this.#userGeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray,
          }),
        ];
        break;
    }

    // Instanciate the sublayer list.
    this.listOfLayerEntryConfig = (this.#userGeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray)
      ?.map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig)) return this.createGroupNode(subLayerConfig, language, this);
        return this.createLeafNode(subLayerConfig, language, this);
      })
      // When a sublayer cannot be created, the value returned is undefined. These values will be filtered.
      ?.filter((subLayerConfig) => {
        return subLayerConfig;
      }) as EntryConfigBaseClass[];

    // Default values are assigned first, then replaced by metadata values and finally by user configuration
    // if they have new values for these properties.
    this.applyDefaultValues();
  }
  // #endregion CONSTRUCTOR

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ================
  // #region ABSTRACT
  /**
   * The getter method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  protected abstract getGeoviewLayerSchema(): string;

  /**
   * Get the service metadata from the metadataAccessPath and store it in a private variable of the geoview layer.
   * The benifit of using a private #metadata is that it is invisible to the schema validation and JSON serialization.
   * @abstract
   */
  abstract fetchServiceMetadata(): Promise<void>;

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the leaf
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
   * @abstract
   */
  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass | undefined;

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
   * @abstract
   */
  abstract createGroupNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass | undefined;

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @protected @abstract
   */
  protected abstract createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @abstract
   */
  protected abstract createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[];
  // #endregion ABSTRACT

  // =================
  // #region PROTECTED
  /**
   * The getter method that returns the language used to create the geoview layer.
   *
   * @returns {TypeDisplayLanguage} The language associated to the config.
   * @protected
   */
  protected getLanguage(): TypeDisplayLanguage {
    return this.#language;
  }

  /**
   * Fetch the metadata of all layer entry configurations defined in the list of layer entry config
   * or the ressulting layer tree.
   *
   * @returns {Promise<void>} A promise that will resolve when the process has completed.
   * @protected @async
   */
  protected async fetchListOfLayerMetadata(layerTreeFilter: EntryConfigBaseClass[] | undefined = undefined): Promise<void> {
    // The root of the GeoView layer tree is an array that contains only one node.
    // If the layer tree is provided, use it. Otherwise use the list of layer entry config.
    const rootLayer = layerTreeFilter ? layerTreeFilter[0] : this.listOfLayerEntryConfig[0];

    try {
      if (rootLayer) {
        // If an error has been detected, there is a problem with the metadata and the layer is unusable.
        if (rootLayer.getErrorDetectedFlag()) return;

        await rootLayer.fetchLayerMetadata();
      }
    } catch (error) {
      logger.logError(`An error occured while reading the metadata for the layerPath ${rootLayer.getLayerPath()}.`, error);
      rootLayer.setErrorDetectedFlag();
    }
  }

  /**
   * Create the layer tree associated to the GeoView layer if the layer tree filter stored in the metadataLayerTree private property
   * is set.
   * @protected @async
   */
  protected async createLayerTree(): Promise<void> {
    let layerTreeFilter = this.getMetadataLayerTree();
    // If a layer tree filter is defined, create the layer tree using it.
    if (layerTreeFilter !== undefined) {
      // When the filter is an empty array, we create the layer tree for all the metadata in the service metadata.
      if (layerTreeFilter.length === 0) {
        const layerTree = this.processListOfLayerEntryConfig(this.createLayerTreeFromServiceMetadata());
        await this.fetchListOfLayerMetadata(layerTree);
        this.setMetadataLayerTree(layerTree);
      } else {
        // When the filter contains one or many layer identifiers, we create the layer tree using only the specified layers.
        // If the filter contains several layer identifiers, we create a group layer, as the root of the tree must contain
        // a single entry.
        if (layerTreeFilter.length > 1) {
          layerTreeFilter = [
            Cast<EntryConfigBaseClass>({
              layerId: this.geoviewLayerId,
              layerName: createLocalizedString(this.geoviewLayerName),
              isLayerGroup: true,
              listOfLayerEntryConfig: layerTreeFilter,
            }),
          ];
        }

        // Instanciate the root node. The root of the tree contains a single entry.
        const rootNode = layerEntryIsGroupLayer(layerTreeFilter[0])
          ? this.createGroupNode(Cast<TypeJsonObject>(layerTreeFilter[0]), this.getLanguage(), this)
          : this.createLeafNode(Cast<TypeJsonObject>(layerTreeFilter[0]), this.getLanguage(), this);
        if (rootNode) layerTreeFilter = [rootNode];
        else throw new GeoviewLayerConfigError('The layer tree creation returned an empty root node.');

        this.applyDefaultValues();
        this.setMetadataLayerTree(this.processListOfLayerEntryConfig(layerTreeFilter));
      }
      await this.fetchListOfLayerMetadata(this.getMetadataLayerTree());
    }
  }

  /**
   * A recursive method to process the listOfLayerEntryConfig. The goal is to process each valid sublayer, searching the service's
   * metadata to verify the layer's existence and whether it is a layer group, in order to determine the node's final structure.
   * If the metadata indicate the node is a layer group, it will be created by the createLayerEntryNode.
   *
   * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig the list of sublayers to process.
   *
   * @returns {EntryConfigBaseClass[]} the new list of sublayer configurations.
   * @protected
   */
  protected processListOfLayerEntryConfig(listOfLayerEntryConfig: EntryConfigBaseClass[]): EntryConfigBaseClass[] {
    return listOfLayerEntryConfig.map((subLayer) => {
      if (subLayer.getErrorDetectedFlag()) return subLayer;

      if (layerEntryIsGroupLayer(subLayer)) {
        // The next line replace the listOfLayerEntryConfig stored in the subLayer parameter
        // Since subLayer is the function parameter, we must disable the eslint no-param-reassign
        // eslint-disable-next-line no-param-reassign
        subLayer.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(subLayer.listOfLayerEntryConfig);
        return subLayer;
      }

      try {
        return this.createLayerEntryNode(subLayer.layerId, subLayer.getParentNode());
      } catch (error) {
        subLayer.setErrorDetectedFlag();
        logger.logError((error as ConfigError).message, error);
        return subLayer;
      }
    });
  }
  // #endregion PROTECTED

  // ==============
  // #region PUBLIC
  // GV: The benifit of using a setter/getter with a private #property is that it is invisible to the schema
  // GV: validation and JSON serialization.
  /**
   * The getter method that returns the serviceMetadata private property.
   *
   * @returns {TypeJsonObject} The GeoView service metadata.
   */
  getServiceMetadata(): TypeJsonObject {
    return this.#serviceMetadata;
  }

  /**
   * The setter method that sets the metadata private property.
   *
   * @param {TypeJsonObject} metadata The GeoView service metadata.
   */
  setServiceMetadata(metadata: TypeJsonObject): void {
    this.#serviceMetadata = metadata;
  }

  /**
   * The getter method that returns the metadataLayerTree private property.
   *
   * @returns {EntryConfigBaseClass[]} The metadata layer tree.
   */
  getMetadataLayerTree(): EntryConfigBaseClass[] | undefined {
    return this.#metadataLayerTree;
  }

  /**
   * The setter method that sets the metadataLayerTree private property.
   *
   * @param {TypeJsonObject} metadataLayerTree The GeoView service metadata.
   */
  setMetadataLayerTree(metadataLayerTree: EntryConfigBaseClass[]): void {
    this.#metadataLayerTree = metadataLayerTree;
  }

  /**
   * The getter method that returns the errorDetected flag.
   *
   * @returns {boolean} The errorDetected property associated to the geoview layer config.
   */
  getErrorDetectedFlag(): boolean {
    return this.#errorDetectedFlag;
  }

  /**
   * Methode used to set the AbstractGeoviewLayerConfig error flag to true.
   */
  setErrorDetectedFlag(): void {
    this.#errorDetectedFlag = true;
  }

  /**
   * The getter method that returns the sublayer configuration. If the layer path doesn't exists, return undefined.
   *
   * @returns {EntryConfigBaseClass | undefined} The sublayer configuration.
   */
  getSubLayerConfig(layerPath: string): EntryConfigBaseClass | undefined {
    const pathElement = layerPath.split('/');
    if (pathElement[0] !== this.geoviewLayerId) return undefined;
    let { listOfLayerEntryConfig } = this;
    let pathNode: EntryConfigBaseClass | undefined;
    for (let i = 1; i < pathElement.length; i++) {
      pathNode = listOfLayerEntryConfig.find((layerEntryConfig) => layerEntryConfig.layerId === pathElement[i]);
      if (!pathNode) break;
      listOfLayerEntryConfig = layerEntryIsGroupLayer(pathNode) ? pathNode.listOfLayerEntryConfig : [];
    }
    return pathNode;
  }

  /**
   * Sets the error flag for all layers in the provided list of layer entries.
   *
   * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries.
   */
  setErrorDetectedFlagForAllLayers(listOfLayerEntryConfig: EntryConfigBaseClass[]): void {
    listOfLayerEntryConfig.forEach((layerEntry) => {
      layerEntry.setErrorDetectedFlag();
      if (layerEntryIsGroupLayer(layerEntry)) this.setErrorDetectedFlagForAllLayers(layerEntry.listOfLayerEntryConfig);
    });
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   */
  applyDefaultValues(): void {
    this.serviceDateFormat = this.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ';
    this.externalDateFormat = this.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ';
    this.isTimeAware = this.isTimeAware !== undefined ? this.isTimeAware : true;
  }

  /**
   * Apply user configuration over the geoview layer configurations created from the raw metadata.
   *
   * @param {TypeJsonObject} userGeoviewLayerConfig Optional parameter that will replace the configuration provided
   *                                                    at instanciation time.
   */
  applyUserConfig(userGeoviewLayerConfig?: TypeJsonObject): void {
    if (userGeoviewLayerConfig && !isvalidComparedToInputSchema(this.getGeoviewLayerSchema(), userGeoviewLayerConfig)) {
      logger.logError(
        `GeoView configuration ${userGeoviewLayerConfig.geoviewLayerId} passed to applyUserConfig is invalid compared to the schema specification and has been ignored.`
      );
      return;
    }

    // if userGeoviewLayerConfig is undefined, use configuration provided at instanciation time. We're using a cloned copy of the
    // configuration because we're modifying it and don't want it to leak back to the original object.
    const geoviewLayerConfig = cloneDeep(userGeoviewLayerConfig || this.#userGeoviewLayerConfig);

    if (geoviewLayerConfig.geoviewLayerName) this.geoviewLayerName = geoviewLayerConfig.geoviewLayerName[this.#language] as string;
    if (geoviewLayerConfig.serviceDateFormat) this.serviceDateFormat = geoviewLayerConfig.serviceDateFormat as string;
    if (geoviewLayerConfig.externalDateFormat) this.externalDateFormat = geoviewLayerConfig.externalDateFormat as string;

    const convertUserConfigToInternalConfig = (listOfLayerEntryConfig: TypeJsonArray): TypeJsonArray => {
      return listOfLayerEntryConfig.map((sublayer): TypeJsonObject => {
        // We disable the eslint no-param-reassign because we want to keep the modifications made to the object passed as parameter.
        // eslint-disable-next-line no-param-reassign
        if (sublayer.layerName) sublayer.layerName = sublayer.layerName[this.#language];
        if (sublayer.isLayerGroup) convertUserConfigToInternalConfig(sublayer.listOfLayerEntryConfig as TypeJsonArray);
        return sublayer;
      });
    };
    const internalConfig = convertUserConfigToInternalConfig(geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray);
    this.listOfLayerEntryConfig = mergeWith(this.listOfLayerEntryConfig, internalConfig, (target, newValue, key) => {
      // Keep the listOfLayerEntryConfig as it is. Do not replace it with the user' array. Only the internal properties will be replaced.
      // This is because the newValue is not an instance of EntryConfigBaseClass. The type of the newValue property is a plain JSON object.
      if (key === 'listOfLayerEntryConfig') return undefined;
      // Replace arrays with user config arrays if they exist.
      if (Array.isArray(target) && Array.isArray(newValue)) return newValue;
      return undefined;
    });

    if (!isvalidComparedToInternalSchema(this.getGeoviewLayerSchema(), this, true)) {
      throw new GeoviewLayerConfigError(
        `GeoView internal configuration ${this.geoviewLayerId} is invalid compared to the internal schema specification.`
      );
    }
  }

  /**
   * This method returns the json string of the geoview layer's configuration. The output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
   * @param {number} indent The number of space to indent the output string (default=2).
   *
   * @returns {string} The json string corresponding to the map feature configuration.
   */
  serialize(indent: number = 2): string {
    return JSON.stringify(this, undefined, indent);
  }
  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
