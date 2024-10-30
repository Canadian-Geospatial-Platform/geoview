import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceOgcFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { Projection } from '@/geo/utils/projection';

export class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceOgcFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be featureAPI.
    if (!this.source) this.source = { format: 'featureAPI' };
    if (!this?.source?.format) this.source.format = 'featureAPI';
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
