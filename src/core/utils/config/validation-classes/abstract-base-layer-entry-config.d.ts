import { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings, TypeBaseSourceInitialConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TimeDimension } from '@/core/utils/date-mgt';
import { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
/**
 * Base type used to define a GeoView layer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** Style to apply to the vector layer. */
    layerStyle?: TypeLayerStyleConfig;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * Gets the service metadata that is associated to the service.
     * @returns {unknown | undefined} The service metadata.
     */
    getServiceMetadata(): unknown | undefined;
    /**
     * Sets the service metadata for the layer.
     * @param {unknown} metadata - The service metadata to set
     */
    setServiceMetadata(metadata: unknown): void;
    /**
     * Gets the metadata that is associated to the layer.
     * @returns {unknown} The layer metadata.
     */
    getLayerMetadata(): unknown | undefined;
    /**
     * Sets the layer metadata for the layer.
     * @param {unknown} layerMetadata - The layer metadata to set
     */
    setLayerMetadata(layerMetadata: unknown): void;
    /**
     * Gets the temporal dimension, if any, that is associated to the layer.
     * @returns {TimeDimension | undefined} The temporal dimension.
     */
    getTemporalDimension(): TimeDimension | undefined;
    /**
     * Sets the temporal dimension that is associated to the layer.
     * @param {TimeDimension} temporalDimension - The temporal dimension.
     */
    setTemporalDimension(temporalDimension: TimeDimension): void;
    /**
     * Gets the layer attributions
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
    /**
     * Sets the layer attributions
     * @param {string[]} attributions - The layer attributions
     */
    setAttributions(attributions: string[]): void;
    /**
     * Gets the layer filter equation
     * @returns {FilterNodeType[] | undefined} The filter equation if any
     */
    getFilterEquation(): FilterNodeType[] | undefined;
    /**
     * Sets the layer filter equation
     * @param {FilterNodeType[]?} filterEquation - The layer filter equation
     */
    setFilterEquation(filterEquation: FilterNodeType[] | undefined): void;
    /**
     * Gets the layer legend filter is off flag
     * @returns {boolean} The legend filter is off flag
     */
    getLegendFilterIsOff(): boolean;
    /**
     * Sets the layer legend filter is off flag
     * @param {boolean} legendFilterIsOff - The legend filter is off flag
     */
    setLegendFilterIsOff(legendFilterIsOff: boolean): void;
    /**
     * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
     */
    getTypeGeometries(): TypeStyleGeometry[];
    /**
     * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
     */
    getFirstStyleSettings(): TypeLayerStyleSettings | undefined;
    /**
     * Overrides the toJson of the mother class
     * @returns {unknown} The Json representation of the instance.
     * @protected
     */
    protected onToJson(): unknown;
}
//# sourceMappingURL=abstract-base-layer-entry-config.d.ts.map