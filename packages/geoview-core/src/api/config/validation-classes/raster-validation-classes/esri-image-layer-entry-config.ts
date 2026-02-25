import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeLayerMetadataEsri,
  TypeSourceImageEsriInitialConfig,
  TypeMetadataEsriRasterFunctionInfos,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';

export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageEsriInitialConfig;
  rasterFunctionInfos?: TypeMetadataEsriRasterFunctionInfos[];
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** The initial raster function to apply to the layer. */
  #initialRasterFunction?: string;

  // TODO: Add an option to set the initial mosaicRule in the config
  /** The mosaic rule extracted from metadata for querying the correct raster item */
  #mosaicRule?: TypeMosaicRule;

  /** The initial time extent from metadata (start and end timestamps). */
  #initialTimeExtent?: [number, number];

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    if (layerConfig.source?.rasterFunction) this.#initialRasterFunction = layerConfig.source.rasterFunction;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeSourceImageEsriInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageEsriInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getServiceMetadata() as TypeLayerMetadataEsri | undefined;
  }

  // #endregion OVERRIDES

  // #region METHODS

  getRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    const metadata = this.getLayerMetadata();

    if (metadata && metadata.rasterFunctionInfos) {
      return metadata.rasterFunctionInfos;
    }
    return;
  }

  /**
   * Gets the active raster function identifier
   * @returns {string | undefined} The raster function identifier
   */
  getInitialRasterFunction(): string | undefined {
    return this.#initialRasterFunction;
  }

  /**
   * Sets the initial raster function for this layer.
   * Called during metadata processing to set default if not explicitly configured.
   * @param {string} rasterFunction - The raster function name to set.
   */
  setInitialRasterFunction(rasterFunction: string): void {
    this.#initialRasterFunction = rasterFunction;
  }

  /**
   * Gets the mosaic rule for this layer.
   * @returns {TypeMosaicRule | undefined} The mosaic rule or undefined.
   */
  getMosaicRule(): TypeMosaicRule | undefined {
    return this.#mosaicRule;
  }

  /**
   * Sets the mosaic rule for this layer.
   * @param {TypeMosaicRule} mosaicRule - The mosaic rule to set.
   */
  setMosaicRule(mosaicRule: TypeMosaicRule): void {
    this.#mosaicRule = mosaicRule;
  }

  /**
   * Gets the initial time extent from metadata.
   * @returns {[number, number] | undefined} The time extent as [startTime, endTime] in milliseconds or undefined.
   */
  getInitialTimeExtent(): [number, number] | undefined {
    return this.#initialTimeExtent;
  }

  /**
   * Sets the initial time extent from metadata.
   * @param {[number, number]} timeExtent - The time extent as [startTime, endTime] in milliseconds.
   */
  setInitialTimeExtent(timeExtent: [number, number]): void {
    this.#initialTimeExtent = timeExtent;
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Esri Image layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for an Esri Image layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeEsriImage(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriImageLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE);
  }

  // #endregion STATIC METHODS
}
