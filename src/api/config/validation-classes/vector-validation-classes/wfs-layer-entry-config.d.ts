import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataWFS, TypeMetadataWFSFeatureTypeListFeatureType } from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import { type TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * The class constructor.
     * @param {OgcWfsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcWfsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWFS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeOutfields[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeOutfields[] | undefined;
    /**
     * Retrieves the WFS `FeatureType` metadata entry corresponding to this layer.
     * This method searches the WFS `FeatureTypeList` inside the service metadata and
     * finds the feature type whose `Name` matches the layer's `layerId`.
     * @throws {LayerServiceMetadataEmptyError}
     * Thrown when the WFS service metadata is missing or incomplete.
     * @throws {LayerEntryConfigLayerIdNotFoundError}
     * Thrown when no `FeatureType` entry matches this layer's `layerId`.
     * @returns {TypeMetadataWFSFeatureTypeListFeatureType}
     * The `FeatureType` metadata entry describing this layer, including supported
     * formats, bounding boxes, and feature schema.
     */
    getFeatureType(): TypeMetadataWFSFeatureTypeListFeatureType;
    /**
     * Returns the spatial reference system (SRS) of the layer's data.
     * This method reads the layer's feature type definition and returns the
     * default SRS/projection used by the WFS layer. If the `DefaultSRS` is
     * an object with a `#text` property (common in XML-parsed responses),
     * the method returns the value of that property. Otherwise, it returns
     * `DefaultSRS` directly.
     * @returns {string | undefined} The EPSG code or SRS string (e.g., 'EPSG:3857'),
     *          or `undefined` if the feature type or SRS cannot be determined.
     */
    getProjectionOfData(): string | undefined;
    /**
     * Returns the list of supported mime output formats for this WFS layer.
     * Formats are extracted from the `OutputFormats` section of the layer's WFS
     * `FeatureType` metadata.
     * @param {string} [defaultWhenNone]
     * An optional default format to return if no supported formats are found
     * in the metadata. If provided, this value will be returned as a single-item
     * array when no formats are found.
     * @throws {LayerServiceMetadataEmptyError}
     * Propagated from `getFeatureType()` if the metadata is missing or incomplete.
     * @throws {LayerEntryConfigLayerIdNotFoundError}
     * Propagated from `getFeatureType()` if the layer's feature type is not found.
     * @returns {string[]}
     * An array of MIME types / format identifiers supported by the WFS service for GetFeature responses.
     */
    getSupportedFormats(defaultWhenNone?: string): string[];
    /**
     * Gets the version. Defaults to 1.3.0.
     * @returns {string} The service version as read from the metadata attribute.
     */
    getVersion(): string;
    /**
     * Gets if the config has specified that we should fetch the styles from the WMS.
     * @returns {boolean} True when the styles should be fetched from the WMS. True by default.
     */
    getShouldFetchStylesFromWMS(): boolean;
    /**
     * Gets the WMS styles layer id associated with this WFS layer entry config if any.
     * @returns {string} The WMS styles layer id
     */
    getWmsStylesLayerId(): string;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a WFS Feature layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a WFS Feature layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map