import { TypeSourceOgcFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { TypeLocalizedString } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from '../vector-layer-entry-config';

export class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceOgcFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {OgcFeatureLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be featureAPI.
    if (!this.source) this.source = { format: 'featureAPI' };
    if (!this?.source?.format) this.source.format = 'featureAPI';
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
    if (!this.source.dataProjection) this.source.dataProjection = 'EPSG:4326';
  }
}
