import { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataEsri, TypeSourceImageEsriInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';
export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageEsriInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageEsriInitialConfig;
    /**
     * The class constructor.
     * @param {EsriImageLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriImageLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents an Esri Image layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for an Esri Image layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeEsriImage(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriImageLayerConfig;
}
//# sourceMappingURL=esri-image-layer-entry-config.d.ts.map