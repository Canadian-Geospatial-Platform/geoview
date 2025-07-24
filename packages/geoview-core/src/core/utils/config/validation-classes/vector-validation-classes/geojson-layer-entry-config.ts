import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoJSONInitialConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeLayerEntryConfig } from '@/api/config/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';

export class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.GEOJSON;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceGeoJSONInitialConfig;

  /**
   * The class constructor.
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoJSONLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Value for this.source.format can only be GeoJSON.
    this.source ??= { format: 'GeoJSON' };
    this.source.format ??= 'GeoJSON';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    if (layerConfig.source?.geojson) this.source.geojson = layerConfig.source.geojson;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    if (!this.source.dataAccessPath) {
      let accessPath = this.geoviewLayerConfig.metadataAccessPath!;
      // Remove the metadata file name and keep only the path to the directory where the metadata resides
      if (accessPath.toLowerCase().endsWith('.meta'))
        accessPath = accessPath.split('/').length > 1 ? accessPath.split('/').slice(0, -1).join('/') : './';
      this.source.dataAccessPath = accessPath;
    }

    // If dataAccessPath doesn't already point to a file (blob, .json, .geojson, =json), append the layerId
    const path = this.source.dataAccessPath;
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const endsWithJson = path.toUpperCase().endsWith('.JSON');
    const endsWithGeoJson = path.toUpperCase().endsWith('.GEOJSON');
    const endsWithEqualsJson = path.toUpperCase().endsWith('=JSON');

    if (!isBlob && !endsWithJson && !endsWithGeoJson && !endsWithEqualsJson) {
      this.source.dataAccessPath = path.endsWith('/') ? `${path}${this.layerId}` : `${path}/${this.layerId}`;
    }
  }
}

export interface TypeMetadataGeoJSON {
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
}
