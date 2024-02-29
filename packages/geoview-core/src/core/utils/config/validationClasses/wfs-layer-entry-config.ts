import { TypeSourceWFSVectorInitialConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { TypeLocalizedString } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from './vector-layer-entry-config';

export class WfsLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceWFSVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WfsLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WfsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be WFS.
    if (!this.source) this.source = { format: 'WFS' };
    if (!this.source.format) this.source.format = 'WFS';
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
    if (!this.source.dataProjection) this.source.dataProjection = 'EPSG:4326';
  }
}
