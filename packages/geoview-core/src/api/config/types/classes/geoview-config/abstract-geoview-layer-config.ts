import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { Cast, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { TypeGeoviewLayerType, TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { normalizeLocalizedString } from '@config/utils';
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

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject;

  /** If the geoview layer is linked to a map config, we keep a reference to the map for message propagation */
  #mapFeatureConfig?: MapFeatureConfig;

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
  geoviewLayerName: string;

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

  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoView layer. */
  listOfLayerEntryConfig: EntryConfigBaseClass[] = [];

  /**
   * The class constructor.
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeatureConfig?: MapFeatureConfig) {
    this.isGeocore = (geoviewLayerConfig.isGeocore as boolean) || false;
    // The isGeocore property is not part of the input schema. Now that it has been transferd to the internal representation,
    // It must be removed from the input config to make the input validation successful.
    // eslint-disable-next-line no-param-reassign
    delete geoviewLayerConfig.isGeocore;

    this.#originalgeoviewLayerConfig = cloneDeep(geoviewLayerConfig);
    this.#mapFeatureConfig = mapFeatureConfig;
    this.#language = language;

    this.initialSettings = Cast<TypeLayerInitialSettings>(
      defaultsDeep(this.#originalgeoviewLayerConfig.initialSettings, CV_DEFAULT_LAYER_INITIAL_SETTINGS)
    );
    // The top layer must be a layer group or a single leaf node.
    if ((this.#originalgeoviewLayerConfig?.listOfLayerEntryConfig as TypeJsonArray)?.length > 1)
      (this.#originalgeoviewLayerConfig.listOfLayerEntryConfig as TypeJsonArray) = [
        {
          layerId: this.#originalgeoviewLayerConfig.geoviewLayerId,
          initialSettings: this.initialSettings as TypeJsonObject,
          layerName: { ...(this.#originalgeoviewLayerConfig.geoviewLayerName as object) },
          isLayerGroup: true as TypeJsonObject,
          listOfLayerEntryConfig: this.#originalgeoviewLayerConfig.listOfLayerEntryConfig,
        },
      ];

    this.geoviewLayerId = (this.#originalgeoviewLayerConfig.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = normalizeLocalizedString(this.#originalgeoviewLayerConfig?.geoviewLayerName)![this.#language]!;
    this.metadataAccessPath = normalizeLocalizedString(this.#originalgeoviewLayerConfig.metadataAccessPath)![this.#language]!;
    this.serviceDateFormat = (this.#originalgeoviewLayerConfig.serviceDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (this.#originalgeoviewLayerConfig.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.isTimeAware = (
      this.#originalgeoviewLayerConfig.isTimeAware === undefined ? true : this.#originalgeoviewLayerConfig.isTimeAware
    ) as boolean;
    this.listOfLayerEntryConfig = (this.#originalgeoviewLayerConfig?.listOfLayerEntryConfig as TypeJsonArray)
      ?.map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig)) return new GroupLayerEntryConfig(subLayerConfig, this.initialSettings, language, this);
        return this.createLeafNode(subLayerConfig, this.initialSettings, language, this);
      })
      // When a sublayer cannot be created, the value returned is undefined. These values will be filtered.
      ?.filter((subLayerConfig) => {
        return subLayerConfig;
      }) as EntryConfigBaseClass[];
  }

  /**
   * Validate the object properties. Layer name and type must be set.
   * @private
   */
  protected validate(): void {
    this.#errorDetected =
      this.#errorDetected || !this.geoviewLayerType || !this.geoviewLayerId || !this.geoviewLayerName || !this.metadataAccessPath;
    if (!this.geoviewLayerType) throw new GeoviewLayerMandatoryError('LayerTypeMandatory', [this.geoviewLayerId, this.geoviewLayerType]);
    if (!this.geoviewLayerId) throw new GeoviewLayerMandatoryError('LayerIdMandatory', [this.geoviewLayerType]);
    if (!this.geoviewLayerName) throw new GeoviewLayerMandatoryError('LayerNameMandatory', [this.geoviewLayerId, this.geoviewLayerType]);
    if (!this.metadataAccessPath)
      throw new GeoviewLayerMandatoryError('MetadataAccessPathMandatory', [this.geoviewLayerId, this.geoviewLayerType]);
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
    initialSettings: TypeLayerInitialSettings | TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass | undefined;

  /**
   * Methode used to set the AbstractGeoviewLayerConfig error flag to true and the MapFeatureConfig error flag if the
   * instance exists.
   */
  setErrorDetectedFlag(): void {
    this.#errorDetected = true;
    this.#mapFeatureConfig?.setErrorDetectedFlag();
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
