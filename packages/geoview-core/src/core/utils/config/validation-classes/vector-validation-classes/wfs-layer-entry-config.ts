import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceWFSVectorInitialConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { Projection } from '@/geo/utils/projection';

export class WfsLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceWFSVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WfsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WfsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Validate the dataAccessPath exists when metadataAccessPath is empty
    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(this.geoviewLayerConfig.geoviewLayerId);
    }

    // Value for this.source.format can only be WFS.
    if (!this.source) this.source = { format: 'WFS' };
    if (!this.source.format) this.source.format = 'WFS';

    // We assign the metadataAccessPath of the GeoView layer to dataAccessPath.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;

    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
