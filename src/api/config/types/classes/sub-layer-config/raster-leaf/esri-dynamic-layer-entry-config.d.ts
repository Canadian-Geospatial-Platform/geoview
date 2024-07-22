import { AbstractBaseEsriLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-esri-layer-entry-config';
import { TypeStyleConfig, TypeLayerEntryType, TypeSourceEsriDynamicInitialConfig, TypeLayerInitialSettings } from '@config/types/map-schema-types';
/**
 * The ESRI dynamic geoview sublayer class.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseEsriLayerEntryConfig {
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceEsriDynamicInitialConfig;
    /** Style to apply to the raster layer. */
    style?: TypeStyleConfig;
    /**
     * Apply default value to undefined fields. The default values to be used for the initialSettings are
     * inherited from the object that owns this sublayer instance.
     *
     * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited by the parent container.
     */
    applyDefaultValueToUndefinedFields(initialSettings: TypeLayerInitialSettings): void;
    /**
     * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
     * used to do its validation.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     * @protected
     */
    protected get schemaPath(): string;
    /**
     * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
     *
     * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
     * @protected
     */
    protected getEntryType(): TypeLayerEntryType;
}
