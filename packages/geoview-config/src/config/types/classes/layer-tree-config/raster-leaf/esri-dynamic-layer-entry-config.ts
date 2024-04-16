import { CONST_LAYER_ENTRY_TYPES, ESRI_DYNAMIC_SCHEMA_PATH } from '../../../config-constants';
import { TypeJsonObject } from '../../../config-types';
import {
  TypeSourceImageEsriInitialConfig,
  TypeStyleConfig,
  TypeLayerInitialSettings,
  TypeLocalizedString,
  TypeLayerEntryType,
} from '../../../map-schema-types';
import { AbstractGeoviewLayerConfig } from '../../geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '../abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  source = {} as TypeSourceImageEsriInitialConfig;

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
    this.style = { ...(layerConfig.style as TypeStyleConfig) };
    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
  }

  get schemaPath(): string {
    return ESRI_DYNAMIC_SCHEMA_PATH;
  }

  get entryType(): TypeLayerEntryType {
    return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
  }
}
