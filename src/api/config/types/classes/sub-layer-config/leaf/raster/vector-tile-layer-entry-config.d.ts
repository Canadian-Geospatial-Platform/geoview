import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeLayerStyleConfig, TypeLayerEntryType, TypeSourceTileInitialConfig, AbstractGeoviewLayerConfig, EntryConfigBaseClass } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { VectorTileLayerConfig } from '../../../geoview-config/raster-config/vector-tile-config';
/**
 * The vector tile geoview sublayer class.
 */
export declare class VectorTileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source?: TypeSourceTileInitialConfig;
    /** Style to apply to the raster layer. */
    layerStyle?: TypeLayerStyleConfig;
    constructor(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode: EntryConfigBaseClass | undefined);
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
     * Shadow method used to do a cast operation on the parent method to returVectorTileLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {VectorTileLayerConfig} The Geoview layer configuration that owns this vector tile layer entry config.
     * @override
     */
    getGeoviewLayerConfig(): VectorTileLayerConfig;
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
//# sourceMappingURL=vector-tile-layer-entry-config.d.ts.map