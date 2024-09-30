import cloneDeep from 'lodash/cloneDeep';

import { CV_DEFAULT_LAYER_INITIAL_SETTINGS } from '@config/types/config-constants';
import { toJsonObject, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import {
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeDisplayLanguage,
  Extent,
} from '@config/types/map-schema-types';
import { isvalidComparedToInputSchema } from '@/api/config/utils';

// ========================
// #region CLASS HEADER
/**
 * Base type used to define a GeoView sublayer to display on the map. The sublayer can be a group or an abstract sublayer.
 */
export abstract class EntryConfigBaseClass {
  // ==========================
  // #region PRIVATE PROPERTIES
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** The GeoView configuration that owns the configuration tree that contains this node. */
  #geoviewLayerConfig: AbstractGeoviewLayerConfig;

  /** Parent node (used to compute the layerPath). */
  #parentNode: EntryConfigBaseClass | undefined = undefined;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetectedFlag = false;

  /**
   * The metadata returned by the service endpoint.
   */
  #layerMetadata: TypeJsonObject = {};
  // #endregion PRIVATE PROPERTIES

  // =========================
  // #region PUBLIC PROPERTIES
  /** Used to distinguish layer group nodes. */
  isLayerGroup: boolean;

  /** The identifier of the layer to display on the map. */
  layerId: string;

  /** The display name of the layer (English/French). */
  layerName?: string;

  /** Attributions obtained from the configuration or the metadata. */
  attributions: string[] = [];

  /** Bounds (in lat long) obtained from the metadata or calculated from the layers */
  bounds: Extent | undefined;

  /** Layer entry data type. */
  entryType?: TypeLayerEntryType;

  // GV NOTE START ****************************************************************************************************
  // The following attributes use the 'definite assignment assertion' (! after the property name) to indicate that
  // these properties will not be null or undefined when used. They are not initialized by the constructor but rather
  // by the applyDefaultValues or the metadata processing methods. I'm writing them here, simply, explicitly, to make
  // it clear that EntryConfigBaseClass owns (and expects) these attributes.

  /** The min scale that can be reach by the layer. */
  minScale!: number;

  /** The max scale that can be reach by the layer. */
  maxScale!: number;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings!: TypeLayerInitialSettings;

  // GV NOTE END *****************************************************************************************************
  // #endregion PUBLIC PROPERTIES

  // ===================
  // #region CONSTRUCTOR
  /**
   * The class constructor use the sublayer configuration supplied by the user and runs a validation on it to find any errors that
   * may have been made. It only initalizes the properties needed to query the layer metadata for leaf nodes or to create a the
   * layer group.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   * @constructor
   */
  constructor(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewLayerConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ) {
    this.validateLayerConfig(layerConfig);
    this.#language = language;
    this.#geoviewLayerConfig = geoviewLayerConfig;
    this.#parentNode = parentNode;

    this.layerId = layerConfig.layerId as string;
    this.layerName = (layerConfig?.layerName?.[this.#language] as string) || 'undefined';
    this.entryType = this.getEntryType();
    this.isLayerGroup = (layerConfig.isLayerGroup as boolean) || false;

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
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @abstract
   */
  protected abstract getSchemaPath(): string;

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @abstract
   */
  protected abstract getEntryType(): TypeLayerEntryType;

  /**
   * Fetch the layer metadata from the metadataAccessPath and store it in a private variable of the sublayer.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   *
   * @returns {Promise<void>} A Promise that will resolve when the execution will be completed.
   * @abstract
   */
  abstract fetchLayerMetadata(): Promise<void>;

  /**
   * This method is used to parse the layer metadata and extract the style, source information and other properties.
   * @abstract @protected
   */
  protected abstract parseLayerMetadata(): void;

  // #endregion ABSTRACT

  // =================
  // #region PROTECTED
  /**
   * Validate the node configuration using the schema associated to its layer type.
   * @protected
   */
  protected validateLayerConfig(layerConfig: TypeJsonObject): void {
    // TODO: Code to be deleted when the configuration api is used permanently. We do that to avoid validation errors.
    // GV: Delete this
    // GV:    |||
    // GV:    vvv
    const entryType = layerConfig?.entryType;
    // eslint-disable-next-line no-param-reassign
    delete layerConfig.entryType;
    // eslint-disable-next-line no-param-reassign
    if (entryType === 'group') (layerConfig.isLayerGroup as boolean) = true;
    // GV:    ^^^
    // GV:    |||

    // GV: Do not delete the following line.

    if (!isvalidComparedToInputSchema(this.getSchemaPath(), layerConfig)) this.setErrorDetectedFlag();

    // TODO: Code to be deleted when the configuration api is used permanently.
    // GV: Delete this
    // GV:    |||
    // GV:    vvv
    // eslint-disable-next-line no-param-reassign
    if (entryType) layerConfig.entryType = entryType;
    // eslint-disable-next-line no-param-reassign
    if (entryType === 'group') delete layerConfig.isLayerGroup;
    // GV:    ^^^
    // GV:    |||
  }
  // #endregion PROTECTED

  // ==============
  // #region PUBLIC
  /**
   * The setter method that sets the metadata private property. The benifit of using a setter/getter with a
   * private #metadata is that it is invisible to the schema validation and JSON serialization.
   *
   * @param {TypeJsonObject} metadata The sub-layer metadata.
   */
  setLayerMetadata(metadata: TypeJsonObject): void {
    this.#layerMetadata = metadata;
  }

  /**
   * The getter method that returns the metadata private property. The benifit of using a setter/getter with a
   * private #metadata is that it is invisible to the schema validation and JSON serialization.
   *
   * @returns {TypeJsonObject} The sub-layer metadata.
   */
  getLayerMetadata(): TypeJsonObject {
    return this.#layerMetadata;
  }

  /** The geoview layer type that owns this config entry. */
  getGeoviewLayerType(): TypeGeoviewLayerType {
    return this.#geoviewLayerConfig.geoviewLayerType;
  }

  /** Set the geoview layer that owns this sub-layer configuration. */
  setGeoviewLayerConfig(geoviewLayerConfig: AbstractGeoviewLayerConfig): void {
    this.#geoviewLayerConfig = geoviewLayerConfig;
  }

  /** The geoview layer that owns this sub-layer configuration. */
  getGeoviewLayerConfig(): AbstractGeoviewLayerConfig {
    return this.#geoviewLayerConfig;
  }

  /**
   * The getter method, which returns the layerPath of the sublayer configuration. The layer path is a unique identifier
   * associated with the sublayer configuration. It's made up of the Geoview layer identifier and the node identifiers you need
   * to traverse to the targeted sublayer configuration, all separated by slashes '/'.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   */
  getLayerPath(): string {
    // recursive fonction used to evaluate the complete layer path. The function is used in the return statement that follow.
    const evaluateLayerPath = (aNode: EntryConfigBaseClass): string => {
      return aNode.#parentNode ? `${evaluateLayerPath(aNode.#parentNode)}/${aNode.layerId}` : aNode.layerId;
    };

    return `${this.#geoviewLayerConfig.geoviewLayerId}/${evaluateLayerPath(this)}`;
  }

  /**
   * Method used to set the EntryConfigBaseClass error flag to true. Once this operation has been performed, the layer entry
   * config is no longer considered viable.
   *
   * @param {boolean} value The value to assign to the flag.
   */
  setErrorDetectedFlag(value = true): void {
    this.#errorDetectedFlag = value;
  }

  /**
   * The getter method that returns the errorDetected flag.
   *
   * @returns {boolean} The errorDetected property associated to the entry config.
   */
  getErrorDetectedFlag(): boolean {
    return this.#errorDetectedFlag;
  }

  /**
   * Method used to set the parent node.
   *
   * @param {EntryConfigBaseClass | undefined} parentNode The parent node.
   */
  setParentNode(parentNode: EntryConfigBaseClass | undefined): void {
    this.#parentNode = parentNode;
  }

  /**
   * The getter method that returns the parentNode.
   *
   * @returns {EntryConfigBaseClass | undefined} The parentNode property associated to the entry config.
   */
  getParentNode(): EntryConfigBaseClass | undefined {
    return this.#parentNode;
  }

  /**
   * The setter method that sets the language used to create the sublayer.
   *
   * @param {TypeDisplayLanguage} language The language associated to the config.
   */
  setLanguage(language: TypeDisplayLanguage): void {
    this.#language = language;
  }

  /**
   * The getter method that returns the language used to create the sublayer.
   *
   * @returns {TypeDisplayLanguage} The language associated to the config.
   */
  getLanguage(): TypeDisplayLanguage {
    return this.#language;
  }

  /**
   * This method returns the json string of the entry configuration. The output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
   * @param {number} indent The number of space to indent the output string (default=2).
   *
   * @returns {string} The json string corresponding to the map feature configuration.
   */
  serialize(indent: number = 2): string {
    return JSON.stringify(this, undefined, indent);
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   */
  applyDefaultValues(): void {
    this.initialSettings = cloneDeep(CV_DEFAULT_LAYER_INITIAL_SETTINGS);
    this.minScale = 0;
    this.maxScale = 0;
  }

  /**
   * Create a clone of this node. This method is mainly used to clone a node from the layer tree to store a copy in the
   * list of layer entry config of the GeoView Layer. It was created to preserve the private fields created using the #
   * operator because cloneDeep doesn't copy them to the cloned instance.
   *
   * @param {EntryConfigBaseClass | undefined} parentNode The layer group that owns this node.
   *
   * @returns {EntryConfigBaseClass} The clone copy of the node.
   */
  clone(parentNode: EntryConfigBaseClass | undefined = undefined): EntryConfigBaseClass {
    let cloneOfTheNode: EntryConfigBaseClass = cloneDeep(this);

    // Remove the following properties to avoid schema validation errors.
    delete cloneOfTheNode.layerName;
    delete cloneOfTheNode.entryType;
    if ('listOfLayerEntryConfig' in cloneOfTheNode) cloneOfTheNode.listOfLayerEntryConfig = [];

    // Create a new instance using the cloned config.
    if (cloneOfTheNode.isLayerGroup)
      cloneOfTheNode = this.#geoviewLayerConfig.createGroupNode(
        toJsonObject(cloneOfTheNode),
        this.#language,
        this.#geoviewLayerConfig,
        parentNode
      )!;
    else
      cloneOfTheNode = this.#geoviewLayerConfig.createLeafNode(
        toJsonObject(cloneOfTheNode),
        this.#language,
        this.#geoviewLayerConfig,
        parentNode
      )!;
    // Restore the layerName and the private properties.
    cloneOfTheNode.layerName = this.layerName;
    cloneOfTheNode.setErrorDetectedFlag(this.#errorDetectedFlag);
    cloneOfTheNode.setLayerMetadata(this.#layerMetadata);
    cloneOfTheNode.parseLayerMetadata();
    return cloneOfTheNode;
  }

  /**
   * The getter method that returns the sublayer configuration. If the layer path doesn't exists, return undefined.
   *
   * @returns {EntryConfigBaseClass | undefined} The sublayer configuration.
   */
  getSubLayerConfig(layerPath: string): EntryConfigBaseClass | undefined {
    // The node is a group
    if (this.isLayerGroup && 'listOfLayerEntryConfig' in this) {
      const pathItems = layerPath.split('/');
      if (pathItems[0] !== this.layerId) return undefined;
      if (pathItems.length === 1) return this;
      let { listOfLayerEntryConfig } = this;
      let nodeFound: EntryConfigBaseClass | undefined;
      for (let i = 1; i < pathItems.length; i++) {
        nodeFound = (listOfLayerEntryConfig as EntryConfigBaseClass[]).find(
          (layerEntryConfig) => layerEntryConfig.layerId === pathItems[i]
        );
        if (!nodeFound) break;
        listOfLayerEntryConfig = layerEntryIsGroupLayer(nodeFound) ? nodeFound.listOfLayerEntryConfig : [];
      }
      return nodeFound;
    }

    // The node is a leaf.
    if (layerPath === this.layerId) return this;
    return undefined;
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
