/* eslint-disable no-underscore-dangle */
// ? we escape all private attribute in this file
import {
  TypeBaseSourceVectorInitialConfig,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageInitialConfig,
  TypeSourceImageStaticInitialConfig,
  TypeSourceImageWmsInitialConfig,
  TypeSourceTileInitialConfig,
  TypeStyleConfig,
  TypeStyleGeometry,
  TypeStyleSettings,
  TypeVectorSourceInitialConfig,
  TypeVectorTileSourceInitialConfig,
} from '@/geo/map/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonObject } from '@/core/types/global-types';
import { FilterNodeArrayType } from '@/geo/utils/renderer/geoview-renderer-types';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** The ending element of the layer configuration path. */
  override layerIdExtension?: string | undefined = undefined;

  /** The metadata associated with the service */
  #serviceMetadata?: TypeJsonObject;

  /** The metadata associated with the layer */
  #layerMetadata?: TypeJsonObject;

  /** The calculated filter equation */
  filterEquation?: FilterNodeArrayType;

  /** Indicates if filter is on/off */
  legendFilterIsOff: boolean = false;

  /** Source settings to apply to the GeoView layer source at creation time. */
  source?:
    | TypeBaseSourceVectorInitialConfig
    | TypeSourceTileInitialConfig
    | TypeVectorSourceInitialConfig
    | TypeVectorTileSourceInitialConfig
    | TypeSourceImageInitialConfig
    | TypeSourceImageWmsInitialConfig
    | TypeSourceImageEsriInitialConfig
    | TypeSourceImageStaticInitialConfig;

  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  declare listOfLayerEntryConfig: never;

  /**
   * The class constructor.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);
    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    Object.assign(this, layerConfig);
  }

  /**
   * Gets the service metadata that is associated to the service.
   * @returns {TypeJsonObject} The service metadata.
   */
  getServiceMetadata(): TypeJsonObject | undefined {
    return this.#serviceMetadata;
  }

  /**
   * Sets the service metadata for the layer.
   * @param {TypeJsonObject} metadata - The service metadata to set
   */
  setServiceMetadata(metadata: TypeJsonObject): void {
    // TODO: Refactor - Layers refactoring. Reminder: turn this function private eventually?
    this.#serviceMetadata = metadata;
  }

  /**
   * Gets the metadata that is associated to the layer.
   * @returns {TypeJsonObject} The layer metadata.
   */
  getLayerMetadata(): TypeJsonObject | undefined {
    return this.#layerMetadata;
  }

  /**
   * Sets the layer metadata for the layer.
   * @param {TypeJsonObject} layerMetadata - The layer metadata to set
   */
  setLayerMetadata(layerMetadata: TypeJsonObject): void {
    // TODO: Refactor - Layers refactoring. Reminder: turn this function private eventually?
    this.#layerMetadata = layerMetadata;
  }

  /**
   * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
   */
  getTypeGeometries(): TypeStyleGeometry[] {
    return Object.keys(this.style || {}) as TypeStyleGeometry[];
  }

  /**
   * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
   * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
   */
  getFirstStyleSettings(): TypeStyleSettings | undefined {
    // Get the type geometries
    const styles = this.getTypeGeometries();

    // If at least one, get the first one
    if (styles.length > 0) {
      return this.style![styles[0]];
    }

    // None
    return undefined;
  }

  /**
   * Overrides the serialization of the mother class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  override onSerialize(): TypeJsonObject {
    // Call parent
    // Can be any object so disable eslint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized = super.onSerialize() as any;

    // Copy values
    serialized.layerIdExtension = this.layerIdExtension;
    serialized.layerName = this.layerName;
    serialized.initialSettings = this.initialSettings;

    // Return it
    return serialized;
  }
}
