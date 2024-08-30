import { TypeStyleConfig, TypeLayerEntryType, TypeSourceEsriDynamicInitialConfig } from '@config/types/map-schema-types';
import { AbstractBaseEsriLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';
/**
 * The ESRI dynamic geoview sublayer class.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceEsriDynamicInitialConfig;
    /** Style to apply to the raster layer. */
    style?: TypeStyleConfig;
    /**
     * @protected @override
     * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
     * used to do its validation.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     */
    protected getSchemaPath(): string;
    /**
     * @protected @override
     * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
     *
     * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
     */
    protected getEntryType(): TypeLayerEntryType;
    /** ***************************************************************************************************************************
     * @protected @override
     * This method is used to parse the layer metadata and extract the style, source information and other properties.
     */
    protected parseLayerMetadata(): void;
    /**
     * @override
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     */
    applyDefaultValues(): void;
}
