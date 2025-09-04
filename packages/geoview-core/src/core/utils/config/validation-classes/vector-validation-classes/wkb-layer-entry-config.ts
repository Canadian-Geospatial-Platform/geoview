import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeSourceWkbInitialConfig } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class WkbLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.WKB;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** Source to include extracted data from GeoPackages */
  declare source: TypeSourceWkbInitialConfig;

  /**
   * The class constructor.
   * @param {WkbLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WkbLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Value for this.source.format can only be WKB.
    this.source ??= { format: 'WKB' };
    this.source.format ??= 'WKB';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    if (layerConfig.source?.dataAccessPath) this.source.dataAccessPath = layerConfig.source.dataAccessPath;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath!;
  }
}
