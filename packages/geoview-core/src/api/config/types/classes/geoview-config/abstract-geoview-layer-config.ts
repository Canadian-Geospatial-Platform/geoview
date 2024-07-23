import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { TypeGeoviewLayerType, TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { isvalidComparedToInputSchema, normalizeLocalizedString } from '@config/utils';
import { CV_DEFAULT_LAYER_INITIAL_SETTINGS } from '@config/types/config-constants';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { GeoviewLayerMandatoryError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

import { generateId } from '@/core/utils/utilities';

/**
 *  Base class for the definition of a Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language: TypeDisplayLanguage;

  /** Cloned copy of the configuration as provided by the user when the constructor was called. */
  #geoviewLayerConfig: TypeJsonObject;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

  /** The metadata returned by the service endpoint. */
  #metadata: TypeJsonObject = {};

  /** The metadata layer tree definition */
  #metadataLayerTree: EntryConfigBaseClass[] = [];

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
  // it will not be null or undefined when used. It is not initialized by the constructor but rather by the metadata
  // processing methods or ultimately by the applyDefaultValueToUndefinedFields method executed following metadata
  // processing. I'm writing it here, simply, explicitly, to make it clear that this AbstractGeoviewLayerConfig class
  // owns (and expects) this attribute.

  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings!: TypeLayerInitialSettings;

  // GV NOTE END *****************************************************************************************************

  /**
   * The class constructor saves a cloned copy of the Geoview configuration supplied by the user and runs a validation on it to
   * find any errors that may have been made. It only initalizes the properties needed to query the service and layer metadata.
   *
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   */
  constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage) {
    // Keep a copy of the configuration. It will be used later in the execution flow to overwrite values obtained from the metadata.
    this.#geoviewLayerConfig = cloneDeep(geoviewLayerConfig);
    this.#validateGeoviewConfig();

    this.#language = language;

    // GV: GeoCore layers are processed by the configApi. GeoView layer instances do not recognize them as a valid geoView layer Type.
    // GV: However, whe have the isGeocore flag to keep track of geocore layers that were converted to geoview layers.
    this.isGeocore = (geoviewLayerConfig.isGeocore as boolean) || false;
    this.geoviewLayerId = (geoviewLayerConfig.geoviewLayerId || generateId()) as string;
    this.metadataAccessPath = normalizeLocalizedString(geoviewLayerConfig.metadataAccessPath)![this.#language]!;

    // Validate the structure of the sublayer list and correct it if needed.
    let jsonListOfLayerEntryConfig: TypeJsonArray;
    switch ((geoviewLayerConfig?.listOfLayerEntryConfig as TypeJsonArray)?.length) {
      case undefined:
      case 0:
        jsonListOfLayerEntryConfig = [];
        break;
      case 1:
        // The top layer is a single leaf node.
        jsonListOfLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray;
        break;
      default:
        // We create a group because the node at the top of the layer tree cannot be an array.
        jsonListOfLayerEntryConfig = [
          Cast<TypeJsonObject>({
            layerId: geoviewLayerConfig.geoviewLayerId,
            layerName: { ...(geoviewLayerConfig.geoviewLayerName as object) },
            isLayerGroup: true,
            listOfLayerEntryConfig: geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray,
          }),
        ];
        break;
    }

    // Instanciate the sublayer list.
    this.listOfLayerEntryConfig = jsonListOfLayerEntryConfig
      ?.map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig)) return new GroupLayerEntryConfig(subLayerConfig, language, this);
        return this.createLeafNode(subLayerConfig, language, this);
      })
      // When a sublayer cannot be created, the value returned is undefined. These values will be filtered.
      ?.filter((subLayerConfig) => {
        return subLayerConfig;
      }) as EntryConfigBaseClass[];
  }

  /**
   * Validate the geoview configuration using the schema associated to its layer type. The validation performed doesn't
   * cover the content of the listOfLayerEntryConfig. This validation will be done by the sublayer instances.
   */
  #validateGeoviewConfig(): void {
    if (
      !isvalidComparedToInputSchema(this.geoviewLayerSchema, this.#geoviewLayerConfig) ||
      !this.#geoviewLayerConfig.geoviewLayerType ||
      !this.#geoviewLayerConfig.metadataAccessPath
    )
      this.setErrorDetectedFlag();

    if (!this.#geoviewLayerConfig.geoviewLayerType)
      throw new GeoviewLayerMandatoryError('LayerTypeMandatory', [this.geoviewLayerId, this.geoviewLayerType]);
    if (!this.#geoviewLayerConfig.metadataAccessPath)
      throw new GeoviewLayerMandatoryError('MetadataAccessPathMandatory', [this.geoviewLayerId, this.geoviewLayerType]);
  }

  /**
   * Apply default value to undefined fields.
   */
  applyDefaultValueToUndefinedFields(): void {
    this.serviceDateFormat = this.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ';
    this.externalDateFormat = this.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ';
    this.isTimeAware = this.isTimeAware !== undefined ? this.isTimeAware : true;

    this.initialSettings = defaultsDeep(this.initialSettings, CV_DEFAULT_LAYER_INITIAL_SETTINGS);
    this.listOfLayerEntryConfig.forEach((subLayer) => {
      subLayer.applyDefaultValueToUndefinedFields(this.initialSettings);
    });
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in a private variable of the geoview layer.
   * The benifit of using a private #metadata is that it is invisible to the schema validation and JSON serialization.
   * @abstract
   */
  abstract fetchServiceMetadata(): Promise<void>;

  /**
   * The setter method that sets the metadata private property. The benifit of using a setter/getter with a
   * private #metadata is that it is invisible to the schema validation and JSON serialization.
   *
   * @param {TypeJsonObject} metadata The GeoView service metadata.
   * @protected
   */
  protected set metadata(metadata: TypeJsonObject) {
    this.#metadata = metadata;
  }

  /**
   * The getter method that returns the metadata private property. The benifit of using a setter/getter with a
   * private #metadata is that it is invisible to the schema validation and JSON serialization.
   *
   * @returns {TypeJsonObject} The GeoView service metadata.
   * @protected
   */
  protected get metadata(): TypeJsonObject {
    return this.#metadata;
  }

  /**
   * The getter method that returns the metadataLayerTree private property. The benifit of using a setter/getter with a
   * private #metadataLayerTree is that it is invisible to the schema validation and JSON serialization.
   *
   * @returns {EntryConfigBaseClass[]} The metadata layer tree.
   */
  get metadataLayerTree(): EntryConfigBaseClass[] {
    return this.#metadataLayerTree;
  }

  /**
   * The setter method that sets the metadataLayerTree private property. The benifit of using a setter/getter with a
   * private #metadata is that it is invisible to the schema validation and JSON serialization.
   *
   * @param {TypeJsonObject} metadataLayerTree The GeoView service metadata.
   * @protected
   */
  protected set metadataLayerTree(metadataLayerTree: EntryConfigBaseClass[]) {
    this.#metadataLayerTree = metadataLayerTree;
  }

  /**
   * The getter method that returns the language used to create the geoview layer.
   *
   * @returns {TypeDisplayLanguage} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  protected get language(): TypeDisplayLanguage {
    return this.#language;
  }

  /**
   * The getter method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  protected abstract get geoviewLayerSchema(): string;

  /**
   * The getter method that returns the geoview layer type to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @abstract
   */
  abstract get geoviewLayerType(): TypeGeoviewLayerType;

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
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
   * Methode used to set the AbstractGeoviewLayerConfig error flag to true.
   */
  setErrorDetectedFlag(): void {
    this.#errorDetected = true;
  }

  /**
   * The getter method that returns the errorDetected flag.
   *
   * @returns {boolean} The errorDetected property associated to the geoview layer config.
   */
  get errorDetected(): boolean {
    return this.#errorDetected;
  }

  /**
   * This method returns the json string of the geoview layer's configuration. The output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
   * @param {number} indent The number of space to indent the output string (default=2).
   *
   * @returns {string} The json string corresponding to the map feature configuration.
   */
  serialize(indent: number = 2): string {
    return JSON.stringify(this, undefined, indent);
  }
}
