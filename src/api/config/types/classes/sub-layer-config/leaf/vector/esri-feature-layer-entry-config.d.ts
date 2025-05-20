import { AbstractBaseEsriLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-esri-layer-entry-config';
import { TypeLayerStyleConfig, TypeLayerEntryType, TypeBaseVectorSourceInitialConfig } from '@/api/config/types/map-schema-types';
/**
 * The ESRI feature geoview sublayer class.
 */
export declare class EsriFeatureLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
    /** Source settings to apply to the GeoView feature layer source at creation time. */
    source: TypeBaseVectorSourceInitialConfig;
    /** Style to apply to the feature layer. */
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
    /** ***************************************************************************************************************************
     * This method is used to parse the layer metadata and extract the style and source information.
     *
     * @protected @override
     */
    protected parseLayerMetadata(): void;
    /**
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     *
     * @override
     */
    applyDefaultValues(): void;
}
