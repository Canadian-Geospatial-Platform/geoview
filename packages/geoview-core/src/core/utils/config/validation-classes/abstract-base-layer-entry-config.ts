import { TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings } from '@/api/config/types/map-schema-types';
import { TypeBaseSourceInitialConfig } from '@/api/config/types/layer-schema-types';
import { ConfigBaseClass, ConfigBaseClassProps } from '@/core/utils/config/validation-classes/config-base-class';
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

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Style to apply to the vector layer. */
  // TODO: This source attribute is responsible for problems. Change to a getLayerStyle() and setLayerStyle().
  layerStyle?: TypeLayerStyleConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
  declare listOfLayerEntryConfig: never;

  /** The metadata associated with the service */
  #serviceMetadata?: unknown;

  /** The metadata associated with the layer */
  #layerMetadata?: unknown;

  /** The time dimension information */
  #temporalDimension?: TimeDimension;

  /** Attribution used in the OpenLayer source. */
  #attributions: string[] = [];

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
    this.source = layerConfig.source;
    this.layerFilter = layerConfig.layerFilter;
    this.layerStyle = layerConfig.layerStyle;
  }

  /**
   * Gets the service metadata that is associated to the service.
   * @returns {unknown | undefined} The service metadata.
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
   * @returns {unknown} The layer metadata.
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
   * Gets the temporal dimension, if any, that is associated to the layer.
   * @returns {TimeDimension | undefined} The temporal dimension.
   */
  getTemporalDimension(): TimeDimension | undefined {
    return this.#temporalDimension;
  }

  /**
   * Sets the temporal dimension that is associated to the layer.
   * @param {TimeDimension} temporalDimension - The temporal dimension.
   */
  setTemporalDimension(temporalDimension: TimeDimension): void {
    this.#temporalDimension = temporalDimension;
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
   * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
   */
  getTypeGeometries(): TypeStyleGeometry[] {
    return Object.keys(this.layerStyle || {}) as TypeStyleGeometry[];
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
      return this.layerStyle![styles[0]];
    }

    // None
    return undefined;
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
}
