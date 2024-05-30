import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig, TypeLayerInitialSettings } from '@/geo/map/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

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

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

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
}
