import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonObject } from '@/core/types/global-types';

/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Tag used to link the entry to a specific schema is not used by groups. */
  declare schemaTag: never;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.GROUP;

  /** The ending element of the layer configuration path is not used on groups. */
  declare layerIdExtension: never;

  /** Source settings to apply to the GeoView layer source at creation time is not used by groups. */
  declare source: never;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /**
   * The class constructor.
   * @param {GroupLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GroupLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
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
    serialized.listOfLayerEntryConfig = this.listOfLayerEntryConfig;

    // Return it
    return serialized;
  }
}
