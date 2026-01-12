import type { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings, TypeOutfields, TypeLayerTextConfig } from '@/api/types/map-schema-types';
import type { ConfigClassOrType, TypeBaseSourceInitialConfig, TypeFeatureInfoLayerConfig, TypeGeoviewLayerType, TypeLayerEntryType } from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TimeDimension } from '@/core/utils/date-mgt';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
export interface AbstractBaseLayerEntryConfigProps extends ConfigBaseClassProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Style to apply to the vector layer. */
    layerStyle?: TypeLayerStyleConfig;
    /** The Text style to apply to the label */
    layerText?: TypeLayerTextConfig;
}
/**
 * Base type used to define a GeoView layer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source: TypeBaseSourceInitialConfig;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * The class constructor.
     * @param {AbstractBaseLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig, schemaTag: TypeGeoviewLayerType, entryType: TypeLayerEntryType);
    /**
     * Sets the service metadata for the layer.
     * @param {unknown} metadata - The service metadata to set
     */
    onSetServiceMetadata(metadata: unknown): void;
    /**
     * Sets the data access path for the source object.
     * This method is called when the data access path is being set.
     * @param {string} dataAccessPath - The path string used to access data.
     */
    protected onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Overridable function get the geometry type based on the geometry field type.
     * It uses the WFS/WMS OGC standard (GML) to interpret the geometry type.
     * @returns {TypeStyleGeometry} The geometry type.
     * @throws {NotSupportedError} When the geometry type is not supported.
     */
    protected onGetGeometryType(): TypeStyleGeometry;
    /**
     * Overrides the toJson of the mother class
     * @returns {unknown} The Json representation of the instance.
     * @protected
     */
    protected onToJson<T>(): T;
    /**
     * Gets the service metadata that is associated to the service.
     * @returns {unknown | undefined} The service metadata or undefined.
     */
    getServiceMetadata(): unknown | undefined;
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
     * Gets the text metadata that is associated to the layer.
     * @returns {TypeLayerTextConfig} The layer text or undefined.
     */
    getLayerText(): TypeLayerTextConfig | undefined;
    /**
     * Sets the layer text metadata for the layer.
     * @param {TypeLayerTextConfig} layerText - The layer text
     */
    setLayerText(layerText: TypeLayerTextConfig): void;
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
     * @returns {string[] | undefined} The layer attributions
     */
    getAttributions(): string[] | undefined;
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
     * Gets the source object.
     * @returns {TypeBaseSourceInitialConfig} The source.
     */
    getSource(): TypeBaseSourceInitialConfig;
    /**
     * Gets the source data access path from the source object.
     * @param {boolean} endsWithSlash - Indicates if the dataAccessPath received should end with a '/', because it's going to be dynamically used to create a url path.
     * @returns {string} The data access path.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    getDataAccessPath(endsWithSlash?: boolean): string;
    /**
     * Gets the source feature info object.
     * @returns {TypeFeatureInfoLayerConfig} The feature info.
     */
    getFeatureInfo(): TypeFeatureInfoLayerConfig;
    /**
     * Sets the source feature info object.
     * @param {TypeFeatureInfoLayerConfig} featureInfo - The feature info.
     */
    setFeatureInfo(featureInfo: TypeFeatureInfoLayerConfig): void;
    /**
     * Gets the source outfields from the source object.
     * @returns {TypeOutfields[] | undefined} The outfields.
     */
    getOutfields(): TypeOutfields[] | undefined;
    /**
     * Sets the source outfields in the source object. The source.featureInfo object must already exist.
     * @param {TypeOutfields[]} outfields - The outfields.
     */
    setOutfields(outfields: TypeOutfields[]): void;
    /**
     * Indicates if the source has an out field which represents the primary key.
     * @returns {boolean} True if the outfield representing the primary key exists, false otherwise.
     */
    hasOutfieldsPK(): boolean;
    /**
     * Gets the out field which represents the primary key.
     * @returns {TypeOutfields} The outfield.
     * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'.
     */
    getOutfieldsPK(): TypeOutfields;
    /**
     * Initializes any outfield aliases that's undefined using the name property as default.
     */
    initOutfieldsAliases(): void;
    /**
     * Gets the source name field object.
     * @returns {string | undefined} The name field.
     */
    getNameField(): string | undefined;
    /**
     * Sets the source name field in the source object. The source.featureInfo object must already exist.
     * @param {string | undefined} nameField - The name field.
     */
    setNameField(nameField: string | undefined): void;
    /**
     * Sets the source name field in the source object only if it's not already set. The source.featureInfo object must already exist.
     * @param {string | undefined} nameField - The name field.
     */
    initNameField(nameField: string | undefined): void;
    /**
     * Gets the source queryable value.
     * @returns {boolean | undefined} The source queryable value.
     */
    getQueryable(): boolean | undefined;
    /**
     * Gets the source queryable value. Defaults to true when couldn't be determined.
     * @returns {boolean} The source queryable value, defaulted if necessary.
     */
    getQueryableDefaulted(): boolean;
    /**
     * Sets the source queryable in the source object. The source.featureInfo object must already exist.
     * @param {boolean | undefined} queryable - The source queryable value.
     */
    setQueryable(queryable: boolean | undefined): void;
    /**
     * Sets the source queryable in the source object only if it's not already set. The source.featureInfo object must already exist.
     * @param {boolean} queryable - The source queryable value.
     */
    initQueryable(queryable: boolean | undefined): void;
    /**
     * Gets the geometry field.
     * @returns {TypeOutfields | undefined} The geometry field.
     */
    getGeometryField(): TypeOutfields | undefined;
    /**
     * Sets the geometry field.
     * @param {TypeOutfields | undefined} geometryField - The geometry field
     */
    setGeometryField(geometryField: TypeOutfields | undefined): void;
    /**
     * Returns the OpenLayers-compatible geometry type of this layer's geometry field.
     * @returns {TypeStyleGeometry} The OpenLayers geometry type (e.g., 'Point', 'LineString', 'Polygon')
     */
    getGeometryType(): TypeStyleGeometry;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {TypeLayerStyleConfig | undefined} The layer style or undefined.
     */
    static getClassOrTypeLayerStyle(layerConfig: ConfigClassOrType | undefined): TypeLayerStyleConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The layer filter or undefined.
     */
    static getClassOrTypeLayerFilter(layerConfig: ConfigClassOrType | undefined): string | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The layer attributions or undefined.
     */
    static getClassOrTypeLayerAttributions(layerConfig: ConfigClassOrType | undefined): string[] | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {TypeLayerTextConfig | undefined} The layer attributions or undefined.
     */
    static getClassOrTypeLayerText(layerConfig: ConfigClassOrType | undefined): TypeLayerTextConfig | undefined;
}
//# sourceMappingURL=abstract-base-layer-entry-config.d.ts.map