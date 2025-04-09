import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
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

    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} when the metadataAccessPath is undefined.`
      );
    }

    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

    // Value for this.source.format can only be CSV.
    if (!this.source) this.source = { format: 'CSV', separator: ',' };
    if (!this.source.format) this.source.format = 'CSV';
    if (!this.source.separator) this.source.separator = ',';

    // If undefined, we assign the metadataAccessPath of the CSV layer to dataAccessPath and place the layerId at the end of it, if needed.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;

    if (
      !(this.source.dataAccessPath!.startsWith('blob') && !this.source.dataAccessPath!.endsWith('/')) &&
      !this.source.dataAccessPath!.toUpperCase().endsWith('.CSV') &&
      !this.source.dataAccessPath!.toUpperCase().includes('.CSV?')
    ) {
      this.source.dataAccessPath! = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath!}${this.layerId}`
        : `${this.source.dataAccessPath!}/${this.layerId}`;

      if (!this.source.dataAccessPath!.toUpperCase().endsWith('.CSV')) this.source.dataAccessPath = `${this.source.dataAccessPath!}.csv`;
    }

    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
