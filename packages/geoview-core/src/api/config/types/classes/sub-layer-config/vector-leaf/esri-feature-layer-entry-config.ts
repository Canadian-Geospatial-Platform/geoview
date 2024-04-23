import { CV_CONST_SUB_LAYER_TYPES, CV_SCHEMA_PATH } from '@config/types/config-constants';
import { TypeJsonObject } from '@config/types/config-types';
import {
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
  TypeLayerInitialSettings,
  TypeLocalizedString,
  TypeLayerEntryType,
  TypeEsriFormatParameter,
} from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';

export class EsriFeatureLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  // entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The sub layer configuration we want to instanciate.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sub layer.
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
    if (!this.source) this.source = {}; // If the user didn't provide a source then create an empty one else keep the user one.
    this.source.format = 'EsriJSON' as TypeEsriFormatParameter; // Set the source.format property (the user cannot provide this field)
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
  }

  /**
   * The getter method that returns the schemaPath property.
   *
   * @returns {string} The schemaPath associated to the sub layer.
   */
  get schemaPath(): string {
    return CV_SCHEMA_PATH.ESRI_FEATURE;
  }

  /**
   * The getter method that returns the entryType property.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sub layer.
   */
  get entryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.VECTOR;
  }
}
