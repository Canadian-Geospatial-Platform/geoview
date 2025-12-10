import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeLayerMetadataEsri,
  TypeSourceEsriFeatureInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';

export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceEsriFeatureInitialConfig;
}

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceEsriFeatureInitialConfig;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
    this.maxRecordCount = layerConfig.maxRecordCount;

    // Value for this.source.format can only be EsriJSON.
    this.source.format = 'EsriJSON';

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

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }

  /**
   * Overrides the get geometry type to interpret the esri type name.
   * @returns {TypeStyleGeometry} The geometry type.
   * @throws {NotSupportedError} When the geometry type is not supported.
   */
  protected override onGetGeometryType(): TypeStyleGeometry {
    // Check the geometry type based on the Esri name
    return GeoUtilities.esriConvertEsriGeometryTypeToOLGeometryType(this.getGeometryField()!.type);
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a Esri Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a Esri Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeEsriFeature(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriFeatureLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_FEATURE);
  }
}
