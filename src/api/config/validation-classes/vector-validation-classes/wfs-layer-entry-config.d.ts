import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataWFS, TypeMetadataWFSFeatureTypeListFeatureType } from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import type { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of OgcWfsLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: OgcWfsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWFSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWFS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config.
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
     * This method reads the layer's feature type definition and returns the
     * default SRS/projection used by the WFS layer. If the `DefaultSRS` is
     * an object with a `#text` property (common in XML-parsed responses),
     * the method returns the value of that property. Otherwise, it returns
     * `DefaultSRS` directly.
     *
     * @returns The EPSG code or SRS string (e.g., 'EPSG:3857'), or undefined if not determined
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
     * Gets the version. Defaults to 1.3.0.
     *
     * @returns The service version as read from the metadata attribute
     */
    getVersion(): string;
    /**
     * Gets if the config has specified that we should fetch the styles from the WMS.
     *
     * @returns True when the styles should be fetched from the WMS. True by default
     */
    getShouldFetchStylesFromWMS(): boolean;
    /**
     * Gets the WMS styles layer id associated with this WFS layer entry config if any.
     *
     * @returns The WMS styles layer id
     */
    getWmsStylesLayerId(): string;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a WFS Feature layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a WFS Feature layer; otherwise `false`
     */
    static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map