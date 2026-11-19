import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataEsriDynamic,
  TypeMetadataEsriDynamicLayer,
  TypeMetadataEsriLayerSummary,
  TypeSourceEsriDynamicInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';

export interface EsriDynamicLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceEsriDynamicInitialConfig;

  /** Max number of records per page for query */
  maxPageSize?: number;

  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * Manual pixel offset (x, y) to apply when centering the identify hit-tolerance circle, overriding the service's
   * xoffset/yoffset (which the legacy esriPMS symbol schema can't carry for CIM-authored symbols with a non-center anchor).
   */
  hitToleranceOffset?: [number, number];
}

/** Type used to define a GeoView image layer to display on the map. */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Manual pixel offset (x, y) overriding the computed identify hit-tolerance recentering. See {@link EsriDynamicLayerEntryConfigProps.hitToleranceOffset}. */
  hitToleranceOffset?: [number, number];

  /**
   * Creates an instance of EsriDynamicLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: EsriDynamicLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_DYNAMIC, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
    this.hitToleranceOffset = layerConfig.hitToleranceOffset;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeEsriDynamicLayerConfig {
    return super.getGeoviewLayerConfig() as TypeEsriDynamicLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceEsriDynamicInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataEsriDynamic | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriDynamic | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeMetadataEsriDynamicLayer | undefined {
    return super.getLayerMetadata() as TypeMetadataEsriDynamicLayer | undefined;
  }

  /**
   * Overrides the get geometry type to interpret the esri type name.
   *
   * @returns The geometry type, if it could be determined.
   * @throws {NotSupportedError} When the geometry type is not supported.
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

  /**
   * Overrides the toJson of the mother class.
   *
   * @returns The JSON representation of the instance
   */
  protected override onToJson<T>(): T {
    // Call parent
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onToJson<T>() as any;

    // Copy values
    serialized.maxPageSize = this.getMaxPageSize();
    serialized.maxRecordCount = this.getMaxRecordCount();

    // Return it
    return serialized;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer.
   *
   * @returns The service maximum record count, or undefined when it is not available
   */
  getMaxPageSize(): number | undefined {
    return (this.layerEntryProps as EsriDynamicLayerEntryConfigProps).maxPageSize;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer, or the default if not specified.
   *
   * @returns The service maximum record count, or the default when it is not available
   */
  getMaxPageSizeOrDefault(): number {
    return this.getMaxPageSize() ?? AbstractGeoViewVector.MAX_PAGE_SIZE;
  }

  /**
   * Initializes the service maximum record count when the layer configuration has not already set it.
   *
   * @param maxRecordCount - The maximum number of records reported by the service, or undefined when unavailable
   */
  initMaxPageSize(maxPageSize: number | undefined): void {
    (this.layerEntryProps as EsriDynamicLayerEntryConfigProps).maxPageSize ??= maxPageSize;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer.
   *
   * @returns The service maximum record count, or undefined when it is not available
   */
  getMaxRecordCount(): number | undefined {
    return (this.layerEntryProps as EsriDynamicLayerEntryConfigProps).maxRecordCount;
  }

  /**
   * Gets the maximum number of records the service allows in a feature request for this layer, or the default if not specified.
   *
   * @returns The service maximum record count, or the default when it is not available
   */
  getMaxRecordCountOrDefault(): number {
    return this.getMaxRecordCount() ?? AbstractGeoViewVector.MAX_FEATURES;
  }

  /**
   * Finds the parent layer summary whose subLayerIds contains this layer's ID.
   *
   * @param serviceMetadata - The ESRI Dynamic service metadata to search
   * @returns The parent layer summary, or undefined if not found
   */
  getParentMetadata(serviceMetadata: TypeMetadataEsriDynamic): TypeMetadataEsriLayerSummary | undefined {
    const layerId = Number(this.layerId);
    return serviceMetadata?.layers?.find((l) => l.subLayerIds?.includes(layerId));
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents an Esri Dynamic layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for an Esri Dynamic layer; otherwise `false`
   */
  static isClassOrTypeEsriDynamic(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriDynamicLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_DYNAMIC);
  }

  // #endregion STATIC METHODS
}
