import { CONST_LAYER_ENTRY_TYPES } from '../../../config-constants';
import { TypeJsonObject } from '../../../config-types';
import {
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
  TypeLocalizedString,
  TypeEsriFormatParameter,
  TypeLayerInitialSettings,
} from '../../../map-schema-types';
import { AbstractGeoviewLayerConfig } from '../../geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '../abstract-base-layer-entry-config';

export class EsriFeatureLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer node configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited form the parent.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration object that is creating this layer tree node.
   */
  constructor(layerConfig: TypeJsonObject, initialSettings: TypeLayerInitialSettings, geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    super(layerConfig, initialSettings, geoviewLayerConfig);
    this.layerFilter = layerConfig.layerFilter as string;
    this.source = { ...(layerConfig.source as TypeSourceImageEsriInitialConfig) };
    this.style = { ...(layerConfig.style as TypeStyleConfig) };
    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be EsriJSON.
    if (!this.source) this.source = { format: 'EsriJSON' as TypeEsriFormatParameter };
    if (!this.source.format) this.source.format = 'EsriJSON' as TypeEsriFormatParameter;
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
  }
}
