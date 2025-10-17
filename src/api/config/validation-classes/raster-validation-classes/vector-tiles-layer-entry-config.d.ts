import type { ConfigClassOrType, ConfigVectorTilesClassOrType, TypeGeoviewLayerConfig, TypeMetadataVectorTiles, TypeSourceTileInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';
import type { TypeVectorTilesConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
export interface VectorTilesLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceTileInitialConfig;
    /** The style url */
    styleUrl?: string;
}
export declare class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
    #private;
    source: TypeSourceTileInitialConfig;
    /**
     * The class constructor.
     * @param {VectorTilesLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: VectorTilesLayerEntryConfigProps);
    /**
     * Gets the style url or undefined.
     */
    getStyleUrl(): string | undefined;
    /**
     * Sets the style url.
     * @param {string} styleUrl - The style url.
     */
    setStyleUrl(styleUrl: string): void;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataVectorTiles | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigVectorTilesClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The style url or undefined.
     */
    static getClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType | undefined): string | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigVectorTilesClassOrType} layerConfig - The layer config class instance or regular json object.
     * @param {string} styleUrl - The style url.
     */
    static setClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType, styleUrl: string): void;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a VectorTiles layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a VectorTiles layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeVectorTiles(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeVectorTilesConfig;
}
//# sourceMappingURL=vector-tiles-layer-entry-config.d.ts.map