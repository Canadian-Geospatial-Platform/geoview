import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractBaseLayerEntryConfig } from '../abstract-base-layer-entry-config';
import {
  GeoviewChild,
  TypeLayerEntryType,
  TypeLocalizedString,
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
} from '@/geo/map/map-schema-types';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'esriImage' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    // if layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
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
