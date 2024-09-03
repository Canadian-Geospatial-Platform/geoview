import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';
import { TypeStyleConfig, TypeLayerEntryType, TypeSourceEsriFeatureInitialConfig } from '@config/types/map-schema-types';
/**
 * The ESRI feature geoview sublayer class.
 */
export declare class EsriFeatureLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
    /** Source settings to apply to the GeoView feature layer source at creation time. */
    source: TypeSourceEsriFeatureInitialConfig;
    /** Style to apply to the feature layer. */
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
     * This method is used to parse the layer metadata and extract the style and source information.
     */
    protected parseLayerMetadata(): void;
    /**
     * @override
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     */
    applyDefaultValues(): void;
}
