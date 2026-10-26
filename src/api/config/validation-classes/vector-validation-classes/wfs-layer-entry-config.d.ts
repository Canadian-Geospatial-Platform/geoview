import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataWFSCapabilities, TypeMetadataWFSFeatureTypeListFeatureType, TypeMetadataWFSOperationMetadataOperation } from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
    #private;
    /**
     * Creates an instance of OgcWfsLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: OgcWfsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer
     */
    getGeoviewLayerConfig(): TypeWFSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config
     */
    getServiceMetadata(): TypeMetadataWFSCapabilities | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config
     */
    getLayerMetadata(): TypeOutfields[] | undefined;
    /**
     * Retrieves the WFS `FeatureType` metadata entry corresponding to this layer.
     *
     * This method searches the WFS `FeatureTypeList` inside the service metadata and
     * finds the feature type whose `Name` matches the layer's `layerId`.
     *
     * @returns The `FeatureType` metadata entry describing this layer
     * @throws {LayerServiceMetadataEmptyError} When the WFS service metadata is missing or incomplete
     * @throws {LayerEntryConfigLayerIdNotFoundError} When no `FeatureType` entry matches this layer's `layerId`
     */
    getFeatureType(): TypeMetadataWFSFeatureTypeListFeatureType;
    /**
     * Returns the spatial reference system (SRS) of the layer's data.
     *
     * Reads the version-specific field: `DefaultCRS` (WFS 2.0), `DefaultSRS` (WFS 1.1), or `SRS` (WFS 1.0), in that order.
     * A value may be a string or an XML-parsed object with a `#text` property.
     *
     * The CRS identifier is returned as provided by the service (for example, an EPSG code, OGC URN, or OGC CRS URI);
     * it is not normalized.
     *
     * @returns The CRS identifier declared by the service, or undefined if none is available
     */
    getProjectionOfData(): string | undefined;
    /**
     * Returns the list of supported mime output formats for this WFS layer.
     *
     * Formats are extracted from the `OutputFormats` section of the layer's WFS
     * `FeatureType` metadata.
     *
     * @param defaultWhenNone - Optional default format to return if no supported formats are found
     * @returns An array of MIME types / format identifiers supported by the WFS service for GetFeature responses
     * @throws {LayerServiceMetadataEmptyError} When the metadata is missing or incomplete (propagated from `getFeatureType()`)
     * @throws {LayerEntryConfigLayerIdNotFoundError} When the layer's feature type is not found (propagated from `getFeatureType()`)
     */
    getSupportedFormats(defaultWhenNone?: string): string[];
    /**
     * Gets the version.
     *
     * @returns The service version as read from the metadata attribute
     */
    getVersion(): string | undefined;
    /**
     * Gets the version and defaults to 1.3.0 when couldn't be determined as it's the most stable in testing.
     *
     * @returns The service version as read from the metadata attribute, or '1.3.0' if not available
     */
    getVersionOrDefault(): string;
    /**
     * Gets if the version is higher than 2.0.0.
     *
     * @returns True if the version is higher than 2.0.0, otherwise false
     */
    getVersionIsHigherThan2(): boolean;
    /**
     * Gets the advertised DescribeFeatureType operation metadata.
     *
     * @returns The operation metadata, or undefined when the service does not provide it
     */
    getMetadataDescribeFeatureTypeOperation(): TypeMetadataWFSOperationMetadataOperation | undefined;
    /**
     * Gets the advertised output formats for the DescribeFeatureType operation.
     *
     * @returns The advertised output format strings, or an empty array if none are found
     */
    getMetadataDescribeFeatureTypeOutputFormats(): string[];
    /**
     * Gets the advertised GetFeature operation metadata.
     *
     * @returns The operation metadata, or undefined when the service does not provide it
     */
    getMetadataGetFeatureOperation(): TypeMetadataWFSOperationMetadataOperation | undefined;
    /**
     * Gets the advertised HTTP GET URL for the GetFeature operation.
     *
     * @returns The advertised GET URL, or undefined when the service does not provide one
     */
    getMetadataGetFeatureOperationUrlGet(): string | undefined;
    /**
     * Gets the advertised HTTP POST URL for the GetFeature operation.
     *
     * @returns The advertised POST URL, or undefined when the service does not provide one
     */
    getMetadataGetFeatureOperationUrlPost(): string | undefined;
    /**
     * Gets the full URL used for the DescribeFeatureType request.
     *
     * @returns The recorded DescribeFeatureType URL, or undefined if none was recorded
     */
    getDescribeFeatureTypeFullUrl(): string | undefined;
    /**
     * Stores the full DescribeFeatureType URL used for the layer.
     *
     * @param describeFeatureTypeFullUrl - Full URL of the DescribeFeatureType request
     */
    setDescribeFeatureTypeFullUrl(describeFeatureTypeFullUrl: string): void;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a WFS Feature layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a WFS Feature layer; otherwise `false`
     */
    static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig;
    /**
     * Finds the DescribeFeatureType operation in the WFS service metadata.
     *
     * @param metadata - The parsed WFS capabilities metadata
     * @returns The operation metadata, or undefined when the service does not advertise the operation
     */
    static readDescribeFeatureOperation(metadata: TypeMetadataWFSCapabilities | undefined): TypeMetadataWFSOperationMetadataOperation | undefined;
    /**
     * Finds the GetFeature operation in the WFS service metadata.
     *
     * @param metadata - The parsed WFS capabilities metadata
     * @returns The operation metadata, or undefined when the service does not advertise the operation
     */
    static readGetFeatureOperation(metadata: TypeMetadataWFSCapabilities | undefined): TypeMetadataWFSOperationMetadataOperation | undefined;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map