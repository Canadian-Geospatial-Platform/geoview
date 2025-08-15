import { CONST_LAYER_ENTRY_TYPES, TypeLayerEntryConfig } from '@/api/config/types/layer-schema-types';
import { ConfigBaseClass, ConfigBaseClassProps } from '@/core/utils/config/validation-classes/config-base-class';

export interface GroupLayerEntryConfigProps extends ConfigBaseClassProps {
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
}

/**
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.GROUP;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: GroupLayerEntryConfigProps;

  /** Tag used to link the entry to a specific schema is not used by groups. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
  declare schemaTag: never;

  /** Source settings to apply to the GeoView layer source at creation time is not used by groups. */
  // TODO: Refactor - This attribute should be removed and logic applied using OO pattern once the constructor is cleaned up.
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
   * Updates the data access path for all layer entries in the configuration.
   * This method overrides a base implementation to recursively apply the provided
   * `dataAccessPath` to each entry in `listOfLayerEntryConfig`. It ensures that
   * all nested or child layer entries also receive the updated data access path.
   * @param {string} dataAccessPath - The new path to be used for accessing data.
   */
  protected override onSetDataAccessPath(dataAccessPath: string): void {
    // Recursively change the data access path for each layer entries
    this.listOfLayerEntryConfig.forEach((layerEntry) => {
      // Go recursive
      layerEntry.setDataAccessPath(dataAccessPath);
    });
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
