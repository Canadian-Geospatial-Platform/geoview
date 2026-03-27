import type { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings, TypeOutfields, TypeLayerTextConfig } from '@/api/types/map-schema-types';
import type { ConfigClassOrType, TypeBaseSourceInitialConfig, TypeFeatureInfoLayerConfig, TypeGeoviewLayerType, TypeLayerEntryType, TypeValidSourceProjectionCodes } from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { type TemporalMode, type TimeDimension, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
/** Base type used to define a GeoView layer to display on the map. */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * Creates an instance of AbstractBaseLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    protected constructor(layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig, schemaTag: TypeGeoviewLayerType, entryType: TypeLayerEntryType);
    /**
     * Overrides the setting of the service metadata.
     *
     * @param metadata - The service metadata to set
     */
    protected onSetServiceMetadata(metadata: unknown): void;
    /**
     * Overrides the setting of the data access path for the source object.
     *
     * This method is called when the data access path is being set.
     *
     * @param dataAccessPath - The path string used to access data.
     */
    protected onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Overridable function to get the geometry type based on the geometry field type.
     *
     * It uses the WFS/WMS OGC standard (GML) to interpret the geometry type.
     *
     * @returns The geometry type, or undefined if it could not be determined
     * @throws {NotSupportedError} When the geometry type is not supported
     */
    protected onGetGeometryType(): TypeStyleGeometry | undefined;
    /**
     * Overrides the toJson of the mother class.
     *
     * @returns The JSON representation of the instance
     */
    protected onToJson<T>(): T;
    /**
     * Gets the service metadata that is associated to the service.
     *
     * @returns The service metadata, or undefined if not set
     */
    getServiceMetadata(): unknown | undefined;
    /**
     * Gets the metadata that is associated to the layer.
     *
     * @returns The layer metadata, or undefined if not set
     */
    getLayerMetadata(): unknown | undefined;
    /**
     * Sets the layer metadata for the layer.
     *
     * @param layerMetadata - The layer metadata to set
     */
    setLayerMetadata(layerMetadata: unknown): void;
    /**
     * Gets the layer style that is associated to the layer.
     *
     * @returns The layer style, or undefined if not set
     */
    getLayerStyle(): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style for the layer.
     *
     * @param layerStyle - The layer style
     */
    setLayerStyle(layerStyle: TypeLayerStyleConfig): void;
    /**
     * Initializes the layer style configuration by filling the blanks in our config with the information from the metadata.
     *
     * @param layerStyleMetadata - Optional layer style metadata to use to help fill the blanks in our layer style config
     */
    initLayerStyleFromMetadata(layerStyleMetadata: TypeLayerStyleConfig | undefined): void;
    /**
     * Gets the text metadata that is associated to the layer.
     *
     * @returns The layer text, or undefined if not set
     */
    getLayerText(): TypeLayerTextConfig | undefined;
    /**
     * Sets the layer text metadata for the layer.
     *
     * @param layerText - The layer text
     */
    setLayerText(layerText: TypeLayerTextConfig): void;
    /**
     * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
     *
     * @returns The array of TypeStyleSettings, or undefined if not available
     * @deprecated This function should be deleted, because it can introduce issues when multiple geometry types are set on a layer style. See GeoJSON - Multi template to reproduce the issue.
     */
    getLayerStyleSettings(): TypeLayerStyleSettings | undefined;
    /**
     * Gets the service date format as specified by the config.
     *
     * @returns The Date Format, or undefined if not specified
     */
    getServiceDateFormatIdentify(): string | undefined;
    /**
     * Gets the service date format as specified by the config.
     *
     * @returns The Date Format, or undefined if not specified
     */
    getServiceDateFormat(): string | undefined;
    /**
     * Gets the service date timezone as specified by the config.
     *
     * @returns The date timezone, or undefined if not specified
     */
    getServiceDateTimezone(): TimeIANA | undefined;
    /**
     * Gets the temporal mode for the date, indicating whether it should be treated as a 'calendar' date or an 'instant'.
     *
     * The method resolves the temporal mode in the following order:
     * 1. Layer-specific configuration (`serviceDateTemporalMode`),
     * 2. Time dimension configuration (`serviceDateTemporalMode`),
     * 3. Inferred from the service date format if available.
     *
     * @returns The date temporal mode, or `undefined` if it cannot be determined
     */
    getServiceDateTemporalMode(): TemporalMode | undefined;
    /**
     * Gets the display format for dates for this layer.
     *
     * The method checks the layer-specific configuration first, and if not set,
     * falls back to the format defined in the layer's time dimension (if available).
     *
     * @returns The date display format, or `undefined` if none is configured
     */
    getDisplayDateFormat(): TypeDisplayDateFormat | undefined;
    /**
     * Gets the short display format for dates for this layer.
     *
     * The method resolves the format in the following order:
     * 1. Layer-specific configuration (`displayDateFormatShort`),
     * 2. Time dimension configuration (`displayDateFormatShort`),
     * 3. Default display format (`getDisplayDateFormat()`).
     *
     * @returns The short date display format, or `undefined` if none is configured
     */
    getDisplayDateFormatShort(): TypeDisplayDateFormat | undefined;
    /**
     * Gets the timezone in which dates should be displayed for this layer.
     *
     * The method first checks the layer-specific configuration, and if not set,
     * falls back to the timezone defined in the layer's time dimension (if available).
     *
     * @returns The display timezone, or `undefined` if none is configured
     */
    getDisplayDateTimezone(): TimeIANA | undefined;
    /**
     * Gets the temporal dimension, if any, that is associated to the layer.
     *
     * @returns The temporal dimension, or undefined if not set
     */
    getTimeDimension(): TimeDimension | undefined;
    /**
     * Sets the temporal dimension that is associated to the layer.
     *
     * @param timeDimension - The temporal dimension
     */
    setTimeDimension(timeDimension: TimeDimension): void;
    /**
     * Gets the layer attributions.
     *
     * @returns The layer attributions, or undefined if not set
     */
    getAttributions(): string[] | undefined;
    /**
     * Sets the layer attributions.
     *
     * @param attributions - The layer attributions
     */
    setAttributions(attributions: string[]): void;
    /**
     * Gets the layer filter that is associated to the layer.
     *
     * @returns The layer filter, or undefined if not set
     */
    getLayerFilter(): string | undefined;
    /**
     * Gets the source object.
     *
     * @returns The source
     */
    getSource(): TypeBaseSourceInitialConfig;
    /**
     * Initializes the source configuration by filling the blanks in our config with the information from the metadata.
     *
     * @param sourceMetadata - Optional source metadata to use to help fill the blanks in our source config
     */
    initSourceFromMetadata(sourceMetadata: TypeBaseSourceInitialConfig | undefined): void;
    /**
     * Returns a shallow-copy of the source object.
     *
     * @returns The shallow-copy of the source object
     */
    cloneSource(): TypeBaseSourceInitialConfig;
    /**
     * Indicates whether the source has a data access path defined.
     *
     * @returns `true` if a data access path is present; otherwise, `false`
     */
    hasDataAccessPath(): boolean;
    /**
     * Gets the source data access path from the source object.
     *
     * @param endsWithSlash - Indicates if the dataAccessPath received should end with a '/'
     * @returns The data access path
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
     */
    getDataAccessPath(endsWithSlash?: boolean): string;
    /**
     * Overrides the data access path using the value provided by metadata.
     *
     * If the metadata source does not define a data access path, no action is taken.
     *
     * @param metadataSource - Optional metadata source configuration containing a data access path
     */
    overrideDataAccessPathFromMetadata(metadataSource: TypeBaseSourceInitialConfig | undefined): void;
    /**
     * Gets the source feature info object.
     *
     * @returns The feature info
     */
    getFeatureInfo(): TypeFeatureInfoLayerConfig;
    /**
     * Gets the source projection.
     *
     * @returns The source projection, or undefined if not set
     */
    getProjection(): TypeValidSourceProjectionCodes | undefined;
    /**
     * Gets the source projection with the EPSG prefix.
     *
     * @returns The source projection with the EPSG prefix, or undefined if not set
     */
    getProjectionWithEPSG(): string | undefined;
    /**
     * Sets the source projection in the source object only if it's not already set and if the parameter is defined.
     *
     * @param projection - Optional source projection
     */
    initProjectionFromMetadata(projection: TypeValidSourceProjectionCodes | undefined): void;
    /**
     * Gets the source outfields from the source object.
     *
     * @returns The outfields, or undefined if not set
     */
    getOutfields(): TypeOutfields[] | undefined;
    /**
     * Sets the source outfields in the source object. The source.featureInfo object must already exist.
     *
     * @param outfields - The outfields
     */
    setOutfields(outfields: TypeOutfields[]): void;
    /**
     * Indicates if the source has an out field which represents the primary key.
     *
     * @returns True if the outfield representing the primary key exists, false otherwise
     */
    hasOutfieldsPK(): boolean;
    /**
     * Gets the out field which represents the primary key.
     *
     * @returns The outfield
     * @throws {NoPrimaryKeyFieldError} When no outfields has the type 'oid'
     */
    getOutfieldsPK(): TypeOutfields;
    /**
     * Gets the field name representing the primary key (OID) if available,
     * otherwise returns the provided default field name.
     *
     * @param defaultField - The field name to return if no OID field is found
     * @returns The primary key (OID) field name or the provided default value
     */
    getOutfieldsPKNameOrDefault(defaultField: string): string;
    /**
     * Initializes any outfield aliases that's undefined using the name property as default.
     */
    initOutfieldsAliases(): void;
    /**
     * Gets the source name field object.
     *
     * @returns The name field, or undefined if not set
     */
    getNameField(): string | undefined;
    /**
     * Sets the source name field in the source object. The source.featureInfo object must already exist.
     *
     * @param nameField - Optional name field
     */
    setNameField(nameField: string | undefined): void;
    /**
     * Sets the source name field in the source object only if it's not already set. The source.featureInfo object must already exist.
     *
     * @param nameField - Optional name field
     */
    initNameField(nameField: string | undefined): void;
    /**
     * Gets the source queryable value.
     *
     * @returns The source queryable value, or undefined if not set
     */
    getQueryableSource(): boolean | undefined;
    /**
     * Gets the source queryable value. Defaults to true when couldn't be determined.
     *
     * @returns The source queryable value, defaulted if necessary
     */
    getQueryableSourceDefaulted(): boolean;
    /**
     * Sets the source queryable in the source object. The source.featureInfo object must already exist.
     *
     * @param queryable - Optional source queryable value
     */
    setQueryableSource(queryable: boolean | undefined): void;
    /**
     * Sets the source queryable in the source object only if it's not already set. The source.featureInfo object must already exist.
     *
     * @param queryable - Optional source queryable value
     */
    initQueryableSource(queryable: boolean | undefined): void;
    /**
     * Gets the geometry field.
     *
     * @returns The geometry field, or undefined if not set
     */
    getGeometryField(): TypeOutfields | undefined;
    /**
     * Sets the geometry field.
     *
     * @param geometryField - Optional geometry field
     */
    setGeometryField(geometryField: TypeOutfields | undefined): void;
    /**
     * Returns the OpenLayers-compatible geometry type of this layer's geometry field.
     *
     * @returns The OpenLayers geometry type (e.g., 'Point', 'LineString', 'Polygon'), or undefined if it could not be determined
     */
    getGeometryType(): TypeStyleGeometry | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The source, or undefined if not available
     */
    static getClassOrTypeSource(layerConfig: ConfigClassOrType | undefined): TypeBaseSourceInitialConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The feature info, or undefined if not available
     */
    static getClassOrTypeFeatureInfo(layerConfig: ConfigClassOrType | undefined): TypeFeatureInfoLayerConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The layer style, or undefined if not available
     */
    static getClassOrTypeLayerStyle(layerConfig: ConfigClassOrType | undefined): TypeLayerStyleConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The layer filter, or undefined if not available
     */
    static getClassOrTypeLayerFilter(layerConfig: ConfigClassOrType | undefined): string | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The layer attributions, or undefined if not available
     */
    static getClassOrTypeLayerAttributions(layerConfig: ConfigClassOrType | undefined): string[] | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - Optional layer config class instance or regular json object
     * @returns The layer text, or undefined if not available
     */
    static getClassOrTypeLayerText(layerConfig: ConfigClassOrType | undefined): TypeLayerTextConfig | undefined;
}
//# sourceMappingURL=abstract-base-layer-entry-config.d.ts.map