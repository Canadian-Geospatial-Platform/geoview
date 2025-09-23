import {
  ConfigClassOrType,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerConfig,
  TypeLayerMetadataWMS,
  TypeMetadataWMS,
  TypeSourceImageWmsInitialConfig,
} from '@/api/types/layer-schema-types';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';

export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageWmsInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageWmsInitialConfig;

  /**
   * The class constructor.
   * @param {OgcWmsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWmsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WMS, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    // Write the default properties when not specified
    this.source ??= {};
    this.source.serverType ??= layerConfig.source?.serverType || 'mapserver';

    // Normalize the access paths
    this.#normalizeMetadataAndDataAccessPaths();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataWMS | undefined {
    return super.getServiceMetadata() as TypeMetadataWMS | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataWMS | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataWMS | undefined;
  }

  /**
   * Normalizes both the metadata and data access paths by replacing legacy wrapper segments in the URL.
   * Specifically, this method replaces `wrapper/ramp/ogc` with `ows` in the metadata access path,
   * then applies the normalized value to both the metadata and data access paths.
   * This ensures consistency between the two paths and supports updated endpoint structures.
   * @private
   */
  #normalizeMetadataAndDataAccessPaths(): void {
    // Get the metadata access path
    let metadataAccessPath = this.getMetadataAccessPath()!;

    // Normalize it
    metadataAccessPath = metadataAccessPath.replace('wrapper/ramp/ogc', 'ows');

    // Set the normalized url in the metadata access path
    this.setMetadataAccessPath(metadataAccessPath);

    // Get the data access path
    let dataAccessPath = this.getDataAccessPath();

    // If any, normalize it as well in case the provided one also needed to be normalized
    if (dataAccessPath) {
      // Normalize it
      dataAccessPath = dataAccessPath.replace('wrapper/ramp/ogc', 'ows');
    } else {
      // No data access path was provided, use the newly normalized metadata access path
      dataAccessPath = metadataAccessPath;
    }

    // Save the normalized url in the data access path
    this.setDataAccessPath(dataAccessPath);
  }

  /**
   * Clones an instance of a OgcWmsLayerEntryConfig.
   * @returns {ConfigBaseClass} The cloned OgcWmsLayerEntryConfig instance
   */
  protected override onClone(): ConfigBaseClass {
    return new OgcWmsLayerEntryConfig(this.layerEntryProps);
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a WMS layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WMS layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeWMS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWMSLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WMS);
  }
}
