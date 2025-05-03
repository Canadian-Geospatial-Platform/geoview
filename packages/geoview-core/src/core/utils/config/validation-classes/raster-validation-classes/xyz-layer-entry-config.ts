import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';

export class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
  declare source: TypeSourceImageXYZTilesInitialConfig;

  /**
   * The class constructor.
   * @param {TypeXYZTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: XYZTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Validate the dataAccessPath exists when metadataAccessPath is empty
    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(this.geoviewLayerConfig.geoviewLayerId);
    }

    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.includes('{z}/{y}/{x}'))
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}`;
  }
}
