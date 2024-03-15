import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { CONST_LAYER_ENTRY_TYPES, GeoviewChild, TypeSourceImageWmsInitialConfig, TypeStyleConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '../abstract-base-layer-entry-config';
import { createLocalizedString } from '../../../utilities';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = CONST_LAYER_TYPES.WMS;

  /** Layer entry data type. */
  entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageWmsInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {OgcWmsLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWmsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // if layerConfig.source.dataAccessPath is undefined, the metadataAccessPath defined on the root is used.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) {
      // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
      // set to '' and will be filled in the fetchServiceMetadata method of the class WMS. So, we begin with the assumption
      // that both en and fr end with ".xml". Be aware that in metadataAccessPath, one language can ends with ".xml" and the
      // other not.
      this.source.dataAccessPath = createLocalizedString('');
      // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
      // to the same value of the corresponding metadataAccessPath.
      if (this.geoviewLayerConfig.metadataAccessPath!.en!.slice(-4).toLowerCase() !== '.xml')
        this.source.dataAccessPath.en = this.geoviewLayerConfig.metadataAccessPath!.en;
      if (this.geoviewLayerConfig.metadataAccessPath!.fr!.slice(-4).toLowerCase() !== '.xml')
        this.source.dataAccessPath.fr = this.geoviewLayerConfig.metadataAccessPath!.fr;
    }
    // Default value for layerConfig.source.serverType is 'mapserver'.
    if (!this.source.serverType) this.source.serverType = 'mapserver';
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}
