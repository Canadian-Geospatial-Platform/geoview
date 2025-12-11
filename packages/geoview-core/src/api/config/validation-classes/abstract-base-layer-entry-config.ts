import type { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings, TypeOutfields } from '@/api/types/map-schema-types';
import type {
  ConfigClassOrType,
  TypeBaseSourceInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryType,
} from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TimeDimension } from '@/core/utils/date-mgt';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { NoPrimaryKeyFieldError } from '@/core/exceptions/geoview-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';

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
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  // TODO: This source attribute is responsible for problems. Change to a getSource() and setSource().
  // TO.DOCONT: However, to do so, we must fix the other major issue with TypeGeoviewLayerConfig and TypeLayerEntryConfig and the classes being created with 'fake classes' in their constructors.
  /** Source settings to apply to the GeoView layer source at creation time. */
  source: TypeBaseSourceInitialConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
  declare listOfLayerEntryConfig: never;

  /** The metadata associated with the service */
  #serviceMetadata?: unknown;

  /** The metadata associated with the layer */
  #layerMetadata?: unknown;

  /** The geometry field information. */
  #geometryField?: TypeOutfields;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** The time dimension information */
  #timeDimension?: TimeDimension;

  /** Attributions used in the OpenLayer source. */
  #attributions?: string[];

  /** Filter to apply on feature of this layer. */
  #layerFilter?: string;

  /** The calculated filter equation */
  #filterEquation?: FilterNodeType[];

  /** Indicates if filter is on/off */
  // TODO: Cleanup - Get rid of this attribute as it doesn't seem to be used (always false as the setLegendFilterIsOff is never called)
  #legendFilterIsOff: boolean = false;

  /**
   * The class constructor.
   * @param {AbstractBaseLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(
    layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig,
    schemaTag: TypeGeoviewLayerType,
    entryType: TypeLayerEntryType
  ) {
    super(layerConfig, schemaTag, entryType);

    // Keep attribute properties
    this.source = layerConfig.source || {};
    this.source.featureInfo = layerConfig.source?.featureInfo || {};
    this.#layerStyle = AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(layerConfig);
    this.#layerFilter = AbstractBaseLayerEntryConfig.getClassOrTypeLayerFilter(layerConfig);
    this.#attributions = AbstractBaseLayerEntryConfig.getClassOrTypeLayerAttributions(layerConfig);

    // Initialize the dataAccessPath
    this.source.dataAccessPath ??= this.layerEntryProps.geoviewLayerConfig.metadataAccessPath;
  }

  // #region OVERRIDES

  /**
   * Sets the service metadata for the layer.
   * @param {unknown} metadata - The service metadata to set
   */
  override onSetServiceMetadata(metadata: unknown): void {
    this.#serviceMetadata = metadata;
  }

  /**
   * Sets the data access path for the source object.
   * This method is called when the data access path is being set.
   * @param {string} dataAccessPath - The path string used to access data.
   */
  protected override onSetDataAccessPath(dataAccessPath: string): void {
    this.source.dataAccessPath = dataAccessPath;
  }

  /**
   * Overridable function get the geometry type based on the geometry field type.
   * It uses the WFS/WMS OGC standard (GML) to interpret the geometry type.
   * @returns {TypeStyleGeometry} The geometry type.
   * @throws {NotSupportedError} When the geometry type is not supported.
   */
  protected onGetGeometryType(): TypeStyleGeometry {
    // Default behavior is to get the geometry type using WFS/WMS OGC standard (GML)
    return GeoUtilities.wfsConvertGeometryTypeToOLGeometryType(this.getGeometryField()?.type);
  }

  /**
   * Overrides the toJson of the mother class
   * @returns {unknown} The Json representation of the instance.
   * @protected
   */
  protected override onToJson<T>(): T {
    // Call parent
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onToJson<T>() as any;

    // Copy values
    serialized.initialSettings = this.getInitialSettings();
    serialized.attributions = this.getAttributions();
    serialized.source = this.source;

    // Return it
    return serialized;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the service metadata that is associated to the service.
   * @returns {unknown | undefined} The service metadata or undefined.
   */
  getServiceMetadata(): unknown | undefined {
    return this.#serviceMetadata;
  }

  /**
   * Gets the metadata that is associated to the layer.
   * @returns {unknown} The layer metadata or undefined.
   */
  getLayerMetadata(): unknown | undefined {
    return this.#layerMetadata;
  }

  /**
   * Sets the layer metadata for the layer.
   * @param {unknown} layerMetadata - The layer metadata to set
   */
  setLayerMetadata(layerMetadata: unknown): void {
    this.#layerMetadata = layerMetadata;
  }

  /**
   * Gets the metadata that is associated to the layer.
   * @returns {TypeLayerStyleConfig} The layer style or undefined.
   */
  getLayerStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer metadata for the layer.
   * @param {TypeLayerStyleConfig} layerStyle - The layer style
   */
  setLayerStyle(layerStyle: TypeLayerStyleConfig): void {
    this.#layerStyle = layerStyle;
  }

  /**
   * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
   */
  getFirstStyleSettings(): TypeLayerStyleSettings | undefined {
    // Get the type geometries
    const styles = this.getLayerStyle();

    // If any styles
    if (styles) {
      // Get the keys
      const keys = Object.keys(styles) as TypeStyleGeometry[];

      // Get the first one
      if (keys.length > 0) {
        return styles[keys[0]];
      }
    }

    // None
    return undefined;
  }

  /**
   * Gets the temporal dimension, if any, that is associated to the layer.
   * @returns {TimeDimension | undefined} The temporal dimension or undefined.
   */
  getTimeDimension(): TimeDimension | undefined {
    return this.#timeDimension;
  }

  /**
   * Sets the temporal dimension that is associated to the layer.
   * @param {TimeDimension} timeDimension - The temporal dimension.
   */
  setTimeDimension(timeDimension: TimeDimension): void {
    this.#timeDimension = timeDimension;
  }

  /**
   * Gets the layer attributions
   * @returns {string[] | undefined} The layer attributions
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
   * Sets the layer attributions
   * @param {string[]} attributions - The layer attributions
   */
  setAttributions(attributions: string[]): void {
    this.#attributions = attributions;
  }

  /**
   * Gets the layer filter that is associated to the layer.
   * @returns {string} The layer filter or undefined.
   */
  getLayerFilter(): string | undefined {
    return this.#layerFilter;
  }

  /**
   * Sets the layer filter for the layer.
   * @param {string} layerFilter - The layer filter
   */
  setLayerFilter(layerFilter: string): void {
    this.#layerFilter = layerFilter;
  }

  /**
   * Gets the layer filter equation
   * @returns {FilterNodeType[] | undefined} The filter equation if any
   */
  getFilterEquation(): FilterNodeType[] | undefined {
    return this.#filterEquation;
  }

  /**
   * Sets the layer filter equation
   * @param {FilterNodeType[]?} filterEquation - The layer filter equation
   */
  setFilterEquation(filterEquation: FilterNodeType[] | undefined): void {
    this.#filterEquation = filterEquation;
  }

  /**
   * Gets the layer legend filter is off flag
   * @returns {boolean} The legend filter is off flag
   */
  getLegendFilterIsOff(): boolean {
    return this.#legendFilterIsOff || false;
  }

  /**
   * Sets the layer legend filter is off flag
   * @param {boolean} legendFilterIsOff - The legend filter is off flag
   */
  setLegendFilterIsOff(legendFilterIsOff: boolean): void {
    this.#legendFilterIsOff = legendFilterIsOff;
  }

  /**
   * Gets the source object.
   * @returns {TypeBaseSourceInitialConfig} The source.
   */
  getSource(): TypeBaseSourceInitialConfig {
    return this.source;
  }

  /**
   * Gets the source data access path from the source object.
   * @param {boolean} endsWithSlash - Indicates if the dataAccessPath received should end with a '/', because it's going to be dynamically used to create a url path.
   * @returns {string} The data access path.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
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
   * Verifies and applies the appropriate `dataAccessPath` for the layer based on metadata.
   * This method handles cases where the layer's `dataAccessPath` was not explicitly defined
   * in the configuration and is therefore expected to be inferred from the metadataAccessPath or the metadata itself.
   * Behavior:
   * - If the metadata does not define a `dataAccessPath`, nothing is changed.
   * - If the layer's own `dataAccessPath` is missing or undefined, the method sets it to the
   *   `dataAccessPath` provided in the metadata.
   * This ensures that metadata-provided values take precedence over any automatically inferred
   * or placeholder paths created during configuration validation.
   * @param {TypeBaseSourceInitialConfig | undefined} metadataSource
   *   The metadata object that may contain an authoritative `dataAccessPath`. If undefined or
   *   missing the field, no changes are made.
   */
  verifyDataAccessPath(metadataSource: TypeBaseSourceInitialConfig | undefined): void {
    // If the source dataAccessPath doesn't exist
    if (!metadataSource?.dataAccessPath) return;

    // If the dataAccessPath was not determined by the configuration (we're only interpreting it based on the metadataAccessPath)
    if (!this.layerEntryProps.source?.dataAccessPath) {
      // Favor the metadata source dataAccessPath over the automatically generated dataAccessPath
      this.setDataAccessPath(metadataSource.dataAccessPath);
    }
  }

  /**
   * Gets the source feature info object.
   * @returns {TypeFeatureInfoLayerConfig} The feature info.
   */
  getFeatureInfo(): TypeFeatureInfoLayerConfig {
    return this.getSource().featureInfo!;
  }

  /**
   * Sets the source feature info object.
   * @param {TypeFeatureInfoLayerConfig} featureInfo - The feature info.
   */
  setFeatureInfo(featureInfo: TypeFeatureInfoLayerConfig): void {
    this.source.featureInfo = featureInfo;
  }

  /**
   * Gets the source outfields from the source object.
   * @returns {TypeOutfields[] | undefined} The outfields.
   */
  getOutfields(): TypeOutfields[] | undefined {
    return this.getFeatureInfo().outfields;
  }

  /**
   * Sets the source outfields in the source object. The source.featureInfo object must already exist.
   * @param {TypeOutfields[]} outfields - The outfields.
   */
  setOutfields(outfields: TypeOutfields[]): void {
    this.source.featureInfo!.outfields = outfields;
  }

  /**
   * Indicates if the source has an out field which represents the primary key.
   * @returns {boolean} True if the outfield representing the primary key exists, false otherwise.
   */
  hasOutfieldsPK(): boolean {
    return !!this.getOutfields()?.find((outfield) => outfield.type === 'oid');
  }

  /**
   * Gets the out field which represents the primary key.
   * @returns {TypeOutfields} The outfield.
   * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'.
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
   * Gets the field name representing the primary key or the provided default value.
   * @returns {string} The field name representing the primary key or the provided default value.
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
   * @returns {string | undefined} The name field.
   */
  getNameField(): string | undefined {
    return this.getFeatureInfo().nameField;
  }

  /**
   * Sets the source name field in the source object. The source.featureInfo object must already exist.
   * @param {string | undefined} nameField - The name field.
   */
  setNameField(nameField: string | undefined): void {
    this.source.featureInfo!.nameField = nameField;
  }

  /**
   * Sets the source name field in the source object only if it's not already set. The source.featureInfo object must already exist.
   * @param {string | undefined} nameField - The name field.
   */
  initNameField(nameField: string | undefined): void {
    this.source.featureInfo!.nameField ??= nameField;
  }

  /**
   * Gets the source queryable value.
   * @returns {boolean | undefined} The source queryable value.
   */
  getQueryable(): boolean | undefined {
    return this.getFeatureInfo().queryable;
  }

  /**
   * Gets the source queryable value. Defaults to true when couldn't be determined.
   * @returns {boolean} The source queryable value, defaulted if necessary.
   */
  getQueryableDefaulted(): boolean {
    return this.getFeatureInfo().queryable ?? true; // default: true
  }

  /**
   * Sets the source queryable in the source object. The source.featureInfo object must already exist.
   * @param {boolean | undefined} queryable - The source queryable value.
   */
  setQueryable(queryable: boolean | undefined): void {
    this.source.featureInfo!.queryable = queryable;
  }

  /**
   * Sets the source queryable in the source object only if it's not already set. The source.featureInfo object must already exist.
   * @param {boolean} queryable - The source queryable value.
   */
  initQueryable(queryable: boolean | undefined): void {
    this.source.featureInfo!.queryable ??= queryable;
  }

  /**
   * Gets the geometry field.
   * @returns {TypeOutfields | undefined} The geometry field.
   */
  getGeometryField(): TypeOutfields | undefined {
    return this.#geometryField;
  }

  /**
   * Sets the geometry field.
   * @param {TypeOutfields | undefined} geometryField - The geometry field
   */
  setGeometryField(geometryField: TypeOutfields | undefined): void {
    this.#geometryField = geometryField;
  }

  /**
   * Returns the OpenLayers-compatible geometry type of this layer's geometry field.
   * @returns {TypeStyleGeometry} The OpenLayers geometry type (e.g., 'Point', 'LineString', 'Polygon')
   */
  getGeometryType(): TypeStyleGeometry {
    return this.onGetGeometryType();
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer style or undefined.
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
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer filter or undefined.
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
   * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer attributions or undefined.
   */
  static getClassOrTypeLayerAttributions(layerConfig: ConfigClassOrType | undefined): string[] | undefined {
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      return layerConfig.getAttributions();
    }
    // Try to narrow the type and return, worst case it will be undefined
    return (layerConfig as AbstractBaseLayerEntryConfigProps)?.attributions;
  }

  // #endregion STATIC METHODS
}
