import { TypeLayerStyleConfig, TypeLayerEntryType, TypeSourceWfsInitialConfig } from '@config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { WfsLayerConfig } from '@config/types/classes/geoview-config/vector-config/wfs-config';
/**
 * The OGC WFS geoview sublayer class.
 */
export declare class WfsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    #private;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceWfsInitialConfig;
    /** Style to apply to the raster layer. */
    layerStyle?: TypeLayerStyleConfig;
    /**
     * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
     * used to do its validation.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     * @protected @override
     */
    protected getSchemaPath(): string;
    /**
     * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
     *
     * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
     * @protected @override
     */
    protected getEntryType(): TypeLayerEntryType;
    /**
     * Shadow method used to do a cast operation on the parent method to return WfsLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {WfsLayerConfig} The Geoview layer configuration that owns this WFS layer entry config.
     * @override @async
     */
    getGeoviewLayerConfig(): WfsLayerConfig;
    /**
     * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
    /**
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     * @override
     */
    applyDefaultValues(): void;
    /**
     * This method is used to parse the layer metadata and extract the source information and other properties.
     * @override @protected
     */
    protected parseLayerMetadata(): void;
}
