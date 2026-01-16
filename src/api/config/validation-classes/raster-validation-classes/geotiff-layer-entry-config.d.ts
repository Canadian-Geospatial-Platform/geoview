import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataGeoTIFF, TypeSourceGeoTIFFInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeGeoTIFFLayerConfig } from '@/geo/layer/geoview-layers/raster/geotiff';
export interface GeoTIFFLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceGeoTIFFInitialConfig;
}
/**
 * Type used to define a GeoTIFF layer to display on the map.
 */
export declare class GeoTIFFLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /**
     * The class constructor.
     * @param {GeoTIFFLayerEntryConfigProps} layerConfig -  The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GeoTIFFLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeSourceGeoTIFFInitialConfig} The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceGeoTIFFInitialConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataGeoTIFF | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataGeoTIFF | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents an GeoTIFF layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a GeoTIFF layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeGeoTIFF(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoTIFFLayerConfig;
}
//# sourceMappingURL=geotiff-layer-entry-config.d.ts.map