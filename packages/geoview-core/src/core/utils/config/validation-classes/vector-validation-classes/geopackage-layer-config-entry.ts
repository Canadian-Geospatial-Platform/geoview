import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoPackageInitialConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class GeoPackageLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.GEOPACKAGE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceGeoPackageInitialConfig;

  /**
   * The class constructor.
   * @param {GeoPackageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoPackageLayerEntryConfig) {
    // FIXME: A constructor should never receive an object of itself. Should fix this programming error.
    super(layerConfig);

    // Write the default properties when not specified
    this.source ??= { format: 'GeoPackage' };
    this.source.format ??= 'GeoPackage';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= layerConfig.source.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

    // Assign metadataAccessPath if dataAccessPath is undefined
    if (this.source.dataAccessPath) {
      this.source.dataAccessPath = this.source.dataAccessPath.includes('/')
        ? this.source.dataAccessPath.split('/').slice(0, -1).join('/')
        : './';

      // Append layerId to dataAccessPath if not pointing to blob or .gpkg
      const isBlob = this.source.dataAccessPath.startsWith('blob') && !this.source.dataAccessPath.endsWith('/');
      const isGpkg = this.source.dataAccessPath.toLowerCase().endsWith('.gpkg');

      if (!isBlob && !isGpkg) {
        const endsWithSlash = this.source.dataAccessPath.endsWith('/');
        this.source.dataAccessPath = endsWithSlash
          ? `${this.source.dataAccessPath}${this.layerId}`
          : `${this.source.dataAccessPath}/${this.layerId}`;
      }
    }
  }
}
