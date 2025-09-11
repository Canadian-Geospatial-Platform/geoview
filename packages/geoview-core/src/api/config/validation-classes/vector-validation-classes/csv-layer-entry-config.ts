import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { Projection } from '@/geo/utils/projection';

export interface CsvLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  // TODO: Think of using a TypeSourceCSVInitialConfigProps, because it can be different properties than the resulting 'source' object stored.
  // TO.DOCONT: e.g.: this.source.format, format isn't necessary to provide as input props here.
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceCSVInitialConfig;
  /** Character separating values in csv file */
  valueSeparator?: string;
}

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.CSV;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: CsvLayerEntryConfigProps;

  /** Source settings to apply to the GeoView layer source at creation time. */
  declare source: TypeSourceCSVInitialConfig;

  /** Character separating values in csv file */
  valueSeparator?: string;

  /**
   * The class constructor.
   * @param {CsvLayerEntryConfigProps | CsvLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: CsvLayerEntryConfigProps | CsvLayerEntryConfig) {
    super(layerConfig);
    this.valueSeparator = layerConfig.valueSeparator;

    // Write the default properties when not specified
    this.source ??= { format: 'CSV', separator: ',' };
    this.source.format ??= 'CSV';
    this.source.separator ??= ',';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

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
