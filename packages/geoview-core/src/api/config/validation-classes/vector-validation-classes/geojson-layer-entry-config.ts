import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import {
  ConfigClassOrType,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerConfig,
  TypeSourceGeoJSONInitialConfig,
} from '@/api/types/layer-schema-types';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { Projection } from '@/geo/utils/projection';

export interface GeoJSONLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceGeoJSONInitialConfig;
}

export class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceGeoJSONInitialConfig;

  /**
   * The class constructor.
   * @param {GeoJSONLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoJSONLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.GEOJSON);

    // Value for this.source.format can only be GeoJSON.
    this.source ??= { format: 'GeoJSON' };
    this.source.format ??= 'GeoJSON';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.geojson ??= layerConfig.source?.geojson;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath and place the layerId at the end of it.
    if (!this.source.dataAccessPath) {
      let accessPath = this.getMetadataAccessPath()!; // TODO: Check - TypeScript - Address the '!' here and handle the case when it's undefined
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

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a GeoJSON layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a GeoJSON layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeGeoJSON(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoJSONLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.GEOJSON);
  }
}
