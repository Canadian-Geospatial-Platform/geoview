import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataEsriImage,
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
  allowedMosaicMethods?: string;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** The initial raster function to apply to the layer. */
  #initialRasterFunction?: string;

  // TODO: Add an option to set the initial mosaicRule in the config
  /** The initial mosaic rule extracted from metadata for querying the correct raster item */
  #initialMosaicRule?: TypeMosaicRule;

  /**
   * The class constructor.
   *
   * @param layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    this.#initialRasterFunction = EsriImageLayerEntryConfig.getClassOrTypeSourceInitialRasterFunction(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeEsriImageLayerConfig {
    return super.getGeoviewLayerConfig() as TypeEsriImageLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageEsriInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataEsriImage | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriImage | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * Note, in the case of an EsriImage, the layer metadata is the same as the service metadata.
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeMetadataEsriImage | undefined {
    return super.getLayerMetadata() as TypeMetadataEsriImage | undefined;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the raster function infos from the layer metadata.
   * @returns The metadata raster function infos or undefined.
   */
  getRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    return this.getLayerMetadata()?.rasterFunctionInfos;
  }

  /**
   * Gets the allowed mosaic methods from the layer metadata.
   * @returns The allowed mosaic methods or undefined.
   */
  getAllowedMosaicMethods(): string | undefined {
    return this.getLayerMetadata()?.allowedMosaicMethods;
  }

  /**
   * Gets the active raster function identifier
   * @returns The raster function identifier
   */
  getInitialRasterFunction(): string | undefined {
    return this.#initialRasterFunction;
  }

  /**
   * Sets the initial raster function for this layer.
   * Called during metadata processing to set default if not explicitly configured.
   * @param rasterFunction - The raster function name to set.
   */
  setInitialRasterFunction(rasterFunction: string): void {
    this.#initialRasterFunction = rasterFunction;
  }

  /**
   * Gets the initial mosaic rule for this layer.
   * @returns The initial mosaic rule or undefined.
   */
  getInitialMosaicRule(): TypeMosaicRule | undefined {
    return this.#initialMosaicRule;
  }

  /**
   * Sets the initial mosaic rule for this layer.
   * @param mosaicRule - The initial mosaic rule to set.
   */
  setInitialMosaicRule(mosaicRule: TypeMosaicRule): void {
    this.#initialMosaicRule = mosaicRule;
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Esri Image layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for an Esri Image layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeEsriImage(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriImageLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE);
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param layerConfig - The layer config class instance or regular json object.
   * @returns The raster function or undefined.
   */
  static getClassOrTypeSourceInitialRasterFunction(layerConfig: ConfigClassOrType | undefined): string | undefined {
    if (layerConfig instanceof EsriImageLayerEntryConfig) {
      return layerConfig.getInitialRasterFunction();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as EsriImageLayerEntryConfigProps)?.source?.rasterFunction;
  }

  // #endregion STATIC METHODS
}
