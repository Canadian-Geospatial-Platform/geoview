import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataEsriImage, TypeSourceImageEsriInitialConfig, TypeMetadataEsriRasterFunctionInfos, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';
export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageEsriInitialConfig;
    rasterFunctionInfos?: TypeMetadataEsriRasterFunctionInfos[];
    allowedMosaicMethods?: string;
}
/** Type used to define a GeoView image layer to display on the map. */
export declare class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    #private;
    /**
     * Creates an instance of EsriImageLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: EsriImageLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeEsriImageLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceImageEsriInitialConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataEsriImage | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * Note, in the case of an EsriImage, the layer metadata is the same as the service metadata.
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeMetadataEsriImage | undefined;
    /**
     * Gets the raster function infos from the layer metadata.
     *
     * @returns The metadata raster function infos, or undefined if not available
     */
    getRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined;
    /**
     * Gets the allowed mosaic methods from the layer metadata.
     *
     * @returns The allowed mosaic methods, or undefined if not available
     */
    getAllowedMosaicMethods(): string | undefined;
    /**
     * Gets the active raster function identifier.
     *
     * @returns The raster function identifier, or undefined if not set
     */
    getInitialRasterFunction(): string | undefined;
    /**
     * Sets the initial raster function for this layer.
     * Called during metadata processing to set default if not explicitly configured.
     *
     * @param rasterFunction - The raster function name to set
     */
    setInitialRasterFunction(rasterFunction: string): void;
    /**
     * Gets the initial mosaic rule for this layer.
     *
     * @returns The initial mosaic rule, or undefined if not set
     */
    getInitialMosaicRule(): TypeMosaicRule | undefined;
    /**
     * Sets the initial mosaic rule for this layer.
     *
     * @param mosaicRule - The initial mosaic rule to set
     */
    setInitialMosaicRule(mosaicRule: TypeMosaicRule): void;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents an Esri Image layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for an Esri Image layer; otherwise `false`
     */
    static isClassOrTypeEsriImage(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriImageLayerConfig;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The raster function, or undefined if not available
     */
    static getClassOrTypeSourceInitialRasterFunction(layerConfig: ConfigClassOrType | undefined): string | undefined;
}
//# sourceMappingURL=esri-image-layer-entry-config.d.ts.map