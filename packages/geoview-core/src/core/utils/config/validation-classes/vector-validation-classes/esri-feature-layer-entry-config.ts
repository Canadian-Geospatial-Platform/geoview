import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
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

    // Validate the dataAccessPath exists when metadataAccessPath is empty
    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(this.geoviewLayerConfig.geoviewLayerId);
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
