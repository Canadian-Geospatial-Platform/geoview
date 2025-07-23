import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeLayerEntryConfig } from '@/api/config/types/map-schema-types';
import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { TypeMetadata } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

export class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.XYZ_TILES;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  declare source: TypeSourceImageXYZTilesInitialConfig;

  /**
   * The class constructor.
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: XYZTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    this.source ??= {};
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.includes('{z}/{y}/{x}'))
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}`;
  }
}

export interface TypeMetadataXYZTiles extends TypeMetadata {
  // TODO: Cleanup - Remove the any by specifying
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: any;
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
}
