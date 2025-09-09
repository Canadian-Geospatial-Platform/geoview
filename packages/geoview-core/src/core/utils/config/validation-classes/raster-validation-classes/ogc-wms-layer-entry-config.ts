import {
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeLayerMetadataWMS,
  TypeMetadataWMS,
  TypeSourceImageWmsInitialConfig,
} from '@/api/config/types/layer-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageWmsInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.WMS;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: OgcWmsLayerEntryConfigProps;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageWmsInitialConfig;

  /**
   * The class constructor.
   * @param {OgcWmsLayerEntryConfigProps | OgcWmsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWmsLayerEntryConfigProps | OgcWmsLayerEntryConfig) {
    super(layerConfig);

    // Write the default properties when not specified
    this.source ??= {};
    this.source.serverType ??= layerConfig.source?.serverType || 'mapserver';

    // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
    // set to '' and will be filled in the fetchAndSetServiceMetadata method of the class WMS.
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? '';

    // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
    // to the same value of the corresponding metadataAccessPath.
    // TODO: remove this wrapper replace when datacube updates the URLs
    this.geoviewLayerConfig.metadataAccessPath = this.geoviewLayerConfig.metadataAccessPath!.replace('wrapper/ramp/ogc', 'ows');
    if (this.geoviewLayerConfig.metadataAccessPath.slice(-4).toLowerCase() !== '.xml')
      this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    this.source.dataAccessPath = this.source.dataAccessPath.replace('wrapper/ramp/ogc', 'ows');
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
   * Clones an instance of a OgcWmsLayerEntryConfig.
   * @returns {ConfigBaseClass} The cloned OgcWmsLayerEntryConfig instance
   */
  protected override onClone(): ConfigBaseClass {
    return new OgcWmsLayerEntryConfig(this.layerEntryProps);
  }
}
