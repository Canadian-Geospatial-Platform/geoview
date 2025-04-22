import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, TypeSourceImageWmsInitialConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.WMS;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageWmsInitialConfig;

  /**
   * The class constructor.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWmsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // if layerConfig.source.dataAccessPath is undefined, the metadataAccessPath defined on the root is used.
    if (!this.source) this.source = {};

    // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
    // set to '' and will be filled in the fetchAndSetServiceMetadata method of the class WMS.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = '';

    // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
    // to the same value of the corresponding metadataAccessPath.
    // TODO: remove this wrapper replace when datacube updates the URLs
    this.geoviewLayerConfig.metadataAccessPath = this.geoviewLayerConfig.metadataAccessPath!.replace('wrapper/ramp/ogc', 'ows');
    if (this.geoviewLayerConfig.metadataAccessPath!.slice(-4).toLowerCase() !== '.xml')
      this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;

    this.source.dataAccessPath = this.source.dataAccessPath!.replace('wrapper/ramp/ogc', 'ows');

    // Default value for layerConfig.source.serverType is 'mapserver'.
    if (!this.source.serverType) this.source.serverType = 'mapserver';
  }

  /**
   * Clones an instance of a OgcWmsLayerEntryConfig.
   *
   * @returns {ConfigBaseClass} The cloned OgcWmsLayerEntryConfig instance
   */
  protected override onClone(): ConfigBaseClass {
    return new OgcWmsLayerEntryConfig(this);
  }
}
