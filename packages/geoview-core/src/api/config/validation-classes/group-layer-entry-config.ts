import type { TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';

export interface GroupLayerEntryConfigProps extends ConfigBaseClassProps {
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
}

/**
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** The list of layer entry configurations to use from the GeoView layer group. */
  // TODO: REFACTOR - Major TypeLayerEntryConfig - Try to type this as ConfigBaseClass[] instead of TypeLayerEntryConfig[]
  listOfLayerEntryConfig: TypeLayerEntryConfig[];

  /**
   * Creates an instance of GroupLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: GroupLayerEntryConfigProps) {
    super(layerConfig, layerConfig.geoviewLayerConfig.geoviewLayerType, CONST_LAYER_ENTRY_TYPES.GROUP);
    this.listOfLayerEntryConfig = layerConfig.listOfLayerEntryConfig || [];
  }

  // #region OVERRIDES

  /**
   * Overrides the setting of the service metadata to do it for all layer entries in the configuration.
   *
   * This method overrides a base implementation to recursively apply the provided
   * `metadata` to each entry in `listOfLayerEntryConfig`. It ensures that
   * all nested or child layer entries also receive the updated metadata.
   *
   * @param metadata - The new service metadata to be used
   */
  protected override onSetServiceMetadata(metadata: unknown): void {
    // Recursively change the service metadata for each layer entries
    this.listOfLayerEntryConfig.forEach((layerEntry) => {
      // Go recursive
      layerEntry.setServiceMetadata(metadata);
    });
  }

  /**
   * Overrides the setting of the data access path to do it for all layer entries in the configuration.
   *
   * This method overrides a base implementation to recursively apply the provided
   * `dataAccessPath` to each entry in `listOfLayerEntryConfig`. It ensures that
   * all nested or child layer entries also receive the updated data access path.
   *
   * @param dataAccessPath - The new path to be used for accessing data
   */
  protected override onSetDataAccessPath(dataAccessPath: string): void {
    // Recursively change the data access path for each layer entries
    this.listOfLayerEntryConfig.forEach((layerEntry) => {
      // Go recursive
      layerEntry.setDataAccessPath(dataAccessPath);
    });
  }

  /**
   * Overrides the creation of the layer props and return a deep clone of the layer entry configuration properties.
   *
   * This method calls the parent method and then copies the listOfLayerEntryConfig over.
   * The listOfLayerEntryConfig isn't deeply cloned.
   *
   * @returns A deep-cloned copy of the layer entry properties
   */
  protected override onCloneLayerProps(): GroupLayerEntryConfigProps {
    // Sure
    const clonedCopy = super.onCloneLayerProps() as GroupLayerEntryConfigProps;

    // Also copy the list of layer entry configs
    clonedCopy.listOfLayerEntryConfig = this.listOfLayerEntryConfig;

    // Return the cloned copy
    return clonedCopy;
  }

  /**
   * Overrides the toJson of the mother class.
   *
   * @returns The Json representation of the instance
   */
  protected override onToJson<T>(): T {
    // Call parent
    const serialized = super.onToJson<T>() as TypeGeoviewLayerConfig;

    // Copy values
    serialized.listOfLayerEntryConfig = this.listOfLayerEntryConfig.map((layerEntryConfig) => layerEntryConfig.toJson());

    // Return it
    return serialized as T;
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHDOS

  /**
   * Returns the `layerPath` values of all immediate child layers in `listOfLayerEntryConfig`.
   *
   * This method does **not** recurse into nested sublayers.
   *
   * @returns An array of `layerPath` strings for direct sublayers
   */
  getLayerPaths(): string[] {
    return this.listOfLayerEntryConfig.map((geoviewLayerEntryConfig) => geoviewLayerEntryConfig.layerPath);
  }

  /**
   * Recursively returns the `layerPath` values of all layers and sublayers starting from this layer.
   *
   * This includes the `layerPath` of the current layer, its direct children, and all nested descendants.
   *
   * @returns An array of `layerPath` strings for all descendant layers (including nested groups)
   */
  getLayerPathsAll(): string[] {
    function getChildPaths(listOfLayerEntryConfig: TypeLayerEntryConfig[]): string[] {
      const layerPaths: string[] = [];
      listOfLayerEntryConfig.forEach((entryConfig) => {
        layerPaths.push(entryConfig.layerPath);
        if (entryConfig.listOfLayerEntryConfig) {
          layerPaths.push(...getChildPaths(entryConfig.listOfLayerEntryConfig));
        }
      });
      return layerPaths;
    }

    // Go recursive and return
    return getChildPaths([this]);
  }

  // #endregion PUBLIC METHDOS
}
