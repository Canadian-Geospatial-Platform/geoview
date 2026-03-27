import type { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { type AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';
import type { TypeSourceImageWMTSInitialConfig, TypeWmtsLayerConfig } from '@/geo/layer/geoview-layers/raster/wmts';
export interface OgcWmtsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** The tile matrix set identifier to use for this WMTS layer. If not provided, the first TileMatrixSet found in the metadata will be used by default. */
    tileMatrixSet?: string;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageWMTSInitialConfig;
}
export declare class OgcWmtsLayerEntryConfig extends TileLayerEntryConfig {
    tileMatrixSet?: string;
    /**
     * Creates an instance of OgcWmtsLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: OgcWmtsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWmtsLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceImageWMTSInitialConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWMTS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeMetadataWMTSContents | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a WMTS layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a WMTS layer; otherwise `false`.
     */
    static isClassOrTypeWMTS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWmtsLayerConfig;
}
export interface TypeMetadataWMTS {
    Capabilities: {
        'ows:OperationsMetadata': TypeMetadataWMTSOperations;
        Contents: TypeMetadataWMTSContents;
    };
}
export interface TypeMetadataWMTSOperations {
    'ows:Operation': {
        '@attributes': {
            name: string;
        };
        'ows:DCP': {
            'ows:HTTP': {
                'ows:Get': {
                    '@attributes': {
                        'xlink:href': string;
                    };
                    'ows:Constraint'?: {
                        'ows:AllowedValues': {
                            'ows:Value': string | string[];
                        };
                    };
                };
            };
        };
    }[];
}
export interface TypeMetadataWMTSContents {
    Layer: TypeMetadataWMTSLayer[] | TypeMetadataWMTSLayer;
    TileMatrixSet: TypeWMTSTileMatrixSet[] | TypeWMTSTileMatrixSet;
}
export interface TypeMetadataWMTSLayer {
    'ows:Identifier': string;
    'ows:WGS84BoundingBox'?: {
        'ows:LowerCorner': string | [number, number];
        'ows:UpperCorner': string | [number, number];
    };
    ResourceURL: {
        '@attributes': {
            template: string;
            resourceType: string;
            format: string;
        };
    };
    'ows:Title'?: string;
    'ows:Abstract'?: string;
    Format: string;
    TileMatrixSetLink: TypeTileMatrixSetLink[] | TypeTileMatrixSetLink;
    Style?: {
        'ows:Identifier': string;
        'ows:Title'?: string;
    };
}
interface TypeTileMatrixSetLink {
    TileMatrixSet: string;
}
export interface TypeWMTSTileMatrixSet {
    'ows:Identifier': string;
    'ows:SupportedCRS': string;
    TileMatrix: TypeWMTSTileMatrix[];
}
interface TypeWMTSTileMatrix {
    'ows:Identifier': string;
    ScaleDenominator: number;
    TopLeftCorner: string | [number, number];
    TileWidth: number;
    TileHeight: number;
    MatrixWidth: number;
    MatrixHeight: number;
}
export {};
//# sourceMappingURL=ogc-wmts-layer-entry-config.d.ts.map