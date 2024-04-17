import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { CONST_LAYER_ENTRY_TYPES } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceCSVInitialConfig;

  // character separating values in csv file
  valueSeparator? = ',';

  /**
   * The class constructor.
   * @param {CsvLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: CsvLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type CSV when the metadataAccessPath is undefined.`
      );
    }
    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in layerConfig)) this.style = undefined;

    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the CSV layer to it
    // and place the layerId at the end of it.
    // Value for this.source.format can only be CSV.
    this.source = { format: 'CSV', separator: ',' };
    this.source.separator = ',';

    let { en, fr } = layerConfig.geoviewLayerConfig.metadataAccessPath!;
    en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
    fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
    this.source.dataAccessPath = { en, fr };

    if (
      !(this.source.dataAccessPath!.en?.startsWith('blob') && !this.source.dataAccessPath!.en?.endsWith('/')) &&
      !this.source.dataAccessPath!.en?.toUpperCase().endsWith('.CSV')
    ) {
      this.source.dataAccessPath!.en = this.source.dataAccessPath!.en!.endsWith('/')
        ? `${this.source.dataAccessPath!.en}${this.layerId}`
        : `${this.source.dataAccessPath!.en}/${this.layerId}`;
      this.source.dataAccessPath!.fr = this.source.dataAccessPath!.fr!.endsWith('/')
        ? `${this.source.dataAccessPath!.fr}${this.layerId}`
        : `${this.source.dataAccessPath!.fr}/${this.layerId}`;
    }

    this.source.dataProjection = 'EPSG:4326';
  }
}
