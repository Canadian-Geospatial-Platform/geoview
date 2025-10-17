import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeKmlLayerConfig } from '@/geo/layer/geoview-layers/vector/kml';
import { Projection } from '@/geo/utils/projection';

export interface KmlLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeBaseVectorSourceInitialConfig;
}

export class KmlLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeBaseVectorSourceInitialConfig;

  /**
   * The class constructor.
   * @param {KmlLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: KmlLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.KML);

    // Value for this.source.format can only be KML.
    this.source ??= { format: 'KML' };
    this.source.format ??= 'KML';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    if (layerConfig.source?.dataAccessPath) this.source.dataAccessPath = layerConfig.source.dataAccessPath;

    // If undefined, we assign the metadataAccessPath of the GeoView layer to dataAccessPath.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.getMetadataAccessPath()!;

    // If dataAccessPath doesn't already point to a file (blob, .kml), append the layerId
    const path = this.source.dataAccessPath;
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const endsWithKml = path.toUpperCase().endsWith('.KML');

    if (!isBlob && !endsWithKml) {
      this.source.dataAccessPath = path.endsWith('/') ? `${path}${this.layerId}` : `${path}/${this.layerId}`;
    }
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a KML Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a KML Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeKMLLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeKmlLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.KML);
  }
}
