import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceEsriFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }

    // Value for this.source.format can only be EsriJSON.
    if (!this.source) this.source = { format: 'EsriJSON' };
    if (!this.source.format) this.source.format = 'EsriJSON';

    // We assign the metadataAccessPath of the GeoView layer to the dataAccessPath.
    this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
  }
}
