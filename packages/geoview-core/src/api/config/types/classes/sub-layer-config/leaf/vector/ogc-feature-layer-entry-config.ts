import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { TypeJsonObject } from '@/api/config/types/config-types';
import {
  TypeLayerStyleConfig,
  TypeLayerEntryType,
  TypeBaseVectorSourceInitialConfig,
  TypeOutfields,
  AbstractGeoviewLayerConfig,
  EntryConfigBaseClass,
} from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { OgcFeatureLayerConfig } from '@/api/config/types/classes/geoview-config/vector-config/ogc-feature-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { Projection } from '@/geo/utils/projection';

// ====================
// #region CLASS HEADER
/**
 * The OGC geoview sublayer class.
 */

export class OgcFeatureLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // ==================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeBaseVectorSourceInitialConfig;

  /** Style to apply to the raster layer. */
  layerStyle?: TypeLayerStyleConfig;
  // #endregion PROPERTIES

  constructor(layerConfig: TypeJsonObject, geoviewLayerConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass) {
    super(layerConfig, geoviewLayerConfig, parentNode);
    Object.assign(this, layerConfig);

    if (!geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${geoviewLayerConfig.geoviewLayerId} when the metadataAccessPath is undefined.`
      );
    }

    // Value for this.source.format can only be featureAPI.
    if (!this.source) this.source = { format: 'featureAPI' };
    if (!this?.source?.format) this.source.format = 'featureAPI';

    // We assign the metadataAccessPath of the GeoView layer to dataAccessPath.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = geoviewLayerConfig.metadataAccessPath;

    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LONLAT;
  }

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */
  // ================
  // #region OVERRIDE

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @override
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.OGC_FEATURE;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.VECTOR;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to return OgcFeatureLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {OgcFeatureLayerConfig} The Geoview layer configuration that owns this OGC layer entry config.
   * @override @async
   */
  override getGeoviewLayerConfig(): OgcFeatureLayerConfig {
    return super.getGeoviewLayerConfig() as OgcFeatureLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override async fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return;

    const metadataUrl = this.getGeoviewLayerConfig().metadataAccessPath;
    if (metadataUrl) {
      const queryUrl = metadataUrl.endsWith('/')
        ? `${metadataUrl}collections/${this.layerId}/queryables?f=json`
        : `${metadataUrl}/collections/${this.layerId}/queryables?f=json`;
      const queryResult = await Fetch.fetchJsonAsObject(queryUrl);
      if (queryResult.data.properties) {
        this.setLayerMetadata(queryResult);
        // Parse the raw layer metadata and build the geoview configuration.
        this.parseLayerMetadata();

        if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
          throw new GeoviewLayerConfigError(
            `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
          );
        }

        return;
      }
    }

    logger.logError(`Can't find layer's metadata for layerPath ${this.getLayerPath()}.`);
    this.setErrorDetectedFlag();
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   * @override
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      strategy: 'all',
      maxRecordCount: 0,
      crossOrigin: 'Anonymous',
      featureInfo: {
        queryable: true,
        nameField: '',
        outfields: [],
      },
    };
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();
    if (layerMetadata) {
      if (layerMetadata.data.properties) {
        this.setLayerMetadata(layerMetadata.data.properties);
        this.#processFeatureInfoConfig(layerMetadata.data.properties);
      }
    }
  }

  // #endregion OVERRIDE

  // ===============
  // #region PRIVATE
  /**
   * This method creates the feature information from the layer metadata.
   *
   * @returns {TypeFeatureInfoLayerConfig} The feature information in the viewer format.
   * @private
   */
  #processFeatureInfoConfig(fields: TypeJsonObject): void {
    if (!this.source) this.source = {};
    if (!this.source.featureInfo) this.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!this.source.featureInfo.outfields?.length) {
      if (!this.source.featureInfo.outfields) this.source.featureInfo.outfields = [];

      Object.keys(fields).forEach((fieldEntryKey) => {
        if (fields[fieldEntryKey].type === 'Geometry') return;

        if (!fields[fieldEntryKey]) return;
        const fieldEntry = fields[fieldEntryKey];
        if (fieldEntry.type === 'Geometry') return;

        let fieldType = 'string';
        if (fieldEntry.type === 'date') fieldType = 'date';
        else if (['bigint', 'number'].includes(typeof fieldEntry)) fieldType = 'number';

        const newOutfield: TypeOutfields = {
          name: fieldEntryKey,
          alias: fieldEntryKey,
          type: fieldType as 'string' | 'number' | 'date',
          domain: null,
        };
        this.source!.featureInfo!.outfields!.push(newOutfield);
      });
    }

    this.source.featureInfo!.outfields.forEach((outfield: TypeOutfields) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!this.source.featureInfo.nameField) {
      // eslint-disable-next-line no-param-reassign
      this.source.featureInfo.nameField = this.source.featureInfo!.outfields[0].name;
    }
  }

  // #endregion PRIVATE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
