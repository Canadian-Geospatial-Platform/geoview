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
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  // TODO: This source attribute is responsible for problems. Change to a getSource() and setSource().
  // TO.DOCONT: However, to do so, we must fix the other major issue with TypeGeoviewLayerConfig and TypeLayerEntryConfig and the classes being created with 'fake classes' in their constructors.
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeBaseSourceInitialConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
  declare listOfLayerEntryConfig: never;

  /** The metadata associated with the service */
  #serviceMetadata?: unknown;

  /** The metadata associated with the layer */
  #layerMetadata?: unknown;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** The time dimension information */
  #timeDimension?: TimeDimension;

  /** Attribution used in the OpenLayer source. */
  #attributions: string[] = [];

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
  protected constructor(layerConfig: AbstractBaseLayerEntryConfigProps | AbstractBaseLayerEntryConfig) {
    super(layerConfig);

    // Keep attribute properties
    this.source = layerConfig.source;
    this.#layerStyle = AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(layerConfig);
    this.#layerFilter = AbstractBaseLayerEntryConfig.getClassOrTypeLayerFilter(layerConfig);
  }

  /**
   * Gets the service metadata that is associated to the service.
   * @returns {unknown | undefined} The service metadata or undefined.
   */
  getServiceMetadata(): unknown | undefined {
    return this.#serviceMetadata;
  }

  /**
   * Sets the service metadata for the layer.
   * @param {unknown} metadata - The service metadata to set
   */
  setServiceMetadata(metadata: unknown): void {
    this.#serviceMetadata = metadata;
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
   * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
   */
  getTypeGeometries(): TypeStyleGeometry[] {
    return Object.keys(this.#layerStyle || {}) as TypeStyleGeometry[];
  }

  /**
   * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
   */
  getFirstStyleSettings(): TypeLayerStyleSettings | undefined {
    // Get the type geometries
    const styles = this.getTypeGeometries();

    // If at least one, get the first one
    if (styles.length > 0) {
      return this.#layerStyle![styles[0]];
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
   * @returns {string[]} The layer attributions
   */
  getAttributions(): string[] {
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
   * Sets the data access path for the source object.
   * This method is called when the data access path is being set.
   * If the `source` object is undefined or null, it initializes it as an empty object.
   * Then it assigns the provided `dataAccessPath` to `source.dataAccessPath`.
   * @param {string} dataAccessPath - The path string used to access data.
   */
  protected override onSetDataAccessPath(dataAccessPath: string): void {
    this.source ??= {};
    this.source.dataAccessPath = dataAccessPath;
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
    serialized.initialSettings = this.initialSettings;
    serialized.attributions = this.getAttributions();
    serialized.source = this.source;

    // Return it
    return serialized;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer style or undefined.
   */
  static getClassOrTypeLayerStyle(layerConfig: ConfigAbstractBaseClassOrType | undefined): TypeLayerStyleConfig | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getLayerStyle();
    }
    return layerConfig?.layerStyle;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigAbstractBaseClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The layer filter or undefined.
   */
  static getClassOrTypeLayerFilter(layerConfig: ConfigAbstractBaseClassOrType | undefined): string | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getLayerFilter();
    }
    return layerConfig?.layerFilter;
  }
}
