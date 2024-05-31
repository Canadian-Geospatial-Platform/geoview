/* eslint-disable no-underscore-dangle */
// ? we escape all private attribute in this file
import {
  TypeBaseSourceVectorInitialConfig,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageInitialConfig,
  TypeSourceImageStaticInitialConfig,
  TypeSourceImageWmsInitialConfig,
  TypeSourceTileInitialConfig,
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

  /** The metadata associated with the layer */
  #metadata?: TypeJsonObject;

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

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  declare listOfLayerEntryConfig: never;

  /**
   * The class constructor.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Gets the metadata that is associated to the layer.
   * @returns {TypeJsonObject} The layer metadata.
   */
  getMetadata(): TypeJsonObject | undefined {
    return this.#metadata;
  }

  /**
   * Sets the layer metadata for the layer.
   * @param {TypeJsonObject} layerMetadata - The layer metadata to set
   */
  setMetadata(layerMetadata: TypeJsonObject): void {
    // TODO: Refactor - Layers refactoring. Reminder: turn this function private eventually?
    this.#metadata = layerMetadata;
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
