/* eslint-disable no-underscore-dangle */
// ? we escape all private attribute in this file
import {
  TypeLayerStyleConfig,
  TypeStyleGeometry,
  TypeLayerStyleSettings,
  TypeLayerEntryConfig2,
  TypeBaseSourceInitialConfig,
} from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TimeDimension } from '@/core/utils/date-mgt';
import { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';

/**
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
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
  // TODO: Cleanup - Get rid of this attribute as it doesn't seem to be used (always false)
  #legendFilterIsOff: boolean = false;

  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeBaseSourceInitialConfig;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig = undefined;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  declare listOfLayerEntryConfig: never;

  /**
   * Constructs a Layer Entry Config
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer config to use to construct the object.
   */
  constructor(layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);

    // Assign attributes
    const layerConfigAsType = layerConfig as unknown as TypeLayerEntryConfig2;
    this.#layerStyle = layerConfigAsType.layerStyle;
    this.source = layerConfigAsType.source;
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
   * Gets the layer style
   * @returns {TypeLayerStyleConfig?} The layer style
   */
  getLayerStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer style
   * @param {TypeLayerStyleConfig?} layerStyle - The layer style
   */
  setLayerStyle(layerStyle: TypeLayerStyleConfig | undefined): void {
    this.#layerStyle = layerStyle;
  }

  /**
   * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
   */
  getTypeGeometries(): TypeStyleGeometry[] {
    return Object.keys(this.getLayerStyle() || {}) as TypeStyleGeometry[];
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
      return this.getLayerStyle()?.[styles[0]];
    }

    // None
    return undefined;
  }

  /**
   * Overrides the toJson of the mother class
   * @returns {unknown} The Json representation of the instance.
   * @protected
   */
  protected override onToJson(): unknown {
    // Call parent
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onToJson() as any;

    // Copy values
    serialized.initialSettings = this.initialSettings;
    serialized.attributions = this.getAttributions();
    serialized.source = this.source;

    // Return it
    return serialized;
  }
}
