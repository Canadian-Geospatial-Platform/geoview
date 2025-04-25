import { CV_CONST_SUB_LAYER_TYPES, CV_LAYER_GROUP_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { layerEntryIsGroupLayer } from '@/api/config/types/type-guards';
import { TypeDisplayLanguage, TypeLayerEntryType } from '@/api/config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { logger } from '@/core/utils/logger';

// ========================
// #region CLASS HEADER
/**
 * Type used to define a group of layers. It can be either subgroups or sublayers.
 */
export abstract class GroupLayerEntryConfig extends EntryConfigBaseClass {
  // #region PUBLIC PROPERTIES
  /** Layer entry data type. */
  override entryType = CV_CONST_SUB_LAYER_TYPES.GROUP;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: EntryConfigBaseClass[] = [];
  // #endregion PUBLIC PROPERTIES

  // ===================
  // #region CONSTRUCTOR
  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
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
    super(layerConfig, language, geoviewLayerConfig, parentNode);
    this.listOfLayerEntryConfig = (layerConfig.listOfLayerEntryConfig as TypeJsonArray)
      .map((subLayerConfig) => {
        if (layerEntryIsGroupLayer(subLayerConfig))
          return geoviewLayerConfig.createGroupNode(subLayerConfig, language, geoviewLayerConfig, this);
        return geoviewLayerConfig.createLeafNode(subLayerConfig, language, geoviewLayerConfig, this);
      })
      .filter((subLayerConfig) => {
        return subLayerConfig;
      }) as EntryConfigBaseClass[];
    this.findDuplicatesAndMarkThemAsErrors();
  }
  // #endregion CONSTRUCTOR

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ==========================
  // #region OVERRIDE
  /**
   * @protected @override
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   */
  protected override getSchemaPath(): string {
    return CV_LAYER_GROUP_SCHEMA_PATH;
  }

  /**
   * @protected @override
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.GROUP;
  }
  // #endregion OVERRIDE

  // #region PROTECTED
  /**
   * Fetch the metadata of all layer entry configurations defined in the layer tree.
   *
   * @returns {Promise<void>} A promise that will resolve when the process has completed.
   * @protected @async
   */
  protected async fetchListOfLayerMetadata(): Promise<void> {
    const arrayOfLayerPromises: Promise<void>[] = [];
    this.listOfLayerEntryConfig.forEach((subLayerConfig) => {
      arrayOfLayerPromises.push(subLayerConfig.fetchLayerMetadata());
    });

    const awaitedPromises = await Promise.allSettled(arrayOfLayerPromises);
    awaitedPromises.forEach((promise, i) => {
      if (promise.status === 'rejected') this.listOfLayerEntryConfig[i].setErrorDetectedFlag();
    });
  }
  // #endregion PROTECTED

  // #region PUBLIC
  /**
   * Scan the list of sublayers for duplicates. If duplicates exist, mark them as an error layer.
   */
  findDuplicatesAndMarkThemAsErrors(): void {
    this.listOfLayerEntryConfig.forEach((subLayer, sublayerIndex) => {
      for (let i = sublayerIndex + 1; i < this.listOfLayerEntryConfig.length; i++) {
        if (!this.listOfLayerEntryConfig[i].getErrorDetectedFlag() && this.listOfLayerEntryConfig[i].layerId === subLayer.layerId) {
          this.listOfLayerEntryConfig[i].setErrorDetectedFlag();
          logger.logError(`ERROR: The layerPath ${subLayer.getLayerPath()} is duplicated.`);
        }
      }
    });
  }
  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
