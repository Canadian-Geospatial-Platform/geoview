import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceEsriFeatureInitialConfig;

  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} when the metadataAccessPath is undefined.`
      );
    }

    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }

    // Value for this.source.format can only be EsriJSON.
    if (!this.source) this.source = { format: 'EsriJSON' };
    if (!this.source.format) this.source.format = 'EsriJSON';

    // If undefined, we assign the metadataAccessPath of the GeoView layer to the dataAccessPath.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';

    // Remove ID from dataAccessPath
    const splitAccessPath = this.source.dataAccessPath!.split('/');
    if (
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'featureserver' &&
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'mapserver'
    ) {
      splitAccessPath.pop();
      splitAccessPath.pop();
      this.source.dataAccessPath = `${splitAccessPath.join('/')}/`;
    }
  }
}
