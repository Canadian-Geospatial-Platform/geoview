import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.CSV;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceCSVInitialConfig;

  // character separating values in csv file
  valueSeparator? = ',';

  /**
   * The class constructor.
   * @param {CsvLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: CsvLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Write the default properties when not specified
    this.source ??= { format: 'CSV', separator: ',' };
    this.source.format ??= 'CSV';
    this.source.separator ??= ',';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Normalize dataAccessPath if needed
    const path = this.source.dataAccessPath!;
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const isCsvFile = path.toUpperCase().endsWith('.CSV');
    const hasCsvQuery = path.toUpperCase().includes('.CSV?');

    if (!isBlob && !isCsvFile && !hasCsvQuery) {
      const endsWithSlash = path.endsWith('/');
      let normalizedPath = endsWithSlash ? `${path}${this.layerId}` : `${path}/${this.layerId}`;

      if (!normalizedPath.toUpperCase().endsWith('.CSV')) {
        normalizedPath += '.csv';
      }
      this.source.dataAccessPath = normalizedPath;
    }
  }
}
