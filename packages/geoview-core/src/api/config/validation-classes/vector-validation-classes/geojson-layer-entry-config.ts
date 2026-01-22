import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceGeoJSONInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';

export interface GeoJSONLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceGeoJSONInitialConfig;
}

export class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
  /**
   * The class constructor.
   * @param {GeoJSONLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   * @constructor
   */
  constructor(layerConfig: GeoJSONLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.GEOJSON);

    // Remove the metadata file name and keep only the path to the directory where the metadata resides
    let dataAccessPath = this.getDataAccessPath();
    if (dataAccessPath.toLowerCase().endsWith('.meta'))
      dataAccessPath = dataAccessPath.split('/').length > 1 ? dataAccessPath.split('/').slice(0, -1).join('/') : './';
    this.setDataAccessPath(dataAccessPath);

    // If dataAccessPath doesn't already point to a file (blob, .json, .geojson, =json), append the layerId
    const path = this.getDataAccessPath();
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const endsWithJson = path.toUpperCase().endsWith('.JSON');
    const endsWithGeoJson = path.toUpperCase().endsWith('.GEOJSON');
    const endsWithEqualsJson = path.toUpperCase().endsWith('=JSON');

    // If not a file name
    if (!isBlob && !endsWithJson && !endsWithGeoJson && !endsWithEqualsJson) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}${this.layerId}`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {TypeSourceGeoJSONInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   * @override
   */
  override getSource(): TypeSourceGeoJSONInitialConfig {
    return super.getSource();
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a GeoJSON layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns {boolean} true if the config is for a GeoJSON layer; otherwise false.
   * @static
   */
  static isClassOrTypeGeoJSON(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoJSONLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.GEOJSON);
  }

  // #endregion STATIC METHODS
}
