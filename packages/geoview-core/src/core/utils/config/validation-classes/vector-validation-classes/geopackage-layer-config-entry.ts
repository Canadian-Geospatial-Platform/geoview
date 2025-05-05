import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoPackageInitialConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class GeoPackageLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceGeoPackageInitialConfig;

  /**
   * The class constructor.
   * @param {GeoPackageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoPackageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

    // Value for this.source.format can only be GeoPackage.
    if (!this.source) this.source = { format: 'GeoPackage' };
    if (!this.source.format) this.source.format = 'GeoPackage';

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath.
    if (!this.source.dataAccessPath) {
      let accessPath = this.geoviewLayerConfig.metadataAccessPath!;
      accessPath = accessPath!.split('/').length > 1 ? accessPath!.split('/').slice(0, -1).join('/') : './';
      this.source.dataAccessPath = accessPath;
    }

    if (
      !(this.source.dataAccessPath!.startsWith('blob') && !this.source.dataAccessPath!.endsWith('/')) &&
      !this.source.dataAccessPath!.toLowerCase().endsWith('.gpkg')
    ) {
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath!}${this.layerId}`
        : `${this.source.dataAccessPath!}/${this.layerId}`;
    }

    if (!this?.source?.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
