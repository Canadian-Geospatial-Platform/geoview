import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass, ConfigBaseClassProps } from '@/core/utils/config/validation-classes/config-base-class';

export interface GroupLayerEntryConfigProps extends ConfigBaseClassProps {
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
}

/**
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Tag used to link the entry to a specific schema is not used by groups. */
  declare schemaTag: never;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.GROUP;

  declare layerEntryProps: GroupLayerEntryConfigProps;

  /** Source settings to apply to the GeoView layer source at creation time is not used by groups. */
  declare source: never;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  // TODO: Refactor - Try to type this as ConfigBaseClass[] instead of TypeLayerEntryConfig[]
  listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];

  /**
   * The class constructor.
   * @param {GroupLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GroupLayerEntryConfigProps) {
    super(layerConfig);
    this.listOfLayerEntryConfig = layerConfig.listOfLayerEntryConfig;
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
    serialized.listOfLayerEntryConfig = this.listOfLayerEntryConfig.map((layerEntryConfig) => layerEntryConfig.toJson());

    // Return it
    return serialized;
  }
}
