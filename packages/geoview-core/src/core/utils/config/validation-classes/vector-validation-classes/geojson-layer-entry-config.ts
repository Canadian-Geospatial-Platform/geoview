import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoJSONInitialConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { CONST_LAYER_ENTRY_TYPES } from '@/geo/map/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceGeoJSONInitialConfig;

  /**
   * The class constructor.
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoJSONLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
    // Value for this.source.format can only be GeoJSON.
    if (!this.source) this.source = { format: 'GeoJSON' };
    if (!this.source.format) this.source.format = 'GeoJSON';

    // We assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    let accessPath = this.geoviewLayerConfig.metadataAccessPath!;
    // Remove the metadata file name and keep only the path to the directory where the metadata resides
    if (accessPath.toLowerCase().endsWith('.meta'))
      accessPath = accessPath!.split('/').length > 1 ? accessPath!.split('/').slice(0, -1).join('/') : './';
    this.source.dataAccessPath = accessPath;

    if (
      !(this.source.dataAccessPath!.startsWith('blob') && !this.source.dataAccessPath!.endsWith('/')) &&
      !this.source.dataAccessPath!.toUpperCase().endsWith('.JSON') &&
      !this.source.dataAccessPath!.toUpperCase().endsWith('.GEOJSON') &&
      !this.source.dataAccessPath!.toUpperCase().endsWith('=JSON')
    ) {
      this.source.dataAccessPath! = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath!}${this.layerId}`
        : `${this.source.dataAccessPath!}/${this.layerId}`;
    }

    if (!this.source.dataProjection) this.source.dataProjection = Projection.PROJECTION_NAMES.LNGLAT;
  }
}
