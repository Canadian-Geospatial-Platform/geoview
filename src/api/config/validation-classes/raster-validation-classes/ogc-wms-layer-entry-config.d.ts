import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataWMS, TypeMetadataWMS, TypeSourceImageWmsInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageWmsInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    #private;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageWmsInitialConfig;
    /**
     * The class constructor.
     * @param {OgcWmsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcWmsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWMS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataWMS | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a WMS layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a WMS layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeWMS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWMSLayerConfig;
}
//# sourceMappingURL=ogc-wms-layer-entry-config.d.ts.map