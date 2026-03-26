import type {
  TypeLayerStyleConfig,
  TypeStyleGeometry,
  TypeLayerStyleSettings,
  TypeOutfields,
  TypeLayerTextConfig,
} from '@/api/types/map-schema-types';
import type {
  ConfigClassOrType,
  TypeBaseSourceInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
  TypeValidSourceProjectionCodes,
} from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { DateMgt, type TemporalMode, type TimeDimension, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { NoPrimaryKeyFieldError } from '@/core/exceptions/geoview-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';
import { deepMerge } from '@/core/utils/utilities';

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
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
  declare listOfLayerEntryConfig: never;

  /** Source settings to apply to the GeoView layer source at creation time. */
  #source: TypeBaseSourceInitialConfig;

  /** The metadata associated with the service. */
  #serviceMetadata?: unknown;

  /** The metadata associated with the layer. */
  #layerMetadata?: unknown;

  /** The geometry field information. */
  #geometryField?: TypeOutfields;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** The OpenLayers Text style to apply to the label (will override the global feature text). */
  #layerText?: TypeLayerTextConfig;

  /** The time dimension information. */
  #timeDimension?: TimeDimension;

  /** Attributions used in the OpenLayer source. */
  #attributions?: string[];

  /** Filter to apply on feature of this layer. */
  #layerFilter?: string;

  /**
   * Creates an instance of AbstractBaseLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  protected constructor(
    layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig,
    schemaTag: TypeGeoviewLayerType,
    entryType: TypeLayerEntryType
  ) {
    super(layerConfig, schemaTag, entryType);

    // Keep attribute properties
    this.#source = AbstractBaseLayerEntryConfig.getClassOrTypeSource(layerConfig) || {};
    this.#source.featureInfo = AbstractBaseLayerEntryConfig.getClassOrTypeFeatureInfo(layerConfig) || {};
    this.#layerStyle = AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(layerConfig);
    this.#layerFilter = AbstractBaseLayerEntryConfig.getClassOrTypeLayerFilter(layerConfig);
    this.#attributions = AbstractBaseLayerEntryConfig.getClassOrTypeLayerAttributions(layerConfig);
    this.#layerText = AbstractBaseLayerEntryConfig.getClassOrTypeLayerText(layerConfig);

    // Initialize the dataAccessPath
    this.#source.dataAccessPath ??= this.layerEntryProps.geoviewLayerConfig.metadataAccessPath;
  }

  // #region OVERRIDES

  /**
   * Overrides the setting of the service metadata.
   *
   * @param metadata - The service metadata to set
   */
  protected override onSetServiceMetadata(metadata: unknown): void {
    this.#serviceMetadata = metadata;
  }

  /**
   * Overrides the setting of the data access path for the source object.
   *
   * This method is called when the data access path is being set.
   *
   * @param dataAccessPath - The path string used to access data.
   */
  protected override onSetDataAccessPath(dataAccessPath: string): void {
    this.#source.dataAccessPath = dataAccessPath;
  }

  /**
   * Overridable function to get the geometry type based on the geometry field type.
   *
   * It uses the WFS/WMS OGC standard (GML) to interpret the geometry type.
   *
   * @returns The geometry type, or undefined if it could not be determined
   * @throws {NotSupportedError} When the geometry type is not supported
   */
  protected onGetGeometryType(): TypeStyleGeometry | undefined {
    // Get the geometry field
    const geometryField = this.getGeometryField();

    // If found
    if (geometryField) {
      // Check the geometry type using WFS/WMS OGC standard (GML)
      return GeoUtilities.wfsConvertGeometryTypeToOLGeometryType(geometryField.type);
    }

    // None
    return undefined;
  }

  /**
   * Overrides the toJson of the mother class.
   *
   * @returns The JSON representation of the instance
   */
  protected override onToJson<T>(): T {
    // Call parent
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onToJson<T>() as any;

    // Copy values
    serialized.initialSettings = this.getInitialSettings();
    serialized.attributions = this.getAttributions();
    serialized.source = this.getSource();
    serialized.layerFilter = this.getLayerFilter();
    serialized.layerStyle = this.getLayerStyle();
    serialized.layerText = this.getLayerText();

    // Return it
    return serialized;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the service metadata that is associated to the service.
   *
   * @returns The service metadata, or undefined if not set
   */
  getServiceMetadata(): unknown | undefined {
    return this.#serviceMetadata;
  }

  /**
   * Gets the metadata that is associated to the layer.
   *
   * @returns The layer metadata, or undefined if not set
   */
  getLayerMetadata(): unknown | undefined {
    return this.#layerMetadata;
  }

  /**
   * Sets the layer metadata for the layer.
   *
   * @param layerMetadata - The layer metadata to set
   */
  setLayerMetadata(layerMetadata: unknown): void {
    this.#layerMetadata = layerMetadata;
  }

  /**
   * Gets the layer style that is associated to the layer.
   *
   * @returns The layer style, or undefined if not set
   */
  getLayerStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer style for the layer.
   *
   * @param layerStyle - The layer style
   */
  setLayerStyle(layerStyle: TypeLayerStyleConfig): void {
    this.#layerStyle = layerStyle;
  }

  /**
   * Initializes the layer style configuration by filling the blanks in our config with the information from the metadata.
   *
   * @param layerStyleMetadata - Optional layer style metadata to use to help fill the blanks in our layer style config
   */
  initLayerStyleFromMetadata(layerStyleMetadata: TypeLayerStyleConfig | undefined): void {
    this.#layerStyle = deepMerge(layerStyleMetadata, this.#layerStyle);
  }

  /**
   * Gets the text metadata that is associated to the layer.
   *
   * @returns The layer text, or undefined if not set
   */
  getLayerText(): TypeLayerTextConfig | undefined {
    return this.#layerText;
  }

  /**
   * Sets the layer text metadata for the layer.
   *
   * @param layerText - The layer text
   */
  setLayerText(layerText: TypeLayerTextConfig): void {
    this.#layerText = layerText;
  }

  /**
   * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
   *
   * @returns The array of TypeStyleSettings, or undefined if not available
   * @deprecated This function should be deleted, because it can introduce issues when multiple geometry types are set on a layer style. See GeoJSON - Multi template to reproduce the issue.
   */
  getLayerStyleSettings(): TypeLayerStyleSettings | undefined {
    // Get the layer style
    const layerStyle = this.getLayerStyle();

    // If has a layer style
    if (layerStyle) {
      // If only one style
      if (Object.keys(layerStyle).length === 1) {
        // Take the only one
        return Object.values(layerStyle)[0];
      }

      // Take the geometry type
      const geometryType = this.getGeometryType();

      // If any
      if (geometryType) {
        // Take the style based on the geometry type
        return layerStyle?.[geometryType];
      }
    }

    // None
    return undefined;
  }

  /**
   * Gets the service date format as specified by the config.
   *
   * @returns The Date Format, or undefined if not specified
   */
  getServiceDateFormatIdentify(): string | undefined {
    return this.getGeoviewLayerConfig().serviceDateFormatIdentify;
  }

  /**
   * Gets the service date format as specified by the config.
   *
   * @returns The Date Format, or undefined if not specified
   */
  getServiceDateFormat(): string | undefined {
    return this.getGeoviewLayerConfig().serviceDateFormat;
  }

  /**
   * Gets the service date timezone as specified by the config.
   *
   * @returns The date timezone, or undefined if not specified
   */
  getServiceDateTimezone(): TimeIANA | undefined {
    return this.getGeoviewLayerConfig().serviceDateTimezone;
  }

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
  getServiceDateTemporalMode(): TemporalMode | undefined {
    return (
      this.getGeoviewLayerConfig().serviceDateTemporalMode ??
      this.getTimeDimension()?.serviceDateTemporalMode ??
      DateMgt.guessDisplayDateInformationFromServiceDateFormat(this.getServiceDateFormat())?.serviceDateTemporalMode
    );
  }

  /**
   * Gets the display format for dates for this layer.
   *
   * The method checks the layer-specific configuration first, and if not set,
   * falls back to the format defined in the layer's time dimension (if available).
   *
   * @returns The date display format, or `undefined` if none is configured
   */
  getDisplayDateFormat(): TypeDisplayDateFormat | undefined {
    return this.getGeoviewLayerConfig().displayDateFormat ?? this.getTimeDimension()?.displayDateFormat;
  }

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
  getDisplayDateFormatShort(): TypeDisplayDateFormat | undefined {
    return (
      this.getGeoviewLayerConfig().displayDateFormatShort ?? this.getTimeDimension()?.displayDateFormatShort ?? this.getDisplayDateFormat()
    );
  }

  /**
   * Gets the timezone in which dates should be displayed for this layer.
   *
   * The method first checks the layer-specific configuration, and if not set,
   * falls back to the timezone defined in the layer's time dimension (if available).
   *
   * @returns The display timezone, or `undefined` if none is configured
   */
  getDisplayDateTimezone(): TimeIANA | undefined {
    return this.getGeoviewLayerConfig().displayDateTimezone ?? this.getTimeDimension()?.displayDateTimezone;
  }

  /**
   * Gets the temporal dimension, if any, that is associated to the layer.
   *
   * @returns The temporal dimension, or undefined if not set
   */
  getTimeDimension(): TimeDimension | undefined {
    return this.#timeDimension;
  }

  /**
   * Sets the temporal dimension that is associated to the layer.
   *
   * @param timeDimension - The temporal dimension
   */
  setTimeDimension(timeDimension: TimeDimension): void {
    this.#timeDimension = timeDimension;
  }

  /**
   * Gets the layer attributions.
   *
   * @returns The layer attributions, or undefined if not set
   */
  getAttributions(): string[] | undefined {
    // If no attributions defined
    if (!this.#attributions) {
      // Get the service metadata
      const serviceMetadata = this.getServiceMetadata();

      // If service metadata is set
      if (serviceMetadata) {
        // Read copyrightText from the metadata
        // GV Can be any object so disable eslint and proceed with caution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { copyrightText } = serviceMetadata as any;
        if (copyrightText) {
          // Set it
          this.#attributions = [copyrightText];
        }
      }
    }

    // Return it
    return this.#attributions;
  }

  /**
   * Sets the layer attributions.
   *
   * @param attributions - The layer attributions
   */
  setAttributions(attributions: string[]): void {
    this.#attributions = attributions;
  }

  /**
   * Gets the layer filter that is associated to the layer.
   *
   * @returns The layer filter, or undefined if not set
   */
  getLayerFilter(): string | undefined {
    return this.#layerFilter;
  }

  /**
   * Gets the source object.
   *
   * @returns The source
   */
  getSource(): TypeBaseSourceInitialConfig {
    return this.#source;
  }

  /**
   * Initializes the source configuration by filling the blanks in our config with the information from the metadata.
   *
   * @param sourceMetadata - Optional source metadata to use to help fill the blanks in our source config
   */
  initSourceFromMetadata(sourceMetadata: TypeBaseSourceInitialConfig | undefined): void {
    this.#source = deepMerge(sourceMetadata, this.#source);
  }

  /**
   * Returns a shallow-copy of the source object.
   *
   * @returns The shallow-copy of the source object
   */
  cloneSource(): TypeBaseSourceInitialConfig {
    // Clone the source object
    return { ...this.getSource() };
  }

  /**
   * Indicates whether the source has a data access path defined.
   *
   * @returns `true` if a data access path is present; otherwise, `false`
   */
  hasDataAccessPath(): boolean {
    return !!this.getSource().dataAccessPath;
  }

  /**
   * Gets the source data access path from the source object.
   *
   * @param endsWithSlash - Indicates if the dataAccessPath received should end with a '/'
   * @returns The data access path
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
   */
  getDataAccessPath(endsWithSlash: boolean = false): string {
    // Read the data access path
    let { dataAccessPath } = this.getSource();

    // Throw if not set, likely initDataAccessPath wasn't called
    if (!dataAccessPath) throw new LayerDataAccessPathMandatoryError(this.layerPath, this.getLayerNameCascade());

    // If should end with a slash
    if (endsWithSlash) {
      // Format the dataAccessPath correctly
      if (!dataAccessPath.endsWith('/')) dataAccessPath += '/';
    }

    // Return it
    return dataAccessPath;
  }

  /**
   * Overrides the data access path using the value provided by metadata.
   *
   * If the metadata source does not define a data access path, no action is taken.
   *
   * @param metadataSource - Optional metadata source configuration containing a data access path
   */
  overrideDataAccessPathFromMetadata(metadataSource: TypeBaseSourceInitialConfig | undefined): void {
    // If the source dataAccessPath doesn't exist
    if (!metadataSource?.dataAccessPath) return;

    // Favor the metadata source dataAccessPath over the automatically generated dataAccessPath
    this.setDataAccessPath(metadataSource.dataAccessPath);
  }

  /**
   * Gets the source feature info object.
   *
   * @returns The feature info
   */
  getFeatureInfo(): TypeFeatureInfoLayerConfig {
    return this.getSource().featureInfo!; // Always defined to something, minimally an empty object.
  }

  /**
   * Gets the source projection.
   *
   * @returns The source projection, or undefined if not set
   */
  getProjection(): TypeValidSourceProjectionCodes | undefined {
    return this.getSource().projection;
  }

  /**
   * Gets the source projection with the EPSG prefix.
   *
   * @returns The source projection with the EPSG prefix, or undefined if not set
   */
  getProjectionWithEPSG(): string | undefined {
    return this.getProjection() ? `EPSG:${this.getProjection()}` : undefined;
  }

  /**
   * Sets the source projection in the source object only if it's not already set and if the parameter is defined.
   *
   * @param projection - Optional source projection
   */
  initProjectionFromMetadata(projection: TypeValidSourceProjectionCodes | undefined): void {
    // If not projection, skip
    if (!projection) return;

    // Set it if not already set.
    this.getSource().projection ??= projection;
  }

  /**
   * Gets the source outfields from the source object.
   *
   * @returns The outfields, or undefined if not set
   */
  getOutfields(): TypeOutfields[] | undefined {
    return this.getFeatureInfo().outfields;
  }

  /**
   * Sets the source outfields in the source object. The source.featureInfo object must already exist.
   *
   * @param outfields - The outfields
   */
  setOutfields(outfields: TypeOutfields[]): void {
    this.getFeatureInfo().outfields = outfields;
  }

  /**
   * Indicates if the source has an out field which represents the primary key.
   *
   * @returns True if the outfield representing the primary key exists, false otherwise
   */
  hasOutfieldsPK(): boolean {
    return !!this.getOutfields()?.find((outfield) => outfield.type === 'oid');
  }

  /**
   * Gets the out field which represents the primary key.
   *
   * @returns The outfield
   * @throws {NoPrimaryKeyFieldError} When no outfields has the type 'oid'
   */
  getOutfieldsPK(): TypeOutfields {
    // Get the oid field
    const outfieldOID = this.getOutfields()?.find((outfield) => outfield.type === 'oid');

    // If not found
    if (!outfieldOID) throw new NoPrimaryKeyFieldError(this.layerPath);

    // Return it
    return outfieldOID;
  }

  /**
   * Gets the field name representing the primary key (OID) if available,
   * otherwise returns the provided default field name.
   *
   * @param defaultField - The field name to return if no OID field is found
   * @returns The primary key (OID) field name or the provided default value
   */
  getOutfieldsPKNameOrDefault(defaultField: string): string {
    // Get the oid field if any
    const outfieldOID = this.getOutfields()?.find((outfield) => outfield.type === 'oid');

    // Return if found or the default
    return outfieldOID?.name ?? defaultField;
  }

  /**
   * Initializes any outfield aliases that's undefined using the name property as default.
   */
  initOutfieldsAliases(): void {
    // For each outfield
    this.getOutfields()?.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      outfield.alias ??= outfield.name;
    });
  }

  /**
   * Gets the source name field object.
   *
   * @returns The name field, or undefined if not set
   */
  getNameField(): string | undefined {
    return this.getFeatureInfo().nameField;
  }

  /**
   * Sets the source name field in the source object. The source.featureInfo object must already exist.
   *
   * @param nameField - Optional name field
   */
  setNameField(nameField: string | undefined): void {
    this.getFeatureInfo().nameField = nameField;
  }

  /**
   * Sets the source name field in the source object only if it's not already set. The source.featureInfo object must already exist.
   *
   * @param nameField - Optional name field
   */
  initNameField(nameField: string | undefined): void {
    this.getFeatureInfo().nameField ??= nameField;
  }

  /**
   * Gets the source queryable value.
   *
   * @returns The source queryable value, or undefined if not set
   */
  getQueryableSource(): boolean | undefined {
    return this.getFeatureInfo().queryable;
  }

  /**
   * Gets the source queryable value. Defaults to true when couldn't be determined.
   *
   * @returns The source queryable value, defaulted if necessary
   */
  getQueryableSourceDefaulted(): boolean {
    return this.getFeatureInfo().queryable ?? true; // default: true
  }

  /**
   * Sets the source queryable in the source object. The source.featureInfo object must already exist.
   *
   * @param queryable - Optional source queryable value
   */
  setQueryableSource(queryable: boolean | undefined): void {
    this.getFeatureInfo().queryable = queryable;
  }

  /**
   * Sets the source queryable in the source object only if it's not already set. The source.featureInfo object must already exist.
   *
   * @param queryable - Optional source queryable value
   */
  initQueryableSource(queryable: boolean | undefined): void {
    this.getFeatureInfo().queryable ??= queryable;
  }

  /**
   * Gets the geometry field.
   *
   * @returns The geometry field, or undefined if not set
   */
  getGeometryField(): TypeOutfields | undefined {
    return this.#geometryField;
  }

  /**
   * Sets the geometry field.
   *
   * @param geometryField - Optional geometry field
   */
  setGeometryField(geometryField: TypeOutfields | undefined): void {
    this.#geometryField = geometryField;
  }

  /**
   * Returns the OpenLayers-compatible geometry type of this layer's geometry field.
   *
   * @returns The OpenLayers geometry type (e.g., 'Point', 'LineString', 'Polygon'), or undefined if it could not be determined
   */
  getGeometryType(): TypeStyleGeometry | undefined {
    return this.onGetGeometryType();
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The source, or undefined if not available
   */
  static getClassOrTypeSource(layerConfig: ConfigClassOrType | undefined): TypeBaseSourceInitialConfig | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getSource();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.source;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The feature info, or undefined if not available
   */
  static getClassOrTypeFeatureInfo(layerConfig: ConfigClassOrType | undefined): TypeFeatureInfoLayerConfig | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getFeatureInfo();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.source?.featureInfo;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The layer style, or undefined if not available
   */
  static getClassOrTypeLayerStyle(layerConfig: ConfigClassOrType | undefined): TypeLayerStyleConfig | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getLayerStyle();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.layerStyle;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The layer filter, or undefined if not available
   */
  static getClassOrTypeLayerFilter(layerConfig: ConfigClassOrType | undefined): string | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getLayerFilter();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.layerFilter;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The layer attributions, or undefined if not available
   */
  static getClassOrTypeLayerAttributions(layerConfig: ConfigClassOrType | undefined): string[] | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getAttributions();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.attributions;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   *
   * @param layerConfig - Optional layer config class instance or regular json object
   * @returns The layer text, or undefined if not available
   */
  static getClassOrTypeLayerText(layerConfig: ConfigClassOrType | undefined): TypeLayerTextConfig | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getLayerText();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.layerText;
  }

  // #endregion STATIC METHODS
}
