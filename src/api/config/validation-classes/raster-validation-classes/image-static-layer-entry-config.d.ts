import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceImageStaticInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeImageStaticLayerConfig } from '@/geo/layer/geoview-layers/raster/image-static';
export interface ImageStaticLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageStaticInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /**
     * The class constructor.
     * @param {ImageStaticLayerEntryConfigProps} layerConfig -  The layer configuration we want to instanciate.
     */
    constructor(layerConfig: ImageStaticLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeSourceImageStaticInitialConfig} The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceImageStaticInitialConfig;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents an Image Static layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for an Image Static layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeImageStatic(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeImageStaticLayerConfig;
}
//# sourceMappingURL=image-static-layer-entry-config.d.ts.map