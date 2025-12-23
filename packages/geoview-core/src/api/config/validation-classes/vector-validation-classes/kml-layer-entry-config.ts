import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeKmlLayerConfig } from '@/geo/layer/geoview-layers/vector/kml';

export interface KmlLayerEntryConfigProps extends VectorLayerEntryConfigProps {}

export class KmlLayerEntryConfig extends VectorLayerEntryConfig {
  /**
   * The class constructor.
   * @param {KmlLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: KmlLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.KML);

    // If dataAccessPath doesn't already point to a file (blob, .kml), append the layerId
    const path = this.getDataAccessPath();
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const endsWithKml = path.toUpperCase().endsWith('.KML');

    if (!isBlob && !endsWithKml) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}${this.layerId}`);
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
