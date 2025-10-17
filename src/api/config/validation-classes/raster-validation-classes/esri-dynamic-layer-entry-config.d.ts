import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataEsri, TypeMetadataEsriDynamic, TypeSourceEsriDynamicInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
export interface EsriDynamicLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceEsriDynamicInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceEsriDynamicInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriDynamicLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriDynamicLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataEsriDynamic | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents an Esri Dynamic layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for an Esri Dynamic layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeEsriDynamic(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriDynamicLayerConfig;
}
//# sourceMappingURL=esri-dynamic-layer-entry-config.d.ts.map