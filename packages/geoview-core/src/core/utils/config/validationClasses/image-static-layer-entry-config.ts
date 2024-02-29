import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GeoviewChild, TypeLayerEntryType, TypeSourceImageStaticInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'imageStatic' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {ImageStaticLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ImageStaticLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.source.dataAccessPath) {
      throw new Error(
        `source.dataAccessPath on layer entry ${this.layerPath} is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type ${this.geoviewLayerConfig.geoviewLayerType}`
      );
    }
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
