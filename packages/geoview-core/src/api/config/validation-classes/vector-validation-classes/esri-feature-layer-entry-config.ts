import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataEsriDynamic,
  TypeMetadataEsriFeature,
  TypeMetadataEsriFeatureLayer,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';

export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {}

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /**
   * Creates an instance of EsriFeatureLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
    this.maxRecordCount = layerConfig.maxRecordCount;

    // Trim any trailing '/'
    let path = this.getDataAccessPath();
    while (path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Remove ID from dataAccessPath
    const splitAccessPath = path.split('/');
    if (
      splitAccessPath[splitAccessPath.length - 1].toLowerCase() !== 'featureserver' &&
      splitAccessPath[splitAccessPath.length - 1].toLowerCase() !== 'mapserver'
    ) {
      splitAccessPath.pop();
      this.setDataAccessPath(`${splitAccessPath.join('/')}`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeEsriFeatureLayerConfig {
    return super.getGeoviewLayerConfig() as TypeEsriFeatureLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * Sometimes, the layer processing uses metadata coming from MapServer/?f=json (TypeMetadataEsriDynamic)
   * and sometimes from FeatureServer/?f=json (TypeMetadataEsriFeature) which is the reason for the double types.
   *
   * @returns The strongly-typed service metadata specific to this layer entry config
   */
  override getServiceMetadata(): TypeMetadataEsriDynamic | TypeMetadataEsriFeature | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriDynamic | TypeMetadataEsriFeature | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config
   */
  override getLayerMetadata(): TypeMetadataEsriFeatureLayer | undefined {
    return super.getLayerMetadata() as TypeMetadataEsriFeatureLayer | undefined;
  }

  /**
   * Overrides the get geometry type to interpret the esri type name.
   *
   * @returns The geometry type, or undefined if it could not be determined
   * @throws {NotSupportedError} When the geometry type is not supported
   */
  protected override onGetGeometryType(): TypeStyleGeometry | undefined {
    // Get the geometry field
    const geometryField = this.getGeometryField();

    // If found
    if (geometryField) {
      // Check the geometry type based on the Esri name
      return GeoUtilities.esriConvertEsriGeometryTypeToOLGeometryType(geometryField.type);
    }

    // None
    return undefined;
  }

  // #endregion OVERRIDES

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Esri Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for an Esri Feature layer; otherwise `false`
   */
  static isClassOrTypeEsriFeature(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriFeatureLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
  }
}
