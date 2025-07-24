import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeSourceEsriDynamicInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLayerMetadataEsri } from '../vector-validation-classes/esri-feature-layer-entry-config';
import { TypeJsonArray } from '@/api/config/types/config-types';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_DYNAMIC;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceEsriDynamicInitialConfig;

  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriDynamicLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Write the default properties when not specified
    this.source ??= {};
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataEsriDynamic | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriDynamic | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }
}

export interface TypeMetadataEsriDynamic {
  // TODO: Cleanup - Remove the any by specifying
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: any;
  supportsDynamicLayers: boolean;
  // TODO: Cleanup - Remove the any by specifying
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: TypeJsonArray;
}
