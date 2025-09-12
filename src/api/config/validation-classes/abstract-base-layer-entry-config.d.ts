import { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings } from '@/api/types/map-schema-types';
import { ConfigAbstractBaseClassOrType, TypeBaseSourceInitialConfig } from '@/api/types/layer-schema-types';
import { ConfigBaseClass, ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { TimeDimension } from '@/core/utils/date-mgt';
import { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
export interface AbstractBaseLayerEntryConfigProps extends ConfigBaseClassProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Style to apply to the vector layer. */
    layerStyle?: TypeLayerStyleConfig;
}
/**
 * Base type used to define a GeoView layer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * The class constructor.
     * @param {AbstractBaseLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig);
    /**
     * Gets the service metadata that is associated to the service.
     * @returns {unknown | undefined} The service metadata or undefined.
     */
    getServiceMetadata(): unknown | undefined;
    /**
     * Sets the service metadata for the layer.
     * @param {unknown} metadata - The service metadata to set
     */
    setServiceMetadata(metadata: unknown): void;
    /**
     * Gets the metadata that is associated to the layer.
     * @returns {unknown} The layer metadata or undefined.
     */
    getLayerMetadata(): unknown | undefined;
    /**
     * Sets the layer metadata for the layer.
     * @param {unknown} layerMetadata - The layer metadata to set
     */
    setLayerMetadata(layerMetadata: unknown): void;
    /**
     * Gets the metadata that is associated to the layer.
     * @returns {TypeLayerStyleConfig} The layer style or undefined.
     */
    getLayerStyle(): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer metadata for the layer.
     * @param {TypeLayerStyleConfig} layerStyle - The layer style
     */
    setLayerStyle(layerStyle: TypeLayerStyleConfig): void;
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
     * Gets the temporal dimension, if any, that is associated to the layer.
     * @returns {TimeDimension | undefined} The temporal dimension or undefined.
     */
    getTimeDimension(): TimeDimension | undefined;
    /**
     * Sets the temporal dimension that is associated to the layer.
     * @param {TimeDimension} timeDimension - The temporal dimension.
     */
    setTimeDimension(timeDimension: TimeDimension): void;
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
     * Gets the layer filter that is associated to the layer.
     * @returns {string} The layer filter or undefined.
     */
    getLayerFilter(): string | undefined;
    /**
     * Sets the layer filter for the layer.
     * @param {string} layerFilter - The layer filter
     */
    setLayerFilter(layerFilter: string): void;
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
     * Sets the data access path for the source object.
     * This method is called when the data access path is being set.
     * If the `source` object is undefined or null, it initializes it as an empty object.
     * Then it assigns the provided `dataAccessPath` to `source.dataAccessPath`.
     * @param {string} dataAccessPath - The path string used to access data.
     */
    protected onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Overrides the toJson of the mother class
     * @returns {unknown} The Json representation of the instance.
     * @protected
     */
    protected onToJson<T>(): T;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The layer style or undefined.
     */
    static getClassOrTypeLayerStyle(layerConfig: ConfigAbstractBaseClassOrType | undefined): TypeLayerStyleConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The layer filter or undefined.
     */
    static getClassOrTypeLayerFilter(layerConfig: ConfigAbstractBaseClassOrType | undefined): string | undefined;
}
//# sourceMappingURL=abstract-base-layer-entry-config.d.ts.map