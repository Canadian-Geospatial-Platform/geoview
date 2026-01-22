import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeLayerMetadataEsri,
  TypeMetadataEsriDynamic,
  TypeSourceEsriDynamicInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';

export interface EsriDynamicLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceEsriDynamicInitialConfig;
  /** Max number of records for query */
  maxRecordCount?: number;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {EsriDynamicLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   * @constructor
   */
  constructor(layerConfig: EsriDynamicLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_DYNAMIC, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
    this.maxRecordCount = layerConfig.maxRecordCount;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {TypeSourceEsriDynamicInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   * @override
   */
  override getSource(): TypeSourceEsriDynamicInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer entry config.
   * @override
   */
  override getServiceMetadata(): TypeMetadataEsriDynamic | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriDynamic | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   * @override
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }

  /**
   * Overrides the get geometry type to interpret the esri type name.
   * @returns {TypeStyleGeometry | undefined} The geometry type, if it could be determined.
   * @throws {NotSupportedError} When the geometry type is not supported.
   * @protected
   * @override
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

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Esri Dynamic layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns {boolean} true if the config is for an Esri Dynamic layer; otherwise false.
   * @static
   */
  static isClassOrTypeEsriDynamic(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriDynamicLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_DYNAMIC);
  }

  // #endregion STATIC METHODS
}
